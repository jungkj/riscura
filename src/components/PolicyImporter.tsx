'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Shield,
  Loader2,
  Edit3,
  Save,
  X,
  FileUp,
  FilePlus2
} from 'lucide-react';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
import { DaisyProgress } from '@/components/ui/DaisyProgress';

interface ExtractedRisk {
  id: string;
  text: string;
  confidence?: number;
  approved?: boolean;
  editing?: boolean;
}

interface ExtractedControl {
  id: string;
  text: string;
  confidence?: number;
  approved?: boolean;
  editing?: boolean;
}

interface ExtractedContent {
  risks: ExtractedRisk[];
  controls: ExtractedControl[];
}

interface PolicyAnalysisResult {
  success: boolean;
  extractedCount: {
    risks: number;
    controls: number;
  };
  data: ExtractedContent;
  fileInfo?: {
    name: string;
    type: string;
    size: number;
    textLength: number;
  };
  note?: string;
  error?: string;
}

interface FilePreview {
  file: File;
  preview: string;
}

interface PolicyImporterProps {
  onAnalysisComplete?: (result: PolicyAnalysisResult) => void;
  className?: string;
}

const PolicyImporter: React.FC<PolicyImporterProps> = ({ 
  onAnalysisComplete, 
  className = '' 
}) => {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<PolicyAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // File type icons
  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('text')) return '📃';
    return '📄';
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setFiles(newFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDropRejected: (rejectedFiles) => {
      const file = rejectedFiles[0];
      if (file.errors[0]?.code === 'file-too-large') {
        setError('File is too large. Maximum size is 10MB.');
      } else if (file.errors[0]?.code === 'file-invalid-type') {
        setError('Invalid file type. Please upload PDF, DOCX, DOC, or TXT files only.');
      } else {
        setError('File rejected. Please try again.');
      }
    }
  });

  // Upload file to API
  const uploadFile = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append('file', files[0].file);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/upload/policy', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result: PolicyAnalysisResult = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Initialize approval states
      if (result.data) {
        result.data.risks = result.data.risks.map(risk => ({
          ...risk,
          approved: false,
          editing: false
        }));
        result.data.controls = result.data.controls.map(control => ({
          ...control,
          approved: false,
          editing: false
        }));
      }

      setAnalysisResult(result);
      onAnalysisComplete?.(result);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // Remove file
  const removeFile = () => {
    setFiles([]);
    setAnalysisResult(null);
    setError(null);
  };

  // Edit risk/control text
  const updateRiskText = (id: string, newText: string) => {
    if (!analysisResult) return;
    
    setAnalysisResult({
      ...analysisResult,
      data: {
        ...analysisResult.data,
        risks: analysisResult.data.risks.map(risk =>
          risk.id === id ? { ...risk, text: newText } : risk
        )
      }
    });
  };

  const updateControlText = (id: string, newText: string) => {
    if (!analysisResult) return;
    
    setAnalysisResult({
      ...analysisResult,
      data: {
        ...analysisResult.data,
        controls: analysisResult.data.controls.map(control =>
          control.id === id ? { ...control, text: newText } : control
        )
      }
    });
  };

  // Toggle editing mode
  const toggleRiskEditing = (id: string) => {
    if (!analysisResult) return;
    
    setAnalysisResult({
      ...analysisResult,
      data: {
        ...analysisResult.data,
        risks: analysisResult.data.risks.map(risk =>
          risk.id === id ? { ...risk, editing: !risk.editing } : risk
        )
      }
    });
  };

  const toggleControlEditing = (id: string) => {
    if (!analysisResult) return;
    
    setAnalysisResult({
      ...analysisResult,
      data: {
        ...analysisResult.data,
        controls: analysisResult.data.controls.map(control =>
          control.id === id ? { ...control, editing: !control.editing } : control
        )
      }
    });
  };

  // Approve/reject items
  const toggleRiskApproval = (id: string) => {
    if (!analysisResult) return;
    
    setAnalysisResult({
      ...analysisResult,
      data: {
        ...analysisResult.data,
        risks: analysisResult.data.risks.map(risk =>
          risk.id === id ? { ...risk, approved: !risk.approved } : risk
        )
      }
    });
  };

  const toggleControlApproval = (id: string) => {
    if (!analysisResult) return;
    
    setAnalysisResult({
      ...analysisResult,
      data: {
        ...analysisResult.data,
        controls: analysisResult.data.controls.map(control =>
          control.id === id ? { ...control, approved: !control.approved } : control
        )
      }
    });
  };

  // Approve all
  const approveAllRisks = () => {
    if (!analysisResult) return;
    
    setAnalysisResult({
      ...analysisResult,
      data: {
        ...analysisResult.data,
        risks: analysisResult.data.risks.map(risk => ({ ...risk, approved: true }))
      }
    });
  };

  const approveAllControls = () => {
    if (!analysisResult) return;
    
    setAnalysisResult({
      ...analysisResult,
      data: {
        ...analysisResult.data,
        controls: analysisResult.data.controls.map(control => ({ ...control, approved: true }))
      }
    });
  };

  const approveAll = () => {
    approveAllRisks();
    approveAllControls();
  };

  return (
    <div className={`w-full max-w-4xl mx-auto space-y-6 ${className}`}>
      {/* File Upload Area */}
      <DaisyCard >
  <DaisyCardBody />
</DaisyCard>
          <DaisyCardTitle className="flex items-center gap-2" >
  <FileUp className="h-5 w-5 text-blue-600" />
</DaisyCardTitle>
            Policy Document Upload
          </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <AnimatePresence>
</DaisyCardBody>
            {files.length === 0 ? (
              <div
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
                  ${isDragActive 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                    : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                  }
                `}
                {...getRootProps()}
              >
                <input {...getInputProps()} />
                <motion.div
                  animate={isDragActive ? { scale: 1.05 } : { scale: 1 }}
                  className="space-y-4"
                >
                  <div className="flex justify-center">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <Upload className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {isDragActive ? 'Drop your policy document here' : 'Drag & drop your policy document'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      or click to browse files
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      Supports PDF, DOCX, DOC, TXT • Max 10MB
                    </p>
                  </div>
                </motion.div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {files.map((filePreview, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {getFileIcon(filePreview.file.type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {filePreview.file.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatFileSize(filePreview.file.size)} • {filePreview.file.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DaisyButton
                        onClick={uploadFile}
                        disabled={uploading}
                        className="bg-blue-600 hover:bg-blue-700" >
  {uploading ? (
</DaisyButton>
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-2" />
                            Analyze Policy
                          </>
                        )}
                      </DaisyButton>
                      <DaisyButton
                        variant="outline"
                        size="sm"
                        onClick={removeFile}
                        disabled={uploading} >
  <X className="h-4 w-4" />
</DaisyButton>
                      </DaisyButton>
                    </div>
                  </div>
                ))}

                {uploading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-2"
                  >
                    <DaisyProgress value={uploadProgress} className="h-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                      Processing document and extracting risks & controls...
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <DaisyAlert variant="error" >
  <DaisyAlertTriangle className="h-4 w-4" />
</DaisyProgress>
                <DaisyAlertDescription>{error}
                </DaisyAlertDescription>
                </DaisyAlertDescription>
              </DaisyAlert>
            </motion.div>
          )}
        </DaisyCardBody>
      </DaisyCard>

      {/* Analysis Results */}
      <AnimatePresence>
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Summary Card */}
            <DaisyCard >
  <DaisyCardBody />
</DaisyCard>
                <div className="flex items-center justify-between">
                  <DaisyCardTitle className="flex items-center gap-2" >
  <CheckCircle className="h-5 w-5 text-green-600" />
</DaisyCardTitle>
                    Analysis Complete
                  </DaisyCardTitle>
                  <DaisyButton
                    onClick={approveAll}
                    className="bg-green-600 hover:bg-green-700" >
  <CheckCircle className="h-4 w-4 mr-2" />
</DaisyButton>
                    Approve All
                  </DaisyButton>
                </div>
              
              <DaisyCardBody >
  <div className="grid grid-cols-2 gap-6">
</DaisyCardBody>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {analysisResult.extractedCount.risks}
                    </div>
                    <div className="text-sm text-red-700 dark:text-red-300">
                      Risks Identified
                    </div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {analysisResult.extractedCount.controls}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      Controls Found
                    </div>
                  </div>
                </div>
                
                {analysisResult.fileInfo && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Processed <strong>{analysisResult.fileInfo.name}</strong> 
                      ({formatFileSize(analysisResult.fileInfo.size)}) • 
                      {analysisResult.fileInfo.textLength.toLocaleString()} characters extracted
                    </p>
                  </div>
                )}

                {analysisResult.note && (
                  <DaisyAlert className="mt-4" >
  <DaisyAlertTriangle className="h-4 w-4" />
</DaisyAlert>
                    <DaisyAlertDescription>{analysisResult.note}
                </DaisyAlertDescription>
                </DaisyAlertDescription>
              </DaisyAlert>
                )}
              </DaisyCardBody>
            </DaisyCard>

            {/* Extracted Content */}
            <DaisyAccordion type="multiple" className="space-y-4" defaultValue={['risks', 'controls']} />
              {/* Risks Section */}
              <DaisyAccordionItem value="risks" className="border rounded-lg" />
                <DaisyAccordionTrigger className="px-6 py-4 hover:no-underline" />
                  <div className="flex items-center gap-3">
                    <DaisyAlertTriangle className="h-5 w-5 text-red-600" >
  <span className="text-lg font-semibold">
</DaisyAccordion>
                      Identified Risks ({analysisResult.data.risks.length})
                    </span>
                    <DaisyBadge variant="error" className="ml-2" >
  {analysisResult.data.risks.filter(r => r.approved).length} approved
</DaisyBadge>
                    </DaisyBadge>
                  </div>
                </DaisyAccordionTrigger>
                <DaisyAccordionContent className="px-6 pb-6" />
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Review and approve risks identified in your policy document
                      </p>
                      <DaisyButton
                        variant="outline"
                        size="sm"
                        onClick={approveAllRisks} >
  Approve All Risks
</DaisyAccordionContent>
                      </DaisyButton>
                    </div>
                    
                    <div className="space-y-3">
                      {analysisResult.data.risks.map((risk, index) => (
                        <motion.div
                          key={risk.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`
                            p-4 border rounded-lg transition-all duration-200
                            ${risk.approved 
                              ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }
                          `}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <DaisyBadge variant="outline" className="text-xs" >
  {risk.id}
</DaisyBadge>
                                </DaisyBadge>
                                {risk.confidence && (
                                  <DaisyBadge variant="secondary" className="text-xs" >
  {(risk.confidence * 100).toFixed(0)}% confidence
</DaisyBadge>
                                  </DaisyBadge>
                                )}
                              </div>
                              
                              {risk.editing ? (
                                <DaisyTextarea
                                  value={risk.text}
                                  onChange={(e) => updateRiskText(risk.id, e.target.value)}
                                  className="min-h-[80px]"
                                />
                              ) : (
                                <p className="text-gray-900 dark:text-gray-100 leading-relaxed">
                                  {risk.text}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <DaisyButton
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleRiskEditing(risk.id)} />
                                {risk.editing ? (
                                  <Save className="h-4 w-4" />
                                ) : (
                                  <Edit3 className="h-4 w-4" />
                                )}
                              </DaisyTextarea>
                              <DaisyButton
                                variant={risk.approved ? "primary" : "outline"}
                                size="sm"
                                onClick={() => toggleRiskApproval(risk.id)}
                                className={risk.approved ? "bg-green-600 hover:bg-green-700" : ""} />
                                {risk.approved ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : (
                                  <XCircle className="h-4 w-4" />
                                )}
                              </DaisyButton>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </DaisyAccordionContent>
              </DaisyAccordionItem>

              {/* Controls Section */}
              <DaisyAccordionItem value="controls" className="border rounded-lg" />
                <DaisyAccordionTrigger className="px-6 py-4 hover:no-underline" />
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <span className="text-lg font-semibold">
                      Security Controls ({analysisResult.data.controls.length})
                    </span>
                    <DaisyBadge variant="secondary" className="ml-2" >
  {analysisResult.data.controls.filter(c => c.approved).length} approved
</DaisyAccordionItem>
                    </DaisyBadge>
                  </div>
                </DaisyAccordionTrigger>
                <DaisyAccordionContent className="px-6 pb-6" />
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Review and approve security controls found in your policy
                      </p>
                      <DaisyButton
                        variant="outline"
                        size="sm"
                        onClick={approveAllControls} >
  Approve All Controls
</DaisyAccordionContent>
                      </DaisyButton>
                    </div>
                    
                    <div className="space-y-3">
                      {analysisResult.data.controls.map((control, index) => (
                        <motion.div
                          key={control.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`
                            p-4 border rounded-lg transition-all duration-200
                            ${control.approved 
                              ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }
                          `}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <DaisyBadge variant="outline" className="text-xs" >
  {control.id}
</DaisyBadge>
                                </DaisyBadge>
                                {control.confidence && (
                                  <DaisyBadge variant="secondary" className="text-xs" >
  {(control.confidence * 100).toFixed(0)}% confidence
</DaisyBadge>
                                  </DaisyBadge>
                                )}
                              </div>
                              
                              {control.editing ? (
                                <DaisyTextarea
                                  value={control.text}
                                  onChange={(e) => updateControlText(control.id, e.target.value)}
                                  className="min-h-[80px]"
                                />
                              ) : (
                                <p className="text-gray-900 dark:text-gray-100 leading-relaxed">
                                  {control.text}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <DaisyButton
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleControlEditing(control.id)} />
                                {control.editing ? (
                                  <Save className="h-4 w-4" />
                                ) : (
                                  <Edit3 className="h-4 w-4" />
                                )}
                              </DaisyTextarea>
                              <DaisyButton
                                variant={control.approved ? "primary" : "outline"}
                                size="sm"
                                onClick={() => toggleControlApproval(control.id)}
                                className={control.approved ? "bg-green-600 hover:bg-green-700" : ""} />
                                {control.approved ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : (
                                  <XCircle className="h-4 w-4" />
                                )}
                              </DaisyButton>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </DaisyAccordionContent>
              </DaisyAccordionItem>
            </DaisyAccordion>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PolicyImporter; 