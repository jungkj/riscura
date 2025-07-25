'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

// UI Components
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyCheckbox } from '@/components/ui/DaisyCheckbox';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Icons
import {
  Upload,
  File,
  FileText,
  Image,
  FileSpreadsheet,
  Eye,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Brain,
  X
} from 'lucide-react';

interface UploadedFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  preview?: string;
}

interface DocumentUploadProps {
  onUpload: (formData: FormData) => Promise<void>;
  maxFileSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
  organizationId: string;
  userId: string;
}

const DOCUMENT_CATEGORIES = [
  { value: 'policy', label: 'Policy' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'guideline', label: 'Guideline' },
  { value: 'form', label: 'Form' },
  { value: 'report', label: 'Report' },
  { value: 'evidence', label: 'Evidence' },
  { value: 'other', label: 'Other' },
];

const DOCUMENT_TYPES = [
  { value: 'internal', label: 'Internal' },
  { value: 'external', label: 'External' },
  { value: 'regulatory', label: 'Regulatory' },
  { value: 'standard', label: 'Standard' },
];

const CONFIDENTIALITY_LEVELS = [
  { value: 'public', label: 'Public' },
  { value: 'internal', label: 'Internal' },
  { value: 'confidential', label: 'Confidential' },
  { value: 'restricted', label: 'Restricted' },
];

export default function DocumentUpload({
  onUpload,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/gif',
  ],
  maxFiles = 10,
  organizationId,
  userId,
}: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [confidentiality, setConfidentiality] = useState('internal');
  const [businessUnit, setBusinessUnit] = useState('');
  const [department, setDepartment] = useState('');
  const [tags, setTags] = useState('');
  const [riskIds, setRiskIds] = useState('');
  const [controlIds, setControlIds] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(({ file, errors }) => 
        `${file.name}: ${errors.map((e: any) => e.message).join(', ')}`
      );
      setUploadError(`Some files were rejected: ${errors.join('; ')}`);
    }

    // Add accepted files
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(2),
      progress: 0,
      status: 'pending',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));

    setFiles(prev => {
      const combined = [...prev, ...newFiles];
      if (combined.length > maxFiles) {
        setUploadError(`Maximum ${maxFiles} files allowed`);
        return prev;
      }
      return combined;
    });

    setUploadError(null);
  }, [maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: allowedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize: maxFileSize,
    multiple: true,
    disabled: isUploading,
  });

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      setUploadError('Please select at least one file');
      return;
    }

    if (!title || !category || !type) {
      setUploadError('Please fill in all required fields');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      
      // Add document metadata
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('type', type);
      formData.append('confidentiality', confidentiality);
      formData.append('businessUnit', businessUnit);
      formData.append('department', department);
      formData.append('tags', tags);
      formData.append('riskIds', riskIds);
      formData.append('controlIds', controlIds);
      formData.append('organizationId', organizationId);
      formData.append('userId', userId);
      formData.append('aiAnalysis', aiAnalysis.toString());

      // Add files
      files.forEach(({ file }) => {
        formData.append('files', file);
      });

      // Simulate upload progress
      const updateProgress = (fileId: string, progress: number, status: UploadedFile['status']) => {
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, progress, status } : f
        ));
      };

      // Update files to uploading status
      files.forEach(f => updateProgress(f.id, 0, 'uploading'));

      // Simulate progressive upload
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        files.forEach(f => updateProgress(f.id, i, 'uploading'));
      }

      await onUpload(formData);

      // Mark all files as completed
      files.forEach(f => updateProgress(f.id, 100, 'completed'));
      
      setUploadSuccess(true);
      
      // Reset form after successful upload
      setTimeout(() => {
        resetForm();
      }, 2000);

    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      
      // Mark files as error
      files.forEach(f => {
        setFiles(prev => prev.map(file => 
          file.id === f.id ? { ...file, status: 'error', error: 'Upload failed' } : file
        ));
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFiles([]);
    setTitle('');
    setDescription('');
    setCategory('');
    setType('');
    setConfidentiality('internal');
    setBusinessUnit('');
    setDepartment('');
    setTags('');
    setRiskIds('');
    setControlIds('');
    setAiAnalysis(true);
    setUploadError(null);
    setUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // File type icons
  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
    if (type.includes('image')) return <Image className="h-8 w-8 text-blue-500" />;
    if (type.includes('spreadsheet') || type.includes('excel')) return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
    return <File className="h-8 w-8 text-gray-500" />;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <DaisyCard className="w-full max-w-4xl mx-auto">
      <DaisyCardHeader>
        <DaisyCardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Documents
        </DaisyCardTitle>
      
      <DaisyCardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Document Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <DaisyLabel htmlFor="title">Title *</DaisyLabel>
              <DaisyInput
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title"
                required
              />
            </div>

            <div className="space-y-2">
              <DaisyLabel htmlFor="category">Category *</DaisyLabel>
              <DaisySelect value={category} onValueChange={setCategory} required>
                <DaisySelectTrigger>
                  <DaisySelectValue placeholder="Select category" />
                </SelectTrigger>
                <DaisySelectContent>
                  {DOCUMENT_CATEGORIES.map(cat => (
                    <DaisySelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </DaisySelect>
            </div>

            <div className="space-y-2">
              <DaisyLabel htmlFor="type">Type *</DaisyLabel>
              <DaisySelect value={type} onValueChange={setType} required>
                <DaisySelectTrigger>
                  <DaisySelectValue placeholder="Select type" />
                </SelectTrigger>
                <DaisySelectContent>
                  {DOCUMENT_TYPES.map(docType => (
                    <DaisySelectItem key={docType.value} value={docType.value}>
                      {docType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </DaisySelect>
            </div>

            <div className="space-y-2">
              <DaisyLabel htmlFor="confidentiality">Confidentiality</DaisyLabel>
              <DaisySelect value={confidentiality} onValueChange={setConfidentiality}>
                <DaisySelectTrigger>
                  <DaisySelectValue placeholder="Select confidentiality level" />
                </SelectTrigger>
                <DaisySelectContent>
                  {CONFIDENTIALITY_LEVELS.map(level => (
                    <DaisySelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </DaisySelect>
            </div>

            <div className="space-y-2">
              <DaisyLabel htmlFor="businessUnit">Business Unit</DaisyLabel>
              <DaisyInput
                id="businessUnit"
                value={businessUnit}
                onChange={(e) => setBusinessUnit(e.target.value)}
                placeholder="Enter business unit"
              />
            </div>

            <div className="space-y-2">
              <DaisyLabel htmlFor="department">Department</DaisyLabel>
              <DaisyInput
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Enter department"
              />
            </div>
          </div>

          <div className="space-y-2">
            <DaisyLabel htmlFor="description">Description</DaisyLabel>
            <DaisyTextarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter document description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <DaisyLabel htmlFor="tags">Tags (comma-separated)</DaisyLabel>
              <DaisyInput
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="tag1, tag2, tag3"
              />
            </div>

            <div className="space-y-2">
              <DaisyLabel htmlFor="riskIds">Related Risk IDs (comma-separated)</DaisyLabel>
              <DaisyInput
                id="riskIds"
                value={riskIds}
                onChange={(e) => setRiskIds(e.target.value)}
                placeholder="risk-id-1, risk-id-2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <DaisyLabel htmlFor="controlIds">Related Control IDs (comma-separated)</DaisyLabel>
            <DaisyInput
              id="controlIds"
              value={controlIds}
              onChange={(e) => setControlIds(e.target.value)}
              placeholder="control-id-1, control-id-2"
            />
          </div>

          {/* AI Analysis Option */}
          <div className="flex items-center space-x-2">
            <DaisyCheckbox
              id="aiAnalysis"
              checked={aiAnalysis}
              onCheckedChange={(checked) => setAiAnalysis(checked as boolean)}
            />
            <DaisyLabel htmlFor="aiAnalysis" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Enable AI analysis for automatic content extraction and classification
            </DaisyLabel>
          </div>

          {/* File Upload Area */}
          <div className="space-y-4">
            <DaisyLabel>Files</DaisyLabel>
            
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                ${isUploading ? 'pointer-events-none opacity-50' : ''}
              `}
            >
              <input {...getInputProps()} ref={fileInputRef} />
              
              <div className="space-y-2">
                <Upload className="h-12 w-12 mx-auto text-gray-400" />
                
                {isDragActive ? (
                  <p className="text-blue-600">Drop the files here...</p>
                ) : (
                  <div>
                    <p className="text-gray-600">
                      Drag & drop files here, or <span className="text-blue-600 underline">browse</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Max {formatFileSize(maxFileSize)} per file, up to {maxFiles} files
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Supported: PDF, Word, Excel, Images, Text
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <DaisyLabel>Selected Files ({files.length}/{maxFiles})</DaisyLabel>
                
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      {file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.file.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 flex items-center justify-center text-2xl">
                          {getFileIcon(file.file.name)}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.file.size)}</p>
                        
                        {file.status === 'uploading' && (
                          <div className="mt-1">
                            <DaisyProgress value={file.progress} className="h-1" />
                            <p className="text-xs text-gray-500 mt-1">{file.progress}% uploaded</p>
                          </div>
                        )}
                        
                        {file.status === 'error' && (
                          <p className="text-xs text-red-500 mt-1">{file.error}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {file.status === 'completed' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {file.status === 'error' && (
                          <DaisyAlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        
                        {!isUploading && (
                          <DaisyButton
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                          >
                            <X className="h-4 w-4" />
                          </DaisyButton>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Error/Success Messages */}
          {uploadError && (
            <DaisyAlert variant="error">
              <DaisyAlertCircle className="h-4 w-4" />
              <DaisyAlertDescription>{uploadError}
            </DaisyAlert>
          )}

          {uploadSuccess && (
            <DaisyAlert>
              <CheckCircle className="h-4 w-4" />
              <DaisyAlertDescription>
                Document uploaded successfully! 
                {aiAnalysis && ' AI analysis is processing in the background.'}
              
            </DaisyAlert>
          )}

          {/* Submit Button */}
          <div className="flex space-x-4">
            <DaisyButton
              type="submit"
              disabled={isUploading || files.length === 0 || !title || !category || !type}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </DaisyButton>
            
            <DaisyButton
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={isUploading}
            >
              Reset
            </DaisyButton>
          </div>
        </form>
      </DaisyCardBody>
    </DaisyCard>
  );
} 