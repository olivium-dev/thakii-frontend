import axios from 'axios';
import { auth } from '../config/firebase';

// Configure the base URL via env; fallback to local backend for development
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://thakii-02.fanusdigital.site/thakii-be';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 300000, // 5 minutes timeout for large file uploads
});

// Store backend custom token (exchanged from Firebase token)
let backendToken = null;

// Get Firebase token and exchange for backend token
const getBackendToken = async () => {
  try {
    // First check localStorage for stored backend token
    const storedToken = localStorage.getItem('thakii_backend_token');
    if (storedToken) {
      console.log('🔑 Using stored backend token');
      return storedToken;
    }
    
    // Get Firebase token from current user
    if (!auth || !auth.currentUser) {
      console.log('⚠️  No Firebase user authenticated');
      return null;
    }
    
    const firebaseToken = await auth.currentUser.getIdToken();
    console.log('🔥 Got Firebase token, exchanging for backend token...');
    
    // Exchange Firebase token for backend custom token
    const response = await axios.post(
      `${BASE_URL}/auth/exchange-token`,
      {},
      {
        headers: { 'Authorization': `Bearer ${firebaseToken}` },
        timeout: 10000
      }
    );
    
    if (response.data.custom_token) {
      backendToken = response.data.custom_token;
      localStorage.setItem('thakii_backend_token', backendToken);
      console.log('✅ Backend token obtained and stored');
      return backendToken;
    } else {
      console.error('❌ No backend token in exchange response');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Token exchange failed:', error);
    return null;
  }
};

// Clear backend token (called on logout)
const clearBackendToken = () => {
  backendToken = null;
  localStorage.removeItem('thakii_backend_token');
  console.log('🗑️ Backend token cleared');
};

// Add request interceptor to add auth token and log requests
api.interceptors.request.use(
  async (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    
    // Get backend token (exchanged from Firebase token)
    const token = await getBackendToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Backend token attached to request');
    } else {
      console.log('⚠️  No backend token available');
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log(`Response received:`, response.status, response.statusText);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.status, error.response?.statusText);
    return Promise.reject(error);
  }
);

export const apiService = {

  // Health check
  async checkHealth() {
    const response = await api.get('/health');
    return response.data;
  },

  // Upload video file - LOCAL BACKEND ONLY
  async uploadVideo(file, onUploadProgress) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onUploadProgress(percentCompleted);
        }
      },
    });

    return response.data;
  },

  // Get list of all videos - LOCAL BACKEND ONLY
  async getVideoList() {
    const response = await api.get('/list');
    return response.data;
  },

  // Get video status by ID - LOCAL BACKEND ONLY
  async getVideoStatus(videoId) {
    const response = await api.get(`/status/${videoId}`);
    return response.data;
  },

  // Download PDF by video ID - LOCAL BACKEND ONLY
  async downloadPdf(videoId) {
    try {
      console.log('Downloading PDF for video ID:', videoId);
      const response = await api.get(`/download/${videoId}`);
      console.log('Download response:', response.data);
      
      // The response should contain a presigned URL
      if (response.data && response.data.download_url) {
        console.log('Using presigned URL:', response.data.download_url);
        
        // Trigger download using the presigned URL
        const link = document.createElement('a');
        link.href = response.data.download_url;
        link.download = `${response.data.filename || videoId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return response.data.download_url;
      } else {
        throw new Error('No download URL received from server');
      }
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  },

  // Admin endpoints
  async getAllVideosAdmin() {
    const response = await api.get('/admin/videos');
    return response.data;
  },

  // System stats (videos/users) - BACKEND API
  async getSystemStats() {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // Test notification endpoint
  async sendTestNotification(type = 'simple') {
    const response = await api.post('/admin/test-notification', { type });
    return response.data;
  },

  // Server management endpoints
  async getServers() {
    const response = await api.get('/admin/servers');
    return response.data;
  },

  async addServer(serverData) {
    const response = await api.post('/admin/servers', serverData);
    return response.data;
  },

  async updateServer(serverId, serverData) {
    const response = await api.put(`/admin/servers/${serverId}`, serverData);
    return response.data;
  },

  async removeServer(serverId) {
    const response = await api.delete(`/admin/servers/${serverId}`);
    return response.data;
  },

  async checkServersHealth() {
    const response = await api.post('/admin/servers/health-check');
    return response.data;
  },

  // Admin management endpoints
  async getAdmins() {
    const response = await api.get('/admin/admins');
    return response.data;
  },

  async addAdmin(adminData) {
    const response = await api.post('/admin/admins', adminData);
    return response.data;
  },

  async updateAdmin(adminId, adminData) {
    const response = await api.put(`/admin/admins/${adminId}`, adminData);
    return response.data;
  },

  async removeAdmin(adminId) {
    const response = await api.delete(`/admin/admins/${adminId}`);
    return response.data;
  },

  // Admin users stats (roles, counts)
  async getAdminStats() {
    const response = await api.get('/admin/admins/stats');
    return response.data;
  },
};

// Export token management functions
export { clearBackendToken };

export default api;
