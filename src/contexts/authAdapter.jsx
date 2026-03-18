/**
 * Adapter: exports AuthProvider and useAuth from mock or real implementation based on VITE_MOCK_MODE.
 * Uses static imports only (no top-level await) to avoid bundler TDZ in production.
 */

import { isMockMode } from '../mocks/mockConfig';
import { AuthProvider as RealAuthProvider, useAuth as RealUseAuth } from './AuthContext';
import { MockAuthProvider, useMockAuth } from '../mocks/MockAuthProvider';

export const AuthProvider = isMockMode() ? MockAuthProvider : RealAuthProvider;
export const useAuth = isMockMode() ? useMockAuth : RealUseAuth;
