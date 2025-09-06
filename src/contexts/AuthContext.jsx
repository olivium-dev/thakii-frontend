import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '../config/firebase';
import toast from 'react-hot-toast';

const AuthContext = createContext();

// Super admin configuration
const SUPER_ADMINS = ['ouday.khaled@gmail.com', 'appsaawt@gmail.com'];

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // If auth is not initialized (Firebase not configured), set loading to false
    if (!auth) {
      console.warn('Firebase Auth not initialized. Please configure Firebase.');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAdmin(user ? SUPER_ADMINS.includes(user.email) : false);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email, password) => {
    if (!auth) {
      toast.error('Authentication not configured. Please set up Firebase.');
      return;
    }
    
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      toast.success('Successfully signed in!');
      return result;
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error(error.message);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    if (!auth) {
      toast.error('Authentication not configured. Please set up Firebase.');
      return;
    }
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      toast.success('Successfully signed in with Google!');
      return result;
    } catch (error) {
      console.error('Google sign in error:', error);
      toast.error(error.message);
      throw error;
    }
  };

  const signUp = async (email, password) => {
    if (!auth) {
      toast.error('Authentication not configured. Please set up Firebase.');
      return;
    }
    
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      toast.success('Account created successfully!');
      return result;
    } catch (error) {
      console.error('Sign up error:', error);
      toast.error(error.message);
      throw error;
    }
  };

  const logout = async () => {
    if (!auth) {
      toast.error('Authentication not configured.');
      return;
    }
    
    try {
      await signOut(auth);
      toast.success('Successfully signed out!');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  // Get ID token for API requests
  const getIdToken = async () => {
    if (currentUser && auth) {
      return await currentUser.getIdToken();
    }
    return null;
  };

  const value = {
    currentUser,
    isAdmin,
    signIn,
    signInWithGoogle,
    signUp,
    logout,
    getIdToken
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}