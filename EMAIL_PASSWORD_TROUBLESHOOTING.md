# Email/Password Authentication Troubleshooting

## Error: `400 (Bad Request)` from identitytoolkit.googleapis.com

This error typically occurs when there's an issue with Firebase Authentication configuration or the request itself.

### Step 1: Verify Email/Password is Enabled

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Authentication** > **Sign-in method**
4. Check that **Email/Password** is enabled:
   - Click on "Email/Password"
   - Toggle "Enable" should be ON
   - Click "Save" if you made changes

### Step 2: Check Firebase Configuration

1. Verify your `firebase-config.js` file has correct values:
   ```javascript
   const FIREBASE_CONFIG = {
       apiKey: "YOUR_API_KEY",  // Should match your Firebase project
       authDomain: "your-project.firebaseapp.com",
       projectId: "your-project-id",
       // ... other values
   };
   ```

2. Make sure the `apiKey` matches your Firebase project:
   - Go to Firebase Console > Project Settings
   - Check "Your apps" section
   - Verify the API key matches

### Step 3: Check API Key Restrictions

If your API key has restrictions, it might be blocking requests:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **APIs & Services** > **Credentials**
4. Find your API key (the one in your Firebase config)
5. Click on it to edit
6. Check **API restrictions**:
   - If "Restrict key" is enabled, make sure it includes:
     - Identity Toolkit API
     - Firebase Authentication API
   - Or set to "Don't restrict key" for testing

7. Check **Application restrictions**:
   - For local testing, you may need to allow all referrers
   - Or add `localhost` and `127.0.0.1` to HTTP referrers

### Step 4: Common Error Codes and Solutions

#### `auth/user-not-found`
- **Cause**: No account exists with that email
- **Solution**: Sign up first, or use the correct email

#### `auth/wrong-password`
- **Cause**: Incorrect password
- **Solution**: Check your password, use "Forgot password" if available

#### `auth/invalid-email`
- **Cause**: Email format is invalid
- **Solution**: Check email format (e.g., user@example.com)

#### `auth/email-already-in-use` (signup only)
- **Cause**: Account already exists
- **Solution**: Sign in instead, or use a different email

#### `auth/operation-not-allowed`
- **Cause**: Email/Password authentication is not enabled
- **Solution**: Enable it in Firebase Console > Authentication > Sign-in method

#### `auth/weak-password` (signup only)
- **Cause**: Password is too weak (usually less than 6 characters)
- **Solution**: Use a stronger password (minimum 6 characters)

#### `auth/network-request-failed`
- **Cause**: Network connectivity issue
- **Solution**: Check your internet connection, try again

### Step 5: Check Browser Console

1. Open browser Developer Tools (F12)
2. Go to **Console** tab
3. Look for detailed error messages
4. Check **Network** tab for failed requests:
   - Click on the failed request
   - Check the **Response** tab for error details

### Step 6: Verify Firebase SDK is Loaded

1. In browser console, type: `typeof firebase`
2. Should return: `"object"` (not `"undefined"`)
3. Type: `typeof firebase.auth`
4. Should return: `"function"` (not `"undefined"`)

If either returns `"undefined"`, check:
- Firebase SDK scripts are loaded in `index.html`
- Scripts are loaded in correct order
- No JavaScript errors preventing script execution

### Step 7: Test with Firebase Console

1. Go to Firebase Console > Authentication > Users
2. Try creating a test user manually
3. If this fails, there might be a project-level issue

### Step 8: Check Project Status

1. Visit [Firebase Status Page](https://status.firebase.google.com/)
2. Check if there are any ongoing issues with Authentication service

### Testing Checklist

- [ ] Email/Password authentication is enabled in Firebase Console
- [ ] Firebase config has correct API key
- [ ] API key doesn't have restrictive settings
- [ ] Firebase SDK is loaded correctly
- [ ] No browser console errors
- [ ] Network connection is stable
- [ ] Email format is valid (e.g., user@example.com)
- [ ] Password meets requirements (min 6 characters for signup)

### Still Having Issues?

1. **Check Firebase Console Logs**:
   - Go to Firebase Console > Authentication > Users
   - Check if any users were created (indicates partial success)

2. **Try Creating User Manually**:
   - Firebase Console > Authentication > Add user
   - If this works, the issue is with the signup flow, not Firebase config

3. **Verify Project Selection**:
   - Make sure you're using the correct Firebase project
   - Check that `projectId` in config matches your project

4. **Clear Browser Data**:
   - Clear cache and cookies
   - Try in incognito/private window
   - Try a different browser

5. **Check for CORS Issues** (if deploying):
   - Make sure your domain is authorized
   - Check Firebase Console > Authentication > Settings > Authorized domains

### Common Mistakes

1. **Using wrong API key**: Make sure the API key in your config matches your Firebase project
2. **Forgot to enable Email/Password**: Must be enabled in Firebase Console
3. **API key restrictions**: Key might be restricted to specific APIs or domains
4. **Wrong project**: Using config from a different Firebase project
5. **Invalid email format**: Email must be properly formatted
