import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { findMockUser, getMockUserByEmail, MockUser } from './mock-users';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

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
let db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
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

export { auth, db };

export const signInUser = async (username: string, password: string) => {
  try {
    // 1. Use static credentials to authenticate and store session
    await signInWithEmailAndPassword(auth, "admin@greenfield.com.ph", "@ITmgr0123");

    // 2. Fetch user from Firestore based on username and password
    const db = getFirestore(app);
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('employeeID', '==', username),
      where('password', '==', password)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { user: null, error: 'Invalid username or password' };
    }

    // Assuming usernames are unique, get the first matching user
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    // You may want to omit the password from the returned user object
    const { password: _pw, ...userWithoutPassword } = userData;

    return {
      user: {
        ...userWithoutPassword,
        uid: userDoc.id,
      },
      error: null
    };
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
