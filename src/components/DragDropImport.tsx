'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { useSharePointIntegration } from '@/hooks/useSharePointIntegration';
import { SharePointFileBrowser } from '@/components/integrations/SharePointFileBrowser';
import { useGoogleDriveIntegration } from '@/hooks/useGoogleDriveIntegration';
import { GoogleDriveFileBrowser } from '@/components/integrations/GoogleDriveFileBrowser';
import { FixedSizeList as List } from 'react-window';

// UI Components
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisyCheckbox } from '@/components/ui/DaisyCheckbox';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Icons
import {
  Upload,
  File,
  FileText,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  FileImage,
  Zap,
  ArrowRight,
  Cloud,
  RefreshCw
} from 'lucide-react';
import Image from 'next/image';

interface ProcessedFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  preview?: string;
  results?: {
    type: 'excel-rcsa' | 'policy-document' | 'bulk-upload';
    data: any;
  };
}

interface ImportModeConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  acceptedTypes: string[];
  maxFiles: number;
  processingType: 'excel-rcsa' | 'policy-document' | 'bulk-upload' | 'sharepoint' | 'googledrive';
  aiEnabled: boolean;
}

const IMPORT_MODES: ImportModeConfig[] = [
  {
    id: 'excel-rcsa',
    name: 'Excel RCSA Templates',
    description: 'Import Excel-based Risk & Control Self Assessment templates. Automatically maps columns to risks and controls.',
    icon: FileSpreadsheet,
    acceptedTypes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ],
    maxFiles: 5,
    processingType: 'excel-rcsa',
    aiEnabled: true
  },
  {
    id: 'policy-docs',
    name: 'Policy Documents',
    description: 'Import policy documents (PDF, DOCX, TXT) with AI-powered risk and control extraction using Claude Sonnet 4.',
    icon: FileText,
    acceptedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ],
    maxFiles: 10,
    processingType: 'policy-document',
    aiEnabled: true
  },
  {
    id: 'sharepoint',
    name: 'SharePoint Import',
    description: 'Import Excel RCSA files directly from your connected SharePoint sites. Browse and select files without downloading.',
    icon: Cloud,
    acceptedTypes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    maxFiles: 10,
    processingType: 'sharepoint',
    aiEnabled: true
  },
  {
    id: 'googledrive',
    name: 'Google Drive Import',
    description: 'Import Excel RCSA files directly from your Google Drive. Browse and select spreadsheets without downloading.',
    icon: Cloud,
    acceptedTypes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.google-apps.spreadsheet'
    ],
    maxFiles: 10,
    processingType: 'googledrive',
    aiEnabled: true
  },
  {
    id: 'bulk-upload',
    name: 'Bulk Document Upload',
    description: 'Upload multiple documents at once for organization and categorization.',
    icon: Upload,
    acceptedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/png',
      'image/jpeg',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    maxFiles: 20,
    processingType: 'bulk-upload',
    aiEnabled: false
  }
];

interface DragDropImportProps {
  organizationId: string;
  userId: string;
  onComplete?: (results: any[]) => void;
  maxFileSize?: number;
}

export default function DragDropImport({
  organizationId,
  userId,
  onComplete,
  maxFileSize = 25 * 1024 * 1024, // 25MB default
}: DragDropImportProps) {
  const [selectedMode, setSelectedMode] = useState<ImportModeConfig>(IMPORT_MODES[0]);
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [processingResults, setProcessingResults] = useState<any[]>([]);

  // SharePoint integration
  const { integrations, isLoading: isLoadingIntegrations } = useSharePointIntegration();
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null);
  const [selectedSharePointFiles, setSelectedSharePointFiles] = useState<any[]>([]);

  // Google Drive integration
  const { isConnected: isGoogleDriveConnected, connect: connectGoogleDrive, checkConnection: checkGoogleDriveConnection } = useGoogleDriveIntegration();
  const [selectedGoogleDriveFiles, setSelectedGoogleDriveFiles] = useState<any[]>([]);

  // Check Google Drive connection when component mounts or mode changes
  useEffect(() => {
    if (selectedMode.id === 'googledrive') {
      checkGoogleDriveConnection();
    }
  }, [selectedMode.id, checkGoogleDriveConnection]);

  // Processing options
  const [options, setOptions] = useState({
    aiAnalysis: true,
    autoMap: true,
    validateData: true,
    createMissing: true,
    previewMode: false
  });

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(({ file, errors }) => 
        `${file.name}: ${errors.map((e: any) => e.message).join(', ')}`
      );
      setProcessingError(`Some files were rejected: ${errors.join('; ')}`);
    }

    // Add accepted files
    const newFiles: ProcessedFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(2),
      progress: 0,
      status: 'pending',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));

    setFiles(prev => {
      const combined = [...prev, ...newFiles];
      if (combined.length > selectedMode.maxFiles) {
        setProcessingError(`Maximum ${selectedMode.maxFiles} files allowed for ${selectedMode.name}`);
        return prev;
      }
      return combined;
    });

    setProcessingError(null);
  }, [selectedMode]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: selectedMode.acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize: maxFileSize,
    multiple: selectedMode.maxFiles > 1,
    disabled: isProcessing,
  });

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const processFiles = async () => {
    // Handle SharePoint mode differently
    if (selectedMode.id === 'sharepoint') {
      if (selectedSharePointFiles.length === 0) {
        setProcessingError('Please select at least one file from SharePoint');
        return;
      }

      setIsProcessing(true);
      setProcessingError(null);
      setProcessingResults([]);

      try {
        const results: any[] = [];

        for (const sharePointFile of selectedSharePointFiles) {
          const formData = new FormData();
          formData.append('fileId', sharePointFile.id);
          formData.append('integrationId', selectedIntegrationId!);
          formData.append('mode', 'excel-rcsa'); // SharePoint files are processed as Excel RCSA
          formData.append('organizationId', organizationId);
          formData.append('userId', userId);
          formData.append('options', JSON.stringify(options));

          try {
            const response = await fetch('/api/sharepoint/import', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              throw new Error(`Processing failed: ${response.statusText}`);
            }

            const result = await response.json();
            results.push(result.data);

          } catch (error) {
            console.error(`Error processing SharePoint file ${sharePointFile.name}:`, error);
            setProcessingError(error instanceof Error ? error.message : 'Processing failed');
          }
        }

        setProcessingResults(results);
        setShowResults(true);
        
        if (onComplete) {
          onComplete(results);
        }

        toast({
          title: "SharePoint Import Complete",
          description: `Successfully processed ${results.length} file(s)`,
        });

      } catch (error) {
        console.error('SharePoint import processing error:', error);
        setProcessingError(error instanceof Error ? error.message : 'Processing failed');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Handle Google Drive mode
    if (selectedMode.id === 'googledrive') {
      if (selectedGoogleDriveFiles.length === 0) {
        setProcessingError('Please select at least one file from Google Drive');
        return;
      }

      setIsProcessing(true);
      setProcessingError(null);
      setProcessingResults([]);

      try {
        const results: any[] = [];

        for (const googleDriveFile of selectedGoogleDriveFiles) {
          const formData = new FormData();
          formData.append('fileId', googleDriveFile.id);
          formData.append('fileName', googleDriveFile.name);
          formData.append('mode', 'excel-rcsa'); // Google Drive files are processed as Excel RCSA
          formData.append('organizationId', organizationId);
          formData.append('userId', userId);
          formData.append('options', JSON.stringify(options));

          try {
            const response = await fetch('/api/google-drive/import', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              throw new Error(`Processing failed: ${response.statusText}`);
            }

            const result = await response.json();
            results.push(result.data);

          } catch (error) {
            console.error(`Error processing Google Drive file ${googleDriveFile.name}:`, error);
            setProcessingError(error instanceof Error ? error.message : 'Processing failed');
          }
        }

        setProcessingResults(results);
        setShowResults(true);
        
        if (onComplete) {
          onComplete(results);
        }

        toast({
          title: "Google Drive Import Complete",
          description: `Successfully processed ${results.length} file(s)`,
        });

      } catch (error) {
        console.error('Google Drive import processing error:', error);
        setProcessingError(error instanceof Error ? error.message : 'Processing failed');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Original file upload logic
    if (files.length === 0) {
      setProcessingError('Please select at least one file');
      return;
    }

    setIsProcessing(true);
    setProcessingError(null);
    setProcessingResults([]);

    try {
      const results: any[] = [];

      for (const fileObj of files) {
        // Update file status
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id 
            ? { ...f, status: 'processing', progress: 10 }
            : f
        ));

        const formData = new FormData();
        formData.append('file', fileObj.file);
        formData.append('mode', selectedMode.processingType);
        formData.append('organizationId', organizationId);
        formData.append('userId', userId);
        formData.append('options', JSON.stringify(options));

        try {
          const response = await fetch('/api/import/process', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Processing failed: ${response.statusText}`);
          }

          const result = await response.json();
          
          // Update file status
          setFiles(prev => prev.map(f => 
            f.id === fileObj.id 
              ? { 
                  ...f, 
                  status: 'completed', 
                  progress: 100,
                  results: result.data
                }
              : f
          ));

          results.push(result.data);

        } catch (error) {
          console.error(`Error processing ${fileObj.file.name}:`, error);
          
          // Update file status with error
          setFiles(prev => prev.map(f => 
            f.id === fileObj.id 
              ? { 
                  ...f, 
                  status: 'error', 
                  progress: 0,
                  error: error instanceof Error ? error.message : 'Processing failed'
                }
              : f
          ));
        }
      }

      setProcessingResults(results);
      setShowResults(true);
      
      if (onComplete) {
        onComplete(results);
      }

      toast({
        title: "Import Complete",
        description: `Successfully processed ${results.length} file(s)`,
      });

    } catch (error) {
      console.error('Import processing error:', error);
      setProcessingError(error instanceof Error ? error.message : 'Processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetImport = () => {
    setFiles([]);
    setSelectedSharePointFiles([]);
    setSelectedGoogleDriveFiles([]);
    setSelectedIntegrationId(null);
    setProcessingError(null);
    setProcessingResults([]);
    setShowResults(false);
  };

  const getFileIcon = (type: string) => {
    if (type.includes('spreadsheet') || type.includes('excel')) return FileSpreadsheet;
    if (type.includes('pdf') || type.includes('document') || type.includes('text')) return FileText;
    if (type.includes('image')) return FileImage;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Import Mode Selection */}
      <DaisyCard>
        <DaisyCardHeader>
          <DaisyCardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Import Mode Selection
          </DaisyCardTitle>
        
        <DaisyCardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {IMPORT_MODES.map((mode) => {
              const IconComponent = mode.icon;
              return (
                <motion.div
                  key={mode.id}
                  className={`
                    p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                    ${selectedMode.id === mode.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                  `}
                  onClick={() => {
                    setSelectedMode(mode);
                    // Clear cloud storage selections when switching modes
                    if (mode.id !== 'sharepoint') {
                      setSelectedSharePointFiles([]);
                      setSelectedIntegrationId(null);
                    }
                    if (mode.id !== 'googledrive') {
                      setSelectedGoogleDriveFiles([]);
                    }
                    // Clear regular files when switching to cloud storage
                    if (mode.id === 'sharepoint' || mode.id === 'googledrive') {
                      setFiles([]);
                    }
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start gap-3">
                    <IconComponent className={`h-6 w-6 mt-1 ${selectedMode.id === mode.id ? 'text-blue-600' : 'text-gray-600'}`} />
                    <div>
                      <h3 className={`font-medium ${selectedMode.id === mode.id ? 'text-blue-900' : 'text-gray-900'}`}>
                        {mode.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {mode.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <DaisyBadge 
                          variant={mode.aiEnabled ? "default" : "secondary"} 
                          className={`text-xs ${mode.aiEnabled ? 'bg-[#199BEC]/10 text-[#199BEC] border-[#199BEC]/30' : ''}`}
                        >
                          {mode.aiEnabled ? (
                            <>
                              <Image 
                                src="/images/logo/riscura.png" 
                                alt="Riscura" 
                                width={12} 
                                height={12} 
                                className="mr-1"
                              />
                              AI Powered
                            </>
                          ) : (
                            'Standard Upload'
                          )}
                        </DaisyBadge>
                        <span className="text-xs text-gray-500">
                          Max {mode.maxFiles} files
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </DaisyCardBody>
      </DaisyCard>

      {/* Processing Options */}
      {selectedMode.aiEnabled && (
        <DaisyCard>
          <DaisyCardHeader>
            <DaisyCardTitle className="text-lg">Processing Options</DaisyCardTitle>
          
          <DaisyCardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <DaisyCheckbox
                  id="aiAnalysis"
                  checked={options.aiAnalysis}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, aiAnalysis: !!checked }))
                  }
                />
                <DaisyLabel htmlFor="aiAnalysis" className="text-sm">
                  AI Analysis
                </DaisyLabel>
              </div>
              <div className="flex items-center space-x-2">
                <DaisyCheckbox
                  id="autoMap"
                  checked={options.autoMap}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, autoMap: !!checked }))
                  }
                />
                <DaisyLabel htmlFor="autoMap" className="text-sm">
                  Auto-map Fields
                </DaisyLabel>
              </div>
              <div className="flex items-center space-x-2">
                <DaisyCheckbox
                  id="validateData"
                  checked={options.validateData}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, validateData: !!checked }))
                  }
                />
                <DaisyLabel htmlFor="validateData" className="text-sm">
                  Validate Data
                </DaisyLabel>
              </div>
              <div className="flex items-center space-x-2">
                <DaisyCheckbox
                  id="createMissing"
                  checked={options.createMissing}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, createMissing: !!checked }))
                  }
                />
                <DaisyLabel htmlFor="createMissing" className="text-sm">
                  Create Missing Items
                </DaisyLabel>
              </div>
              <div className="flex items-center space-x-2">
                <DaisyCheckbox
                  id="previewMode"
                  checked={options.previewMode}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, previewMode: !!checked }))
                  }
                />
                <DaisyLabel htmlFor="previewMode" className="text-sm">
                  Preview Mode
                </DaisyLabel>
              </div>
            </div>
          </DaisyCardBody>
        </DaisyCard>
      )}

      {/* File Drop Zone - Only show for non-cloud storage modes */}
      {selectedMode.id !== 'sharepoint' && selectedMode.id !== 'googledrive' && (
        <DaisyCard>
          <DaisyCardContent className="p-6">
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200
                ${isDragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
                }
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <input {...getInputProps()} />
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: isDragActive ? 1.05 : 1 }}
                className="space-y-4"
              >
                <Upload className={`h-12 w-12 mx-auto ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {isDragActive 
                      ? `Drop ${selectedMode.name.toLowerCase()} here` 
                      : `Drag & drop ${selectedMode.name.toLowerCase()} here`
                    }
                  </h3>
                  <p className="text-gray-600 mt-1">
                    or click to browse (max {formatFileSize(maxFileSize)} per file)
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Accepted: {selectedMode.acceptedTypes.map(type => {
                      if (type.includes('excel') || type.includes('spreadsheet')) return 'Excel';
                      if (type.includes('pdf')) return 'PDF';
                      if (type.includes('word') || type.includes('document')) return 'Word';
                      if (type.includes('text')) return 'Text';
                      return type.split('/')[1];
                    }).join(', ')}
                  </p>
                </div>
              </motion.div>
            </div>
          </DaisyCardBody>
        </DaisyCard>
      )}

      {/* SharePoint Integration Selection */}
      {selectedMode.id === 'sharepoint' && (
        <>
          <DaisyCard>
            <DaisyCardHeader>
              <DaisyCardTitle className="text-lg">Select SharePoint Site</DaisyCardTitle>
            
            <DaisyCardContent>
              {isLoadingIntegrations ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>Loading SharePoint connections...</span>
                </div>
              ) : integrations.length === 0 ? (
                <DaisyAlert>
                  <DaisyAlertCircle className="h-4 w-4" />
                  <DaisyAlertDescription>
                    No SharePoint sites connected. Please go to Settings → Integrations to connect a SharePoint site first.
                  
                </DaisyAlert>
              ) : (
                <div className="space-y-2">
                  {integrations.map((integration) => (
                    <div
                      key={integration.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedIntegrationId === integration.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onClick={() => setSelectedIntegrationId(integration.id)}
                    >
                      <div className="flex items-center">
                        <Cloud className="h-5 w-5 text-blue-600 mr-2" />
                        <div>
                          <p className="font-medium">{integration.displayName}</p>
                          <p className="text-sm text-gray-600">Site ID: {integration.siteId}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DaisyCardBody>
          </DaisyCard>

          {/* SharePoint File Browser */}
          {selectedIntegrationId && (
            <DaisyCard>
              <DaisyCardHeader>
                <DaisyCardTitle className="text-lg">Select Excel Files</DaisyCardTitle>
              
              <DaisyCardContent>
                <SharePointFileBrowser
                  integrationId={selectedIntegrationId}
                  onFileSelect={(file) => {
                    const isSelected = selectedSharePointFiles.some(f => f.id === file.id);
                    if (isSelected) {
                      setSelectedSharePointFiles(prev => prev.filter(f => f.id !== file.id));
                    } else {
                      if (selectedSharePointFiles.length < selectedMode.maxFiles) {
                        setSelectedSharePointFiles(prev => [...prev, file]);
                      } else {
                        toast({
                          title: "Maximum files reached",
                          description: `You can only select up to ${selectedMode.maxFiles} files`,
                          variant: "destructive"
                        });
                      }
                    }
                  }}
                  selectedFileId={selectedSharePointFiles[0]?.id}
                />
                {selectedSharePointFiles.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      Selected {selectedSharePointFiles.length} file{selectedSharePointFiles.length > 1 ? 's' : ''}
                    </p>
                    <div className="mt-2">
                      {selectedSharePointFiles.length <= 5 ? (
                        // For small lists, use regular rendering
                        <div className="space-y-1">
                          {selectedSharePointFiles.map((file) => (
                            <div key={file.id} className="flex items-center justify-between text-sm">
                              <span className="text-blue-700 truncate">{file.name}</span>
                              <DaisyButton
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedSharePointFiles(prev => prev.filter(f => f.id !== file.id))}
                              >
                                <X className="h-3 w-3" />
                              </DaisyButton>
                            </div>
                          ))}
                        </div>
                      ) : (
                        // For large lists, use virtualization
                        <List
                          height={150} // Fixed height for 5 items
                          itemCount={selectedSharePointFiles.length}
                          itemSize={30} // Height of each item
                          width="100%"
                        >
                          {({ index, style }) => {
                            const file = selectedSharePointFiles[index];
                            return (
                              <div key={file.id} style={style} className="flex items-center justify-between text-sm px-1">
                                <span className="text-blue-700 truncate">{file.name}</span>
                                <DaisyButton
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedSharePointFiles(prev => prev.filter(f => f.id !== file.id))}
                                >
                                  <X className="h-3 w-3" />
                                </DaisyButton>
                              </div>
                            );
                          }}
                        </List>
                      )}
                    </div>
                  </div>
                )}
              </DaisyCardBody>
            </DaisyCard>
          )}
        </>
      )}

      {/* Google Drive Integration */}
      {selectedMode.id === 'googledrive' && (
        <DaisyCard>
          <DaisyCardHeader>
            <DaisyCardTitle className="text-lg">Google Drive Connection</DaisyCardTitle>
          
          <DaisyCardContent>
            {!isGoogleDriveConnected ? (
              <div className="space-y-4">
                <DaisyAlert>
                  <DaisyAlertCircle className="h-4 w-4" />
                  <DaisyAlertDescription>
                    Connect your Google Drive account to import Excel files directly from your Drive.
                  
                </DaisyAlert>
                <DaisyButton 
                  onClick={connectGoogleDrive}
                  className="w-full"
                >
                  <Cloud className="h-4 w-4 mr-2" />
                  Connect Google Drive
                </DaisyButton>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-green-900 font-medium">Google Drive Connected</span>
                  </div>
                  <DaisyButton
                    variant="ghost"
                    size="sm"
                    onClick={checkGoogleDriveConnection}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </DaisyButton>
                </div>
                
                {/* Google Drive File Browser */}
                <GoogleDriveFileBrowser
                  onFileSelect={(file) => {
                    const isSelected = selectedGoogleDriveFiles.some(f => f.id === file.id);
                    if (isSelected) {
                      setSelectedGoogleDriveFiles(prev => prev.filter(f => f.id !== file.id));
                    } else {
                      if (selectedGoogleDriveFiles.length < selectedMode.maxFiles) {
                        setSelectedGoogleDriveFiles(prev => [...prev, file]);
                      } else {
                        toast({
                          title: "Maximum files reached",
                          description: `You can only select up to ${selectedMode.maxFiles} files`,
                          variant: "destructive"
                        });
                      }
                    }
                  }}
                  selectedFileId={selectedGoogleDriveFiles[0]?.id}
                />
                
                {selectedGoogleDriveFiles.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      Selected {selectedGoogleDriveFiles.length} file{selectedGoogleDriveFiles.length > 1 ? 's' : ''}
                    </p>
                    <div className="mt-2 space-y-1">
                      {selectedGoogleDriveFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between text-sm">
                          <span className="text-blue-700 truncate">{file.name}</span>
                          <DaisyButton
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedGoogleDriveFiles(prev => prev.filter(f => f.id !== file.id))}
                          >
                            <X className="h-3 w-3" />
                          </DaisyButton>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DaisyCardBody>
        </DaisyCard>
      )}

      {/* Selected Files */}
      {files.length > 0 && selectedMode.id !== 'sharepoint' && selectedMode.id !== 'googledrive' && (
        <DaisyCard>
          <DaisyCardHeader>
            <DaisyCardTitle className="flex items-center justify-between">
              <span>Selected Files ({files.length})</span>
              <DaisyButton
                variant="outline"
                size="sm"
                onClick={resetImport}
                disabled={isProcessing}
              >
                Clear All
              </DaisyButton>
            </DaisyCardTitle>
          
          <DaisyCardContent>
            <div className="space-y-3">
              {files.map((fileObj) => {
                const FileIcon = getFileIcon(fileObj.file.type);
                return (
                  <motion.div
                    key={fileObj.id}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <FileIcon className="h-8 w-8 text-blue-600" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {fileObj.file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(fileObj.file.size)}
                      </p>
                      {fileObj.status === 'processing' && (
                        <DaisyProgress value={fileObj.progress} className="mt-2" />
                      )}
                      {fileObj.error && (
                        <p className="text-sm text-red-600 mt-1">{fileObj.error}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {fileObj.status === 'completed' && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {fileObj.status === 'error' && (
                        <DaisyAlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      {fileObj.status === 'processing' && (
                        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                      )}
                      <DaisyButton
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(fileObj.id)}
                        disabled={isProcessing}
                      >
                        <X className="h-4 w-4" />
                      </DaisyButton>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </DaisyCardBody>
        </DaisyCard>
      )}

      {/* Error Display */}
      {processingError && (
        <DaisyAlert variant="error">
          <DaisyAlertCircle className="h-4 w-4" />
          <DaisyAlertDescription>{processingError}
        </DaisyAlert>
      )}

      {/* Action Buttons */}
      {((files.length > 0 && selectedMode.id !== 'sharepoint' && selectedMode.id !== 'googledrive') || 
        (selectedSharePointFiles.length > 0 && selectedMode.id === 'sharepoint') ||
        (selectedGoogleDriveFiles.length > 0 && selectedMode.id === 'googledrive')) && (
        <div className="flex gap-4">
          <DaisyButton
            onClick={processFiles}
            disabled={isProcessing}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
                Process {selectedMode.id === 'sharepoint' 
                  ? `${selectedSharePointFiles.length} SharePoint File${selectedSharePointFiles.length > 1 ? 's' : ''}`
                  : selectedMode.id === 'googledrive'
                  ? `${selectedGoogleDriveFiles.length} Google Drive File${selectedGoogleDriveFiles.length > 1 ? 's' : ''}`
                  : `${files.length} File${files.length > 1 ? 's' : ''}`
                }
              </>
            )}
          </DaisyButton>
        </div>
      )}

      {/* Results Dialog */}
      <DaisyDialog open={showResults} onOpenChange={setShowResults}>
        <DaisyDialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DaisyDialogHeader>
            <DaisyDialogTitle>Import Results</DaisyDialogTitle>
            <DaisyDialogDescription>
              Review the results of your import process
            </DaisyDialogDescription>
          </DaisyDialogHeader>
          <div className="space-y-4">
            {processingResults.map((result, idx) => (
              <DaisyCard key={idx}>
                <DaisyCardHeader>
                  <DaisyCardTitle className="text-lg">
                    {result.filename || `File ${idx + 1}`}
                  </DaisyCardTitle>
                
                <DaisyCardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Type:</strong> {result.type}
                    </div>
                    <div>
                      <strong>Status:</strong> {result.status}
                    </div>
                    {result.summary && (
                      <div className="col-span-2">
                        <strong>Summary:</strong>
                        <ul className="mt-1 space-y-1">
                          {Object.entries(result.summary).map(([key, value]) => (
                            <li key={key}>
                              • {key}: {value as string}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </DaisyCardBody>
              </DaisyCard>
            ))}
          </div>
          <DaisyDialogFooter>
            <DaisyButton onClick={() => setShowResults(false)}>
              Close
            </DaisyButton>
          </DaisyDialogFooter>
        </DaisyDialogContent>
      </DaisyDialog>
    </div>
  );
} 