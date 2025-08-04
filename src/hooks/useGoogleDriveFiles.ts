import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface GoogleDriveFile {
  id: string;
  name: string;
  size: number;
  modifiedDate: string;
  mimeType: string;
  webViewLink?: string;
}

interface UseGoogleDriveFilesReturn {
  files: GoogleDriveFile[];
  isLoading: boolean;
  error: string | null;
  authRequired: boolean;
  listFiles: (folderId?: string) => Promise<void>;
  searchFiles: (_query: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useGoogleDriveFiles = (): UseGoogleDriveFilesReturn => {
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [lastFolderId, setLastFolderId] = useState<string | undefined>();

  // List files in a folder
  const listFiles = useCallback(async (folderId?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setAuthRequired(false);
      setLastFolderId(folderId);

      const response = await api.post('/api/google-drive/files', {
        folderId,
      });

      const data = await response.json();

      if (data.files) {
        setFiles(data.files);
      } else if (data.code === 'AUTH_REQUIRED') {
        setAuthRequired(true);
        setFiles([]);
      } else if (data.error) {
        setError(data.error);
        setFiles([]);
      }
    } catch (err) {
      // console.error('Error listing Google Drive files:', err)
      setError('Failed to load files from Google Drive');
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search for files
  const searchFiles = useCallback(
    async (_query: string) => {
      if (!query.trim()) {
        listFiles(lastFolderId);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        setAuthRequired(false);

        const response = await api.put('/api/google-drive/files', {
          query,
        });

        const data = await response.json();

        if (data.files) {
          setFiles(data.files);
        } else if (data.code === 'AUTH_REQUIRED') {
          setAuthRequired(true);
          setFiles([]);
        } else if (data.error) {
          setError(data.error);
          setFiles([]);
        }
      } catch (err) {
        // console.error('Error searching Google Drive files:', err)
        setError('Failed to search files in Google Drive');
        setFiles([]);
      } finally {
        setIsLoading(false);
      }
    },
    [lastFolderId, listFiles]
  );

  // Refresh current view
  const refresh = useCallback(async () => {
    await listFiles(lastFolderId);
  }, [listFiles, lastFolderId]);

  return {
    files,
    isLoading,
    error,
    authRequired,
    listFiles,
    searchFiles,
    refresh,
  };
};
