# Firebase Setup Guide

## Prerequisites
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication in your Firebase project
3. Set up Email/Password authentication method

## Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Getting Firebase Configuration

1. Go to your Firebase Console
2. Click on the gear icon (⚙️) next to "Project Overview"
3. Select "Project settings"
4. Scroll down to "Your apps" section
5. Click on the web app icon (</>)
6. Register your app if you haven't already
7. Copy the configuration values from the provided config object

## Authentication Setup

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider
5. Optionally, you can add additional providers like Google, GitHub, etc.

## Creating Test Users

1. In Firebase Console, go to "Authentication" > "Users"
2. Click "Add user"
3. Enter email and password for test users
4. Use these credentials to test the login functionality

## Security Rules (Optional)

If you plan to use Firestore or Storage, make sure to set up appropriate security rules in your Firebase Console.

## Testing

1. Start your development server: `npm run dev`
2. Navigate to `/login`
3. Use the test credentials you created in Firebase Console
4. You should be redirected to the dashboard upon successful login
