'use client';

import React, { useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  usePolicyUpload, 
  usePolicyExtraction, 
  useImportStore,
  ExtractedRisk,
  ExtractedControl 
} from '@/lib/stores/importStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Edit2, 
  Save, 
  X,
  CheckSquare,
  Square,
  Upload as UploadIcon,
  Loader2
} from 'lucide-react';

interface PolicyImporterWithStoreProps {
  onComplete?: (extraction: { risks: ExtractedRisk[]; controls: ExtractedControl[] }) => void;
}

export default function PolicyImporterWithStore({ onComplete }: PolicyImporterWithStoreProps) {
  const { uploadFile, loading, error, success } = usePolicyUpload();
  const policyExtraction = usePolicyExtraction();
  const clearImports = useImportStore((state) => state.clearImports);

  // Local state for editing and approval
  const [editingItems, setEditingItems] = React.useState<Set<string>>(new Set());
  const [editedTexts, setEditedTexts] = React.useState<Record<string, string>>({});
  const [approvedItems, setApprovedItems] = React.useState<Set<string>>(new Set());

  // File preview state
  const [filePreview, setFilePreview] = React.useState<{
    name: string;
    size: number;
    type: string;
    icon: string;
  } | null>(null);

  // Handle file upload
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Set file preview
    setFilePreview({
      name: file.name,
      size: file.size,
      type: file.type,
      icon: getFileIcon(file.type),
    });

    // Upload file using store
    await uploadFile(file);
  }, [uploadFile]);

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  // File icon helper
  const getFileIcon = (mimeType: string): string => {
    switch (mimeType) {
      case 'application/pdf':
        return '📄';
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        return '📝';
      case 'text/plain':
        return '📃';
      default:
        return '📄';
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle editing
  const startEditing = (id: string, currentText: string) => {
    setEditingItems(prev => new Set([...prev, id]));
    setEditedTexts(prev => ({ ...prev, [id]: currentText }));
  };

  const saveEdit = (id: string) => {
    setEditingItems(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const cancelEdit = (id: string) => {
    setEditingItems(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setEditedTexts(prev => {
      const { [id]: removed, ...rest } = prev;
      return rest;
    });
  };

  // Handle approval
  const toggleApproval = (id: string) => {
    setApprovedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const approveAll = () => {
    if (!policyExtraction) return;
    const allIds = [
      ...policyExtraction.risks.map(r => `risk-${r.id}`),
      ...policyExtraction.controls.map(c => `control-${c.id}`)
    ];
    setApprovedItems(new Set(allIds));
  };

  // Handle completion callback
  useEffect(() => {
    if (success && policyExtraction && onComplete) {
      onComplete(policyExtraction);
    }
  }, [success, policyExtraction, onComplete]);

  // Reset local state when store is cleared
  useEffect(() => {
    if (!policyExtraction) {
      setEditingItems(new Set());
      setEditedTexts({});
      setApprovedItems(new Set());
      setFilePreview(null);
    }
  }, [policyExtraction]);

  const handleReset = () => {
    clearImports();
  };

  const hasResults = policyExtraction && (policyExtraction.risks.length > 0 || policyExtraction.controls.length > 0);
  const allItemsApproved = hasResults && policyExtraction && 
    policyExtraction.risks.every(r => approvedItems.has(`risk-${r.id}`)) &&
    policyExtraction.controls.every(c => approvedItems.has(`control-${c.id}`));

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Policy Document Upload
          </CardTitle>
          <CardDescription>
            Upload policy documents (PDF, DOCX, DOC, TXT) for AI-powered risk and control analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!loading && !hasResults && (
            <div
              {...getRootProps()}
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                ${isDragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-300 hover:border-gray-400'
                }
              `}
            >
              <input {...getInputProps()} />
              <div className="space-y-4">
                <div className="flex justify-center">
                  <UploadIcon className="h-12 w-12 text-gray-400" />
                </div>
                <div>
                  <p className="text-lg font-medium">
                    {isDragActive ? 'Drop your file here' : 'Drag & drop your policy document'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    or click to browse files
                  </p>
                </div>
                <div className="text-xs text-gray-500">
                  Supports PDF, DOCX, DOC, TXT • Maximum 10MB
                </div>
              </div>
            </div>
          )}

          {/* File Preview */}
          {filePreview && !hasResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 border rounded-lg bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{filePreview.icon}</span>
                  <div>
                    <p className="font-medium">{filePreview.name}</p>
                    <p className="text-sm text-gray-600">
                      {formatFileSize(filePreview.size)} • {filePreview.type}
                    </p>
                  </div>
                </div>
                {loading && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Processing...</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Error Display */}
          {error && (
            <Alert className="mt-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {success && hasResults && (
            <Alert className="mt-4" variant="default">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Analysis complete! Found {policyExtraction?.risks.length} risks and {policyExtraction?.controls.length} controls.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      <AnimatePresence>
        {hasResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Action Bar */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="px-3 py-1">
                      {policyExtraction?.risks.length} Risks
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1">
                      {policyExtraction?.controls.length} Controls
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={approveAll}
                      disabled={allItemsApproved}
                    >
                      <CheckSquare className="h-4 w-4 mr-2" />
                      {allItemsApproved ? 'All Approved' : 'Approve All'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results Accordion */}
            <Card>
              <CardContent className="pt-6">
                <Accordion type="multiple" defaultValue={['risks', 'controls']}>
                  {/* Risks Section */}
                  <AccordionItem value="risks">
                    <AccordionTrigger className="text-lg font-semibold">
                      Identified Risks ({policyExtraction?.risks.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        {policyExtraction?.risks.map((risk) => {
                          const itemId = `risk-${risk.id}`;
                          const isEditing = editingItems.has(itemId);
                          const isApproved = approvedItems.has(itemId);
                          const displayText = editedTexts[itemId] || risk.text;

                          return (
                            <motion.div
                              key={risk.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className={`p-4 border rounded-lg ${isApproved ? 'bg-green-50 border-green-200' : 'bg-white'}`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="destructive" className="text-xs">
                                      Risk {risk.id}
                                    </Badge>
                                    {risk.confidence && (
                                      <Badge variant="outline" className="text-xs">
                                        {Math.round(risk.confidence * 100)}% confidence
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {isEditing ? (
                                    <div className="space-y-2">
                                      <Textarea
                                        value={editedTexts[itemId] || risk.text}
                                        onChange={(e) => 
                                          setEditedTexts(prev => ({ ...prev, [itemId]: e.target.value }))
                                        }
                                        className="min-h-[100px]"
                                      />
                                      <div className="flex gap-2">
                                        <Button size="sm" onClick={() => saveEdit(itemId)}>
                                          <Save className="h-3 w-3 mr-1" />
                                          Save
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => cancelEdit(itemId)}>
                                          <X className="h-3 w-3 mr-1" />
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-gray-700 leading-relaxed">{displayText}</p>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => isEditing ? cancelEdit(itemId) : startEditing(itemId, displayText)}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={isApproved ? "default" : "outline"}
                                    onClick={() => toggleApproval(itemId)}
                                  >
                                    {isApproved ? (
                                      <CheckSquare className="h-3 w-3" />
                                    ) : (
                                      <Square className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Controls Section */}
                  <AccordionItem value="controls">
                    <AccordionTrigger className="text-lg font-semibold">
                      Identified Controls ({policyExtraction?.controls.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        {policyExtraction?.controls.map((control) => {
                          const itemId = `control-${control.id}`;
                          const isEditing = editingItems.has(itemId);
                          const isApproved = approvedItems.has(itemId);
                          const displayText = editedTexts[itemId] || control.text;

                          return (
                            <motion.div
                              key={control.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className={`p-4 border rounded-lg ${isApproved ? 'bg-green-50 border-green-200' : 'bg-white'}`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                                      Control {control.id}
                                    </Badge>
                                    {control.confidence && (
                                      <Badge variant="outline" className="text-xs">
                                        {Math.round(control.confidence * 100)}% confidence
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {isEditing ? (
                                    <div className="space-y-2">
                                      <Textarea
                                        value={editedTexts[itemId] || control.text}
                                        onChange={(e) => 
                                          setEditedTexts(prev => ({ ...prev, [itemId]: e.target.value }))
                                        }
                                        className="min-h-[100px]"
                                      />
                                      <div className="flex gap-2">
                                        <Button size="sm" onClick={() => saveEdit(itemId)}>
                                          <Save className="h-3 w-3 mr-1" />
                                          Save
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => cancelEdit(itemId)}>
                                          <X className="h-3 w-3 mr-1" />
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-gray-700 leading-relaxed">{displayText}</p>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => isEditing ? cancelEdit(itemId) : startEditing(itemId, displayText)}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={isApproved ? "default" : "outline"}
                                    onClick={() => toggleApproval(itemId)}
                                  >
                                    {isApproved ? (
                                      <CheckSquare className="h-3 w-3" />
                                    ) : (
                                      <Square className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 