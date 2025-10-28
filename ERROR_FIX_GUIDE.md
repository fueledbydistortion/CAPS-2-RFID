# Error Fix Guide

## Issues Identified and Solutions

### 1. **401 Unauthorized Errors**

**Problem**: The notification service is getting 401 errors because Firebase authentication tokens are not being generated properly.

**Solutions Applied**:

- ✅ Added better error logging to `notificationService.js`
- ✅ Improved token refresh logic
- ✅ Added retry mechanism for expired tokens

### 2. **ERR_CONNECTION_REFUSED**

**Problem**: The schedule service can't connect to the server because the server isn't running.

**Solutions Applied**:

- ✅ Added dotenv dependency to server
- ✅ Updated server.js to load environment variables
- ✅ Created test connection script

### 3. **Firebase Credentials Error**

**Problem**: The Firebase admin SDK can't find valid credentials.

**Solutions Applied**:

- ✅ Created Firebase setup guide
- ✅ Added dotenv configuration
- ✅ Updated server configuration

## Next Steps to Complete the Fix

### 1. **Set up Firebase Credentials**

You need to create a `.env` file in the `server` directory with your Firebase service account credentials:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=smartchild-2e350
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@smartchild-2e350.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Semaphore SMS API Configuration
SEMAPHORE_API_KEY=your-semaphore-api-key-here
SEMAPHORE_SENDER_NAME=SmartChildcare

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 2. **Get Firebase Service Account Key**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `smartchild-2e350`
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key"
5. Download the JSON file and extract the credentials

### 3. **Start the Server**

```bash
cd server
npm start
```

### 4. **Test the Connection**

```bash
node test-connection.js
```

## Files Modified

1. **server/package.json** - Added dotenv dependency
2. **server/server.js** - Added dotenv configuration
3. **client/src/utils/notificationService.js** - Improved error handling
4. **server/FIREBASE_SETUP_GUIDE.md** - Created setup guide
5. **server/test-connection.js** - Created connection test

## Expected Results

After completing the setup:

- ✅ Server should start without Firebase credential errors
- ✅ Client should be able to authenticate properly
- ✅ API calls should work with proper authentication
- ✅ No more 401 or connection refused errors

## Troubleshooting

If you still get errors:

1. Check if the server is running: `netstat -an | findstr :3000`
2. Verify Firebase credentials are correct
3. Check browser console for authentication errors
4. Ensure user is logged in before making API calls
