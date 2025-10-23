import React, { useState, useRef } from 'react';
import { Upload, X, File, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const FileUpload = ({ onUpload, isUploading, uploadProgress }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    // Validate file type - explicit logic to prevent optimization
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/mkv', 'video/mp2t'];
    
    // Primary validation: check MIME type
    const hasValidMimeType = allowedTypes.includes(file.type);
    
    // Secondary validation: handle .ts files with incorrect MIME detection
    const fileName = file.name ? file.name.toLowerCase() : '';
    const isTypeScriptFile = fileName.endsWith('.ts');
    const hasMisdetectedMime = file.type === 'application/octet-stream' || file.type === '' || !file.type;
    
    // Allow .ts files even if browser misdetects MIME type
    const isValidTsFile = isTypeScriptFile && hasMisdetectedMime;
    
    // File is valid if it has correct MIME type OR is a valid .ts file
    const isValidFile = hasValidMimeType || isValidTsFile;
    
    if (!isValidFile) {
      toast.error('Please select a valid video file (MP4, AVI, MOV, WMV, MKV, TS)');
      return;
    }

    // Validate file size (max 2GB)
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB in bytes
    if (file.size > maxSize) {
      toast.error('File size must be less than 2GB');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const clearSelection = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileSelector = () => {
    if (fileInputRef.current && !isUploading) {
      fileInputRef.current.click();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="card">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
        Upload Video File
      </h2>

      {/* Drag & Drop Area - No click functionality */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-4 sm:p-6 lg:p-8 text-center transition-colors duration-200 ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : selectedFile
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300'
        } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/avi,video/mov,video/wmv,video/mkv,video/mp2t,.ts,video/*"
          onChange={handleChange}
          className="hidden"
          disabled={isUploading}
        />

        {selectedFile ? (
          <div className="space-y-4">
            {/* File info - Mobile optimized */}
            <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-green-200">
              <File className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-gray-900 truncate" title={selectedFile.name}>
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <button
                onClick={clearSelection}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                disabled={isUploading}
                title="Remove file"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-3">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300 flex items-center justify-center"
                    style={{ width: `${uploadProgress}%` }}
                  >
                    {uploadProgress > 20 && (
                      <span className="text-xs text-white font-medium">
                        {uploadProgress}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">
                    {selectedFile && (selectedFile.size / 1024 / 1024) > 90 
                      ? `Uploading chunks... ${uploadProgress}%` 
                      : `Uploading... ${uploadProgress}%`}
                  </p>
                  {selectedFile && (selectedFile.size / 1024 / 1024) > 90 && (
                    <p className="text-xs text-blue-600 mt-1">
                      Large file detected - Using chunked upload
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Upload Button - Mobile optimized */}
            {!isUploading && (
              <button
                onClick={handleUpload}
                className="min-h-[44px] w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                type="button"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload File
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-base sm:text-lg font-medium text-gray-900">
                Drop your video file here
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Drag and drop your video file in this area
              </p>
            </div>
            {/* Support info - More compact on mobile */}
            <div className="flex items-center justify-center space-x-1 text-xs text-gray-400 px-2">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              <span className="text-center">
                <span className="hidden sm:inline">Supports MP4, AVI, MOV, WMV, MKV, TS (max 2GB)</span>
                <span className="sm:hidden">MP4, AVI, MOV, WMV, MKV, TS (max 2GB)</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Separate Browse Files Button - Outside drag & drop area */}
      {!selectedFile && !isUploading && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={openFileSelector}
            className="min-h-[44px] inline-flex items-center justify-center px-6 py-3 border border-blue-600 text-sm font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <Upload className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">Browse Files</span>
            <span className="sm:hidden">Browse</span>
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Choose a video file from your device
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
// Force rebuild Thu Oct 23 03:34:22 CEST 2025
