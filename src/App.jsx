import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import VideoList from './components/VideoList';
import CreditPackagesModal from './components/CreditPackagesModal';
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
  const [credits, setCredits] = useState(null);
  const [showCreditPackages, setShowCreditPackages] = useState(false);

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

  const fetchCredits = async () => {
    try {
      const data = await apiService.getCreditsBalance();
      setCredits(data.credits);
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    }
  };

  // Fetch video list
  const fetchVideos = async () => {
    setIsLoadingVideos(true);
    try {
      const response = await apiService.getVideoList();
      let videoArray = [];
      let hasError = false;

      if (Array.isArray(response)) {
        videoArray = response;
      } else if (response && typeof response === 'object') {
        if (response.error) {
          console.error('Backend returned error:', response.error);
          hasError = true;
          videoArray = [];
        } else if (response.videos && Array.isArray(response.videos)) {
          videoArray = response.videos;
        } else {
          videoArray = [];
        }
      } else {
        videoArray = [];
      }

      setVideos(videoArray);
    } catch (error) {
      console.error('Failed to load videos:', error);
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

      // Immediately add the video to local state with the backend-returned video_id
      if (result && result.video_id) {
        const newVideo = {
          video_id: result.video_id,
          filename: file.name,
          status: 'in_queue',
          upload_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
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

  const startAutoRefresh = () => {
    stopAutoRefresh();
    setAutoRefreshActive(true);
    const interval = setInterval(() => fetchVideos(), 30000);
    setRefreshInterval(interval);
  };

  const stopAutoRefresh = () => {
    setAutoRefreshActive(false);
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
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
  

  // Detect return from payment website and refresh credits balance
  useEffect(() => {
    if (currentUser) {
      const urlParams = new URLSearchParams(window.location.search);
      const isReturningFromPayment =
        urlParams.get('payment_success') === 'true' || urlParams.has('payment_id');
      if (isReturningFromPayment) {
        const status = urlParams.get('status');
        window.history.replaceState({}, '', window.location.pathname);

        if (status === 'failed' || status === 'cancelled' || status === 'refunded') {
          toast.error('Payment was not successful. Please try again.');
        } else {
          fetchCredits().then(() => {
            toast.success('Credits added to your account!');
          });
        }
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchHealthStatus();
      fetchVideos();
      fetchCredits();
      setTimeout(() => startAutoRefresh(), 2000);

      websocketService.connect(currentUser.uid, (taskData) => {
        if (!taskData.video_id) {
          console.warn('WebSocket update missing video_id, ignoring:', taskData);
          return;
        }
        setVideos(prevVideos => {
          const index = prevVideos.findIndex(v => v.video_id === taskData.video_id);
          if (index !== -1) {
            const updated = [...prevVideos];
            updated[index] = { ...updated[index], ...taskData, video_id: updated[index].video_id };
            const oldStatus = prevVideos[index].status;
            if (oldStatus !== taskData.status) {
              if (taskData.status === 'completed' || taskData.status === 'done') {
                toast.success(`Video "${taskData.filename || 'unknown'}" is ready for download!`);
              } else if (taskData.status === 'failed') {
                toast.error(`Video "${taskData.filename || 'unknown'}" processing failed`);
              } else if (taskData.status === 'processing') {
                toast(`Processing video "${taskData.filename || 'unknown'}"...`, { icon: 'ℹ️' });
              }
            }
            return updated;
          }
          return [taskData, ...prevVideos];
        });
      });

      return () => {
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
        credits={credits}
        onBuyCredits={() => setShowCreditPackages(true)}
      />
      
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {activeTab === 'videos' ? (
          <div className="space-y-4 sm:space-y-8">
            {/* Mobile-first responsive layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Left column - Upload (full width on mobile) */}
              <div className="lg:col-span-1 space-y-4 sm:space-y-6">
                {/* ServiceStatus component hidden as requested */}
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


      <CreditPackagesModal
        isOpen={showCreditPackages}
        onClose={() => setShowCreditPackages(false)}
        credits={credits}
      />

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