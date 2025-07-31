import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface UseGoogleDriveIntegrationReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<boolean>;
  checkConnection: () => Promise<void>;
}

export const useGoogleDriveIntegration = (): UseGoogleDriveIntegrationReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is connected
  const checkConnection = useCallback(async () => {
    try {
      // Try to list files to check if authenticated
      const response = await api.post('/api/google-drive/files', {});
      const data = await response.json();

      setIsConnected(!data.error || data.code !== 'AUTH_REQUIRED');
    } catch (err) {
      setIsConnected(false);
    }
  }, []);

  // Connect to Google Drive
  const connect = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);

      const response = await api.get('/api/google-drive/auth');
      const data = await response.json();

      if (data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      console.error('Error connecting to Google Drive:', err);
      setError('Failed to connect to Google Drive');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect from Google Drive
  const disconnect = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);

      const response = await api.delete('/api/google-drive/auth');
      const data = await response.json();

      if (data.message) {
        setIsConnected(false);
        return true;
      } else if (data.error) {
        setError(data.error);
        return false;
      }

      return false;
    } catch (err) {
      console.error('Error disconnecting from Google Drive:', err);
      setError('Failed to disconnect from Google Drive');
      return false;
    }
  }, []);

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    checkConnection,
  };
};
