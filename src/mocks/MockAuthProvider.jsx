/**
 * Mock auth provider - no Firebase. Uses user.json fixture.
 * When VITE_MOCK_AUTO_LOGIN is not 'false', currentUser is set on mount.
 * Otherwise user must click "Continue with Google" to set user (no popup).
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMockAutoLogin } from './mockConfig';
import userData from './data/user.json';

const MockAuthContext = createContext();

export function useMockAuth() {
  const ctx = useContext(MockAuthContext);
  if (!ctx) throw new Error('useMockAuth must be used within MockAuthProvider');
  return ctx;
}

export function MockAuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() =>
    getMockAutoLogin() ? userData : null
  );

  useEffect(() => {
    if (getMockAutoLogin() && !currentUser) {
      setCurrentUser(userData);
    }
  }, []);

  const googleSignIn = async () => {
    await new Promise((r) => setTimeout(r, 300));
    setCurrentUser(userData);
  };

  const superLogin = async () => {
    await new Promise((r) => setTimeout(r, 300));
    setCurrentUser(userData);
    return { success: true, user: userData };
  };

  const logout = async () => {
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    backendToken: 'mock-token',
    isAdmin: currentUser ? currentUser.isAdmin === true : false,
    signup: () => Promise.reject(new Error('Mock: signup not supported')),
    login: () => Promise.reject(new Error('Mock: login not supported')),
    googleSignIn,
    superLogin,
    logout,
    loading: false,
  };

  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
}
