'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Download } from 'lucide-react';
// import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  X,
  Download
} from 'lucide-react'

interface FilePreview {
  file: File;
  name: string;
  size: string;
}

interface ImportResult {
  success: boolean;
  importedCount?: number;
  errors?: string[];
}

interface RcsaImporterProps {
  onImportComplete?: (result: ImportResult) => void;
  className?: string;
}

const RcsaImporter: React.FC<RcsaImporterProps> = ({ 
  onImportComplete, 
  className = '' 
}) => {
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const { handleSubmit, reset } = useForm();

  // Format file size
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setFilePreview({
        file,
        name: file.name,
        size: formatFileSize(file.size)
      });
      setImportResult(null); // Clear previous results
    }
  }, [formatFileSize]);

  // Configure dropzone
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    fileRejections
  } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isUploading
  })

  // Handle file upload
  const onSubmit = async () => {
    if (!filePreview) return

    setIsUploading(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', filePreview.file);

      const response = await fetch('/api/upload/rcsa', {
        method: 'POST',
        body: formData,
      });

      const result: ImportResult = await response.json();
      setImportResult(result);
      
      if (onImportComplete) {
        onImportComplete(result);
      }
    } catch (error) {
      setImportResult({
        success: false,
        errors: ['Network error occurred while uploading file']
      });
    } finally {
      setIsUploading(false);
    }
  }

  // Clear file and reset form
  const handleClear = () => {
    setFilePreview(null)
    setImportResult(null);
    reset();
  }

  // Download sample template
  const handleDownloadTemplate = () => {
    // This would typically download a sample RCSA template
    // console.log('Download RCSA template')
  }

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                RCSA File Import
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Upload Excel files with Risk and Control data
              </p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Template
            </button>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
                ${Boolean(isDragActive) && !isDragReject ? 'border-blue-400 bg-blue-50' : ''}
                ${isDragReject ? 'border-red-400 bg-red-50' : ''}
                ${!isDragActive && !isDragReject ? 'border-gray-300 hover:border-gray-400 hover:bg-gray-50' : ''}
                ${isUploading ? 'pointer-events-none opacity-50' : ''}
              `}
            >
              <input {...getInputProps()} />
              
              <AnimatePresence mode="wait">
                {!filePreview ? (
                  <motion.div
                    key="dropzone"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    
                    <div>
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        {isDragActive ? 'Drop the file here' : 'Drop your RCSA file here'}
                      </p>
                      <p className="text-sm text-gray-600 mb-4">
                        or click to browse your computer
                      </p>
                      <p className="text-xs text-gray-500">
                        Supports .xlsx and .xls files up to 10MB
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-4"
                  >
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <FileText className="w-8 h-8 text-green-600" />
                    </div>
                    
                    <div>
                      <p className="text-lg font-medium text-gray-900 mb-1">
                        {filePreview.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {filePreview.size}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClear();
                      }}
                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* File Rejection Errors */}
            {fileRejections.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-md p-4"
              >
                <div className="flex items-start">
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800 mb-2">
                      File Upload Error
                    </h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {fileRejections.map(({ file, errors }, index) => (
                        <li key={index}>
                          <strong>{file.name}:</strong>
                          <ul className="ml-4 mt-1 space-y-1">
                            {errors.map((error, errorIndex) => (
                              <li key={errorIndex} className="list-disc list-inside">
                                {error.message}
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Upload Button */}
            {Boolean(filePreview) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center"
              >
                <button
                  type="submit"
                  disabled={isUploading}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Import RCSA Data
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </form>

          {/* Loading Animation */}
          <AnimatePresence>
            {Boolean(isUploading) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4"
              >
                <div className="flex items-center">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin mr-3" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Processing your RCSA file...
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Parsing Excel data and validating entries
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Import Results */}
          <AnimatePresence>
            {Boolean(importResult) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6"
              >
                {importResult.success ? (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-green-800 mb-2">
                          Import Successful!
                        </h4>
                        <p className="text-sm text-green-700">
                          Successfully imported{' '}
                          <strong>{importResult.importedCount}</strong> records
                          from your RCSA file.
                        </p>
                        <button
                          onClick={handleClear}
                          className="mt-3 text-sm text-green-700 hover:text-green-800 underline"
                        >
                          Import another file
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex items-start">
                      <DaisyAlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" >
  <div className="flex-1">
</DaisyAlertCircle>
                        <h4 className="text-sm font-medium text-red-800 mb-2">
                          Import Failed
                        </h4>
                        {importResult.errors && importResult.errors.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-sm text-red-700 mb-2">
                              The following errors were found:
                            </p>
                            <ul className="text-sm text-red-700 space-y-1 max-h-40 overflow-y-auto">
                              {importResult.errors.map((error, index) => (
                                <li key={index} className="list-disc list-inside">
                                  {error}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <button
                          onClick={handleClear}
                          className="mt-3 text-sm text-red-700 hover:text-red-800 underline"
                        >
                          Try again
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Help Text */}
          <div className="mt-6 bg-gray-50 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Expected File Format
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Excel file (.xlsx or .xls) with Risk and Control data</li>
              <li>• Required columns: Risk ID, Risk Description, Control ID, Control Description</li>
              <li>• Headers should be in the first 5 rows of the worksheet</li>
              <li>• Each row represents a risk-control relationship</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RcsaImporter; 