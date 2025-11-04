import React, { useState } from 'react';
import { X, Link, Loader, AlertCircle, Download } from 'lucide-react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const SingleUrlImportModal = ({ isOpen, onClose, onImportSuccess }) => {
  const [url, setUrl] = useState('');
  const [filename, setFilename] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    // Extract filename from URL if not provided
    const finalFilename = filename.trim() || url.split('/').pop().split('?')[0] || 'imported_video.mp4';

    setIsImporting(true);

    try {
      const result = await apiService.importSingleUrl(url, finalFilename);
      
      toast.success('Video import started successfully!');
      onImportSuccess && onImportSuccess(result);
      
      // Reset form
      setUrl('');
      setFilename('');
      onClose();
      
    } catch (error) {
      console.error('Import failed:', error);
      toast.error(error.message || 'Failed to import video');
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <Link className="w-5 h-5 mr-2 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Import Video from URL</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isImporting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* URL Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/video.mp4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isImporting}
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter the direct URL to the video file
            </p>
          </div>

          {/* Filename Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filename (optional)
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="my-video.mp4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isImporting}
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave empty to use the original filename from URL
            </p>
          </div>

          {/* Info Box */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">How it works:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>The video will be downloaded from the URL</li>
                  <li>It will be uploaded to our processing queue</li>
                  <li>Processing will start automatically</li>
                  <li>You can track progress in the video list</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isImporting}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={isImporting || !url.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isImporting ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Import Video
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SingleUrlImportModal;
