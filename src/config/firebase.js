import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  // Actual Firebase project config
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBBPh9nAptY_J8i0z87YUCIXEEUc8GbVpg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "thakii-973e3.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "thakii-973e3",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "thakii-973e3.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "258632915594",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:258632915594:web:0910d1ad68ea361e912b73"
};

// Initialize Firebase
let app;
let auth;
let db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Create mock objects for development
  auth = null;
  db = null;
}

export { auth, db };
export default app;