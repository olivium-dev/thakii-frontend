import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
  const [logoutTimer, setLogoutTimer] = useState(null);
  
  // Use ref to track if logout timer has been started (persists across renders)
  const logoutTimerStartedRef = useRef(false);

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
      // Clear the logout timer
      if (logoutTimer) {
        clearTimeout(logoutTimer);
        setLogoutTimer(null);
        logoutTimerStartedRef.current = false; // Reset timer started flag
        console.log('🕐 Logout timer cleared and flag reset');
      }
      
      clearBackendToken();
      await signOut(auth);
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  // Start automatic logout timer (2 hours)
  const startLogoutTimer = () => {
    // Clear any existing timer
    if (logoutTimer) {
      clearTimeout(logoutTimer);
    }

    console.log('🕐 Starting 2-hour logout timer...');
    const timer = setTimeout(() => {
      console.log('⏰ 2 hours elapsed - automatically logging out user');
      logout();
    }, 2 * 60 * 60 * 1000); // 2 hours in milliseconds

    setLogoutTimer(timer);
    console.log('✅ Logout timer set for 2 hours');
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
          
          // CRITICAL FIX: Only start logout timer ONCE per session using persistent ref
          // This prevents infinite recursion from multiple auth state changes
          if (!logoutTimerStartedRef.current) {
            console.log('🕐 Initial login detected - starting logout timer (ref check)');
            logoutTimerStartedRef.current = true;
            startLogoutTimer();
          } else {
            console.log('🔄 Auth state change detected - timer already running (ref = true)');
          }
          
          // Exchange Firebase token for backend token (don't await to prevent blocking)
          exchangeTokenWithBackend(user).catch(error => {
            console.error('Token exchange failed:', error);
          });
          
        } else {
          // User is signed out
          setCurrentUser(null);
          clearBackendToken();
          logoutTimerStartedRef.current = false; // Reset ref on logout
          console.log('👋 User signed out - ref reset');
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
