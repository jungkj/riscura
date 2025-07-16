'use client';

import React, { useState, useEffect } from 'react';
import { useSharePointIntegration } from '@/hooks/useSharePointIntegration';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Loader2, Link, Unlink, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

export const SharePointIntegration: React.FC = () => {
  const {
    integrations,
    isLoading,
    isConnecting,
    error,
    connect,
    disconnect,
    refresh
  } = useSharePointIntegration();

  const [siteUrl, setSiteUrl] = useState('');
  const [showConnectForm, setShowConnectForm] = useState(false);

  const handleConnect = async () => {
    if (!siteUrl.trim()) {
      return;
    }

    const result = await connect(siteUrl);
    if (result.success) {
      setSiteUrl('');
      setShowConnectForm(false);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    if (window.confirm('Are you sure you want to disconnect this SharePoint site?')) {
      await disconnect(integrationId);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          <span className="ml-2">Loading SharePoint connections...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">SharePoint Integration</h3>
            <p className="text-sm text-gray-600 mt-1">
              Connect your SharePoint sites to import RCSA Excel files
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={refresh}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {!showConnectForm && (
              <Button
                onClick={() => setShowConnectForm(true)}
                size="sm"
              >
                <Link className="h-4 w-4 mr-2" />
                Connect Site
              </Button>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {showConnectForm && (
          <div className="border rounded-lg p-4 mb-4 bg-gray-50">
            <h4 className="font-medium mb-3">Connect SharePoint Site</h4>
            <div className="space-y-3">
              <div>
                <label htmlFor="siteUrl" className="block text-sm font-medium mb-1">
                  SharePoint Site URL
                </label>
                <input
                  id="siteUrl"
                  type="url"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  placeholder="https://yourcompany.sharepoint.com/sites/yoursite"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isConnecting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the full URL of your SharePoint site
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleConnect}
                  disabled={!siteUrl.trim() || isConnecting}
                  size="sm"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Connect
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowConnectForm(false);
                    setSiteUrl('');
                  }}
                  variant="outline"
                  size="sm"
                  disabled={isConnecting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {integrations.length === 0 && !showConnectForm ? (
          <div className="text-center py-8 text-gray-500">
            <p>No SharePoint sites connected yet.</p>
            <p className="text-sm mt-1">Connect a site to start importing Excel files.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-medium">{integration.displayName}</h4>
                  <p className="text-sm text-gray-600">
                    Site ID: {integration.siteId}
                  </p>
                  {integration.lastSyncedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Last accessed: {new Date(integration.lastSyncedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    integration.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {integration.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <Button
                    onClick={() => handleDisconnect(integration.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Unlink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              SharePoint Integration Requirements
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Azure AD app registration with Sites.Read.All permission</li>
                <li>Admin consent granted for the application</li>
                <li>Access to the SharePoint site you want to connect</li>
                <li>Excel files must be in .xlsx or .xls format</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};