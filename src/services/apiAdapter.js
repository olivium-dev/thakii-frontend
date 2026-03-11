/**
 * Adapter: exports apiService from mock or real implementation based on VITE_MOCK_MODE.
 * Uses dynamic import so mock code is not loaded in production.
 */

import { isMockMode } from '../mocks/mockConfig';

const apiService = isMockMode()
  ? (await import('../mocks/mockApiService')).mockApiService
  : (await import('./api')).apiService;

export { apiService };
