import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@/types';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// Firebase configuration
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
let db;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
}

interface UserContextType {
  // User data
  user: User | null;
  loading: boolean;
  
  // Actions
  signIn: (username: string, password: string) => Promise<{ user: User | null; error: string | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // Computed values
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: React.ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const savedUser = localStorage.getItem('user-session');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error checking existing session:', error);
        localStorage.removeItem('user-session');
      } finally {
        setLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  // Sign in function that checks Firestore
  const signIn = useCallback(async (username: string, password: string) => {
    try {
      if (!db) {
        return { user: null, error: 'Database not initialized' };
      }

      // Query Firestore for user with matching username and password
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

      // Get the first matching user (assuming unique employeeID)
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // Create user object (excluding password for security)
      const { password: _pw, ...userWithoutPassword } = userData;
      const user: User = {
        uid: userDoc.id,
        name: userData.name || userData.employeeID,
        email: userData.email || `${userData.employeeID}@greenfield.com.ph`,
        password: '', // Don't store password in context
        role: userData.role || 'employee',
        employeeNo: userData.employeeID,
        location: userData.location || 'Main Office',
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: new Date(),
      };

      // Save to localStorage for session persistence
      localStorage.setItem('user-session', JSON.stringify(user));
      setUser(user);

      return { user, error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { user: null, error: error.message || 'An error occurred during sign in' };
    }
  }, []);

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      localStorage.removeItem('user-session');
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!user?.uid || !db) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const { password: _pw, ...userWithoutPassword } = userData;
        
        const updatedUser: User = {
          uid: userDoc.id,
          name: userData.name || userData.employeeID,
          email: userData.email || `${userData.employeeID}@greenfield.com.ph`,
          password: '',
          role: userData.role || 'employee',
          employeeNo: userData.employeeID,
          location: userData.location || 'Main Office',
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: new Date(),
        };

        localStorage.setItem('user-session', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }, [user?.uid]);

  // Computed values
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isEmployee = user?.role === 'employee';

  const value: UserContextType = {
    user,
    loading,
    signIn,
    signOut,
    refreshUser,
    isAuthenticated,
    isAdmin,
    isEmployee,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
