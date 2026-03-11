/**
 * Mock WebSocket service - simulates task_update events without a real socket.
 * When connect(userId, onTaskUpdate) is called, starts an interval that emits
 * progress/status updates so the UI shows real-time-like behavior.
 */

import { getMockWsInterval } from './mockConfig';
import videosData from './data/videos.json';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

class MockWebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.connected = false;
    this._onTaskUpdate = null;
    this._intervalId = null;
    this._simulatedProgress = new Map();
  }

  connect(userId, onTaskUpdate) {
    if (this.connected && this._onTaskUpdate) {
      console.log('[Mock WS] Already connected');
      return;
    }
    this._onTaskUpdate = onTaskUpdate;
    this.connected = true;
    this.socket = {
      connected: true,
      on: () => {},
      off: () => {},
      emit: () => {},
      removeListener: () => {},
    };
    console.log(`[Mock WS] Connected (user: ${userId})`);

    const intervalMs = getMockWsInterval();
    this._intervalId = setInterval(() => {
      this._emitSimulatedUpdate();
    }, intervalMs);
  }

  _emitSimulatedUpdate() {
    const inQueueOrProcessing = videosData.filter(
      (v) => v.status === 'in_queue' || v.status === 'processing'
    );
    if (inQueueOrProcessing.length === 0) {
      this._stopIntervalIfIdle();
      return;
    }

    const video = inQueueOrProcessing[0];
    const key = video.video_id;
    let progress = this._simulatedProgress.get(key) ?? (video.status === 'processing' ? video.progress_percent : 0);

    if (video.status === 'in_queue') {
      const data = {
        video_id: key,
        filename: video.filename,
        status: 'processing',
        progress_percent: 10,
      };
      this._simulatedProgress.set(key, 10);
      this._notify(data);
      return;
    }

    if (progress < 100) {
      progress = Math.min(100, progress + 15);
      this._simulatedProgress.set(key, progress);
      const data = {
        video_id: key,
        filename: video.filename,
        status: progress >= 100 ? 'done' : 'processing',
        progress_percent: progress,
      };
      this._notify(data);
      if (progress >= 100) this._simulatedProgress.delete(key);
    }
  }

  _stopIntervalIfIdle() {
    const inQueueOrProcessing = videosData.filter(
      (v) => v.status === 'in_queue' || v.status === 'processing'
    );
    if (inQueueOrProcessing.length === 0 && this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
      console.log('[Mock WS] No videos to simulate; interval stopped');
    }
  }

  _notify(data) {
    if (this._onTaskUpdate && typeof this._onTaskUpdate === 'function') {
      this._onTaskUpdate(data);
    }
    this.listeners.forEach((cb) => cb(data));
  }

  disconnect() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
    this.socket = null;
    this.connected = false;
    this._onTaskUpdate = null;
    this.listeners.clear();
    this._simulatedProgress.clear();
    console.log('[Mock WS] Disconnected');
  }

  on(key, callback) {
    this.listeners.set(key, callback);
  }

  off(key) {
    this.listeners.delete(key);
  }

  ping() {
    // no-op
  }

  isConnected() {
    return this.connected && this.socket && this.socket.connected;
  }

  emit(event, data) {
    console.log('[Mock WS] emit', event, data);
  }
}

const mockWebSocketService = new MockWebSocketService();
export { mockWebSocketService };
export default mockWebSocketService;
