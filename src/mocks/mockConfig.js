/**
 * Mock mode configuration.
 * Single source of truth for "are we mocking?" and delay tuning.
 * Used only by adapter modules; components never check this directly.
 */

export function isMockMode() {
  return import.meta.env.VITE_MOCK_MODE === 'true';
}

/** Delay in ms for API responses (simulates network latency). */
export function getMockDelay() {
  const env = import.meta.env.VITE_MOCK_DELAY;
  if (env !== undefined && env !== '') {
    const n = parseInt(env, 10);
    if (!Number.isNaN(n) && n >= 0) return n;
  }
  return 400;
}

/** Simulated upload progress duration in ms. */
export function getMockUploadDuration() {
  const env = import.meta.env.VITE_MOCK_UPLOAD_DURATION;
  if (env !== undefined && env !== '') {
    const n = parseInt(env, 10);
    if (!Number.isNaN(n) && n >= 0) return n;
  }
  return 2000;
}

/** Whether to auto-login (skip login screen) in mock mode. */
export function getMockAutoLogin() {
  return import.meta.env.VITE_MOCK_AUTO_LOGIN !== 'false';
}

/** WebSocket simulated status progression interval in ms. */
export function getMockWsInterval() {
  const env = import.meta.env.VITE_MOCK_WS_INTERVAL;
  if (env !== undefined && env !== '') {
    const n = parseInt(env, 10);
    if (!Number.isNaN(n) && n >= 0) return n;
  }
  return 3000;
}
