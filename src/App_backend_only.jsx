import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

import Header from './components/Header';
import FileUpload from './components/FileUpload';
import VideoList from './components/VideoList';
import ServiceStatus from './components/ServiceStatus';
import BackendAuth from './components/Auth/BackendAuth';
import AdminDashboard from './components/AdminDashboard';
import { apiService } from './services/api';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [healthStatus, setHealthStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [videosError, setVideosError] = useState(null);
  const [activeTab, setActiveTab] = useState('videos');

  // Check for existing authentication on app load
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        const userInfo = await apiService.getCurrentUser();
        if (userInfo.user) {
          setCurrentUser({
            email: userInfo.user.email,
            uid: userInfo.user.uid,
            isAdmin: userInfo.user.is_admin
          });
          console.log('✅ Existing authentication found:', userInfo.user.email);
        }
      } catch (error) {
        console.log('No existing authentication found');
      }
    };

    checkExistingAuth();
  }, []);

  // Fetch health status
  const fetchHealthStatus = async () => {
    try {
      const health = await apiService.checkHealth();
      setHealthStatus(health);
      console.log('✅ Health status updated:', health);
    } catch (error) {
      console.error('❌ Health check failed:', error);
      setHealthStatus({ status: 'unhealthy', error: error.message });
    }
  };

  // Fetch videos from backend
  const fetchVideos = async () => {
    if (!currentUser) return;
    
    setIsLoadingVideos(true);
    setVideosError(null);
    
    try {
      console.log('📹 Fetching video list for user:', currentUser.email);
      const response = await apiService.getVideoList();
      
      if (response.videos) {
        setVideos(response.videos);
        console.log(`✅ Videos loaded: ${response.total} videos`);
        
        if (response.error_message) {
          console.warn('⚠️  Backend warning:', response.error_message);
          toast.error('Database temporarily unavailable, showing cached data');
        }
      } else {
        setVideos([]);
        console.log('📋 No videos returned');
      }
    } catch (error) {
      console.error('❌ Failed to fetch videos:', error);
      setVideosError(error.message);
      setVideos([]);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  // Handle authentication success
  const handleAuthSuccess = (userData) => {
    setCurrentUser(userData);
    console.log('✅ User authenticated:', userData.email, userData.isAdmin ? '(Admin)' : '(User)');
    
    // Fetch initial data
    fetchHealthStatus();
    fetchVideos();
  };

  // Handle logout
  const handleLogout = () => {
    apiService.logout();
    setCurrentUser(null);
    setVideos([]);
    setHealthStatus(null);
    console.log('✅ User logged out');
  };

  // Handle video upload
  const handleUpload = async (file) => {
    if (!currentUser) {
      toast.error('Please login first');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      console.log('📤 Uploading video:', file.name);
      
      const result = await apiService.uploadVideo(file, (progress) => {
        setUploadProgress(progress);
      });

      console.log('✅ Upload result:', result);
      toast.success(`Video uploaded successfully! Processing started.`);
      
      // Refresh video list after upload
      setTimeout(fetchVideos, 2000);
      
    } catch (error) {
      console.error('❌ Upload failed:', error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle PDF download
  const handleDownload = async (videoId) => {
    try {
      console.log('📥 Downloading PDF for video:', videoId);
      await apiService.downloadPdf(videoId);
      toast.success('Download started!');
    } catch (error) {
      console.error('❌ Download failed:', error);
      toast.error(`Download failed: ${error.message}`);
    }
  };

  // Show authentication page if not logged in
  if (!currentUser) {
    return <BackendAuth onAuthSuccess={handleAuthSuccess} />;
  }

  // Show admin dashboard for admin users
  if (currentUser.isAdmin && activeTab === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          user={currentUser} 
          onLogout={handleLogout}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <AdminDashboard />
        </main>
        <Toaster position="top-right" />
      </div>
    );
  }

  // Main application
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={currentUser} 
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Upload and Status */}
            <div className="lg:col-span-1 space-y-6">
              <FileUpload
                onUpload={handleUpload}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
              />
              <ServiceStatus 
                healthStatus={healthStatus}
                onRefresh={fetchHealthStatus}
              />
            </div>
            
            {/* Right column - Video List */}
            <div className="lg:col-span-2">
              <VideoList
                videos={videos}
                onDownload={handleDownload}
                onRefresh={fetchVideos}
                isLoading={isLoadingVideos}
                error={videosError}
              />
            </div>
          </div>
        </div>
      </main>
      
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
