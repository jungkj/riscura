import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
  AlertDialogDescription,
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
  Brain
} from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string; // Base64 encoded content
  uploadedAt: Date;
  status: 'uploading' | 'uploaded' | 'analyzing' | 'analyzed' | 'error';
  progress: number;
  aiAnalysis?: {
    risks: Array<{
      title: string;
      description: string;
      likelihood: number;
      impact: number;
      confidence: number;
    }>;
    summary: string;
    recommendations: string[];
  };
}

interface DocumentUploadProps {
  onFilesUploaded?: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
}

export default function DocumentUpload({
  onFilesUploaded,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png'
  ]
}: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [deleteFile, setDeleteFile] = useState<UploadedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Mock AI analysis
  const analyzeDocument = async (file: UploadedFile): Promise<UploadedFile['aiAnalysis']> => {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));

    // Mock analysis results based on file type and name
    const mockRisks = [
      {
        title: 'Data Privacy Risk',
        description: 'Document contains potential PII that may require protection',
        likelihood: 3,
        impact: 4,
        confidence: 85
      },
      {
        title: 'Operational Risk',
        description: 'Process dependencies identified that could impact operations',
        likelihood: 2,
        impact: 3,
        confidence: 78
      },
      {
        title: 'Compliance Risk',
        description: 'Regulatory requirements mentioned that need monitoring',
        likelihood: 4,
        impact: 5,
        confidence: 92
      }
    ];

    return {
      risks: mockRisks.slice(0, Math.floor(Math.random() * 3) + 1),
      summary: `AI analysis identified ${mockRisks.length} potential risk areas in this document. The content appears to be ${file.type.includes('pdf') ? 'a policy document' : 'operational documentation'} with moderate risk exposure.`,
      recommendations: [
        'Review data handling procedures for compliance',
        'Implement additional controls for identified risks',
        'Schedule regular review of this document',
        'Consider stakeholder notification requirements'
      ]
    };
  };

  // Handle file upload
  const handleFileUpload = useCallback(async (acceptedFiles: File[]) => {
    if (files.length + acceptedFiles.length > maxFiles) {
      toast({
        title: 'Too many files',
        description: `Maximum ${maxFiles} files allowed`,
        variant: 'destructive'
      });
      return;
    }

    const newFiles: UploadedFile[] = [];

    for (const file of acceptedFiles) {
      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds ${formatFileSize(maxSize)} limit`,
          variant: 'destructive'
        });
        continue;
      }

      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        
        const uploadedFile: UploadedFile = {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          content,
          uploadedAt: new Date(),
          status: 'uploading',
          progress: 0
        };

        setFiles(prev => [...prev, uploadedFile]);

        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, progress } : f
          ));
        }

        // Mark as uploaded
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, status: 'uploaded' } : f
        ));

        // Start AI analysis
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, status: 'analyzing' } : f
        ));

        try {
          const analysis = await analyzeDocument(uploadedFile);
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, status: 'analyzed', aiAnalysis: analysis } : f
          ));
          
          toast({
            title: 'Analysis Complete',
            description: `AI analysis completed for ${file.name}`,
          });
        } catch {
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, status: 'error' } : f
          ));
          
          toast({
            title: 'Analysis Failed',
            description: `Failed to analyze ${file.name}`,
            variant: 'destructive'
          });
        }
      };

      reader.readAsDataURL(file);
      newFiles.push({
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        content: '',
        uploadedAt: new Date(),
        status: 'uploading',
        progress: 0
      });
    }

    if (onFilesUploaded) {
      onFilesUploaded(newFiles);
    }
  }, [files.length, maxFiles, maxSize, onFilesUploaded]);

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles: maxFiles - files.length,
    maxSize
  });

  // Handle file deletion
  const handleDeleteFile = (file: UploadedFile) => {
    setFiles(prev => prev.filter(f => f.id !== file.id));
    setDeleteFile(null);
    toast({
      title: 'File Removed',
      description: `${file.name} has been removed`,
    });
  };

  // Get status badge
  const getStatusBadge = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Uploading</Badge>;
      case 'uploaded':
        return <Badge variant="outline"><CheckCircle className="h-3 w-3 mr-1" />Uploaded</Badge>;
      case 'analyzing':
        return <Badge variant="secondary"><Brain className="h-3 w-3 mr-1 animate-pulse" />Analyzing</Badge>;
      case 'analyzed':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Analyzed</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Document Upload & AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} ref={fileInputRef} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg font-medium">Drop files here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports PDF, Word, Excel, images and text files up to {formatFileSize(maxSize)}
                </p>
                <Button variant="outline">
                  Choose Files
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files ({files.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <AnimatePresence>
                {files.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    {getFileIcon(file.type)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{file.name}</p>
                        {getStatusBadge(file.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)} • {file.uploadedAt.toLocaleString()}
                      </p>
                      
                      {file.status === 'uploading' && (
                        <Progress value={file.progress} className="mt-2" />
                      )}
                      
                      {file.aiAnalysis && (
                        <div className="mt-2 text-sm">
                          <p className="text-green-600 font-medium">
                            ✓ {file.aiAnalysis.risks.length} risks identified
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[600px] sm:w-[800px]">
                          <SheetHeader>
                            <SheetTitle>{file.name}</SheetTitle>
                            <SheetDescription>
                              File details and AI analysis results
                            </SheetDescription>
                          </SheetHeader>
                          
                          <div className="mt-6 space-y-6">
                            {/* File Info */}
                            <div>
                              <h4 className="font-medium mb-2">File Information</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Size:</span>
                                  <span className="ml-2">{formatFileSize(file.size)}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Type:</span>
                                  <span className="ml-2">{file.type}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Uploaded:</span>
                                  <span className="ml-2">{file.uploadedAt.toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Status:</span>
                                  <span className="ml-2">{getStatusBadge(file.status)}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* AI Analysis Results */}
                            {file.aiAnalysis && (
                              <div>
                                <h4 className="font-medium mb-2">AI Analysis Results</h4>
                                
                                <div className="space-y-4">
                                  <div>
                                    <h5 className="text-sm font-medium mb-2">Summary</h5>
                                    <p className="text-sm text-muted-foreground">
                                      {file.aiAnalysis.summary}
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <h5 className="text-sm font-medium mb-2">Identified Risks</h5>
                                    <div className="space-y-2">
                                      {file.aiAnalysis.risks.map((risk, index) => (
                                        <div key={index} className="p-3 border rounded">
                                          <div className="flex items-center justify-between mb-1">
                                            <h6 className="font-medium">{risk.title}</h6>
                                            <Badge variant="outline">
                                              {risk.confidence}% confidence
                                            </Badge>
                                          </div>
                                          <p className="text-sm text-muted-foreground mb-2">
                                            {risk.description}
                                          </p>
                                          <div className="flex gap-4 text-xs">
                                            <span>Likelihood: {risk.likelihood}/5</span>
                                            <span>Impact: {risk.impact}/5</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h5 className="text-sm font-medium mb-2">Recommendations</h5>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                      {file.aiAnalysis.recommendations.map((rec, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                          <span className="text-primary">•</span>
                                          {rec}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </SheetContent>
                      </Sheet>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setDeleteFile(file)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteFile} onOpenChange={() => setDeleteFile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteFile?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteFile && handleDeleteFile(deleteFile)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 