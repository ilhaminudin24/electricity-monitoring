# Electricity Monitoring - Firebase Version

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Setup Firebase

1. Create Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Get your Firebase config (see `FIREBASE_SETUP.md`)

### 3. Configure Environment Variables

Create `frontend/.env.local`:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 4. Run Locally

```bash
cd frontend
npm start
```

### 5. Deploy to GitHub Pages

1. Add Firebase config as GitHub Secrets (see `FIREBASE_SETUP.md`)
2. Push to GitHub - deployment happens automatically!

## 📋 Features

- ✅ Firebase Firestore database
- ✅ Static deployment (GitHub Pages)
- ✅ Real-time data sync (optional)
- ✅ All existing features preserved:
  - Add/Edit/Delete readings
  - Rupiah formatting
  - Auto token calculation
  - Dashboard analytics
  - Date/time handling

## 📚 Documentation

- `FIREBASE_SETUP.md` - Complete Firebase setup guide
- `MIGRATION_SUMMARY.md` - What changed in the migration
- `DEPLOYMENT_SETUP.md` - Deployment instructions

## 🔒 Security

Current setup uses public read/write rules for development. For production:
1. Enable Firebase Authentication
2. Update Firestore rules (see `firestore.rules`)
3. Add user ID to documents

