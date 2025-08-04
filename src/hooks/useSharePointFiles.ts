import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface FileInfo {
  id: string;
  name: string;
  size: number;
  modifiedDate: Date;
  webUrl?: string;
  path?: string;
}

interface UseSharePointFilesReturn {
  files: FileInfo[];
  isLoading: boolean;
  error: string | null;
  currentPath: string;
  listFiles: (path?: string) => Promise<void>;
  searchFiles: (_query: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useSharePointFiles = (integrationId: string): UseSharePointFilesReturn => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [lastPath, setLastPath] = useState<string>('/');

  // List files in a path
  const listFiles = useCallback(
    async (path: string = '/') => {
      if (!integrationId) return;

      try {
        setIsLoading(true);
        setError(null);
        setCurrentPath(path);
        setLastPath(path);

        const response = await api.post('/api/sharepoint/files', {
          integrationId,
          path: path === '/' ? undefined : path,
        });

        const data = await response.json();

        if (data.files) {
          setFiles(
            data.files.map((_file: any) => ({
              ...file,
              modifiedDate: new Date(file.modifiedDate),
            }))
          );
        } else if (data.error) {
          setError(data.error);
          setFiles([]);
        }
      } catch (err) {
        // console.error('Error listing files:', err)
        setError('Failed to load files from SharePoint');
        setFiles([]);
      } finally {
        setIsLoading(false);
      }
    },
    [integrationId]
  );

  // Search for files
  const searchFiles = useCallback(
    async (_query: string) => {
      if (!integrationId || !query.trim()) return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await api.put('/api/sharepoint/files', {
          integrationId,
          query,
          fileTypes: ['xlsx', 'xls'],
        });

        const data = await response.json();

        if (data.files) {
          setFiles(
            data.files.map((_file: any) => ({
              ...file,
              modifiedDate: new Date(file.modifiedDate),
            }))
          );
        } else if (data.error) {
          setError(data.error);
          setFiles([]);
        }
      } catch (err) {
        // console.error('Error searching files:', err)
        setError('Failed to search files in SharePoint');
        setFiles([]);
      } finally {
        setIsLoading(false);
      }
    },
    [integrationId]
  );

  // Refresh current view
  const refresh = useCallback(async () => {
    await listFiles(lastPath);
  }, [listFiles, lastPath]);

  return {
    files,
    isLoading,
    error,
    currentPath,
    listFiles,
    searchFiles,
    refresh,
  };
};
