# Google Sign-In Troubleshooting

## Error: `auth/invalid-credential`

This error typically occurs when Google Sign-In is not properly configured. Follow these steps:

### Step 1: Verify Google Sign-In is Enabled

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Authentication** > **Sign-in method**
4. Check that **Google** is enabled (toggle should be ON)
5. Verify your **Project support email** is set

### Step 2: Configure OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **Important:** Make sure you select the SAME project as your Firebase project
3. Go to **APIs & Services** > **OAuth consent screen**
4. If not configured, you'll see a setup screen:
   - **User Type**: Choose "External" (unless you have a Google Workspace)
   - **App name**: Enter your app name
   - **User support email**: Your email
   - **Developer contact information**: Your email
   - Click **Save and Continue**
5. **Scopes**: Click "Save and Continue" (default scopes are fine)
6. **Test users** (if in testing mode): Add test user emails
7. **Summary**: Review and go back to dashboard

### Step 3: Verify Authorized Domains

1. In Firebase Console > **Authentication** > **Settings** tab
2. Scroll to **Authorized domains**
3. Make sure these are listed:
   - `localhost` (for local testing)
   - Your production domain (when deployed)
   - `your-project.firebaseapp.com` (usually auto-added)

### Step 4: Check Firebase Configuration

1. Verify `firebase-config.js` has correct values:
   - `apiKey` should match your Firebase project
   - `projectId` should match your Firebase project
   - All other values should be correct

2. Make sure Firebase Auth SDK is loaded:
   ```html
   <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
   ```

### Step 5: Clear Browser Cache

1. Clear browser cache and cookies
2. Try in an incognito/private window
3. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)

### Step 6: Check Browser Console

1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for any error messages
4. Check Network tab for failed requests

### Common Issues and Solutions

#### Issue: "Popup blocked"
- **Solution**: Allow popups for your site
- Check browser popup blocker settings

#### Issue: "Operation not allowed"
- **Solution**: Google Sign-In is not enabled in Firebase Console
- Enable it in Authentication > Sign-in method

#### Issue: "Invalid credential"
- **Solution**: OAuth consent screen not configured
- Follow Step 2 above to configure it

#### Issue: Works in one browser but not another
- **Solution**: Browser-specific issue
- Clear cache/cookies for that browser
- Check if browser extensions are blocking requests

### Testing Checklist

- [ ] Google Sign-In enabled in Firebase Console
- [ ] Project support email is set
- [ ] OAuth consent screen is configured in Google Cloud Console
- [ ] Authorized domains include `localhost` (for testing)
- [ ] Firebase config is correct
- [ ] Browser cache cleared
- [ ] No browser extensions blocking requests
- [ ] Using correct Firebase project

### Still Having Issues?

1. **Check Firebase Console Logs**:
   - Go to Firebase Console > Authentication > Users
   - Check if any users were created (indicates partial success)

2. **Try Email/Password Auth**:
   - If Email/Password works but Google doesn't, the issue is specific to Google setup

3. **Verify Project Selection**:
   - Make sure you're using the same project in:
     - Firebase Console
     - Google Cloud Console
     - Your `firebase-config.js` file

4. **Check Firebase Status**:
   - Visit [Firebase Status Page](https://status.firebase.google.com/)
   - Check if there are any ongoing issues

### Alternative: Use Redirect Instead of Popup

If popup continues to fail, you can modify the code to use redirect:

```javascript
// Instead of signInWithPopup, use:
await auth.signInWithRedirect(provider);
```

Then handle the redirect result:
```javascript
auth.getRedirectResult().then((result) => {
    if (result.user) {
        // User signed in
    }
});
```

However, popup is generally preferred for better UX.
