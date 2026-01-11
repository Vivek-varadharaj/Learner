# Firebase Setup Guide

This app uses Firebase Authentication and Firestore for user-specific question tracking.

## Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project" or "Create a project"
3. Enter a project name (e.g., "daily-ritual")
4. Disable Google Analytics (optional, not needed for this)
5. Click "Create project"

## Step 2: Get Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon `</>`
5. Register your app with a nickname (e.g., "Daily Ritual Web")
6. Copy the `firebaseConfig` object

It should look like this:
```javascript
const firebaseConfig = {
    apiKey: "AIzaSy...",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
};
```

## Step 3: Set Up Firebase Config File

1. Copy the example config file:
   ```bash
   cp firebase-config.example.js firebase-config.js
   ```

2. Open `firebase-config.js`
3. Replace the placeholder values with your actual Firebase config:

```javascript
const FIREBASE_CONFIG = {
    apiKey: "AIzaSy...",  // Paste your apiKey
    authDomain: "your-project.firebaseapp.com",  // Paste your authDomain
    projectId: "your-project-id",  // Paste your projectId
    storageBucket: "your-project.appspot.com",  // Paste your storageBucket
    messagingSenderId: "123456789",  // Paste your messagingSenderId
    appId: "1:123456789:web:abc123"  // Paste your appId
};
```

**Note:** `firebase-config.js` is ignored by git (it's in `.gitignore`), so your credentials won't be committed to version control. The `firebase-config.example.js` file is a template that you can share.

## Step 4: Set Up Firestore Database

1. In Firebase Console, go to "Build" > "Firestore Database"
2. Click "Create database"
3. Start in **test mode** (for development) or **production mode** (with security rules)
4. Select a location (choose closest to your users)
5. Click "Enable"

## Step 5: Set Up Security Rules (Important!)

1. In Firestore Database, go to the "Rules" tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to write to completions collection
    // For production, you might want to add authentication
    match /completions/{document=**} {
      allow read, write: if true;
    }
  }
}
```

**For production with better security:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Questions collection - read-only for users, write allowed for imports
    match /questions/{document=**} {
      allow read: if true; // Users need to read questions
      allow create: if true; // Allow creating (for bulk imports)
      allow update, delete: if false; // No updates or deletes from client
    }
    
    // Completions collection - allow creating documents
    match /completions/{document=**} {
      allow create: if true;
      allow read: if false; // Only you can read from Firebase Console
      allow update, delete: if false;
    }
  }
}
```

3. Click "Publish"

## Step 8: Test

1. Open your app in the browser
2. Create an account or sign in
3. Complete some questions
4. Sign out and sign back in
5. Verify completed questions don't appear again
6. In Firebase Console, go to Firestore Database
7. You should see:
   - `questions` collection with your questions
   - `userCompletions` collection with user-specific completion data

1. Open your app in the browser
2. Complete a day's ritual
3. In Firebase Console, go to Firestore Database
4. You should see:
   - `questions` collection with your questions
   - `completions` collection with completion logs containing:
     - `date`: The completion date
     - `completedAt`: Server timestamp
     - `status`: "completed"
     - `timestamp`: ISO timestamp

## Troubleshooting

### "Firebase not configured" in console
- Make sure you've updated `FIREBASE_CONFIG` in `script.js`
- Check that all values are correct (no quotes around numbers)
- Make sure Firebase SDK scripts are loaded (check browser console for errors)

### "Permission denied" errors
- Check Firestore security rules
- Make sure rules are published (click "Publish" after editing)
- Verify rules allow read access for `questions` collection
- Verify rules allow create access for `completions` collection

### Questions not appearing
- Check browser console for errors
- Verify `questions` collection exists in Firestore
- Verify questions have the correct `date` format (YYYY-MM-DD)
- Check that today's date matches a question's date field
- Verify security rules allow read access to `questions`

### Completions not logging
- Check browser console for errors
- Verify Firestore Database is created and enabled
- Check that security rules allow creating documents in `completions`
- Refresh the Firestore data view in Firebase Console

## Viewing Data

1. Go to Firebase Console > Firestore Database
2. You'll see:
   - `questions` collection - all your questions
   - `completions` collection - completion logs
3. Each document represents one question or completion
4. You can export data, view statistics, or query specific dates

## Optional: Set Up Authentication (for better security)

If you want to restrict writes to authenticated users:

1. Enable Authentication in Firebase Console
2. Update security rules to require authentication
3. Add authentication code to your app (optional)

For this simple use case, the open write permissions are fine since we're only writing completion logs.