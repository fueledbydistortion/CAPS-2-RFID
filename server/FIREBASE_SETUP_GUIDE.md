# Firebase Setup Guide

## Server-Side Firebase Admin SDK Setup

### 1. Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `smartchild-2e350`
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key"
5. Download the JSON file

### 2. Extract Credentials from JSON

From the downloaded JSON file, extract:

- `project_id` → FIREBASE_PROJECT_ID
- `client_email` → FIREBASE_CLIENT_EMAIL
- `private_key` → FIREBASE_PRIVATE_KEY

### 3. Set Environment Variables

Create a `.env` file in the server directory with:

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

### 4. Install dotenv

```bash
npm install dotenv
```

### 5. Update server.js

Add this at the top of server.js:

```javascript
require("dotenv").config();
```

## Client-Side Authentication Issues

### 1. Check Firebase Auth State

The client needs to ensure the user is properly authenticated before making API calls.

### 2. Token Refresh

The notification service should handle token refresh automatically.

## Troubleshooting

### 401 Unauthorized

- Check if user is logged in
- Verify Firebase ID token is valid
- Ensure server has proper Firebase admin credentials

### Connection Refused

- Make sure server is running on port 3000
- Check if port 3000 is available
- Verify server dependencies are installed

### Firebase Credentials Error

- Ensure .env file exists with proper credentials
- Check if dotenv is installed and configured
- Verify Firebase project ID matches
