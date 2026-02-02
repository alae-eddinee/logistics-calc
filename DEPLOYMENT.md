# Vercel Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy Your App
```bash
# From your project directory
vercel
```

### 4. Initialize Database
After deployment, visit:
```
https://your-app-url.vercel.app/api/init-db
```
This will create the test users in the database.

### 5. Test Your App
Visit your deployed app and login with:
- **Username**: `admin` **Password**: `admin123`
- **Username**: `user1` **Password**: `user123`

## 📋 Configuration Files Created

- `vercel.json` - Vercel deployment configuration
- `.gitignore` - Excludes unnecessary files
- `api/init-db.js` - Database initialization endpoint

## ⚙️ Environment Variables (Optional)

In your Vercel dashboard, you can set:
- `SESSION_SECRET` - Custom secret for session security
- `NODE_ENV` - Set to `production` (auto-configured)

## 🔄 Redeployment

Every time you push changes to GitHub:
```bash
git add .
git commit -m "Update app"
git push
```
Vercel will automatically redeploy your app.

## 📝 Important Notes

### Database Persistence
- **SQLite database** is stored in `/tmp/` on Vercel
- **Data persists** between function invocations but may reset on redeployment
- For production, consider using external database services

### Session Storage
- Uses **memory store** for sessions on Vercel
- Sessions reset when the app redeploy
- For persistent sessions, consider Redis or external session store

### Limitations
- **Free tier**: 100GB bandwidth/month
- **Function execution**: 10 seconds max
- **Database**: Limited to SQLite in `/tmp/`

## 🛠️ Troubleshooting

### If database doesn't initialize:
1. Visit `/api/init-db` manually
2. Check Vercel function logs
3. Ensure all dependencies are installed

### If sessions don't work:
1. Check browser console for errors
2. Ensure HTTPS is enabled (automatic on Vercel)
3. Clear browser cookies and retry

### If app doesn't load:
1. Check Vercel deployment logs
2. Verify all files are committed to Git
3. Ensure `vercel.json` is properly configured

## 📞 Support

- Vercel Documentation: https://vercel.com/docs
- Issues: Check Vercel function logs in dashboard
- Status: https://vercel-status.com/

Your app will be available at: `https://your-project-name.vercel.app`
