# Firebase Setup Instructions

## 🔥 Firebase Configuration

To enable cross-device data sync, you need to set up Firebase:

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `action-track-app`
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Firestore Database
1. In your Firebase project, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode"
4. Select your region
5. Click "Done"

### 3. Set Firestore Rules
Go to "Firestore Database" > "Rules" and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /userData/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 4. Get Firebase Config
1. Go to Project Settings (⚙️ icon)
2. Scroll down to "Your apps"
3. Click "Web" icon (</>) to add web app
4. Register app name: "action:Track"
5. Copy the config object

### 5. Update Configuration
Replace the config in `js/firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 6. Deploy to Vercel
1. Push code to GitHub
2. Import repository in Vercel
3. Your app will work with cross-device sync!

## 🔑 Passkey Features

Your app now includes:

- **Passwordless Authentication**: Users sign in with biometrics/PIN
- **Cross-Device Sync**: Data syncs across all devices
- **Offline Support**: Works offline, syncs when online
- **Secure Storage**: Data encrypted in Firebase
- **Modern UX**: No passwords to remember

## 🚀 Production Deployment

For production:

1. ✅ Set up proper Firebase security rules
2. ✅ Enable Firebase Authentication (optional)
3. ✅ Configure domain in Firebase settings
4. ✅ Test Passkeys on mobile and desktop
5. ✅ Monitor usage in Firebase Analytics

## 💡 Benefits

- **Users**: Secure, fast login with biometrics
- **You**: No password management, better security
- **Cross-platform**: Works on iPhone, Android, Windows, Mac
- **Future-proof**: Passkeys are the future of authentication