# Firebase Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: `electricity-monitoring` (or your preferred name)
4. Disable Google Analytics (optional, for simplicity)
5. Click "Create project"
6. Wait for project creation to complete

## Step 2: Enable Firestore Database

1. In Firebase Console, click "Firestore Database" in the left menu
2. Click "Create database"
3. Select "Start in test mode" (we'll update rules later)
4. Choose a location (select closest to your users)
5. Click "Enable"

## Step 3: Get Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon `</>` to add a web app
5. Register app with nickname: "Electricity Monitoring Web"
6. **Copy the Firebase configuration object**

It will look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Step 4: Add Firebase Config to GitHub Secrets

1. Go to your GitHub repository
2. Click "Settings" → "Secrets and variables" → "Actions"
3. Add the following secrets (one for each config value):

   - `REACT_APP_FIREBASE_API_KEY` = your `apiKey`
   - `REACT_APP_FIREBASE_AUTH_DOMAIN` = your `authDomain`
   - `REACT_APP_FIREBASE_PROJECT_ID` = your `projectId`
   - `REACT_APP_FIREBASE_STORAGE_BUCKET` = your `storageBucket`
   - `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` = your `messagingSenderId`
   - `REACT_APP_FIREBASE_APP_ID` = your `appId`

## Step 5: Update Firestore Security Rules

1. In Firebase Console, go to "Firestore Database"
2. Click "Rules" tab
3. Replace the rules with the content from `firestore.rules` file:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /readings/{docId} {
      allow read, write: if true; // dev mode only
    }
  }
}
```

4. Click "Publish"

⚠️ **Important**: These rules allow public read/write access. For production, you should:
- Add authentication
- Update rules to require authentication
- Or implement custom validation rules

## Step 6: Test Locally

1. Create a `.env.local` file in the `frontend` folder:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

2. Install dependencies:
```bash
cd frontend
npm install
```

3. Start development server:
```bash
npm start
```

4. Test by adding a reading - it should save to Firestore!

## Step 7: Deploy to GitHub Pages

1. Push your code to GitHub (if not already done)
2. The GitHub Actions workflow will automatically:
   - Build the app with Firebase config from secrets
   - Deploy to GitHub Pages
3. Check the "Actions" tab to monitor deployment
4. Your app will be live at: `https://ilhaminudin24.github.io/electricity-monitoring`

## Production Security (Future)

When ready to secure your app:

1. **Enable Authentication**:
   - Go to Firebase Console → Authentication
   - Enable sign-in methods (Email/Password, Google, etc.)

2. **Update Security Rules**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /readings/{docId} {
      allow read, write: if request.auth != null;
      // Or more specific:
      // allow read: if request.auth != null;
      // allow create: if request.auth != null && request.resource.data.keys().hasAll(['reading_kwh', 'created_at']);
      // allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

3. **Add User ID to Documents**:
   - Update `addReading()` to include `userId: auth.currentUser.uid`
   - Filter queries by `userId`

## Troubleshooting

### Error: "Firebase: Error (auth/unauthorized)"
- Check that Firestore rules allow read/write
- Verify Firebase config is correct

### Error: "Missing or insufficient permissions"
- Check Firestore security rules
- Ensure rules are published

### Data not appearing
- Check Firebase Console → Firestore Database
- Verify data structure matches expected format
- Check browser console for errors

### Build fails in GitHub Actions
- Verify all Firebase secrets are added correctly
- Check secret names match exactly (case-sensitive)
- Review build logs in Actions tab

