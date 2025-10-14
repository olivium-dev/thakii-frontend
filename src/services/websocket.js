/**
 * WebSocket Service for Real-time Updates
 * Replaces Firestore real-time listeners with WebSocket
 */

import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Map();
    this.connected = false;
  }
  
  /**
   * Connect to WebSocket server
   * @param {string} userId - User ID to join user-specific room
   * @param {function} onTaskUpdate - Callback for task updates
   */
  connect(userId, onTaskUpdate) {
    if (this.socket && this.connected) {
      console.log('✅ WebSocket already connected');
      return;
    }

    const backendUrl = import.meta.env.VITE_API_BASE_URL || 
                       'https://thakii-02.fanusdigital.site/thakii-be';
    
    console.log(`🔌 Connecting to WebSocket: ${backendUrl}`);
    
    this.socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });
    
    // Connection event
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.connected = true;
      this.reconnectAttempts = 0;
      
      // Join user-specific room
      if (userId) {
        this.socket.emit('join', { user_id: userId });
        console.log(`👤 Joined room: user_${userId}`);
      }
    });
    
    // Task update event
    this.socket.on('task_update', (data) => {
      console.log('📨 Task update received:', data);
      if (onTaskUpdate && typeof onTaskUpdate === 'function') {
        onTaskUpdate(data);
      }
      
      // Call any registered listeners
      this.listeners.forEach((callback, listenerKey) => {
        callback(data);
      });
    });
    
    // Disconnection event
    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      this.connected = false;
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect manually
        this.socket.connect();
      }
    });
    
    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      this.connected = false;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('⚠️  Max reconnection attempts reached. Falling back to polling.');
      }
    });
    
    // Reconnection event
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ WebSocket reconnected after ${attemptNumber} attempts`);
      this.connected = true;
      
      // Rejoin user room
      if (userId) {
        this.socket.emit('join', { user_id: userId });
      }
    });
    
    // Ping-pong for keep-alive
    this.socket.on('pong', (data) => {
      console.log('🏓 Pong received:', data);
    });
  }
  
  /**
   * Register a listener for task updates
   * @param {string} key - Unique key for the listener
   * @param {function} callback - Callback function
   */
  on(key, callback) {
    this.listeners.set(key, callback);
  }
  
  /**
   * Unregister a listener
   * @param {string} key - Key of the listener to remove
   */
  off(key) {
    this.listeners.delete(key);
  }
  
  /**
   * Send ping to keep connection alive
   */
  ping() {
    if (this.socket && this.connected) {
      this.socket.emit('ping');
    }
  }
  
  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket');
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.listeners.clear();
    }
  }
  
  /**
   * Check if WebSocket is connected
   * @returns {boolean}
   */
  isConnected() {
    return this.connected && this.socket && this.socket.connected;
  }
  
  /**
   * Emit a custom event
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('⚠️  Cannot emit event, WebSocket not connected');
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;

