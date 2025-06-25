'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  ArrowRight
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
  processingType: 'excel-rcsa' | 'policy-document' | 'bulk-upload';
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Import Mode Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  onClick={() => setSelectedMode(mode)}
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
                        <Badge 
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
                        </Badge>
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
        </CardContent>
      </Card>

      {/* Processing Options */}
      {selectedMode.aiEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Processing Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="aiAnalysis"
                  checked={options.aiAnalysis}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, aiAnalysis: !!checked }))
                  }
                />
                <Label htmlFor="aiAnalysis" className="text-sm">
                  AI Analysis
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autoMap"
                  checked={options.autoMap}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, autoMap: !!checked }))
                  }
                />
                <Label htmlFor="autoMap" className="text-sm">
                  Auto-map Fields
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="validateData"
                  checked={options.validateData}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, validateData: !!checked }))
                  }
                />
                <Label htmlFor="validateData" className="text-sm">
                  Validate Data
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="createMissing"
                  checked={options.createMissing}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, createMissing: !!checked }))
                  }
                />
                <Label htmlFor="createMissing" className="text-sm">
                  Create Missing Items
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="previewMode"
                  checked={options.previewMode}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, previewMode: !!checked }))
                  }
                />
                <Label htmlFor="previewMode" className="text-sm">
                  Preview Mode
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Drop Zone */}
      <Card>
        <CardContent className="p-6">
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
        </CardContent>
      </Card>

      {/* Selected Files */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Selected Files ({files.length})</span>
              <Button
                variant="outline"
                size="sm"
                onClick={resetImport}
                disabled={isProcessing}
              >
                Clear All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                        <Progress value={fileObj.progress} className="mt-2" />
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
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      {fileObj.status === 'processing' && (
                        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(fileObj.id)}
                        disabled={isProcessing}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {processingError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{processingError}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      {files.length > 0 && (
        <div className="flex gap-4">
          <Button
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
                Process {files.length} File{files.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Results</DialogTitle>
            <DialogDescription>
              Review the results of your import process
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {processingResults.map((result, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {result.filename || `File ${idx + 1}`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowResults(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 