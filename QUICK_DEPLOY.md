# Quick Deployment Guide

## Prerequisites
- GitHub account
- Render.com or Railway.app account (free tier available)

## Step 1: Deploy Backend to Render.com

1. **Sign up** at [render.com](https://render.com) (free)

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

3. **Configure Service**:
   - **Name**: `electricity-monitoring-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free

4. **Add Environment Variables**:
   - `NODE_ENV` = `production`
   - `FRONTEND_URL` = `https://YOUR_USERNAME.github.io` (add this after frontend is deployed)

5. **Deploy**: Click "Create Web Service"
   - Wait for deployment (2-3 minutes)
   - Copy your backend URL (e.g., `https://electricity-monitoring-backend.onrender.com`)

## Step 2: Deploy Frontend to GitHub Pages

1. **Update package.json homepage**:
   - Replace `YOUR_USERNAME` with your GitHub username in `frontend/package.json`

2. **Add GitHub Secret**:
   - Go to your GitHub repository
   - Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `REACT_APP_API_URL`
   - Value: Your backend URL from Step 1 (e.g., `https://electricity-monitoring-backend.onrender.com/api`)

3. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: "GitHub Actions"
   - Save

4. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Setup deployment"
   git push origin main
   ```

5. **Wait for Deployment**:
   - Go to Actions tab in GitHub
   - Wait for "Deploy to GitHub Pages" workflow to complete
   - Your site will be at: `https://YOUR_USERNAME.github.io/electricity-monitoring`

## Step 3: Update CORS in Backend

1. **Update Backend Environment Variable**:
   - Go back to Render.com
   - Go to your service → Environment
   - Add/Update: `FRONTEND_URL` = `https://YOUR_USERNAME.github.io`
   - Save changes (this will trigger a redeploy)

## Step 4: Test Deployment

1. **Frontend**: Visit `https://YOUR_USERNAME.github.io/electricity-monitoring`
2. **Backend**: Test `https://YOUR_BACKEND_URL.onrender.com/api/health`
3. **Integration**: Try adding a reading in the deployed frontend

## Alternative: Railway.app Deployment

If you prefer Railway:

1. **Sign up** at [railway.app](https://railway.app)
2. **New Project** → Deploy from GitHub
3. **Select repository** and **backend folder**
4. Railway auto-detects Node.js
5. Add environment variables (same as Render)
6. Deploy!

## Troubleshooting

### CORS Errors
- Make sure `FRONTEND_URL` is set correctly in backend
- Check browser console for specific error

### API Not Working
- Verify backend URL in GitHub secret `REACT_APP_API_URL`
- Check backend logs in Render/Railway dashboard
- Test backend health endpoint directly

### Database Issues
- SQLite file persists on Render/Railway servers
- For production, consider upgrading to PostgreSQL (Render offers free PostgreSQL)

## Notes

- **Free Tier Limitations**:
  - Render: Service sleeps after 15 min inactivity (wakes on request)
  - Railway: Limited hours per month on free tier
  - GitHub Pages: Unlimited, but static only

- **Database Persistence**:
  - SQLite file persists on the server
  - Consider backups for important data
  - For production, use managed database (PostgreSQL)

