import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface SharePointIntegration {
  id: string;
  displayName: string;
  siteId: string;
  driveId?: string;
  isActive: boolean;
  lastSyncedAt?: Date;
  createdAt: Date;
  webUrl?: string;
}

interface UseSharePointIntegrationReturn {
  integrations: SharePointIntegration[];
  isLoading: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: (siteUrl: string) => Promise<{ success: boolean; integration?: SharePointIntegration; error?: string }>;
  disconnect: (integrationId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export const useSharePointIntegration = (): UseSharePointIntegrationReturn => {
  const [integrations, setIntegrations] = useState<SharePointIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch integrations
  const fetchIntegrations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get('/api/sharepoint/connect');
      const data = await response.json();
      
      if (data.integrations) {
        setIntegrations(data.integrations.map((integration: any) => ({
          ...integration,
          lastSyncedAt: integration.lastSyncedAt ? new Date(integration.lastSyncedAt) : undefined,
          createdAt: new Date(integration.createdAt)
        })));
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      console.error('Error fetching integrations:', err);
      setError('Failed to load SharePoint connections');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Connect to SharePoint
  const connect = useCallback(async (siteUrl: string): Promise<{ 
    success: boolean; 
    integration?: SharePointIntegration; 
    error?: string 
  }> => {
    try {
      setIsConnecting(true);
      setError(null);
      
      const response = await api.post('/api/sharepoint/connect', {
        siteUrl
      });
      
      const data = await response.json();
      
      if (data.integration) {
        const newIntegration: SharePointIntegration = {
          ...data.integration,
          lastSyncedAt: data.integration.lastSyncedAt ? new Date(data.integration.lastSyncedAt) : undefined,
          createdAt: data.integration.createdAt ? new Date(data.integration.createdAt) : new Date()
        };
        
        // Update integrations list
        setIntegrations(prev => {
          const existing = prev.find(i => i.id === newIntegration.id);
          if (existing) {
            return prev.map(i => i.id === newIntegration.id ? newIntegration : i);
          }
          return [...prev, newIntegration];
        });
        
        return { success: true, integration: newIntegration };
      } else if (data.error) {
        setError(data.error);
        return { success: false, error: data.error };
      }
      
      return { success: false, error: 'Unknown error occurred' };
    } catch (err) {
      console.error('Error connecting to SharePoint:', err);
      const errorMessage = 'Failed to connect to SharePoint';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect from SharePoint
  const disconnect = useCallback(async (integrationId: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await api.delete(`/api/sharepoint/connect?integrationId=${integrationId}`);
      const data = await response.json();
      
      if (data.message) {
        // Remove from integrations list
        setIntegrations(prev => prev.filter(i => i.id !== integrationId));
        return true;
      } else if (data.error) {
        setError(data.error);
        return false;
      }
      
      return false;
    } catch (err) {
      console.error('Error disconnecting from SharePoint:', err);
      setError('Failed to disconnect from SharePoint');
      return false;
    }
  }, []);

  // Refresh integrations
  const refresh = useCallback(async () => {
    await fetchIntegrations();
  }, [fetchIntegrations]);

  // Load integrations on mount
  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  return {
    integrations,
    isLoading,
    isConnecting,
    error,
    connect,
    disconnect,
    refresh
  };
};