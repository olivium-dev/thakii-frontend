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

// Get backend token (prioritize AuthContext token over localStorage)
const getBackendToken = async () => {
  console.log('🔑 === GET BACKEND TOKEN STARTED ===');
  
  try {
    // PRIORITY 1: Check if AuthContext has set a backend token
    const authContextToken = localStorage.getItem('thakii_backend_token');
    if (authContextToken) {
      console.log('🎯 Using AuthContext backend token (from Firebase login)');
      
      // Validate token payload to see user info
      try {
        const payload = JSON.parse(atob(authContextToken.split('.')[1]));
        console.log('✅ TOKEN VALIDATION:');
        console.log('   User ID:', payload.user_id);
        console.log('   Email:', payload.email);
        console.log('   Is Admin:', payload.is_admin);
        console.log('   Expires:', new Date(payload.exp * 1000).toISOString());
        
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp > now) {
          console.log('✅ Token is valid and not expired');
          return authContextToken;
        } else {
          console.log('⚠️  Token expired, will get fresh one...');
          localStorage.removeItem('thakii_backend_token');
        }
      } catch (e) {
        console.log('⚠️  Could not decode token, using anyway');
        return authContextToken;
      }
    }
    
    // PRIORITY 2: Get fresh token via Firebase
    if (!auth || !auth.currentUser) {
      console.log('❌ No Firebase user authenticated for fresh token');
      return null;
    }
    
    console.log('🔥 Getting fresh Firebase token for backend exchange...');
    const firebaseToken = await auth.currentUser.getIdToken();
    console.log('   Firebase token length:', firebaseToken.length);
    
    // Decode Firebase token to see user info
    try {
      const firebasePayload = JSON.parse(atob(firebaseToken.split('.')[1]));
      console.log('🔥 FIREBASE TOKEN INFO:');
      console.log('   User ID:', firebasePayload.user_id || firebasePayload.sub);
      console.log('   Email:', firebasePayload.email);
      console.log('   Issuer:', firebasePayload.iss);
    } catch (e) {
      console.log('⚠️  Could not decode Firebase token');
    }
    
    console.log('🔄 Exchanging Firebase token for backend token via /auth/login...');
    
    // Exchange Firebase token for backend token using login endpoint
    const response = await axios.post(
      `${BASE_URL}/auth/login`,
      {},
      {
        headers: { 'Authorization': `Bearer ${firebaseToken}` },
        timeout: 120000  // 2 minutes for token exchange
      }
    );
    
    console.log('📊 BACKEND LOGIN RESPONSE:');
    console.log('   Status:', response.status);
    console.log('   Success:', response.data?.success);
    
    if (response.data?.success && response.data?.backend_token) {
      const newBackendToken = response.data.backend_token;
      localStorage.setItem('thakii_backend_token', newBackendToken);
      
      // Decode new backend token to verify user info
      try {
        const backendPayload = JSON.parse(atob(newBackendToken.split('.')[1]));
        console.log('✅ NEW BACKEND TOKEN INFO:');
        console.log('   User ID:', backendPayload.user_id);
        console.log('   Email:', backendPayload.email);
        console.log('   Is Admin:', backendPayload.is_admin);
        console.log('🎯 This UID should match video ownership!');
      } catch (e) {
        console.log('⚠️  Could not decode new backend token');
      }
      
      return newBackendToken;
    } else {
      console.error('❌ Backend login failed');
      console.log('   Response:', response.data);
      return null;
    }
    
  } catch (error) {
    console.error('❌ GET BACKEND TOKEN ERROR:', error);
    
    // FALLBACK: Try any stored token
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

  // Upload video file with chunked upload for large files
  async uploadVideo(file, onUploadProgress) {
    console.log('📤 === UPLOAD VIDEO STARTED ===');
    console.log('   File name:', file.name);
    console.log('   File size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    
    const fileSizeMB = file.size / 1024 / 1024;
    const useChunkedUpload = fileSizeMB > 90; // Use chunked upload for files > 90MB
    
    if (useChunkedUpload) {
      console.log('🚨 LARGE FILE - Using chunked upload (bypasses Cloudflare 100MB limit)');
      return await this.uploadVideoChunked(file, onUploadProgress);
    } else {
      console.log('📤 SMALL FILE - Using standard upload');
      return await this.uploadVideoStandard(file, onUploadProgress);
    }
  },

  // Standard upload for small files (< 90MB)
  async uploadVideoStandard(file, onUploadProgress) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 1800000, // 30 minutes for large files
        onUploadProgress: (progressEvent) => {
          if (onUploadProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onUploadProgress(percentCompleted);
          }
        }
      });

      console.log('✅ Standard upload completed successfully');
      return response.data;
      
    } catch (error) {
      console.error('❌ STANDARD UPLOAD ERROR:', error);
      throw error;
    }
  },

  // Chunked upload for large files (> 90MB)
  async uploadVideoChunked(file, onUploadProgress) {
    console.log('📦 === CHUNKED UPLOAD STARTED ===');
    
    const chunkSize = 50 * 1024 * 1024; // 50MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);
    const fileId = `chunked-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`   Chunk size: 50MB`);
    console.log(`   Total chunks: ${totalChunks}`);
    console.log(`   File ID: ${fileId}`);
    
    try {
      let totalUploaded = 0;
      
      // Upload chunks sequentially
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        
        console.log(`📦 Uploading chunk ${chunkIndex + 1}/${totalChunks} (${(chunk.size / 1024 / 1024).toFixed(1)}MB)...`);
        
        const formData = new FormData();
        formData.append('chunk', chunk, `chunk_${chunkIndex}`);
        formData.append('chunk_index', chunkIndex.toString());
        formData.append('total_chunks', totalChunks.toString());
        formData.append('file_id', fileId);
        formData.append('original_filename', file.name);
        
        const chunkResponse = await api.post('/upload-chunk', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 300000, // 5 minutes per chunk
        });
        
        if (chunkResponse.status === 200) {
          totalUploaded += chunk.size;
          const overallProgress = Math.round((totalUploaded / file.size) * 100);
          console.log(`   ✅ Chunk ${chunkIndex + 1} uploaded - Overall progress: ${overallProgress}%`);
          
          if (onUploadProgress) {
            onUploadProgress(overallProgress);
          }
        } else {
          throw new Error(`Chunk ${chunkIndex + 1} upload failed: ${chunkResponse.status}`);
        }
      }
      
      console.log('🔧 Assembling chunks into final file...');
      
      // Assemble file
      const assembleResponse = await api.post('/assemble-file', {
        file_id: fileId,
        total_chunks: totalChunks,
        original_filename: file.name
      }, {
        timeout: 600000, // 10 minutes for assembly
      });
      
      if (assembleResponse.status === 200) {
        console.log('✅ Chunked upload completed successfully!');
        if (onUploadProgress) {
          onUploadProgress(100);
        }
        return assembleResponse.data;
      } else {
        throw new Error(`File assembly failed: ${assembleResponse.status}`);
      }
      
    } catch (error) {
      console.error('❌ CHUNKED UPLOAD ERROR:');
      console.error('   Error:', error.message);
      console.error('   Response:', error.response?.data);
      throw error;
    }
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
  async downloadPdf(videoId, originalFilename) {
    console.log('📥 === DOWNLOAD PDF STARTED ===');
    console.log('   Video ID:', videoId);
    console.log('   Original filename passed:', originalFilename);
    
    // Force parameter usage to prevent optimization
    if (typeof originalFilename === 'undefined') {
      originalFilename = null;
    }
    
    try {
      // First, let's check what token we're using
      const currentToken = await getBackendToken();
      if (currentToken) {
        try {
          const payload = JSON.parse(atob(currentToken.split('.')[1]));
          console.log('🔑 DOWNLOAD TOKEN INFO:');
          console.log('   User ID:', payload.user_id);
          console.log('   Email:', payload.email);
          console.log('   Is Admin:', payload.is_admin);
        } catch (e) {
          console.log('⚠️  Could not decode download token');
        }
      }
      
      console.log('📡 Making download request...');
      const response = await api.get(`/download/${videoId}`);
      
      console.log('📊 DOWNLOAD RESPONSE:');
      console.log('   Status:', response.status);
      console.log('   Data:', response.data);
      console.log('🔍 FILENAME DEBUG:');
      console.log('   Backend filename:', response.data.filename);
      console.log('   Video ID:', response.data.video_id);
      
      // The response should contain a presigned URL
      if (response.data && response.data.download_url) {
        console.log('✅ Download URL received:', response.data.download_url);
        
        // Trigger download using the presigned URL
        const link = document.createElement('a');
        link.href = response.data.download_url;
        
        // SIMPLE FIX: Backend IS sending correct filename, just use it!
        const backendFilename = response.data.filename || videoId;
        const pdfName = backendFilename.replace(/\.[^/.]+$/, '') + '.pdf';
        
        console.log('📁 FILENAME PROCESSING:');
        console.log('   Backend filename:', response.data.filename);
        console.log('   Final PDF name:', pdfName);
        console.log('   ✅ Using backend filename directly (it has the correct name!)');
        
        // Show what we would have used from video list
        if (originalFilename) {
          console.log('   Video list filename (for reference):', originalFilename);
        }
        
        link.download = pdfName;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ Download triggered successfully');
        return response.data.download_url;
      } else {
        console.error('❌ No download URL in response');
        throw new Error('No download URL received from server');
      }
    } catch (error) {
      console.error('❌ DOWNLOAD ERROR:');
      console.error('   Error type:', typeof error);
      console.error('   Error message:', error.message);
      console.error('   Response status:', error.response?.status);
      console.error('   Response data:', error.response?.data);
      
      if (error.response?.status === 403) {
        console.error('🚨 ACCESS DENIED - User ID mismatch detected');
        console.error('   This means the backend token has wrong user ID');
      }
      
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

  // ==================== BATCH IMPORT (JOB-BASED) ====================
  
  /**
   * Submit a batch import job
   * @param {string} shareUrl - The Nextcloud share URL
   * @returns {Promise<{success: boolean, job_id: string, total_videos: number, total_size: number}>}
   */
  async submitBatchImport(shareUrl) {
    const response = await api.post('/batch-import/submit', { 
      share_url: shareUrl 
    });
    return response.data;
  },

  /**
   * Get status of a batch import job
   * @param {string} jobId - The batch job ID
   * @returns {Promise<{job_id: string, status: string, total_videos: number, processed_videos: number, failed_videos: number, videos: Array}>}
   */
  async getBatchJobStatus(jobId) {
    const response = await api.get(`/batch-import/status/${jobId}`);
    return response.data;
  },

  /**
   * List batch import jobs for the current user
   * @param {number} limit - Maximum number of jobs to return (default: 20)
   * @returns {Promise<{jobs: Array}>}
   */
  async listBatchJobs(limit = 20) {
    const response = await api.get('/batch-import/jobs', {
      params: { limit }
    });
    return response.data;
  },

  /**
   * Cancel video processing
   * @param {string} videoId - Video ID to cancel
   * @param {string} reason - Optional cancellation reason
   * @param {boolean} cleanupCompleted - Whether to cleanup completed videos
   * @returns {Promise} Response data
   */
  async cancelVideo(videoId, reason = 'User requested cancellation', cleanupCompleted = false) {
    console.log(`🚫 Cancelling video: ${videoId}`);
    
    try {
      const response = await api.post(`/cancel/${videoId}`, {
        reason: reason,
        cleanup_completed: cleanupCompleted
      });
      
      console.log('✅ Video cancellation successful:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Video cancellation failed:', error);
      
      // Extract error message from response
      const errorMessage = error.response?.data?.error || error.message || 'Failed to cancel video';
      
      // Re-throw with better error message
      const enhancedError = new Error(errorMessage);
      enhancedError.originalError = error;
      enhancedError.videoId = videoId;
      throw enhancedError;
    }
  },
  
  /**
   * Import a video from a direct URL
   * @param {string} url - Direct URL to the video file
   * @param {string} filename - Optional custom filename
   * @returns {Promise} Response data with video_id
   */
  async importSingleUrl(url, filename) {
    console.log(`📥 Importing single video from URL: ${url}`);
    
    try {
      const response = await api.post('/import-url', {
        url: url,
        filename: filename
      });
      
      console.log('✅ Single URL import successful:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Single URL import failed:', error);
      
      // Extract error message from response
      const errorMessage = error.response?.data?.error || error.message || 'Failed to import video from URL';
      
      // Re-throw with better error message
      const enhancedError = new Error(errorMessage);
      enhancedError.originalError = error;
      throw enhancedError;
    }
  },
};

// Export token management functions
export { clearBackendToken };

export default api;
