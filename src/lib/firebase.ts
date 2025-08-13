import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { findMockUser, getMockUserByEmail, MockUser } from './mock-users';

// Your Firebase configuration
// Replace these values with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'demo-app-id'
};

// Initialize Firebase
let app;
let auth;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Create a mock auth object for development
  auth = {
    currentUser: null,
    onAuthStateChanged: (callback: any) => {
      callback(null);
      return () => {};
    }
  } as any;
}

export { auth };

// Authentication functions
export const signInUser = async (email: string, password: string) => {
  try {
    console.log(`start: ${email} ${password}`)
    // Check if we're using mock auth (when Firebase isn't properly configured)
    console.log(`auth: ${!auth}`)
    console.log(`auth.currentUser: ${auth?.currentUser}`)
    // if (!auth || typeof auth.currentUser === null) {
      // console.log(`in`)
      // Mock authentication for development
      const mockUser = findMockUser(email, password);
      if (mockUser) {
        console.log(`mockuser`)
        return { 
          user: { 
            email: mockUser.email, 
            displayName: mockUser.displayName,
            uid: mockUser.uid,
            role: mockUser.role
          } as any, 
          error: null 
        };
      // } else {
      //   return { user: null, error: 'Invalid email or password' };
      // }
    }
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const registerUser = async (email: string, password: string) => {
  try {
    // Check if we're using mock auth (when Firebase isn't properly configured)
    if (!auth || typeof auth.currentUser === 'undefined') {
      // Check if user already exists
      const existingUser = getMockUserByEmail(email);
      if (existingUser) {
        return { user: null, error: 'User with this email already exists' };
      }
      
      // Mock registration for development
      return { 
        user: { 
          email, 
          displayName: email.split('@')[0],
          uid: `user-${Date.now()}`,
          role: 'employee' // Default role for new registrations
        } as any, 
        error: null 
      };
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const signOutUser = async () => {
  try {
    // Check if we're using mock auth (when Firebase isn't properly configured)
    if (!auth || typeof auth.currentUser === 'undefined') {
      // Mock sign out for development
      return { error: null };
    }
    await signOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// Auth state observer
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  // Check if we're using mock auth (when Firebase isn't properly configured)
  if (!auth || typeof auth.currentUser === 'undefined') {
    // Mock auth state for development
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

export default app;
