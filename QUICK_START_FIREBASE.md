# Quick Start - Firebase Migration

## ✅ Migration Complete!

Your application has been migrated to Firebase Firestore. Follow these steps to get started.

## 📦 Step 1: Install Dependencies

```bash
cd frontend
npm install
```

This will install Firebase SDK and all required dependencies.

## 🔥 Step 2: Setup Firebase Project

### 2.1 Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Enter project name: `electricity-monitoring` (or your choice)
4. Click "Continue"
5. Disable Google Analytics (optional)
6. Click "Create project"

### 2.2 Enable Firestore

1. In Firebase Console, click "Firestore Database"
2. Click "Create database"
3. Select "Start in test mode" (we'll update rules)
4. Choose location (closest to you)
5. Click "Enable"

### 2.3 Get Firebase Config

1. Click gear icon ⚙️ → "Project settings"
2. Scroll to "Your apps"
3. Click web icon `</>`
4. Register app: "Electricity Monitoring"
5. **Copy the config object**

## 🔐 Step 3: Add Firebase Config

### Option A: Local Development (.env.local)

Create `frontend/.env.local`:

```env
REACT_APP_FIREBASE_API_KEY=AIza...
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123
```

### Option B: GitHub Secrets (for deployment)

1. Go to GitHub repository → Settings
2. Secrets and variables → Actions
3. Add these secrets:
   - `REACT_APP_FIREBASE_API_KEY`
   - `REACT_APP_FIREBASE_AUTH_DOMAIN`
   - `REACT_APP_FIREBASE_PROJECT_ID`
   - `REACT_APP_FIREBASE_STORAGE_BUCKET`
   - `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
   - `REACT_APP_FIREBASE_APP_ID`

## 🛡️ Step 4: Update Firestore Rules

1. In Firebase Console → Firestore Database → Rules
2. Replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /readings/{docId} {
      allow read, write: if true; // dev mode
    }
  }
}
```

3. Click "Publish"

⚠️ **Note**: These rules allow public access. For production, add authentication.

## 🚀 Step 5: Test Locally

```bash
cd frontend
npm start
```

1. Open http://localhost:3000
2. Try adding a reading
3. Check Firebase Console → Firestore to see the data!

## 📤 Step 6: Deploy to GitHub Pages

1. **Enable GitHub Pages**:
   - Repository → Settings → Pages
   - Source: "GitHub Actions"

2. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Migrate to Firebase"
   git push origin main
   ```

3. **Monitor Deployment**:
   - Go to "Actions" tab
   - Wait for workflow to complete
   - Your app: `https://ilhaminudin24.github.io/electricity-monitoring`

## ✨ What's New

- ✅ No backend server needed
- ✅ Data stored in Firestore (cloud)
- ✅ Real-time updates available
- ✅ All features work the same!

## 🐛 Troubleshooting

### "Firebase: Error (auth/unauthorized)"
- Check Firestore rules are published
- Verify config values are correct

### "Missing or insufficient permissions"
- Update Firestore rules (see Step 4)
- Ensure rules allow read/write

### Build fails
- Check all GitHub secrets are added
- Verify secret names match exactly

### Data not saving
- Check browser console for errors
- Verify Firebase config in `.env.local`
- Check Firestore rules

## 📚 More Info

- `FIREBASE_SETUP.md` - Detailed setup guide
- `MIGRATION_SUMMARY.md` - What changed
- `firestore.rules` - Security rules file

---

**You're all set!** 🎉 Your app now uses Firebase Firestore and can be deployed as a static site.

