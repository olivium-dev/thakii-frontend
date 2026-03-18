/**
 * Adapter: exports apiService from mock or real implementation based on VITE_MOCK_MODE.
 * Uses dynamic import so mock code is not loaded in production.
 */

import { isMockMode } from '../mocks/mockConfig';

let apiService;
if (isMockMode()) {
  const mod = await import('../mocks/mockApiService');
  apiService = mod.mockApiService;
} else {
  const mod = await import('./api');
  apiService = mod.apiService;
}

export { apiService };
