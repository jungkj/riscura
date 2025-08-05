'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard'
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { useToast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  FileText,
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Eye,
  Clock,
} from 'lucide-react';

interface ImportFile {
  file: File;
  status: 'pending' | 'processing' | 'success' | 'error';
  message?: string;
  recordsFound?: number;
  recordsImported?: number;
}

export default function ImportDataPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [dataType, setDataType] = useState<string>('risks');
  const [files, setFiles] = useState<ImportFile[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      status: 'pending' as const,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/json': ['.json'],
    },
    multiple: true,
  });

  const handleImport = async () => {
    if (files.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select at least one file to import',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);
    setImportProgress(0);

    for (let i = 0; i < files.length; i++) {
      const importFile = files[i];

      // Update status to processing
      setFiles((prev) =>
        prev.map((f, index) => (index === i ? { ...f, status: 'processing' } : f))
      )

      try {
        const formData = new FormData();
        formData.append('file', importFile.file);
        formData.append('dataType', dataType);

        const response = await fetch('/api/data/import', {
          method: 'POST',
          body: formData,
        });

        const _result = await response.json();

        if (!response.ok) throw new Error(result.error || 'Import failed');

        // Update with success
        setFiles((prev) =>
          prev.map((f, index) =>
            index === i
              ? {
                  ...f,
                  status: 'success',
                  recordsFound: result.recordsFound,
                  recordsImported: result.recordsImported,
                  message: `Successfully imported ${result.recordsImported} records`,
                }
              : f
          )
        )
      } catch (__error: any) {
        // Update with error
        setFiles((prev) =>
          prev.map((f, index) =>
            index === i
              ? {
                  ...f,
                  status: 'error',
                  message: error.message || 'Import failed',
                }
              : f
          )
        )
      }

      setImportProgress(((i + 1) / files.length) * 100);
    }

    setImporting(false);

    toast({
      title: 'Import Complete',
      description: 'Check the results below for details',
    });
  }

  const downloadTemplate = () => {
    // In a real implementation, this would download a template file
    const templates: { [key: string]: string } = {
      risks: 'risk-import-template.csv',
      controls: 'controls-import-template.csv',
      vendors: 'vendors-import-template.csv',
      assets: 'assets-import-template.csv',
    }

    toast({
      title: 'Template Downloaded',
      description: `Downloaded ${templates[dataType] || 'template.csv'}`,
    });
  }

  const removeFile = (_index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.csv')) return <FileText className="h-5 w-5" />;
    if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx'))
      return <FileSpreadsheet className="h-5 w-5" />;
    if (fileName.endsWith('.json')) return <Database className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  }

  const getStatusIcon = (status: ImportFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-400" />;
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <DaisyButton
              variant="ghost"
              onClick={() => router.push('/dashboard/quick-actions')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quick Actions
            </DaisyButton>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Import Risk Data</h1>
                <p className="text-gray-600 mt-1">
                  Upload and import risk data from external sources
                </p>
              </div>
              <DaisyBadge variant="outline" className="text-sm">
                <Clock className="h-4 w-4 mr-1" />
                15-25 min
              </DaisyBadge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Import Configuration */}
            <div className="lg:col-span-2 space-y-6">
              {/* Data Type Selection */}
              <DaisyCard>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Import Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Data Type</label>
                      <div className="mt-1 p-2 border rounded">{dataType}</div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Supported formats:</strong> CSV, Excel (.xls, .xlsx), JSON
                      </p>
                      <DaisyButton
                        variant="link"
                        size="sm"
                        onClick={downloadTemplate}
                        className="mt-2 p-0 h-auto text-blue-700"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download {dataType} template
                      </DaisyButton>
                    </div>
                  </div>
                </div>
              </DaisyCard>

              {/* File Upload */}
              <DaisyCard>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Upload Files</h3>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    {isDragActive ? (
                      <p className="text-gray-700">Drop the files here...</p>
                    ) : (
                      <>
                        <p className="text-gray-700 mb-2">
                          Drag & drop files here, or click to select
                        </p>
                        <p className="text-sm text-gray-500">
                          Support for CSV, Excel, and JSON files
                        </p>
                      </>
                    )}
                  </div>

                  {/* File List */}
                  {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {files.map((importFile, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {getFileIcon(importFile.file.name)}
                            <div>
                              <p className="text-sm font-medium">{importFile.file.name}</p>
                              <p className="text-xs text-gray-500">
                                {(importFile.file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {importFile.status !== 'pending' && (
                              <div className="text-right">
                                {importFile.recordsImported !== undefined && (
                                  <p className="text-sm font-medium">
                                    {importFile.recordsImported}/{importFile.recordsFound} records
                                  </p>
                                )}
                                {importFile.message && (
                                  <p
                                    className={`text-xs ${
                                      importFile.status === 'error'
                                        ? 'text-red-600'
                                        : 'text-green-600'
                                    }`}
                                  >
                                    {importFile.message}
                                  </p>
                                )}
                              </div>
                            )}

                            {getStatusIcon(importFile.status)}

                            {importFile.status === 'pending' && (
                              <DaisyButton
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                              >
                                <XCircle className="h-4 w-4" />
                              </DaisyButton>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Import Progress */}
                  {Boolean(importing) && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Import Progress</p>
                        <p className="text-sm text-gray-500">{Math.round(importProgress)}%</p>
                      </div>
                      <DaisyProgress value={importProgress} className="h-2" />
</div>
                  )}
                </div>
              </DaisyCard>
            </div>

            {/* Import Actions & Help */}
            <div className="space-y-6">
              {/* Actions */}
              <DaisyCard>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Import Actions</h3>
                  <div className="space-y-3">
                    <DaisyButton
                      className="w-full"
                      size="lg"
                      onClick={handleImport}
                      disabled={files.length === 0 || importing}
                    >
                      {importing ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 mr-2" />
                          Start Import
                        </>
                      )}
                    </DaisyButton>

                    <DaisyButton
                      variant="outline"
                      className="w-full"
                      onClick={() => toast({ title: 'Opening validation rules...' })}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Validation Rules
                    </DaisyButton>

                    <DaisyButton
                      variant="outline"
                      className="w-full"
                      onClick={() =>
          setFiles([])}
                      disabled={importing}
                    >
                      Clear All Files
                    
        </DaisyButton>
                  </div>
                </div>
              </DaisyCard>

              {/* Import Guidelines */}
              <DaisyCard>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Import Guidelines</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <h4 className="font-medium mb-1">File Requirements</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li>• Maximum file size: 10MB</li>
                        <li>• UTF-8 encoding required</li>
                        <li>• Headers must match template</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-1">Data Validation</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li>• Required fields must be filled</li>
                        <li>• Dates in ISO format (YYYY-MM-DD)</li>
                        <li>• Valid email addresses</li>
                        <li>• Unique identifiers preserved</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-1">Import Behavior</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li>• Duplicates are skipped</li>
                        <li>• Invalid rows are logged</li>
                        <li>• Partial imports allowed</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </DaisyCard>

              {/* Recent Imports */}
              <DaisyCard>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Imports</h3>
                  <p className="text-sm text-gray-600">No recent imports</p>
                </div>
              </DaisyCard>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
