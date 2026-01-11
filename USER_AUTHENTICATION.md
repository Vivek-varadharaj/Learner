# User Authentication Setup

This app now uses Firebase Authentication for user-specific question tracking.

## Firebase Authentication Setup

### Step 1: Enable Authentication in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Build** > **Authentication**
4. Click **Get started** (if not already enabled)
5. Go to **Sign-in method** tab

#### Enable Email/Password:
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"

#### Enable Google Sign-In:
   - Click on "Google"
   - Toggle "Enable" to ON
   - Set your project support email (required)
   - Click "Save"

**Important:** After enabling Google Sign-In, you may need to:
1. **Configure OAuth Consent Screen** (if not already done):
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select your Firebase project
   - Go to **APIs & Services** > **OAuth consent screen**
   - Complete the consent screen setup (User Type, App name, Support email, etc.)
   - Add your domain to authorized domains if needed
   - Save and continue

2. **Add Authorized Domains** (if testing locally):
   - In Firebase Console > Authentication > Settings > Authorized domains
   - Add `localhost` if testing locally
   - Add your production domain when deploying

**Troubleshooting `auth/invalid-credential` error:**
- Make sure Google Sign-In is enabled in Firebase Console
- Verify OAuth consent screen is configured in Google Cloud Console
- Check that your project support email is set
- Try clearing browser cache and cookies
- Make sure you're using the correct Firebase project

### Step 2: Update Firestore Security Rules

Update your Firestore security rules to require authentication:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Questions collection - read-only for authenticated users
    match /questions/{document=**} {
      allow read: if request.auth != null;
      allow create: if false; // Only you can create via Console/import
      allow update, delete: if false;
    }
    
    // User completions - users can only access their own data
    match /userCompletions/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Old completions collection (if you want to keep for analytics)
    match /completions/{document=**} {
      allow create: if request.auth != null;
      allow read: if false;
      allow update, delete: if false;
    }
  }
}
```

### Step 3: Data Structure

#### User Completions Collection

Each user has a document in `userCompletions` collection:

```
userCompletions/
  └── {userId}/
      ├── userId: "user-id-string"
      ├── email: "user@example.com"
      ├── completedQuestionIds: ["question-id-1", "question-id-2", ...]
      ├── completedCount: 25
      ├── createdAt: Timestamp
      └── lastUpdated: Timestamp
```

## Features

- ✅ User-specific question tracking
- ✅ Questions are filtered to exclude already completed ones
- ✅ Completion count per user
- ✅ No localStorage - everything in Firebase
- ✅ Users can see their progress
- ✅ Questions won't repeat for users who completed them

## User Flow

1. User signs up or logs in
2. User clicks "Begin"
3. System fetches all questions
4. System filters out questions user has already completed
5. User views and completes available questions
6. Completed questions are marked in Firebase
7. User won't see completed questions again

## Testing

1. Create a test account
2. Complete some questions
3. Sign out and sign back in
4. Verify completed questions don't appear again
5. Check Firebase Console > Firestore > `userCompletions` collection to see user data
