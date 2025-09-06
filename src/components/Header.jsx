import React from 'react';
import { FileText, Activity, LogOut, User, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Header = ({ healthStatus, activeTab, setActiveTab, isAdmin }) => {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo, Title and Navigation */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Thakii Lecture2PDF
                </h1>
                <p className="text-sm text-gray-500">
                  Convert lecture videos to PDF documents
                </p>
              </div>
            </div>
            
            {/* Navigation Tabs */}
            {currentUser && (
              <nav className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('videos')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition duration-200 ${
                    activeTab === 'videos'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  My Videos
                </button>
                
                {isAdmin && (
                  <button
                    onClick={() => setActiveTab('admin')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition duration-200 flex items-center ${
                      activeTab === 'admin'
                        ? 'bg-red-100 text-red-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Shield className="w-4 h-4 mr-1" />
                    Admin Dashboard
                  </button>
                )}
              </nav>
            )}
          </div>

          {/* Health Status and User Menu */}
          <div className="flex items-center space-x-4">
            {/* Health Status */}
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-gray-400" />
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    healthStatus?.status === 'healthy'
                      ? 'bg-green-500'
                      : 'bg-red-500'
                  }`}
                />
                <span className="text-sm text-gray-600">
                  {healthStatus?.status === 'healthy' ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            {/* User Menu */}
            {currentUser && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {currentUser.email}
                  </span>
                  {isAdmin && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Admin
                    </span>
                  )}
                </div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition duration-200"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;