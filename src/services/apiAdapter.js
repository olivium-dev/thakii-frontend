/**
 * Adapter: exports apiService from mock or real implementation based on VITE_MOCK_MODE.
 * Uses static imports only (no top-level await) to avoid bundler TDZ in production.
 */

import { isMockMode } from '../mocks/mockConfig';
import { apiService as realApiService } from './api';
import { mockApiService } from '../mocks/mockApiService';

export const apiService = isMockMode() ? mockApiService : realApiService;
