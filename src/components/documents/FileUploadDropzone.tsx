'use client';

import React, { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Image, Archive, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { formatFileSize } from '@/lib/storage/file-validator';
import toast from 'react-hot-toast';

interface FileUploadItem {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  result?: any;
}

interface FileUploadDropzoneProps {
  onUploadComplete?: (results: any[]) => void;
  onUploadError?: (error: string) => void;
  category?: string;
  linkedEntityType?: string;
  linkedEntityId?: string;
  allowedTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
  className?: string;
}

const CATEGORY_OPTIONS = [
  { value: 'evidence', label: 'Evidence' },
  { value: 'policy', label: 'Policy' },
  { value: 'control', label: 'Control Documentation' },
  { value: 'risk', label: 'Risk Assessment' },
  { value: 'audit', label: 'Audit Documentation' },
  { value: 'template', label: 'Template' },
  { value: 'general', label: 'General' },
];

const FILE_TYPE_ICONS = {
  pdf: FileText,
  word: FileText,
  excel: FileText,
  powerpoint: FileText,
  text: FileText,
  image: Image,
  archive: Archive,
  unknown: FileText,
};

export default function FileUploadDropzone({
  onUploadComplete,
  onUploadError,
  category: defaultCategory = 'general',
  linkedEntityType,
  linkedEntityId,
  allowedTypes,
  maxFileSize = 100 * 1024 * 1024, // 100MB
  maxFiles = 10,
  className = '',
}: FileUploadDropzoneProps) {
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState(defaultCategory);
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    rejectedFiles.forEach(({ file, errors }) => {
      errors.forEach((error: any) => {
        toast.error(`${file.name}: ${error.message}`);
      });
    });

    // Add accepted files
    const newFiles: FileUploadItem[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      progress: 0,
      status: 'pending',
    }));

    setFiles(prev => {
      const updated = [...prev, ...newFiles];
      if (updated.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        return updated.slice(0, maxFiles);
      }
      return updated;
    });
  }, [maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    accept: allowedTypes ? allowedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as any) : {
      'application/pdf': [],
      'application/msword': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
      'application/vnd.ms-excel': [],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [],
      'image/*': [],
      'text/*': [],
    },
    maxSize: maxFileSize,
    maxFiles: maxFiles,
    multiple: true,
  });

  const removeFile = (id: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== id);
      return updated;
    });
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setUploading(true);
    const results: any[] = [];
    const errors: string[] = [];

    try {
      // Upload files one by one to track individual progress
      for (const fileItem of files) {
        if (fileItem.status !== 'pending') continue;

        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'uploading', progress: 0 }
            : f
        ));

        try {
          const formData = new FormData();
          formData.append('files', fileItem.file);
          formData.append('category', category);
          formData.append('tags', tags);
          formData.append('description', description);
          
          if (linkedEntityType) {
            formData.append('linkedEntityType', linkedEntityType);
          }
          if (linkedEntityId) {
            formData.append('linkedEntityId', linkedEntityId);
          }

          // Create XMLHttpRequest for progress tracking
          const xhr = new XMLHttpRequest();
          
          const uploadPromise = new Promise((resolve, reject) => {
            xhr.upload.addEventListener('progress', (e) => {
              if (e.lengthComputable) {
                const progress = Math.round((e.loaded / e.total) * 100);
                setFiles(prev => prev.map(f => 
                  f.id === fileItem.id 
                    ? { ...f, progress }
                    : f
                ));
              }
            });

            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve(JSON.parse(xhr.responseText));
              } else {
                reject(new Error(`Upload failed: ${xhr.statusText}`));
              }
            });

            xhr.addEventListener('error', () => {
              reject(new Error('Upload failed'));
            });

            xhr.open('POST', '/api/documents/upload');
            xhr.send(formData);
          });

          const result = await uploadPromise;
          
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id 
              ? { ...f, status: 'success', progress: 100, result }
              : f
          ));

          results.push(result);

        } catch (error) {
          console.error('Upload error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id 
              ? { ...f, status: 'error', error: errorMessage }
              : f
          ));

          errors.push(`${fileItem.file.name}: ${errorMessage}`);
        }
      }

      // Report results
      if (results.length > 0) {
        toast.success(`Successfully uploaded ${results.length} file(s)`);
        onUploadComplete?.(results);
      }

      if (errors.length > 0) {
        const errorMessage = `Failed to upload ${errors.length} file(s)`;
        toast.error(errorMessage);
        onUploadError?.(errorMessage);
      }

    } catch (error) {
      console.error('Upload process error:', error);
      const errorMessage = 'Upload process failed';
      toast.error(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const clearFiles = () => {
    // Clean up object URLs
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
  };

  const retryUpload = (id: string) => {
    setFiles(prev => prev.map(f => 
      f.id === id 
        ? { ...f, status: 'pending', error: undefined, progress: 0 }
        : f
    ));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return FILE_TYPE_ICONS.image;
    if (file.type === 'application/pdf') return FILE_TYPE_ICONS.pdf;
    if (file.type.includes('word')) return FILE_TYPE_ICONS.word;
    if (file.type.includes('excel') || file.type.includes('spreadsheet')) return FILE_TYPE_ICONS.excel;
    if (file.type.includes('powerpoint') || file.type.includes('presentation')) return FILE_TYPE_ICONS.powerpoint;
    if (file.type.startsWith('text/')) return FILE_TYPE_ICONS.text;
    if (file.type.includes('zip') || file.type.includes('archive')) return FILE_TYPE_ICONS.archive;
    return FILE_TYPE_ICONS.unknown;
  };

  const getStatusColor = (status: FileUploadItem['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-700';
      case 'uploading': return 'bg-blue-100 text-blue-700';
      case 'success': return 'bg-green-100 text-green-700';
      case 'error': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: FileUploadItem['status']) => {
    switch (status) {
      case 'uploading': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'error': return <DaisyAlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <DaisyCard className={`w-full ${className}`}>
      <DaisyCardHeader>
        <DaisyCardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          File Upload
        </DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent className="space-y-6">
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive || dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }
          `}
        >
          <input {...getInputProps()} ref={fileInputRef} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg mb-2 text-gray-700">
            {isDragActive || dragActive 
              ? 'Drop files here...' 
              : 'Drag & drop files here, or click to select'
            }
          </p>
          <p className="text-sm text-gray-500">
            Maximum {maxFiles} files, up to {formatFileSize(maxFileSize)} each
          </p>
          <DaisyButton 
            type="button" 
            variant="outline" 
            className="mt-4"
            onClick={() => fileInputRef.current?.click()}
          >
            Browse Files
          </DaisyButton>
        </div>

        {/* Upload Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <DaisyLabel htmlFor="category">Category</DaisyLabel>
            <DaisySelect value={category} onValueChange={setCategory}>
              <DaisySelectTrigger>
                <DaisySelectValue placeholder="Select category" />
              </DaisySelectTrigger>
              <DaisySelectContent>
                {CATEGORY_OPTIONS.map(option => (
                  <DaisySelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </DaisySelect>
          </div>

          <div className="space-y-2">
            <DaisyLabel htmlFor="tags">Tags (comma-separated)</DaisyLabel>
            <DaisyInput
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="compliance, SOC2, audit..."
            />
          </div>
        </div>

        <div className="space-y-2">
          <DaisyLabel htmlFor="description">Description</DaisyLabel>
          <DaisyTextarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description for the uploaded files..."
            rows={3}
          />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Files to Upload ({files.length})</h3>
              <DaisyButton 
                variant="outline" 
                size="sm" 
                onClick={clearFiles}
                disabled={uploading}
              >
                Clear All
              </DaisyButton>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {files.map((fileItem) => {
                const FileIcon = getFileIcon(fileItem.file);
                
                return (
                  <div 
                    key={fileItem.id}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-white"
                  >
                    {/* File Icon/Preview */}
                    <div className="flex-shrink-0">
                      {fileItem.preview ? (
                        <img 
                          src={fileItem.preview} 
                          alt={fileItem.file.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded">
                          <FileIcon className="w-5 h-5 text-gray-600" />
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fileItem.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(fileItem.file.size)}
                      </p>
                      
                      {/* Progress Bar */}
                      {fileItem.status === 'uploading' && (
                        <DaisyProgress value={fileItem.progress} className="mt-1" />
                      )}
                      
                      {/* Error Message */}
                      {fileItem.error && (
                        <p className="text-xs text-red-600 mt-1">
                          {fileItem.error}
                        </p>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="flex-shrink-0">
                      <DaisyBadge 
                        variant="secondary"
                        className={getStatusColor(fileItem.status)}
                      >
                        <div className="flex items-center gap-1">
                          {getStatusIcon(fileItem.status)}
                          <span className="capitalize">{fileItem.status}</span>
                        </div>
                      </DaisyBadge>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center gap-1">
                      {fileItem.status === 'error' && (
                        <DaisyButton
                          size="sm"
                          variant="ghost"
                          onClick={() => retryUpload(fileItem.id)}
                          disabled={uploading}
                        >
                          Retry
                        </DaisyButton>
                      )}
                      
                      <DaisyButton
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(fileItem.id)}
                        disabled={uploading && fileItem.status === 'uploading'}
                      >
                        <X className="w-4 h-4" />
                      </DaisyButton>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Upload Actions */}
        {files.length > 0 && (
          <div className="flex justify-end gap-2">
            <DaisyButton 
              variant="outline" 
              onClick={clearFiles}
              disabled={uploading}
            >
              Clear All
            </DaisyButton>
            <DaisyButton 
              onClick={uploadFiles}
              disabled={uploading || files.every(f => f.status === 'success')}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Files
                </>
              )}
            </DaisyButton>
          </div>
        )}
      </DaisyCardContent>
    </DaisyCard>
  );
} 