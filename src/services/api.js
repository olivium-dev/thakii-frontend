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
  console.log('🔑 === GET BACKEND TOKEN STARTED ===');
  
  try {
    // First check localStorage for stored backend token
    const storedToken = localStorage.getItem('thakii_backend_token');
    if (storedToken) {
      console.log('✅ Using stored backend token');
      console.log('   Token length:', storedToken.length);
      console.log('   Token preview:', storedToken.substring(0, 50) + '...');
      
      // Validate token is not expired (basic check)
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp > now) {
          console.log('✅ Stored token is valid (not expired)');
          return storedToken;
        } else {
          console.log('⚠️  Stored token expired, removing...');
          localStorage.removeItem('thakii_backend_token');
        }
      } catch (e) {
        console.log('⚠️  Could not validate stored token, using anyway');
        return storedToken;
      }
    }
    
    // Get Firebase token from current user
    if (!auth || !auth.currentUser) {
      console.log('❌ No Firebase user authenticated');
      console.log('   Auth object:', !!auth);
      console.log('   Current user:', !!auth?.currentUser);
      return null;
    }
    
    console.log('🔥 Getting fresh Firebase token...');
    const firebaseToken = await auth.currentUser.getIdToken();
    console.log('   Firebase token length:', firebaseToken.length);
    
    console.log('🔄 Exchanging Firebase token for backend token...');
    
    // Exchange Firebase token for backend token using login endpoint
    const response = await axios.post(
      `${BASE_URL}/auth/login`,
      {},
      {
        headers: { 'Authorization': `Bearer ${firebaseToken}` },
        timeout: 15000
      }
    );
    
    console.log('📊 LOGIN RESPONSE:');
    console.log('   Status:', response.status);
    console.log('   Data:', response.data);
    
    if (response.data.success && response.data.backend_token) {
      backendToken = response.data.backend_token;
      localStorage.setItem('thakii_backend_token', backendToken);
      console.log('✅ New backend token obtained and stored');
      console.log('   Token length:', backendToken.length);
      return backendToken;
    } else {
      console.error('❌ No backend token in login response');
      console.log('   Response data:', response.data);
      return null;
    }
    
  } catch (error) {
    console.error('❌ GET BACKEND TOKEN ERROR:', error);
    console.error('   Error type:', typeof error);
    console.error('   Error message:', error.message);
    console.error('   Response status:', error.response?.status);
    console.error('   Response data:', error.response?.data);
    
    // Try to use stored token as fallback
    const fallbackToken = localStorage.getItem('thakii_backend_token');
    if (fallbackToken) {
      console.log('🔄 Using fallback stored token');
      return fallbackToken;
    }
    
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
    console.log(`🌐 === API REQUEST: ${config.method?.toUpperCase()} ${config.url} ===`);
    
    try {
      // Get backend token (exchanged from Firebase token)
      console.log('🔑 Getting backend token...');
      const token = await getBackendToken();
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Backend token attached to request');
        console.log('   Token length:', token.length);
        console.log('   Token preview:', token.substring(0, 50) + '...');
      } else {
        console.log('❌ No backend token available');
        console.log('   This request will be unauthenticated');
      }
      
      console.log('📡 Request headers:', config.headers);
      return config;
      
    } catch (error) {
      console.error('❌ REQUEST INTERCEPTOR ERROR:', error);
      return config; // Continue with request even if token fails
    }
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
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
    console.log('📹 === API SERVICE: GETTING VIDEO LIST ===');
    
    try {
      console.log('📡 Making GET request to /list...');
      const response = await api.get('/list');
      
      console.log('📊 API RESPONSE DETAILS:');
      console.log('   Status:', response.status);
      console.log('   Headers:', response.headers);
      console.log('   Data type:', typeof response.data);
      console.log('   Is array:', Array.isArray(response.data));
      console.log('   Raw data:', response.data);
      
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        console.log('✅ Object response detected');
        console.log('   Keys:', Object.keys(response.data));
        console.log('   Videos:', response.data.videos);
        console.log('   Total:', response.data.total);
        
        if (response.data.error_message) {
          console.log('⚠️  Error message:', response.data.error_message);
        }
      }
      
      console.log('✅ Returning response.data to fetchVideos');
      return response.data;
      
    } catch (error) {
      console.error('❌ API SERVICE ERROR:');
      console.error('   Error type:', typeof error);
      console.error('   Error message:', error.message);
      console.error('   Response status:', error.response?.status);
      console.error('   Response data:', error.response?.data);
      throw error;
    }
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
