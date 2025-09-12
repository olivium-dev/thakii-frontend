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
  const [showRefreshModal, setShowRefreshModal] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [refreshTimeout, setRefreshTimeout] = useState(null);

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

      // Refresh video list after successful upload
      setTimeout(() => {
        fetchVideos();
      }, 1000);

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
  const handleDownload = async (videoId) => {
    try {
      return await apiService.downloadPdf(videoId);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  };

  // Start auto-refresh system
  const startAutoRefresh = () => {
    console.log('🔄 === STARTING AUTO-REFRESH SYSTEM ===');
    console.log('   Current auto-refresh state:', autoRefreshActive);
    
    // Stop any existing intervals first
    stopAutoRefresh();
    
    console.log('✅ Setting auto-refresh active to true...');
    setAutoRefreshActive(true);
    
    // Set up 5-second interval
    console.log('⏰ Setting up 5-second interval...');
    const interval = setInterval(() => {
      console.log('🔄 === AUTO-REFRESH TRIGGERED ===');
      console.log('   Time:', new Date().toLocaleTimeString());
      fetchVideos();
    }, 5000);
    setRefreshInterval(interval);
    console.log('✅ Interval set with ID:', interval);
    
    // Set up 2-minute timeout for modal
    console.log('⏰ Setting up 2-minute timeout for modal...');
    const timeout = setTimeout(() => {
      console.log('⏰ === 2 MINUTES ELAPSED ===');
      console.log('   Stopping auto-refresh BEFORE showing modal...');
      stopAutoRefresh();
      console.log('   Now showing refresh modal...');
      setShowRefreshModal(true);
    }, 120000); // 2 minutes
    setRefreshTimeout(timeout);
    console.log('✅ Timeout set with ID:', timeout);
    
    console.log('🎉 Auto-refresh system fully initialized!');
  };
  
  // Stop auto-refresh system
  const stopAutoRefresh = () => {
    console.log('⏹️ === STOPPING AUTO-REFRESH SYSTEM ===');
    console.log('   Current interval ID:', refreshInterval);
    console.log('   Current timeout ID:', refreshTimeout);
    
    setAutoRefreshActive(false);
    console.log('✅ Auto-refresh active set to false');
    
    if (refreshInterval) {
      console.log('🛑 Clearing interval:', refreshInterval);
      clearInterval(refreshInterval);
      setRefreshInterval(null);
      console.log('✅ Interval cleared and nullified');
    }
    
    if (refreshTimeout) {
      console.log('🛑 Clearing timeout:', refreshTimeout);
      clearTimeout(refreshTimeout);
      setRefreshTimeout(null);
      console.log('✅ Timeout cleared and nullified');
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
  
  // Handle modal continue
  const handleModalContinue = () => {
    console.log('✅ User chose to continue auto-refresh');
    setShowRefreshModal(false);
    startAutoRefresh(); // Restart auto-refresh
  };
  
  // Handle modal dismiss
  const handleModalDismiss = () => {
    console.log('❌ User dismissed auto-refresh modal');
    setShowRefreshModal(false);
    // Don't restart auto-refresh until manual refresh
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
      
      // Set up real-time listeners
      let unsubscribeVideos;
      let unsubscribeHealth;
      let unsubscribeNotifications;
      
      try {
        // Set up real-time listener for videos based on user role - DISABLED for manual refresh only
        // if (isAdmin) {
        //   console.log('Setting up admin real-time listener for all videos');
        //   unsubscribeVideos = firestoreService.subscribeToAllVideos((updatedVideos) => {
        //     console.log(`Received ${updatedVideos.length} videos via push notification (admin)`);
        //     setVideos(updatedVideos);
        //     toast.success('Video list updated in real-time');
        //   });
        // } else {
        //   console.log(`Setting up user real-time listener for user ${currentUser.uid}`);
        //   unsubscribeVideos = firestoreService.subscribeToUserVideos(currentUser.uid, (updatedVideos) => {
        //     console.log(`Received ${updatedVideos.length} videos via push notification`);
        //     setVideos(updatedVideos);
        //     if (updatedVideos.length > 0 && videos.length !== updatedVideos.length) {
        //       toast.success('Video list updated in real-time');
        //     }
        //   });
        // }
        
        // Set up real-time listener for health status - DISABLED for manual refresh only
        // unsubscribeHealth = firestoreService.subscribeToHealthStatus((updatedHealth) => {
        //   console.log('Received health update via push notification:', updatedHealth);
        //   // Only apply Firestore health if it contains a definitive status
        //   if (updatedHealth && typeof updatedHealth.status === 'string') {
        //     setHealthStatus((prev) => ({ ...(prev || {}), ...updatedHealth }));
        //   }
        // });
        
        // Set up real-time listener for notifications - DISABLED for manual refresh only
        // unsubscribeNotifications = notificationService.subscribeToNotifications((notification) => {
        //   console.log('Received notification:', notification);
        // });
        
        // Set up listener for system notifications - DISABLED for manual refresh only
        // const unsubscribeSystemNotifications = notificationService.subscribeToSystemNotifications((systemData) => {
        //   console.log('Received system notification:', systemData);
        // });
      } catch (error) {
        console.error('Error setting up real-time listeners:', error);
        toast.error('Failed to set up real-time updates');
        
        // Fallback to polling if real-time fails - DISABLED for manual refresh only
        // const healthInterval = setInterval(fetchHealthStatus, 30000);
        // const videoInterval = setInterval(fetchVideos, 10000);
        
        // return () => {
        //   clearInterval(healthInterval);
        //   clearInterval(videoInterval);
        // };
      }
      
      // Clean up auto-refresh when component unmounts or user changes
      return () => {
        console.log('🧹 Cleaning up auto-refresh on unmount');
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

  // Auto-refresh modal component
  const RefreshModal = () => (
    showRefreshModal && (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
              Continue Auto-Refresh?
            </h3>
            <div className="mt-2 px-7 py-3">
              <p className="text-sm text-gray-500">
                The video list has been auto-refreshing for 2 minutes. Would you like to continue 
                automatic updates or switch to manual refresh?
              </p>
            </div>
            <div className="items-center px-4 py-3">
              <button
                onClick={handleModalContinue}
                className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 mb-3"
              >
                Continue Auto-Refresh
              </button>
              <button
                onClick={handleModalDismiss}
                className="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Switch to Manual
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'videos' ? (
          <div className="space-y-8">
            {/* Service Status */}
            <ServiceStatus healthStatus={healthStatus} />

            {/* File Upload */}
            <FileUpload 
              onUpload={handleUpload}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
            />

            {/* Video List */}
            <VideoList
              videos={videos}
              onDownload={handleDownload}
              onRefresh={handleRefresh}
              isLoading={isLoadingVideos}
              autoRefreshActive={autoRefreshActive}
              onStopAutoRefresh={stopAutoRefresh}
            />
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

      {/* Auto-refresh modal */}
      <RefreshModal />

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