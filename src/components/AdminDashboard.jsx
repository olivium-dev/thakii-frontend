import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import TestNotificationButton from './TestNotificationButton';
import ServerManagement from './ServerManagement';
import AdminManagement from './AdminManagement';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

function AdminDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [videos, setVideos] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVideos: 0,
    totalPDFs: 0,
    activeProcessing: 0,
    inQueue: 0,
    failed: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  // Super admin emails
  const SUPER_ADMINS = ['ouday.khaled@gmail.com', 'appsaawt@gmail.com'];
  const isSuperAdmin = SUPER_ADMINS.includes(currentUser?.email);

  useEffect(() => {
    // Initial fetch - DISABLED for manual refresh only
    // fetchAdminData();
    
    // Set up real-time listener for all videos - DISABLED for manual refresh only
    // const unsubscribeVideos = firestoreService.subscribeToAllVideos((updatedVideos) => {
    //   console.log(`Admin dashboard received ${updatedVideos.length} videos via push notification`);
    //   setVideos(updatedVideos);
    //   setIsLoading(false);
    // });
    
    // Set up real-time listener for notifications - DISABLED for manual refresh only
    // const unsubscribeNotifications = notificationService.subscribeToNotifications((notification) => {
    //   console.log('Admin received notification:', notification);
    //   setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10 notifications
    // });
    
    // Set up listener for system notifications - DISABLED for manual refresh only
    // const unsubscribeSystemNotifications = notificationService.subscribeToSystemNotifications((systemData) => {
    //   console.log('Admin received system notification:', systemData);
    // });
    
    // Clean up listeners when component unmounts - DISABLED since no listeners are active
    // return () => {
    //   unsubscribeVideos();
    //   unsubscribeNotifications();
    //   unsubscribeSystemNotifications();
    // };
  }, []);
  
  // Fetch admin data from API
  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // Fetch admin videos and stats in parallel
      const [videosData, statsData] = await Promise.all([
        apiService.getAllVideosAdmin(),
        apiService.getSystemStats()
      ]);
      
      setVideos(videosData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      toast.error('Failed to fetch admin data');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'in_queue': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800', 
      'done': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'servers', name: 'Servers', icon: '🖥️' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    ...(isSuperAdmin ? [{ id: 'admins', name: 'Admins', icon: '👥' }] : [])
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">System Overview</h2>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <StatsCard title="Total Users" value={stats.totalUsers} icon="👤" color="bg-blue-100" />
              <StatsCard title="Total Videos" value={stats.totalVideos} icon="🎥" color="bg-green-100" />
              <StatsCard title="Total PDFs" value={stats.totalPDFs} icon="📄" color="bg-purple-100" />
              <StatsCard title="Processing" value={stats.activeProcessing} icon="⚙️" color="bg-yellow-100" />
              <StatsCard title="In Queue" value={stats.inQueue} icon="⏳" color="bg-orange-100" />
              <StatsCard title="Failed" value={stats.failed} icon="❌" color="bg-red-100" />
            </div>

            {/* Videos Table */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Recent Videos</h3>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : videos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No videos found
                </div>
              ) : (
                <>
                  {/* Mobile Card Layout */}
                  <div className="space-y-4 md:hidden">
                    {videos.slice(0, 10).map((video) => (
                      <div key={video.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate" title={video.video_name}>
                              {video.video_name}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">ID: {video.id}</p>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(video.status)} flex-shrink-0`}>
                            {video.status}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium mr-2">User:</span>
                            <span className="truncate" title={video.user_email}>{video.user_email}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium mr-2">Date:</span>
                            <span>{video.date ? new Date(video.date).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table Layout */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Video</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {videos.slice(0, 10).map((video) => (
                          <tr key={video.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900 truncate" title={video.video_name}>
                                {video.video_name}
                              </div>
                              <div className="text-sm text-gray-500">ID: {video.id}</div>
                              {/* Show user on mobile table view */}
                              <div className="text-sm text-gray-500 lg:hidden mt-1">
                                User: {video.user_email}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">
                              <div className="max-w-[200px] truncate" title={video.user_email}>
                                {video.user_email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(video.status)}`}>
                                {video.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden xl:table-cell">
                              {video.date ? new Date(video.date).toLocaleDateString() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      case 'servers':
        return <ServerManagement />;
      case 'notifications':
        return <TestNotificationButton />;
      case 'admins':
        return isSuperAdmin ? <AdminManagement /> : null;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
}

// Stats Card Component
function StatsCard({ title, value, icon, color }) {
  return (
    <div className={`${color} rounded-lg p-4 flex items-center`}>
      <div className="text-3xl mr-4">{icon}</div>
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-xl font-semibold">{value}</p>
      </div>
    </div>
  );
}

export default AdminDashboard;