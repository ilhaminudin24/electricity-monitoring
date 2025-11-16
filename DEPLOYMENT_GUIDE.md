# Deployment Guide

## Overview

This application consists of:
- **Frontend**: React app (can be deployed to GitHub Pages)
- **Backend**: Node.js/Express API (needs a hosting service)
- **Database**: SQLite (stored on backend server)

## Deployment Strategy

### Option 1: GitHub Pages (Frontend) + Render/Railway (Backend) - Recommended

1. **Frontend** → GitHub Pages (Free)
2. **Backend** → Render.com or Railway.app (Free tier available)
3. **Database** → SQLite file on backend server

### Option 2: Vercel (Full Stack)

1. **Frontend** → Vercel (Free)
2. **Backend** → Vercel Serverless Functions (Free)
3. **Database** → Vercel Postgres or SQLite (with limitations)

## Step-by-Step Deployment

### Part 1: Deploy Frontend to GitHub Pages

1. **Update package.json** (already done - see below)
2. **Set up GitHub Actions** (see `.github/workflows/deploy.yml`)
3. **Configure environment variables** in GitHub repository settings
4. **Push to GitHub** - deployment happens automatically

### Part 2: Deploy Backend to Render/Railway

#### Using Render.com (Recommended)

1. Create account at [render.com](https://render.com)
2. Create new "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment**: Node
5. Add environment variable: `PORT=10000` (or let Render assign)
6. Deploy

#### Using Railway.app

1. Create account at [railway.app](https://railway.app)
2. Create new project
3. Deploy from GitHub
4. Select backend folder
5. Railway auto-detects Node.js and deploys

### Part 3: Configure API URL

After backend is deployed, update the frontend API URL:

1. Get your backend URL (e.g., `https://your-app.onrender.com`)
2. Update GitHub repository settings:
   - Go to Settings → Secrets and variables → Actions
   - Add `REACT_APP_API_URL` = `https://your-backend-url.com/api`

## Important Notes

### Database Persistence

- **SQLite on Render/Railway**: Database file persists on the server
- **File System**: Ephemeral on some platforms - consider database backups
- **Alternative**: Use a cloud database (PostgreSQL) for production

### CORS Configuration

The backend already has CORS enabled, but you may need to update it:

```javascript
// backend/server.js
app.use(cors({
  origin: ['https://your-username.github.io', 'http://localhost:3000']
}));
```

### Environment Variables

- Frontend: `REACT_APP_API_URL` (set in GitHub Actions)
- Backend: `PORT` (usually auto-assigned by hosting service)

## Testing Deployment

1. **Frontend**: Visit `https://your-username.github.io/electricity-monitoring`
2. **Backend**: Test API at `https://your-backend-url.com/api/health`
3. **Integration**: Verify frontend can connect to backend

## Troubleshooting

### CORS Errors
- Update backend CORS origin to include your GitHub Pages URL
- Check browser console for specific error messages

### Database Not Persisting
- Some platforms have ephemeral file systems
- Consider using a managed database service
- Implement database backup/restore functionality

### API Connection Failed
- Verify backend URL is correct
- Check backend logs for errors
- Ensure backend is running and accessible

