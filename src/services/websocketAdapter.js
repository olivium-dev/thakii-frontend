/**
 * Adapter: exports websocketService from mock or real implementation based on VITE_MOCK_MODE.
 * Uses dynamic import so mock code is not loaded in production.
 */

import { isMockMode } from '../mocks/mockConfig';

let websocketService;
if (isMockMode()) {
  const mod = await import('../mocks/mockWebSocketService');
  websocketService = mod.default;
} else {
  const mod = await import('./websocket');
  websocketService = mod.websocketService;
}

export { websocketService };
