import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import VideoList from './components/VideoList';
import ServiceStatus from './components/ServiceStatus';
import FirebaseLogin from './components/Auth/FirebaseLogin';
import AdminDashboard from './components/AdminDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import { apiService } from './services/api';
import { websocketService } from './services/websocket';

function AppContent() {
  const { currentUser, isAdmin } = useAuth();
  const [videos, setVideos] = useState([]);
  const [healthStatus, setHealthStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [activeTab, setActiveTab] = useState('videos');
  
  // Auto-refresh state
  const [autoRefreshActive, setAutoRefreshActive] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Fetch health status directly from API (authoritative)
  const fetchHealthStatus = async () => {
    try {
      const health = await apiService.checkHealth();
      setHealthStatus((prev) => ({ ...(prev || {}), ...health }));
    } catch (error) {
      console.error('Failed to fetch health status:', error);
      // Do not overwrite an existing healthy status with an error from a transient failure
      setHealthStatus((prev) => prev ? prev : { status: 'unhealthy' });
    }
  };

  // Fetch video list
  const fetchVideos = async () => {
    console.log('🎬 === FETCH VIDEOS STARTED ===');
    setIsLoadingVideos(true);
    
    try {
      console.log('📡 Calling apiService.getVideoList()...');
      const response = await apiService.getVideoList();
      
      console.log('📊 RAW BACKEND RESPONSE:');
      console.log('   Type:', typeof response);
      console.log('   Is Array:', Array.isArray(response));
      console.log('   Response:', response);
      
      // Handle different response formats
      let videoArray = [];
      let hasError = false;
      
      if (Array.isArray(response)) {
        console.log('✅ Response is array format (legacy)');
        videoArray = response;
      } else if (response && typeof response === 'object') {
        console.log('✅ Response is object format (correct)');
        console.log('   Keys:', Object.keys(response));
        
        // Check for error first
        if (response.error) {
          console.error('❌ Backend returned error:', response.error);
          hasError = true;
          videoArray = [];
        } else if (response.videos && Array.isArray(response.videos)) {
          videoArray = response.videos;
          console.log(`✅ Found videos array: ${response.videos.length} videos`);
          console.log(`✅ Total count: ${response.total || 0}`);
          
          // Log first few videos for debugging
          if (response.videos.length > 0) {
            console.log('📋 First video:', response.videos[0]);
          }
        } else {
          console.log('⚠️  No videos array in response, using empty array');
          videoArray = [];
        }
        
        if (response.error_message) {
          console.log('⚠️  Backend warning:', response.error_message);
          if (response.error_message.includes('index')) {
            console.log('🔥 Firebase index issue detected');
          }
        }
      } else {
        console.log('❌ Unexpected response format:', response);
        videoArray = [];
      }
      
      console.log(`🎯 FINAL RESULT: Setting ${videoArray.length} videos`);
      setVideos(videoArray);
      
      // Show success message
      if (!hasError) {
        console.log(`✅ Video list updated successfully: ${videoArray.length} videos`);
      }
      
    } catch (error) {
      console.error('❌ FETCH VIDEOS ERROR:', error);
      console.error('   Error type:', typeof error);
      console.error('   Error message:', error.message);
      console.error('   Error response:', error.response?.data);
      
      toast.error('Failed to load videos');
      setVideos([]);
    } finally {
      console.log('🏁 FETCH VIDEOS COMPLETED - Setting loading to false');
      setIsLoadingVideos(false);
    }
  };

  // Handle file upload
  const handleUpload = async (file) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await apiService.uploadVideo(file, (progress) => {
        setUploadProgress(progress);
      });

      toast.success('Video uploaded successfully!');
      console.log('Upload result:', result);

      // CRITICAL FIX: Immediately add the video to local state with the backend-returned video_id
      // This prevents UUID mismatch issues where frontend would show wrong video_id
      if (result && result.video_id) {
        const newVideo = {
          video_id: result.video_id,
          filename: file.name,
          status: 'in_queue',
          upload_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        
        console.log('✅ Adding uploaded video to local state:', newVideo);
        setVideos(prevVideos => [newVideo, ...prevVideos]);
      }

      // Also refresh video list after a short delay to get full backend data
      setTimeout(() => {
        fetchVideos();
      }, 2000);

    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(
        error.response?.data?.error || 
        'Upload failed. Please try again.'
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle PDF download
  const handleDownload = async (videoId, originalFilename = null) => {
    try {
      return await apiService.downloadPdf(videoId, originalFilename);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  };

  // Start auto-refresh system (simplified - no modal)
  const startAutoRefresh = () => {
    console.log('🔄 === STARTING AUTO-REFRESH SYSTEM ===');
    console.log('   Current auto-refresh state:', autoRefreshActive);
    
    // Stop any existing intervals first
    stopAutoRefresh();
    
    console.log('✅ Setting auto-refresh active to true...');
    setAutoRefreshActive(true);
    
    // Set up 30-second interval for continuous refresh
    console.log('⏰ Setting up 30-second interval...');
    const interval = setInterval(() => {
      console.log('🔄 === AUTO-REFRESH TRIGGERED ===');
      console.log('   Time:', new Date().toLocaleTimeString());
      
      fetchVideos();
    }, 30000); // 30 seconds
    setRefreshInterval(interval);
    console.log('✅ Interval set with ID:', interval);
    
    console.log('🎉 Auto-refresh system initialized (no modal timeout)');
  };
  
  // Stop auto-refresh system
  const stopAutoRefresh = () => {
    console.log('⏹️ === STOPPING AUTO-REFRESH SYSTEM ===');
    console.log('   Current interval ID:', refreshInterval);
    
    setAutoRefreshActive(false);
    console.log('✅ Auto-refresh active set to false');
    
    if (refreshInterval) {
      console.log('🛑 Clearing interval:', refreshInterval);
      clearInterval(refreshInterval);
      setRefreshInterval(null);
      console.log('✅ Interval cleared and nullified');
    }
    
    console.log('🎯 Auto-refresh system completely stopped');
  };
  
  // Handle manual refresh
  const handleRefresh = () => {
    fetchVideos();
    fetchHealthStatus();
    
    // Start auto-refresh if not already active
    if (!autoRefreshActive) {
      startAutoRefresh();
    }
  };
  

  // Initial data fetch and real-time updates setup - DISABLED for manual refresh only
  useEffect(() => {
    if (currentUser) {
      console.log('👤 User authenticated, starting initial data fetch...');
      // Initial fetch for immediate data
      fetchHealthStatus();
      fetchVideos();
      
      // Start auto-refresh after initial load
      console.log('🚀 Triggering auto-refresh after initial load...');
      setTimeout(() => {
        console.log('⏰ 2-second delay completed, starting auto-refresh...');
        startAutoRefresh();
      }, 2000); // Wait 2 seconds after initial load
      
      // Connect to WebSocket for real-time updates
      console.log('🔌 Connecting to WebSocket for real-time updates...');
      websocketService.connect(currentUser.uid, (taskData) => {
        console.log('📨 WebSocket task update received:', taskData);
        
        // CRITICAL FIX: Use video_id as the ONLY identifier (no fallback to 'id')
        // This prevents mismatched IDs from creating duplicate entries
        if (!taskData.video_id) {
          console.warn('⚠️  WebSocket update missing video_id, ignoring:', taskData);
          return;
        }
        
        // Update videos state with new task data
        setVideos(prevVideos => {
          const index = prevVideos.findIndex(v => v.video_id === taskData.video_id);
          
          if (index !== -1) {
            // Update existing video - merge task data with existing data
            const updated = [...prevVideos];
            updated[index] = { 
              ...updated[index], 
              ...taskData,
              // Ensure video_id stays consistent
              video_id: updated[index].video_id 
            };
            console.log(`✅ Updated video ${taskData.video_id} to status: ${taskData.status}`);
            
            // Show toast notification for status changes (only once per status)
            const oldStatus = prevVideos[index].status;
            if (oldStatus !== taskData.status) {
              if (taskData.status === 'completed' || taskData.status === 'done') {
                toast.success(`Video "${taskData.filename || 'unknown'}" is ready for download!`);
              } else if (taskData.status === 'failed') {
                toast.error(`Video "${taskData.filename || 'unknown'}" processing failed`);
              } else if (taskData.status === 'processing') {
                toast.info(`Processing video "${taskData.filename || 'unknown'}"...`);
              }
            }
            
            return updated;
          } else {
            // New video not in local state yet - add it
            console.log(`➕ Adding new video ${taskData.video_id} from WebSocket`);
            return [taskData, ...prevVideos];
          }
        });
      });
      
      // Clean up WebSocket and auto-refresh when component unmounts or user changes
      return () => {
        console.log('🧹 Cleaning up WebSocket and auto-refresh on unmount');
        websocketService.disconnect();
        stopAutoRefresh();
      };
    }
  }, [currentUser]);

  // Periodic verification to keep the status accurate even if Firestore doc is stale - DISABLED for manual refresh only
  // useEffect(() => {
  //   const intervalId = setInterval(() => {
  //     fetchHealthStatus();
  //   }, 15000);
  //   return () => clearInterval(intervalId);
  // }, []);


  // Show auth page if user is not logged in
  if (!currentUser) {
    return <FirebaseLogin />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        healthStatus={healthStatus} 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={isAdmin}
      />
      
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {activeTab === 'videos' ? (
          <div className="space-y-4 sm:space-y-8">
            {/* Mobile-first responsive layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Left column - Upload and Status (full width on mobile) */}
              <div className="lg:col-span-1 space-y-4 sm:space-y-6">
                <ServiceStatus healthStatus={healthStatus} />
                <FileUpload 
                  onUpload={handleUpload}
                  isUploading={isUploading}
                  uploadProgress={uploadProgress}
                />
              </div>
              
              {/* Right column - Video List (full width on mobile) */}
              <div className="lg:col-span-2">
                <VideoList
                  videos={videos}
                  onDownload={handleDownload}
                  onRefresh={handleRefresh}
                  isLoading={isLoadingVideos}
                  autoRefreshActive={autoRefreshActive}
                  onStopAutoRefresh={stopAutoRefresh}
                />
              </div>
            </div>
          </div>
        ) : activeTab === 'admin' && isAdmin ? (
          <AdminDashboard />
        ) : (
          <div className="text-center py-12">
            <div className="text-red-600 text-lg font-semibold">
              Access Denied
            </div>
            <p className="text-gray-600 mt-2">
              You don't have permission to view this section.
            </p>
          </div>
        )}
      </main>


      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10B981',
            },
          },
          error: {
            style: {
              background: '#EF4444',
            },
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;