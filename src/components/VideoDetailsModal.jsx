import React from 'react';
import { X, File, Calendar, Clock, User, AlertCircle, CheckCircle, Loader } from 'lucide-react';

const VideoDetailsModal = ({ video, isOpen, onClose }) => {
  if (!isOpen || !video) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'done':
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'in_queue':
      case 'uploaded':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'cancelled':
      case 'cancelling':
        return <X className="w-5 h-5 text-gray-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Unknown';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Video Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Filename */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-500">Filename</label>
            <div className="mt-1 p-3 bg-gray-50 rounded-lg break-words">
              <File className="w-4 h-4 inline mr-2 text-gray-400" />
              <span className="text-gray-900">{video.filename || 'Unknown'}</span>
            </div>
          </div>

          {/* Status */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-500">Status</label>
            <div className="mt-1 flex items-center">
              {getStatusIcon(video.status)}
              <span className="ml-2 text-gray-900 capitalize">{video.status || 'Unknown'}</span>
            </div>
          </div>

          {/* Progress for processing videos */}
          {video.status === 'processing' && video.progress_percent !== undefined && (
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-500">Processing Progress</label>
              <div className="mt-2">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{video.progress_percent || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${video.progress_percent || 0}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Upload Date</label>
              <div className="mt-1 flex items-center text-gray-900">
                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                {formatDate(video.upload_date || video.created_at)}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Last Updated</label>
              <div className="mt-1 flex items-center text-gray-900">
                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                {formatDate(video.updated_at)}
              </div>
            </div>
          </div>

          {/* User Info */}
          {video.user_email && (
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-500">User</label>
              <div className="mt-1 flex items-center text-gray-900">
                <User className="w-4 h-4 mr-2 text-gray-400" />
                {video.user_email}
              </div>
            </div>
          )}

          {/* Cancellation Info */}
          {video.cancelled && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg">
              <h3 className="text-sm font-medium text-red-800 mb-2">Cancellation Information</h3>
              <div className="space-y-1 text-sm text-red-700">
                {video.cancelled_by && (
                  <div>Cancelled by: {video.cancelled_by}</div>
                )}
                {video.cancelled_at && (
                  <div>Cancelled at: {formatDate(video.cancelled_at)}</div>
                )}
                {video.cancellation_reason && (
                  <div>Reason: {video.cancellation_reason}</div>
                )}
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-500">Video ID</label>
            <div className="mt-1 p-2 bg-gray-50 rounded text-xs font-mono text-gray-600 break-all">
              {video.video_id}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoDetailsModal;
