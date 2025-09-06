import React from 'react';
import { FiDownload, FiRefreshCw, FiClock, FiCheck, FiAlertTriangle, FiLoader } from 'react-icons/fi';

function VideoList({ videos, onDownload, onRefresh, isLoading }) {
  // Sort videos by upload date (newest first)
  const sortedVideos = [...videos].sort((a, b) => {
    return new Date(b.upload_date || 0) - new Date(a.upload_date || 0);
  });

  // Get status icon and color
  const getStatusInfo = (status) => {
    switch (status) {
      case 'in_queue':
        return { 
          icon: <FiClock className="mr-1" />, 
          text: 'In Queue', 
          color: 'text-yellow-600 bg-yellow-100' 
        };
      case 'in_progress':
        return { 
          icon: <FiLoader className="mr-1 animate-spin" />, 
          text: 'Processing', 
          color: 'text-blue-600 bg-blue-100' 
        };
      case 'done':
        return { 
          icon: <FiCheck className="mr-1" />, 
          text: 'Ready', 
          color: 'text-green-600 bg-green-100' 
        };
      case 'failed':
        return { 
          icon: <FiAlertTriangle className="mr-1" />, 
          text: 'Failed', 
          color: 'text-red-600 bg-red-100' 
        };
      default:
        return { 
          icon: <FiClock className="mr-1" />, 
          text: 'Unknown', 
          color: 'text-gray-600 bg-gray-100' 
        };
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">My Videos</h2>
        <button
          onClick={onRefresh}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <FiRefreshCw className="mr-2" />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : sortedVideos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No videos uploaded yet.</p>
          <p className="mt-2 text-sm">Upload a video to get started!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Filename
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {video.filename}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {video.upload_date || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>
                        {icon} {text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {video.status === 'done' ? (
                        <button
                          onClick={() => onDownload(video.id || video.video_id)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <FiDownload className="mr-1" /> Download PDF
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500">
                          {video.status === 'in_progress' ? 'Processing...' : 
                           video.status === 'in_queue' ? 'Waiting in queue...' : 
                           video.status === 'failed' ? 'Processing failed' : 'Status unknown'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {/* Real-time update indicator */}
          <div className="text-center mt-4 text-xs text-gray-500 flex items-center justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Real-time updates enabled
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoList;