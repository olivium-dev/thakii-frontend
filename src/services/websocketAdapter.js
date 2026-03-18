/**
 * Adapter: exports websocketService from mock or real implementation based on VITE_MOCK_MODE.
 * Uses static imports only (no top-level await) to avoid bundler TDZ in production.
 */

import { isMockMode } from '../mocks/mockConfig';
import { websocketService as realWebsocketService } from './websocket';
import mockWebSocketService from '../mocks/mockWebSocketService';

export const websocketService = isMockMode() ? mockWebSocketService : realWebsocketService;
