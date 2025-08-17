# Firestore-Based Authentication System

This document explains the new authentication system that uses Firestore instead of Firebase Authentication.

## Overview

The authentication system has been updated to validate user credentials against a Firestore database instead of using Firebase Authentication. This allows for more control over user management and integration with existing user data.

## How It Works

### 1. User Login Process
1. User enters username (employeeID) and password on the login form
2. System queries the Firestore `users` collection
3. Looks for a document where `employeeID` matches the username AND `password` matches the password
4. If found, creates a user session and stores it in localStorage
5. If not found, returns an error message

### 2. Session Management
- User sessions are stored in localStorage as `user-session`
- Sessions persist until the user signs out or clears browser data
- No server-side session management required

### 3. User Context
The `UserContext` provides:
- `user`: Current user object (null if not authenticated)
- `loading`: Loading state
- `signIn(username, password)`: Sign in function
- `signOut()`: Sign out function
- `refreshUser()`: Refresh user data from Firestore
- `isAuthenticated`: Boolean indicating if user is logged in
- `isAdmin`/`isEmployee`: Role-based boolean values

## Firestore Database Structure

### Users Collection
Each user document should have the following structure:

```javascript
{
  employeeID: "string",        // Username for login
  password: "string",          // Password for login
  name: "string",              // Full name
  email: "string",             // Email address
  role: "admin" | "employee",  // User role
  location: "string",          // User location
  createdAt: Timestamp,        // Account creation date
  updatedAt: Timestamp         // Last update date
}
```

### Example User Document
```javascript
{
  employeeID: "EMP001",
  password: "password123",
  name: "John Doe",
  email: "john.doe@company.com",
  role: "admin",
  location: "Main Office",
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
}
```

## Usage Examples

### Login Component
```tsx
import { useUser } from '@/contexts/UserContext';

const Login = () => {
  const { signIn } = useUser();
  
  const handleLogin = async (username: string, password: string) => {
    const { user, error } = await signIn(username, password);
    
    if (error) {
      // Handle error
      console.error(error);
    } else {
      // Navigate to dashboard
      navigate('/app/dashboard');
    }
  };
};
```

### Protected Route
```tsx
import { useUser } from '@/contexts/UserContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useUser();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/" />;
  
  return children;
};
```

### Header with Logout
```tsx
import { useUser } from '@/contexts/UserContext';

const Header = () => {
  const { user, signOut } = useUser();
  
  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };
  
  return (
    <div>
      <span>Welcome, {user?.name}</span>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};
```

## Security Considerations

### Current Implementation
- Passwords are stored in plain text in Firestore (NOT recommended for production)
- No password hashing or encryption
- No rate limiting on login attempts
- No session expiration

### Recommended Improvements
1. **Password Hashing**: Use bcrypt or similar to hash passwords before storing
2. **Rate Limiting**: Implement rate limiting on login attempts
3. **Session Expiration**: Add session timeout functionality
4. **HTTPS**: Ensure all communication is over HTTPS
5. **Input Validation**: Validate and sanitize all user inputs
6. **Audit Logging**: Log authentication attempts and failures

## Testing

### Test Page
Visit `/test-auth` to see the current authentication state and test the system.

### Test Credentials
You can use the test credentials page at `/test-credentials` to see available mock users.

## Migration from Firebase Auth

### What Changed
1. Removed dependency on Firebase Authentication
2. Updated all components to use `useUser` instead of `useAuth`
3. Changed authentication flow to use Firestore queries
4. Updated session management to use localStorage

### What Remains the Same
1. Protected routes still work the same way
2. User roles and permissions system unchanged
3. UI components and styling unchanged
4. Navigation and routing unchanged

## Troubleshooting

### Common Issues

1. **"Database not initialized" error**
   - Check Firebase configuration in environment variables
   - Ensure Firestore is enabled in your Firebase project

2. **"Invalid username or password" error**
   - Verify the user exists in Firestore
   - Check that employeeID and password fields match exactly
   - Ensure the document structure is correct

3. **Session not persisting**
   - Check if localStorage is enabled in the browser
   - Verify the user object is being saved correctly

4. **Role-based access not working**
   - Ensure the user document has a `role` field
   - Check that the role value is either "admin" or "employee"

### Debug Steps
1. Check browser console for errors
2. Verify Firestore rules allow read access to users collection
3. Test with the `/test-auth` page
4. Check localStorage for saved session data
