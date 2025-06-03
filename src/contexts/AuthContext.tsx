import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth';
import { auth } from '../firebase/config';

interface AuthContextType {
  user: User | null;
  databaseUserId: number | null;
  userAccessLevel: number | null;
  loading: boolean;
  loginLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [databaseUserId, setDatabaseUserId] = useState<number | null>(null);
  const [userAccessLevel, setUserAccessLevel] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);

  const fetchUserDatabaseId = async (firebaseUser: User) => {
    try {
      console.log('Fetching user data for Firebase ID:', firebaseUser.uid);
      const response = await fetch(`http://localhost:5176/api/user/by-firebase-id?firebaseId=${firebaseUser.uid}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Origin': window.location.origin
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await response.json();
      console.log('Fetched user data:', userData);
      setDatabaseUserId(userData.dumpyUsersId);
      setUserAccessLevel(userData.userAccessLevel);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    // Set persistence to LOCAL
    setPersistence(auth, browserLocalPersistence)
      .catch((error) => {
        console.error("Error setting auth persistence:", error);
      });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user ? "User logged in" : "No user");
      setUser(user);
      if (user) {
        await fetchUserDatabaseId(user);
      } else {
        setDatabaseUserId(null);
        setUserAccessLevel(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const saveUserToBackend = async (firebaseUser: User) => {
    try {
      console.log('Saving user data to backend:', firebaseUser.uid);
      const response = await fetch('http://localhost:5176/api/user/google-signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': window.location.origin
        },
        credentials: 'include',
        body: JSON.stringify({
          firebaseId: firebaseUser.uid,
          userEmail: firebaseUser.email,
          userAccessLevel: 1, // Default access level for new users
          displayName: firebaseUser.displayName || null,
          photoUrl: firebaseUser.photoURL || null,
          isEmailVerified: firebaseUser.emailVerified,
          phoneNumber: firebaseUser.phoneNumber || null,
          providerId: firebaseUser.providerId
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to save user data to backend: ${errorData}`);
      }

      const savedUser = await response.json();
      console.log('User data saved to backend:', savedUser);
      setDatabaseUserId(savedUser.dumpyUsersId);
      setUserAccessLevel(savedUser.userAccessLevel);
    } catch (error) {
      console.error('Error saving user data to backend:', error);
      // Don't throw the error - we still want the user to be logged in even if backend save fails
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoginLoading(true);
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      
      console.log("Starting Google sign in...");
      
      // Ensure auth is properly initialized
      if (!auth) {
        throw new Error('Firebase Auth is not initialized');
      }

      // Set custom parameters for the Google sign-in
      provider.setCustomParameters({
        prompt: 'select_account',
        response_type: 'token',
        include_granted_scopes: 'true'
      });

      const result = await signInWithPopup(auth, provider);
      
      if (!result.user) {
        throw new Error('No user data received from Google sign in');
      }
      
      console.log("Google sign in successful:", result.user);
      
      // Save user data to backend
      await saveUserToBackend(result.user);
      
      // Fetch user data after saving
      await fetchUserDatabaseId(result.user);
      
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Pop-up was blocked by your browser. Please allow pop-ups for this site.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Sign in was cancelled. Please try again.');
      } else if (error.code === 'auth/argument-error') {
        throw new Error('There was an error with the sign-in process. Please try again.');
      } else if (error.code === 'auth/internal-error') {
        throw new Error('An internal error occurred. Please try again or contact support if the problem persists.');
      } else if (error.message?.includes('JSON')) {
        throw new Error('There was an error processing the authentication response. Please try again.');
      } else {
        throw new Error(`Authentication failed: ${error.message}`);
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setDatabaseUserId(null);
      setUserAccessLevel(null);
    } catch (error: any) {
      console.error('Error signing out:', error);
      throw new Error(`Logout failed: ${error.message}`);
    }
  };

  const value = {
    user,
    databaseUserId,
    userAccessLevel,
    loading,
    loginLoading,
    signInWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 