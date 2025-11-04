import React, { useState } from 'react';
import { FiDownload, FiRefreshCw, FiClock, FiCheck, FiAlertTriangle, FiLoader, FiCalendar, FiFile, FiX, FiInfo, FiPercent } from 'react-icons/fi';
import { apiService } from '../services/api';
import { toast } from 'react-hot-toast';
import VideoDetailsModal from './VideoDetailsModal';

function VideoList({ videos, onDownload, onRefresh, isLoading, error, autoRefreshActive, onStopAutoRefresh }) {
  const [cancellingVideos, setCancellingVideos] = useState(new Set());
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Sort videos by upload date (newest first)
  const sortedVideos = [...videos].sort((a, b) => {
    return new Date(b.upload_date || 0) - new Date(a.upload_date || 0);
  });
  
  // Truncate filename for display
  const truncateFilename = (filename, maxLength = 25) => {
    if (!filename) return 'Unknown';
    if (filename.length <= maxLength) return filename;
    
    const extension = filename.split('.').pop();
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 4);
    
    return `${truncatedName}...${extension}`;
  };

  // Show video details modal
  const showVideoDetails = (video) => {
    setSelectedVideo(video);
    setShowDetailsModal(true);
  };

  // Handle video cancellation
  const handleCancelVideo = async (video, e) => {
    // Stop event propagation to prevent opening details modal
    e && e.stopPropagation();
    
    const videoId = video.video_id;
    const filename = video.filename || 'Unknown';
    
    // Confirm cancellation
    const isCompleted = video.status === 'done' || video.status === 'completed';
    const confirmMessage = isCompleted 
      ? `Are you sure you want to delete "${truncateFilename(filename)}"? This will permanently remove the video and PDF.`
      : `Are you sure you want to cancel processing of "${truncateFilename(filename)}"?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    // Add to cancelling set
    setCancellingVideos(prev => new Set(prev).add(videoId));
    
    try {
      const result = await apiService.cancelVideo(
        videoId, 
        'User requested cancellation',
        isCompleted // cleanup_completed flag for done videos
      );
      
      toast.success(result.message || 'Video cancelled successfully');
      
      // Refresh the video list to show updated status
      if (onRefresh) {
        onRefresh();
      }
      
    } catch (error) {
      console.error('Failed to cancel video:', error);
      toast.error(error.message || 'Failed to cancel video');
    } finally {
      // Remove from cancelling set
      setCancellingVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(videoId);
        return newSet;
      });
    }
  };

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

  // Get status icon and color with progress
  const getStatusInfo = (status, progressPercent) => {
    switch (status) {
      case 'in_queue':
        return { 
          icon: <FiClock className="w-4 h-4" />, 
          text: 'In Queue', 
          color: 'text-yellow-700 bg-yellow-100 border-yellow-200' 
        };
      case 'processing':
        const progressText = progressPercent !== undefined && progressPercent > 0 
          ? `Processing (${progressPercent}%)` 
          : 'Processing';
        return { 
          icon: <FiLoader className="w-4 h-4 animate-spin" />, 
          text: progressText, 
          color: 'text-blue-700 bg-blue-100 border-blue-200' 
        };
      case 'in_progress': // Legacy status
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
      case 'failed':
        return { 
          icon: <FiAlertTriangle className="w-4 h-4" />, 
          text: 'Failed', 
          color: 'text-red-700 bg-red-100 border-red-200' 
        };
      case 'cancelled':
        return { 
          icon: <FiX className="w-4 h-4" />, 
          text: 'Cancelled', 
          color: 'text-gray-700 bg-gray-100 border-gray-200' 
        };
      case 'cancelling':
        return { 
          icon: <FiLoader className="w-4 h-4 animate-spin" />, 
          text: 'Cancelling', 
          color: 'text-orange-700 bg-orange-100 border-orange-200' 
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
    <>
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
              const { icon, text, color } = getStatusInfo(video.status, video.progress_percent);
              const displayFilename = truncateFilename(video.filename);
              const isLongFilename = video.filename && video.filename.length > 25;
              
              return (
                <div 
                  key={video.video_id} 
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => showVideoDetails(video)}
                >
                  {/* Card Header with Status */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 mr-2">
                      <div className="flex items-start">
                        <FiFile className="w-4 h-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900 break-words">
                            {displayFilename}
                          </h3>
                          {isLongFilename && (
                            <button 
                              className="text-xs text-blue-600 hover:text-blue-800 mt-1 flex items-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                showVideoDetails(video);
                              }}
                            >
                              <FiInfo className="w-3 h-3 mr-1" />
                              View full details
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${color}`}>
                      {icon}
                      <span className="ml-1">{text}</span>
                    </span>
                  </div>
                  
                  {/* Progress Bar for Processing Videos */}
                  {video.status === 'processing' && video.progress_percent !== undefined && video.progress_percent > 0 && (
                    <div className="mb-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${video.progress_percent}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Upload Date */}
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <FiCalendar className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span>{formatDate(video.upload_date)}</span>
                  </div>
                  
                  {/* Card Actions */}
                  <div className="flex gap-2 justify-end">
                    {/* Cancel Button - Show for cancellable statuses */}
                    {(video.status === 'in_queue' || video.status === 'processing' || video.status === 'done' || video.status === 'completed' || video.status === 'failed') && video.status !== 'cancelled' && video.status !== 'cancelling' && (
                      <button
                        onClick={(e) => handleCancelVideo(video, e)}
                        disabled={cancellingVideos.has(video.video_id)}
                        className="min-h-[44px] inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={video.status === 'done' || video.status === 'completed' ? 'Delete video and PDF' : 'Cancel processing'}
                      >
                        {cancellingVideos.has(video.video_id) ? (
                          <FiLoader className="w-4 h-4 animate-spin" />
                        ) : (
                          <FiX className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    
                    {/* Download Button */}
                    {(video.status === 'done' || video.status === 'completed') ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownload(video.video_id, video.filename);
                        }}
                        className="min-h-[44px] inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex-1 justify-center"
                      >
                        <FiDownload className="mr-2 w-4 h-4" />
                        Download PDF
                      </button>
                    ) : (
                      <div className="text-sm text-gray-500 py-2 text-center flex-1">
                        {video.status === 'processing' ? 'Processing...' : 
                         video.status === 'in_queue' ? 'Waiting in queue...' : 
                         video.status === 'failed' ? 'Processing failed' : 
                         video.status === 'cancelled' ? 'Cancelled' :
                         video.status === 'cancelling' ? 'Cancelling...' : 'Status unknown'}
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
                    const { icon, text, color } = getStatusInfo(video.status, video.progress_percent);
                    const displayFilename = truncateFilename(video.filename);
                    const isLongFilename = video.filename && video.filename.length > 36;
                    
                    return (
                      <tr 
                        key={video.video_id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => showVideoDetails(video)}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            <FiFile className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                            <div className="flex-1">
                              <span className="truncate" title={video.filename}>
                                {displayFilename}
                              </span>
                              {isLongFilename && (
                                <button 
                                  className="ml-2 text-blue-600 hover:text-blue-800"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    showVideoDetails(video);
                                  }}
                                >
                                  <FiInfo className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                          <div className="flex items-center">
                            <FiCalendar className="w-4 h-4 mr-2 text-gray-400" />
                            {formatDate(video.upload_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
                              {icon}
                              <span className="ml-1">{text}</span>
                            </span>
                            {video.status === 'processing' && video.progress_percent !== undefined && video.progress_percent > 0 && (
                              <div className="mt-2 w-32">
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div 
                                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${video.progress_percent}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            {/* Cancel Button - Show for cancellable statuses */}
                            {(video.status === 'in_queue' || video.status === 'processing' || video.status === 'done' || video.status === 'completed' || video.status === 'failed') && video.status !== 'cancelled' && video.status !== 'cancelling' && (
                              <button
                                onClick={(e) => handleCancelVideo(video, e)}
                                disabled={cancellingVideos.has(video.video_id)}
                                className="min-h-[44px] inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={video.status === 'done' || video.status === 'completed' ? 'Delete video and PDF' : 'Cancel processing'}
                              >
                                {cancellingVideos.has(video.video_id) ? (
                                  <FiLoader className="w-4 h-4 animate-spin" />
                                ) : (
                                  <FiX className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            
                            {/* Download Button or Status */}
                            {(video.status === 'done' || video.status === 'completed') ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDownload(video.video_id, video.filename);
                                }}
                                className="min-h-[44px] inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                <FiDownload className="mr-1 w-4 h-4" />
                                <span className="hidden lg:inline">Download PDF</span>
                                <span className="lg:hidden">PDF</span>
                              </button>
                            ) : (
                              <span className="text-sm text-gray-500">
                                {video.status === 'processing' ? 'Processing...' : 
                                 video.status === 'in_queue' ? 'In queue...' : 
                                 video.status === 'failed' ? 'Failed' : 
                                 video.status === 'cancelled' ? 'Cancelled' :
                                 video.status === 'cancelling' ? 'Cancelling...' : 'Unknown'}
                              </span>
                            )}
                          </div>
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

      {/* Video Details Modal */}
      <VideoDetailsModal
        video={selectedVideo}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedVideo(null);
        }}
      />
    </>
  );
}

export default VideoList;