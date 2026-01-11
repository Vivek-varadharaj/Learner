# Firestore Security Rules

Copy and paste these rules into your Firebase Console > Firestore Database > Rules tab, then click "Publish".

## Complete Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    /* ===============================
       QUESTIONS (READ ONLY)
       =============================== */
    match /questions/{document=**} {
      allow read: if request.auth != null;
      allow create, update, delete: if false;
    }

    /* ===============================
       CHALLENGES (ADMIN ONLY WRITE)
       =============================== */
    match /challenges/{challengeId} {
      allow read: if request.auth != null;
      allow create: if true; // Allow unauthenticated writes for import tool (temporary - change back after importing)
      allow update, delete: if false;
    }

    /* ===============================
       USER CHALLENGE PROGRESS
       =============================== */
    match /userChallenges/{userId} {
      allow read, create, update: if request.auth != null
                                  && request.auth.uid == userId;
      allow delete: if false;
    }

    /* ===============================
       USER COMPLETIONS (NEW)
       =============================== */
    match /userCompletions/{userId} {
      allow read, write: if request.auth != null
                          && request.auth.uid == userId;
    }

    /* ===============================
       COMPLETIONS (OLD / ANALYTICS)
       =============================== */
    match /completions/{document=**} {
      allow create: if request.auth != null;
      allow read, update, delete: if false;
    }
  }
}
```

## How to Update Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** > **Rules** tab
4. Copy the rules above and paste them
5. Click **Publish** button (top right)
6. Wait for confirmation that rules are published

## Rule Descriptions

### Questions Collection
- **Read**: Authenticated users only
- **Write**: Admin only (disabled for client SDK)

### Challenges Collection
- **Read**: Authenticated users only
- **Create**: Currently allowed for import tool (`if true` - temporary)
  - ⚠️ **After importing challenges, change this back to:** `allow create: if request.auth != null;`
- **Update/Delete**: Admin only (disabled for client SDK)

### User Challenges Collection
- **Read/Write**: Users can only access their own progress document
- **Delete**: Disabled

### User Completions Collection
- **Read/Write**: Users can only access their own completions document

### Completions Collection (Analytics)
- **Create**: Authenticated users can create completion logs
- **Read/Update/Delete**: Disabled

## Security Notes

⚠️ **Important**: The `challenges` collection currently allows unauthenticated writes (`allow create: if true`) for the import tool. After importing your challenges, change this line to:

```javascript
allow create: if request.auth != null;
```

This will prevent unauthorized users from creating challenges in production.
