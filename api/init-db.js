const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

// For Vercel, use /tmp directory
const dbPath = path.join(process.env.VERCEL === '1' ? '/tmp' : './', 'logistics_calculator.db');
const db = new sqlite3.Database(dbPath);

module.exports = async (req, res) => {
    try {
        // Create test users
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
            const hashedPassword = await bcrypt.hash(user.password, 10);
            
            await new Promise((resolve, reject) => {
                db.run('INSERT OR IGNORE INTO users (username, email, password) VALUES (?, ?, ?)', 
                    [user.username, user.email, hashedPassword], 
                    function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(this.changes);
                        }
                    }
                );
            });
        }

        res.status(200).json({ 
            success: true, 
            message: 'Database initialized with test users',
            users: testUsers.map(u => ({ username: u.username, password: u.password }))
        });

    } catch (error) {
        console.error('Error initializing database:', error);
        res.status(500).json({ error: 'Failed to initialize database' });
    }
};
