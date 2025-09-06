import axios from 'axios';
import { auth } from '../config/firebase';

// Configure the base URL via env; fallback to local backend for development
// Set VITE_API_BASE_URL in your web .env to point to API Gateway in production
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 300000, // 5 minutes timeout for large file uploads
});

// Add authentication token to requests
const getAuthToken = async () => {
  try {
    if (!auth) {
      console.warn('Firebase auth not initialized');
      return null;
    }
    
    const user = auth.currentUser;
    if (user) {
      console.log('Getting auth token for user:', user.email);
      return await user.getIdToken();
    } else {
      console.log('No authenticated user found');
      return null;
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Add request interceptor to add auth token and log requests
api.interceptors.request.use(
  async (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    
    // Add authentication token to headers
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
  // Health check - LOCAL BACKEND ONLY
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

export default api;
