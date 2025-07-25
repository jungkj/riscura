'use client';

import React, { useState, useEffect } from 'react';
import { useSharePointFiles } from '@/hooks/useSharePointFiles';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyCard } from '@/components/ui/DaisyCard';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
import { 
  FileSpreadsheet, 
  Folder, 
  ChevronLeft, 
  Search, 
  Download,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface FileInfo {
  id: string;
  name: string;
  size: number;
  modifiedDate: Date;
  webUrl?: string;
  path?: string;
}

interface Props {
  integrationId: string;
  onFileSelect: (file: FileInfo) => void;
  selectedFileId?: string;
}

export const SharePointFileBrowser: React.FC<Props> = ({ 
  integrationId, 
  onFileSelect,
  selectedFileId 
}) => {
  const {
    files,
    isLoading,
    error,
    currentPath,
    listFiles,
    searchFiles,
    refresh
  } = useSharePointFiles(integrationId);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Load files when component mounts
    listFiles();
  }, [integrationId, listFiles]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      listFiles(); // Reset to list view
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
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

  if (isLoading && files.length === 0) {
    return (
      <DaisyCard className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          <span className="ml-2">Loading files...</span>
        </div>
      </DaisyCard>
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
        <DaisyButton
          onClick={handleSearch}
          disabled={isLoading}
          variant="outline"
        >
          Search
        </DaisyButton>
        <DaisyButton
          onClick={refresh}
          variant="outline"
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4" />
        </DaisyButton>
      </div>

      {/* Current Path / Search Results */}
      {isSearching && searchQuery && (
        <div className="flex items-center text-sm text-gray-600">
          <span>Search results for: "{searchQuery}"</span>
          <DaisyButton
            onClick={() => {
              setSearchQuery('');
              setIsSearching(false);
              listFiles();
            }}
            variant="link"
            size="sm"
            className="ml-2"
          >
            Clear search
          </DaisyButton>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <DaisyAlert variant="error">
          {error}
        </DaisyAlert>
      )}

      {/* File List */}
      <DaisyCard className="divide-y">
        {files.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {isSearching ? (
              <p>No Excel files found matching your search.</p>
            ) : (
              <p>No Excel files found in this location.</p>
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
                {selectedFileId === file.id && (
                  <div className="ml-4 flex-shrink-0">
                    <span className="text-sm text-blue-600 font-medium">Selected</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </DaisyCard>

      {/* Loading indicator for pagination */}
      {isLoading && files.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
        </div>
      )}
    </div>
  );
};