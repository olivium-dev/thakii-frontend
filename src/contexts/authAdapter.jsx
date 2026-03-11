/**
 * Adapter: exports AuthProvider and useAuth from mock or real implementation based on VITE_MOCK_MODE.
 * Use this instead of AuthContext when the app should support mock mode.
 */

import { isMockMode } from '../mocks/mockConfig';

const authModule = isMockMode()
  ? await import('../mocks/MockAuthProvider')
  : await import('./AuthContext');

export const AuthProvider = isMockMode() ? authModule.MockAuthProvider : authModule.AuthProvider;
export const useAuth = isMockMode() ? authModule.useMockAuth : authModule.useAuth;
