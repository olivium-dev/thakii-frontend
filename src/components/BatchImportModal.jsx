import { useState, useEffect } from 'react';
import { X, Loader, CheckCircle, XCircle, Download, Upload, Clock, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiService } from '../services/api';
import { websocketService } from '../services/websocket';

const BatchImportModal = ({ isOpen, onClose, onImportComplete }) => {
  const [step, setStep] = useState('url'); // 'url', 'loading', 'selection', 'importing'
  const [shareUrl, setShareUrl] = useState('');
  const [videoList, setVideoList] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [importProgress, setImportProgress] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalSize, setTotalSize] = useState(0);

  // Listen for batch import progress via WebSocket
  useEffect(() => {
    if (!websocketService.socket) return;

    const handleBatchProgress = (data) => {
      console.log('📦 Batch import progress:', data);
      setImportProgress(prev => ({
        ...prev,
        [data.video_id]: {
          video_name: data.video_name,
          status: data.status,
          progress_percent: data.progress_percent,
          error: data.error
        }
      }));
    };

    websocketService.socket.on('batch_import_progress', handleBatchProgress);

    return () => {
      if (websocketService.socket) {
        websocketService.socket.off('batch_import_progress', handleBatchProgress);
      }
    };
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('url');
      setShareUrl('');
      setVideoList([]);
      setSelectedVideos([]);
      setImportProgress({});
      setIsProcessing(false);
      setTotalSize(0);
    }
  }, [isOpen]);

  const handleFetchVideos = async () => {
    if (!shareUrl.trim()) {
      toast.error('Please enter a share URL');
      return;
    }

    setIsProcessing(true);
    setStep('loading');

    try {
      const result = await apiService.listBatchImportVideos(shareUrl);
      
      if (result.error) {
        toast.error(result.error);
        setStep('url');
        return;
      }

      if (result.videos.length === 0) {
        toast.error('No videos found in this share');
        setStep('url');
        return;
      }

      setVideoList(result.videos);
      setTotalSize(result.total_size);
      // Select all videos by default
      setSelectedVideos(result.videos.map(v => v.name));
      setStep('selection');
      toast.success(`Found ${result.videos.length} videos`);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch videos');
      setStep('url');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleVideoSelection = (videoName) => {
    setSelectedVideos(prev => {
      if (prev.includes(videoName)) {
        return prev.filter(v => v !== videoName);
      } else {
        return [...prev, videoName];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedVideos.length === videoList.length) {
      setSelectedVideos([]);
    } else {
      setSelectedVideos(videoList.map(v => v.name));
    }
  };

  const handleImport = async () => {
    if (selectedVideos.length === 0) {
      toast.error('Please select at least one video');
      return;
    }

    setIsProcessing(true);
    setStep('importing');

    // Initialize progress for selected videos
    const initialProgress = {};
    selectedVideos.forEach(videoName => {
      initialProgress[videoName] = {
        video_name: videoName,
        status: 'queued',
        progress_percent: 0
      };
    });
    setImportProgress(initialProgress);

    try {
      const selectedVideoObjects = videoList.filter(v => selectedVideos.includes(v.name));
      
      const result = await apiService.importBatchVideos(shareUrl, selectedVideoObjects);
      
      toast.success(`Import completed: ${result.success_count} succeeded, ${result.failed_count} failed`);
      
      if (onImportComplete) {
        onImportComplete();
      }
      
      // Keep modal open to show results, let user close manually
    } catch (error) {
      console.error('Error importing videos:', error);
      toast.error(error.response?.data?.error || 'Failed to import videos');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'downloading':
        return <Download className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'uploading':
        return <Upload className="w-4 h-4 text-purple-500 animate-pulse" />;
      case 'queued':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'downloading':
        return 'Downloading...';
      case 'uploading':
        return 'Uploading to S3...';
      case 'queued':
        return 'Queued';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return 'Waiting...';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Batch Import Videos
          </h2>
          <button
            onClick={onClose}
            disabled={isProcessing && step === 'importing'}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Step 1: URL Input */}
          {step === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nextcloud Share URL
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      value={shareUrl}
                      onChange={(e) => setShareUrl(e.target.value)}
                      placeholder="https://fanusdigital.wolkesicher.de/s/..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isProcessing}
                    />
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Enter a wolkesicher.de (Nextcloud) public share URL
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Supported Sources:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• wolkesicher.de (Nextcloud)</li>
                  <li className="text-gray-400">• YouTube (Coming soon)</li>
                  <li className="text-gray-400">• Google Drive (Coming soon)</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Loading */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-lg text-gray-700">Fetching video list...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
            </div>
          )}

          {/* Step 3: Video Selection */}
          {step === 'selection' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Select Videos to Import
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedVideos.length} of {videoList.length} videos selected
                    {totalSize > 0 && ` • Total: ${formatFileSize(totalSize)}`}
                  </p>
                </div>
                <button
                  onClick={toggleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {selectedVideos.length === videoList.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                {videoList.map((video) => (
                  <label
                    key={video.name}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedVideos.includes(video.name)}
                      onChange={() => toggleVideoSelection(video.name)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {video.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(video.size)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Importing Progress */}
          {step === 'importing' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Import Progress
                </h3>
                <p className="text-sm text-gray-500">
                  {Object.values(importProgress).filter(p => p.status === 'completed').length} of {selectedVideos.length} videos completed
                </p>
              </div>

              <div className="space-y-2">
                {selectedVideos.map((videoName) => {
                  const progress = importProgress[videoName] || importProgress[Object.keys(importProgress).find(
                    key => importProgress[key].video_name === videoName
                  )];
                  
                  return (
                    <div key={videoName} className="border rounded-lg p-3">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(progress?.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {videoName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {getStatusText(progress?.status)}
                            {progress?.error && ` - ${progress.error}`}
                          </p>
                        </div>
                        {progress?.progress_percent > 0 && progress?.status !== 'completed' && progress?.status !== 'failed' && (
                          <span className="text-sm font-medium text-gray-700">
                            {progress.progress_percent}%
                          </span>
                        )}
                      </div>
                      {progress?.progress_percent > 0 && progress?.status !== 'completed' && progress?.status !== 'failed' && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress.progress_percent}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-4 sm:p-6 border-t bg-gray-50">
          {step === 'url' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleFetchVideos}
                disabled={isProcessing || !shareUrl.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Fetch Videos
              </button>
            </>
          )}

          {step === 'selection' && (
            <>
              <button
                onClick={() => setStep('url')}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={selectedVideos.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Import {selectedVideos.length} Video{selectedVideos.length !== 1 ? 's' : ''}
              </button>
            </>
          )}

          {step === 'importing' && (
            <>
              <div className="text-sm text-gray-600">
                {isProcessing ? 'Importing videos...' : 'Import completed'}
              </div>
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Please Wait...' : 'Close'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchImportModal;

