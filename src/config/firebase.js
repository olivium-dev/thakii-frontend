import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBBPh9nAptY_J8i0z87YUCIXEEUc8GbVpg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "thakii-973e3.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "thakii-973e3",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "thakii-973e3.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "258632915594",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:258632915594:web:0910d1ad68ea361e912b73"
};

// Initialize Firebase (for authentication ONLY)
let app;
let auth;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  console.log('✅ Firebase auth initialized (authentication only)');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  auth = null;
}

export { auth };
export default app;
