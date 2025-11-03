import { useState, useEffect } from 'react';
import { X, Loader, CheckCircle, XCircle, Download, Upload, Clock, Link as LinkIcon, History, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiService } from '../services/api';
import { websocketService } from '../services/websocket';

const BatchImportModal = ({ isOpen, onClose, onImportComplete }) => {
  const [step, setStep] = useState('url'); // 'url', 'submitting', 'tracking', 'history'
  const [shareUrl, setShareUrl] = useState('');
  const [currentJob, setCurrentJob] = useState(null);
  const [jobHistory, setJobHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);

  // Listen for batch import progress via WebSocket
  useEffect(() => {
    if (!websocketService.socket) return;

    const handleBatchProgress = (data) => {
      console.log('📦 Batch import progress:', data);
      // Update current job if it matches
      if (currentJob && currentJob.job_id) {
        setCurrentJob(prev => {
          if (!prev) return prev;
          
          // Update the specific video in the job
          const updatedVideos = prev.videos.map(video => {
            if (video.video_name === data.video_name) {
              return {
                ...video,
                status: data.status,
                progress_percent: data.progress_percent,
                error_message: data.error || null
              };
            }
            return video;
          });
          
          return {
            ...prev,
            videos: updatedVideos
          };
        });
      }
    };

    websocketService.socket.on('batch_import_progress', handleBatchProgress);

    return () => {
      if (websocketService.socket) {
        websocketService.socket.off('batch_import_progress', handleBatchProgress);
      }
    };
  }, [currentJob]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('url');
      setShareUrl('');
      setCurrentJob(null);
      setIsProcessing(false);
      
      // Clear polling interval
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  }, [isOpen, pollingInterval]);
  
  // Load job history when modal opens
  useEffect(() => {
    if (isOpen && step === 'history') {
      loadJobHistory();
    }
  }, [isOpen, step]);

  const handleSubmitJob = async () => {
    if (!shareUrl.trim()) {
      toast.error('Please enter a share URL');
      return;
    }

    setIsProcessing(true);
    setStep('submitting');

    try {
      const result = await apiService.submitBatchImport(shareUrl);
      
      if (result.error) {
        toast.error(result.error);
        setStep('url');
        return;
      }

      setCurrentJob({
        job_id: result.job_id,
        status: 'pending',
        total_videos: result.total_videos,
        processed_videos: 0,
        failed_videos: 0,
        videos: []
      });
      
      setStep('tracking');
      toast.success(`Batch job created! Processing ${result.total_videos} videos`);
      
      // Start polling for job status
      startJobPolling(result.job_id);
      
    } catch (error) {
      console.error('Error submitting batch job:', error);
      toast.error(error.response?.data?.error || 'Failed to submit batch job');
      setStep('url');
    } finally {
      setIsProcessing(false);
    }
  };

  const startJobPolling = (jobId) => {
    // Clear any existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    // Poll every 5 seconds
    const interval = setInterval(async () => {
      try {
        const jobStatus = await apiService.getBatchJobStatus(jobId);
        setCurrentJob(jobStatus);
        
        // Stop polling if job is completed or failed
        if (jobStatus.status === 'completed' || jobStatus.status === 'failed') {
          clearInterval(interval);
          setPollingInterval(null);
          
          if (jobStatus.status === 'completed') {
            toast.success(`Batch import completed! ${jobStatus.processed_videos - jobStatus.failed_videos} videos processed successfully`);
            if (onImportComplete) {
              onImportComplete();
            }
          } else {
            toast.error(`Batch import failed: ${jobStatus.error_message || 'Unknown error'}`);
          }
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        // Don't show error toast for polling failures, just log them
      }
    }, 5000);
    
    setPollingInterval(interval);
  };
  
  const loadJobHistory = async () => {
    try {
      const result = await apiService.listBatchJobs();
      setJobHistory(result.jobs || []);
    } catch (error) {
      console.error('Error loading job history:', error);
      toast.error('Failed to load job history');
    }
  };
  
  const trackExistingJob = (job) => {
    setCurrentJob(job);
    setStep('tracking');
    
    // Start polling if job is still active
    if (job.status === 'pending' || job.status === 'processing') {
      startJobPolling(job.job_id);
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
            disabled={isProcessing && step === 'submitting'}
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
                <h3 className="font-medium text-blue-900 mb-2">How it works:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Submit your share URL to create a batch job</li>
                  <li>• Videos are processed in the background</li>
                  <li>• Track progress in real-time</li>
                  <li>• View job history and results</li>
                </ul>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setStep('history')}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <History className="w-4 h-4" />
                  View History
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Submitting Job */}
          {step === 'submitting' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-lg text-gray-700">Creating batch job...</p>
              <p className="text-sm text-gray-500 mt-2">This will return immediately</p>
            </div>
          )}

          {/* Step 3: Job Tracking */}
          {step === 'tracking' && currentJob && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    Batch Job Status
                  </h3>
                  <button
                    onClick={() => startJobPolling(currentJob.job_id)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <p className="font-medium capitalize">{currentJob.status}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Videos:</span>
                    <p className="font-medium">{currentJob.total_videos}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Processed:</span>
                    <p className="font-medium">{currentJob.processed_videos}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Failed:</span>
                    <p className="font-medium">{currentJob.failed_videos}</p>
                  </div>
                </div>
                {currentJob.error_message && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{currentJob.error_message}</p>
                  </div>
                )}
              </div>

              {currentJob.videos && currentJob.videos.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Video Progress</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {currentJob.videos.map((video) => (
                      <div key={video.id} className="border rounded-lg p-3">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(video.status)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {video.video_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {getStatusText(video.status)}
                              {video.error_message && ` - ${video.error_message}`}
                            </p>
                          </div>
                          {video.progress_percent > 0 && video.status !== 'completed' && video.status !== 'failed' && (
                            <span className="text-sm font-medium text-gray-700">
                              {video.progress_percent}%
                            </span>
                          )}
                        </div>
                        {video.progress_percent > 0 && video.status !== 'completed' && video.status !== 'failed' && (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${video.progress_percent}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Job History */}
          {step === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Batch Import History
                </h3>
                <button
                  onClick={loadJobHistory}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>

              {jobHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No batch import jobs found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobHistory.map((job) => (
                    <div key={job.job_id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          <span className="font-medium capitalize">{job.status}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(job.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mb-2 truncate">
                        {job.share_url}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          {job.processed_videos} of {job.total_videos} videos
                          {job.failed_videos > 0 && ` (${job.failed_videos} failed)`}
                        </div>
                        {(job.status === 'pending' || job.status === 'processing') && (
                          <button
                            onClick={() => trackExistingJob(job)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Track Progress
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                onClick={handleSubmitJob}
                disabled={isProcessing || !shareUrl.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Create Batch Job
              </button>
            </>
          )}

          {step === 'submitting' && (
            <>
              <div className="text-sm text-gray-600">
                Creating batch job...
              </div>
              <button
                disabled
                className="px-6 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
              >
                Please Wait...
              </button>
            </>
          )}

          {step === 'tracking' && (
            <>
              <button
                onClick={() => setStep('url')}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                New Job
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep('history')}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg"
                >
                  View History
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </>
          )}

          {step === 'history' && (
            <>
              <button
                onClick={() => setStep('url')}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                New Job
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchImportModal;