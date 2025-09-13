import React, { useState } from 'react';
import { FileText, Activity, LogOut, User, Shield, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Header = ({ healthStatus, activeTab, setActiveTab, isAdmin }) => {
  const { currentUser, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false); // Close mobile menu after selection
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main header */}
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                Thakii Lecture2PDF
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                Convert lecture videos to PDF documents
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          {currentUser && (
            <nav className="hidden md:flex space-x-4">
              <button
                onClick={() => setActiveTab('videos')}
                className={`min-h-[44px] px-4 py-2 rounded-md text-sm font-medium transition duration-200 ${
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
                  className={`min-h-[44px] px-4 py-2 rounded-md text-sm font-medium transition duration-200 flex items-center ${
                    activeTab === 'admin'
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  <span className="hidden lg:inline">Admin Dashboard</span>
                  <span className="lg:hidden">Admin</span>
                </button>
              )}
            </nav>
          )}

          {/* Right side - Health Status and User Menu */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Health Status - Compact on mobile */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    healthStatus?.status === 'healthy'
                      ? 'bg-green-500'
                      : 'bg-red-500'
                  }`}
                />
                <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">
                  {healthStatus?.status === 'healthy' ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            {/* User Menu - Desktop */}
            {currentUser && (
              <div className="hidden sm:flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700 max-w-[120px] lg:max-w-none truncate" title={currentUser.email}>
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
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition duration-200 rounded-md hover:bg-gray-100"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            {currentUser && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="min-h-[44px] min-w-[44px] md:hidden flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition duration-200"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {currentUser && mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              {/* Navigation Buttons */}
              <button
                onClick={() => handleTabChange('videos')}
                className={`w-full text-left min-h-[44px] px-4 py-3 rounded-md text-sm font-medium transition duration-200 ${
                  activeTab === 'videos'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                My Videos
              </button>
              
              {isAdmin && (
                <button
                  onClick={() => handleTabChange('admin')}
                  className={`w-full text-left min-h-[44px] px-4 py-3 rounded-md text-sm font-medium transition duration-200 flex items-center ${
                    activeTab === 'admin'
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Dashboard
                </button>
              )}

              {/* User Info and Logout */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between px-4 py-2">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate" title={currentUser.email}>
                      {currentUser.email}
                    </span>
                    {isAdmin && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex-shrink-0">
                        Admin
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-gray-600 hover:text-gray-800 transition duration-200 rounded-md hover:bg-gray-100"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;