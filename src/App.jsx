import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import VideoList from './components/VideoList';
import ServiceStatus from './components/ServiceStatus';
import AuthPage from './components/Auth/AuthPage';
import DevAuthPage from './components/Auth/DevAuthPage';
import AdminDashboard from './components/AdminDashboard';
import { apiService } from './services/api';
import { firestoreService } from './services/firestore';
import { notificationService } from './services/notifications';

function AppContent() {
  const { currentUser, isAdmin } = useAuth();
  const [videos, setVideos] = useState([]);
  const [healthStatus, setHealthStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [activeTab, setActiveTab] = useState('videos');

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
    setIsLoadingVideos(true);
    try {
      const videoList = await apiService.getVideoList();
      setVideos(Array.isArray(videoList) ? videoList : []);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      toast.error('Failed to load videos');
      setVideos([]);
    } finally {
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

  // Handle refresh
  const handleRefresh = () => {
    fetchVideos();
    fetchHealthStatus();
  };

  // Initial data fetch and real-time updates setup - DISABLED for manual refresh only
  useEffect(() => {
    if (currentUser) {
      // Initial fetch for immediate data - DISABLED, use manual refresh only
      // fetchHealthStatus();
      // fetchVideos();
      
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
      
      // Clean up listeners when component unmounts or user changes - DISABLED since no listeners are active
      // return () => {
      //   console.log('Cleaning up real-time listeners');
      //   if (unsubscribeVideos) unsubscribeVideos();
      //   if (unsubscribeHealth) unsubscribeHealth();
      //   if (unsubscribeNotifications) unsubscribeNotifications();
      // };
    }
  }, [currentUser, isAdmin]);

  // Periodic verification to keep the status accurate even if Firestore doc is stale - DISABLED for manual refresh only
  // useEffect(() => {
  //   const intervalId = setInterval(() => {
  //     fetchHealthStatus();
  //   }, 15000);
  //   return () => clearInterval(intervalId);
  // }, []);

  // Show auth page if user is not logged in
  if (!currentUser) {
    // Check if Firebase is properly configured
    const hasFirebaseConfig = import.meta.env.VITE_FIREBASE_API_KEY && 
                              import.meta.env.VITE_FIREBASE_API_KEY !== 'your_api_key_here';
    
    if (!hasFirebaseConfig) {
      return <DevAuthPage />;
    }
    
    return <AuthPage />;
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
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;