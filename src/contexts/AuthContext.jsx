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
  const [backendToken, setBackendToken] = useState(null);

  // Check if user is admin
  const isAdmin = (email) => {
    return SUPER_ADMINS.includes(email);
  };

  // Exchange Firebase token for backend token
  const exchangeTokenWithBackend = async (firebaseUser) => {
    try {
      console.log('🔄 Exchanging Firebase token for backend token...');
      
      const firebaseToken = await firebaseUser.getIdToken();
      
      // Call backend login endpoint (bypasses broken Firebase verification)
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://thakii-02.fanusdigital.site/thakii-be'}/auth/login`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firebaseToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.backend_token) {
          setBackendToken(data.backend_token);
          localStorage.setItem('thakii_backend_token', data.backend_token);
          console.log('✅ 30-day backend token obtained and stored');
          console.log(`✅ User: ${data.user.email} (Admin: ${data.user.is_admin})`);
          return data.backend_token;
        } else {
          console.error('❌ No backend token in response:', data);
          return null;
        }
      } else {
        console.error('❌ Token exchange failed:', response.status);
        // Don't show toast error that might crash the app
        console.error('Authentication failed - please try again');
        return null;
      }
    } catch (error) {
      console.error('❌ Token exchange error:', error);
      // Don't show toast error that might crash the app
      console.error('Authentication error - please try again');
      return null;
    }
  };

  // Clear backend token
  const clearBackendToken = () => {
    setBackendToken(null);
    localStorage.removeItem('thakii_backend_token');
    console.log('🗑️ Backend token cleared');
  };

  // Firebase authentication methods
  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const googleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log('✅ Google sign-in successful:', result.user.email);
      
      // Exchange Firebase token for backend token
      await exchangeTokenWithBackend(result.user);
      
      return result;
    } catch (error) {
      console.error('❌ Google sign-in failed:', error);
      toast.error('Google sign-in failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      clearBackendToken();
      await signOut(auth);
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  // Listen for authentication state changes
  useEffect(() => {
    if (!auth) {
      console.error('❌ Firebase auth not available');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        console.log('🔄 Auth state changed:', user?.email || 'No user');
        
        if (user) {
          // User is signed in
          const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            isAdmin: isAdmin(user.email)
          };
          
          setCurrentUser(userData);
          console.log('✅ User authenticated:', userData.email, userData.isAdmin ? '(Admin)' : '(User)');
          
          // Exchange Firebase token for backend token (don't await to prevent blocking)
          exchangeTokenWithBackend(user).catch(error => {
            console.error('Token exchange failed:', error);
          });
          
        } else {
          // User is signed out
          setCurrentUser(null);
          clearBackendToken();
          console.log('👋 User signed out');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('❌ Auth state change error:', error);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Check for existing backend token on app load
  useEffect(() => {
    const storedBackendToken = localStorage.getItem('thakii_backend_token');
    if (storedBackendToken) {
      setBackendToken(storedBackendToken);
      console.log('🔑 Existing backend token found');
    }
  }, []);

  const value = {
    currentUser,
    backendToken,
    isAdmin: currentUser ? isAdmin(currentUser.email) : false,
    signup,
    login,
    googleSignIn,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
