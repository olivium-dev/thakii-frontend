import React from 'react';
import { FiDownload, FiRefreshCw, FiClock, FiCheck, FiAlertTriangle, FiLoader, FiCalendar, FiFile } from 'react-icons/fi';

function VideoList({ videos, onDownload, onRefresh, isLoading, error, autoRefreshActive, onStopAutoRefresh }) {
  // Sort videos by upload date (newest first)
  const sortedVideos = [...videos].sort((a, b) => {
    return new Date(b.upload_date || 0) - new Date(a.upload_date || 0);
  });

  // Format date for better mobile display
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Unknown') return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">My Videos</h2>
          <button disabled className="min-h-[44px] px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed flex items-center justify-center">
            <FiRefreshCw className="mr-2 animate-spin" />
            Loading...
          </button>
        </div>
        <div className="flex items-center justify-center py-12">
          <FiLoader className="animate-spin h-8 w-8 text-blue-500 mr-3" />
          <span className="text-gray-600">Loading your videos...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">My Videos</h2>
          <button
            onClick={onRefresh}
            className="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center"
          >
            <FiRefreshCw className="mr-2" />
            Retry
          </button>
        </div>
        <div className="flex items-center justify-center py-12">
          <FiAlertTriangle className="h-8 w-8 text-red-500 mr-3" />
          <div className="text-center">
            <p className="text-red-600 font-medium">Failed to load videos</p>
            <p className="text-gray-500 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Get status icon and color
  const getStatusInfo = (status) => {
    switch (status) {
      case 'in_queue':
        return { 
          icon: <FiClock className="w-4 h-4" />, 
          text: 'In Queue', 
          color: 'text-yellow-700 bg-yellow-100 border-yellow-200' 
        };
      case 'in_progress':
        return { 
          icon: <FiLoader className="w-4 h-4 animate-spin" />, 
          text: 'Processing', 
          color: 'text-blue-700 bg-blue-100 border-blue-200' 
        };
      case 'done':
      case 'completed':
        return { 
          icon: <FiCheck className="w-4 h-4" />, 
          text: 'Ready', 
          color: 'text-green-700 bg-green-100 border-green-200' 
        };
      case 'processing':
        return { 
          icon: <FiLoader className="w-4 h-4 animate-spin" />, 
          text: 'Processing', 
          color: 'text-blue-700 bg-blue-100 border-blue-200' 
        };
      case 'failed':
        return { 
          icon: <FiAlertTriangle className="w-4 h-4" />, 
          text: 'Failed', 
          color: 'text-red-700 bg-red-100 border-red-200' 
        };
      default:
        return { 
          icon: <FiClock className="w-4 h-4" />, 
          text: 'Unknown', 
          color: 'text-gray-700 bg-gray-100 border-gray-200' 
        };
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 sm:p-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">My Videos</h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {autoRefreshActive && (
            <div className="flex items-center text-green-600 text-sm order-2 sm:order-1">
              <FiRefreshCw className="animate-spin mr-1 w-4 h-4" />
              <span className="hidden sm:inline">Auto-refreshing every 30s</span>
              <span className="sm:hidden">Auto-refresh</span>
              <button
                onClick={onStopAutoRefresh}
                className="ml-2 text-xs text-gray-500 hover:text-gray-700 underline min-h-[32px] px-2"
              >
                Stop
              </button>
            </div>
          )}
          <button
            onClick={onRefresh}
            className="min-h-[44px] inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 order-1 sm:order-2"
          >
            <FiRefreshCw className="mr-2 w-4 h-4" />
            {autoRefreshActive ? 'Refresh Now' : 'Refresh'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : sortedVideos.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FiFile className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-base font-medium">No videos uploaded yet</p>
          <p className="mt-2 text-sm">Upload a video to get started!</p>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout */}
          <div className="space-y-4 md:hidden">
            {sortedVideos.map((video) => {
              const { icon, text, color } = getStatusInfo(video.status);
              return (
                <div key={video.id || video.video_id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate pr-2" title={video.filename}>
                        <FiFile className="inline w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                        {video.filename}
                      </h3>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color} flex-shrink-0`}>
                      {icon}
                      <span className="ml-1">{text}</span>
                    </span>
                  </div>
                  
                  {/* Card Body */}
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <FiCalendar className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span>{formatDate(video.upload_date)}</span>
                  </div>
                  
                  {/* Card Actions */}
                  <div className="flex justify-end">
                    {(video.status === 'done' || video.status === 'completed') ? (
                      <button
                        onClick={() => onDownload(video.id || video.video_id)}
                        className="min-h-[44px] inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full justify-center"
                      >
                        <FiDownload className="mr-2 w-4 h-4" />
                        Download PDF
                      </button>
                    ) : (
                      <div className="text-sm text-gray-500 py-2 text-center w-full">
                        {(video.status === 'in_progress' || video.status === 'processing') ? 'Processing...' : 
                         video.status === 'in_queue' ? 'Waiting in queue...' : 
                         video.status === 'failed' ? 'Processing failed' : 'Status unknown'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Filename
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Upload Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedVideos.map((video) => {
                    const { icon, text, color } = getStatusInfo(video.status);
                    return (
                      <tr key={video.id || video.video_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            <FiFile className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                            <span className="truncate" title={video.filename}>{video.filename}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                          <div className="flex items-center">
                            <FiCalendar className="w-4 h-4 mr-2 text-gray-400" />
                            {formatDate(video.upload_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
                            {icon}
                            <span className="ml-1">{text}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {(video.status === 'done' || video.status === 'completed') ? (
                            <button
                              onClick={() => onDownload(video.id || video.video_id)}
                              className="min-h-[44px] inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              <FiDownload className="mr-1 w-4 h-4" />
                              <span className="hidden lg:inline">Download PDF</span>
                              <span className="lg:hidden">PDF</span>
                            </button>
                          ) : (
                            <span className="text-sm text-gray-500">
                              {(video.status === 'in_progress' || video.status === 'processing') ? 'Processing...' : 
                               video.status === 'in_queue' ? 'In queue...' : 
                               video.status === 'failed' ? 'Failed' : 'Unknown'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Real-time update indicator */}
          <div className="text-center mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 flex items-center justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Real-time updates enabled
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default VideoList;