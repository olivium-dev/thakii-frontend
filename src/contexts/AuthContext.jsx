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
    console.log('🔄 === TOKEN EXCHANGE STARTED ===');
    
    try {
      console.log('🔥 Getting Firebase ID token...');
      const firebaseToken = await firebaseUser.getIdToken();
      console.log('   Firebase token length:', firebaseToken.length);
      console.log('   Firebase token preview:', firebaseToken.substring(0, 50) + '...');
      
      const backendUrl = import.meta.env.VITE_API_BASE_URL || 'https://thakii-02.fanusdigital.site/thakii-be';
      console.log('🌐 Calling backend login endpoint:', `${backendUrl}/auth/login`);
      
      // Call backend login endpoint (bypasses broken Firebase verification)
      const response = await fetch(`${backendUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firebaseToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 BACKEND LOGIN RESPONSE:');
      console.log('   Status:', response.status);
      console.log('   OK:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('   Response data:', data);
        
        if (data.success && data.backend_token) {
          setBackendToken(data.backend_token);
          localStorage.setItem('thakii_backend_token', data.backend_token);
          console.log('✅ 30-day backend token obtained and stored');
          console.log('   Backend token length:', data.backend_token.length);
          console.log(`✅ User: ${data.user.email} (Admin: ${data.user.is_admin})`);
          
          // Decode and verify the backend token contains correct user info
          try {
            const payload = JSON.parse(atob(data.backend_token.split('.')[1]));
            console.log('🔍 BACKEND TOKEN VERIFICATION:');
            console.log('   Token User ID:', payload.user_id);
            console.log('   Token Email:', payload.email);
            console.log('   Token Admin:', payload.is_admin);
            console.log('🎯 This should match your video ownership!');
          } catch (e) {
            console.log('⚠️  Could not decode backend token for verification');
          }
          
          console.log('🎯 TOKEN EXCHANGE SUCCESSFUL');
          return data.backend_token;
        } else {
          console.error('❌ No backend token in response:', data);
          console.log('🔍 Response analysis:');
          console.log('   Success:', data.success);
          console.log('   Has backend_token:', !!data.backend_token);
          return null;
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Token exchange failed:', response.status);
        console.error('   Error response:', errorText);
        return null;
      }
    } catch (error) {
      console.error('❌ TOKEN EXCHANGE ERROR:', error);
      console.error('   Error type:', typeof error);
      console.error('   Error message:', error.message);
      console.error('   Stack:', error.stack);
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
