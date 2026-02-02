const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

// Check if we're in Vercel environment
const isVercel = process.env.VERCEL === '1';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: isVercel ? true : ['http://localhost:3000'],
    credentials: true
}));
app.use(express.json());

// Log all requests
if (!isVercel) {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
        next();
    });
}

// Session configuration
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: isVercel ? true : false, // HTTPS in production
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: isVercel ? 'none' : 'lax'
    }
};

// For Vercel, we need to adjust session store
if (isVercel) {
    // Use memory store for Vercel (note: this will reset on redeploy)
    const MemoryStore = require('express-session').MemoryStore;
    sessionConfig.store = new MemoryStore({
        checkPeriod: 86400000 // 24 hours
    });
}

app.use(session(sessionConfig));

// Database initialization
// For Vercel, we need to use a different database approach
const dbPath = isVercel ? '/tmp/logistics_calculator.db' : './logistics_calculator.db';
const db = new sqlite3.Database(dbPath);

// Create tables if they don't exist
db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // User sessions/calculations table
    db.run(`CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_name TEXT NOT NULL,
        session_data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Auto-create test users
    createTestUsers();
});

// Function to create test users
async function createTestUsers() {
    const testUsers = [
        {
            username: 'admin',
            email: 'admin@logistics.com',
            password: 'admin123'
        },
        {
            username: 'user1',
            email: 'user1@logistics.com', 
            password: 'user123'
        }
    ];

    for (const user of testUsers) {
        try {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            
            db.run('INSERT OR IGNORE INTO users (username, email, password) VALUES (?, ?, ?)', 
                [user.username, user.email, hashedPassword], 
                function(err) {
                    if (err) {
                        console.error(`Error creating user ${user.username}:`, err);
                    } else if (this.changes > 0) {
                        console.log(`✅ Created test user: ${user.username}`);
                    }
                }
            );
        } catch (error) {
            console.error(`Error hashing password for ${user.username}:`, error);
        }
    }
}

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
}

// Routes

// Serve login page as default
app.get('/', (req, res) => {
    console.log('Request to / route');
    console.log('Session:', req.session);
    // Always serve login page for now to debug
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Serve main app
app.get('/app', (req, res) => {
    console.log('Request to /app route');
    if (!req.session.userId) {
        console.log('No session, redirecting to /');
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Static files (after routes)
app.use(express.static(path.join(__dirname)));

// User registration
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', 
            [username, email, hashedPassword], 
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Username or email already exists' });
                    }
                    return res.status(500).json({ error: 'Database error' });
                }
                
                req.session.userId = this.lastID;
                req.session.username = username;
                res.json({ success: true, userId: this.lastID, username: username });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// User login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        try {
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                req.session.userId = user.id;
                req.session.username = user.username;
                res.json({ success: true, userId: user.id, username: user.username });
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Server error' });
        }
    });
});

// User logout
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ success: true });
    });
});

// Get current user info
app.get('/api/user', isAuthenticated, (req, res) => {
    res.json({ 
        success: true, 
        userId: req.session.userId, 
        username: req.session.username 
    });
});

// Save user session data
app.post('/api/sessions', isAuthenticated, (req, res) => {
    const { sessionName, sessionData } = req.body;
    const userId = req.session.userId;

    if (!sessionName || !sessionData) {
        return res.status(400).json({ error: 'Session name and data are required' });
    }

    // Check if session exists for this user
    db.get('SELECT id FROM user_sessions WHERE user_id = ? AND session_name = ?', 
        [userId, sessionName], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        const dataString = JSON.stringify(sessionData);
        
        if (row) {
            // Update existing session
            db.run('UPDATE user_sessions SET session_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [dataString, row.id], (err) => {
                    if (err) {
                        return res.status(500).json({ error: 'Database error' });
                    }
                    res.json({ success: true, message: 'Session updated' });
                });
        } else {
            // Create new session
            db.run('INSERT INTO user_sessions (user_id, session_name, session_data) VALUES (?, ?, ?)',
                [userId, sessionName, dataString], function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Database error' });
                    }
                    res.json({ success: true, sessionId: this.lastID, message: 'Session saved' });
                });
        }
    });
});

// Get user sessions
app.get('/api/sessions', isAuthenticated, (req, res) => {
    const userId = req.session.userId;

    db.all('SELECT id, session_name, created_at, updated_at FROM user_sessions WHERE user_id = ? ORDER BY updated_at DESC',
        [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true, sessions: rows });
    });
});

// Get specific session data
app.get('/api/sessions/:sessionId', isAuthenticated, (req, res) => {
    const { sessionId } = req.params;
    const userId = req.session.userId;

    db.get('SELECT session_data FROM user_sessions WHERE id = ? AND user_id = ?',
        [sessionId, userId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Session not found' });
        }

        try {
            const sessionData = JSON.parse(row.session_data);
            res.json({ success: true, sessionData: sessionData });
        } catch (error) {
            res.status(500).json({ error: 'Invalid session data' });
        }
    });
});

// Delete session
app.delete('/api/sessions/:sessionId', isAuthenticated, (req, res) => {
    const { sessionId } = req.params;
    const userId = req.session.userId;

    db.run('DELETE FROM user_sessions WHERE id = ? AND user_id = ?',
        [sessionId, userId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json({ success: true, message: 'Session deleted' });
    });
});

// Start server
if (isVercel) {
    // Export for Vercel serverless
    module.exports = app;
} else {
    // Start local server
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
