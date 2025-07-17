'use client';

import React, { useState, useEffect } from 'react';
import { useGoogleDriveFiles } from '@/hooks/useGoogleDriveFiles';
import { useGoogleDriveIntegration } from '@/hooks/useGoogleDriveIntegration';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { 
  FileSpreadsheet, 
  Search, 
  Loader2,
  RefreshCw,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

interface GoogleDriveFile {
  id: string;
  name: string;
  size: number;
  modifiedDate: string;
  webViewLink?: string;
}

interface Props {
  onFileSelect: (file: GoogleDriveFile) => void;
  selectedFileId?: string;
}

export const GoogleDriveFileBrowser: React.FC<Props> = ({ 
  onFileSelect,
  selectedFileId 
}) => {
  const {
    files,
    isLoading,
    error,
    authRequired,
    listFiles,
    searchFiles,
    refresh
  } = useGoogleDriveFiles();

  const {
    isConnected,
    connect,
    checkConnection
  } = useGoogleDriveIntegration();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Check connection and load files when component mounts
    checkConnection().then(() => {
      if (!authRequired) {
        listFiles();
      }
    });
  }, [checkConnection, authRequired, listFiles]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      listFiles();
      return;
    }
    await searchFiles(searchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Show auth required state
  if (authRequired || !isConnected) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
          <h3 className="text-lg font-semibold">Connect Google Drive</h3>
          <p className="text-gray-600">
            Connect your Google Drive account to import Excel files
          </p>
          <Button
            onClick={connect}
            className="mx-auto"
          >
            Connect Google Drive
          </Button>
        </div>
      </Card>
    );
  }

  if (isLoading && files.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          <span className="ml-2">Loading files...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search for Excel files..."
            className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={isLoading}
          variant="outline"
        >
          Search
        </Button>
        <Button
          onClick={refresh}
          variant="outline"
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* File List */}
      <Card className="divide-y">
        {files.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchQuery ? (
              <p>No Excel files found matching your search.</p>
            ) : (
              <p>No Excel files found in your Google Drive.</p>
            )}
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedFileId === file.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
              onClick={() => onFileSelect(file)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0">
                  <FileSpreadsheet className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.size)} • Modified {new Date(file.modifiedDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="ml-4 flex items-center gap-2">
                  {file.webViewLink && (
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  {selectedFileId === file.id && (
                    <span className="text-sm text-blue-600 font-medium">Selected</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </Card>

      {/* Loading indicator for pagination */}
      {isLoading && files.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
        </div>
      )}
    </div>
  );
};