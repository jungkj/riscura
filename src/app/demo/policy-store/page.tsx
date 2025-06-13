'use client';

import React from 'react';
import PolicyImporterWithStore from '@/components/PolicyImporterWithStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRcsaEntries, usePolicyExtraction, useUploadStates } from '@/lib/stores/importStore';

export default function PolicyStoreDemoPage() {
  const rcsaEntries = useRcsaEntries();
  const policyExtraction = usePolicyExtraction();
  const uploadStates = useUploadStates();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Policy Importer with State Management
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Demonstration of AI-powered policy analysis with Zustand store integration
          </p>
        </div>

        {/* Store State Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">RCSA Entries</CardTitle>
              <CardDescription>Imported risk entries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Count:</span>
                  <Badge variant={rcsaEntries.length > 0 ? "default" : "secondary"}>
                    {rcsaEntries.length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Upload Status:</span>
                  <Badge variant={
                    uploadStates.rcsa.loading ? "secondary" :
                    uploadStates.rcsa.error ? "destructive" :
                    uploadStates.rcsa.success ? "default" : "outline"
                  }>
                    {uploadStates.rcsa.loading ? "Loading" :
                     uploadStates.rcsa.error ? "Error" :
                     uploadStates.rcsa.success ? "Success" : "Ready"}
                  </Badge>
                </div>
                {uploadStates.rcsa.error && (
                  <p className="text-sm text-red-600 mt-2">{uploadStates.rcsa.error}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Policy Extraction</CardTitle>
              <CardDescription>AI-analyzed content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Risks:</span>
                  <Badge variant={policyExtraction?.risks.length ? "destructive" : "secondary"}>
                    {policyExtraction?.risks.length || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Controls:</span>
                  <Badge variant={policyExtraction?.controls.length ? "default" : "secondary"}>
                    {policyExtraction?.controls.length || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Upload Status:</span>
                  <Badge variant={
                    uploadStates.policy.loading ? "secondary" :
                    uploadStates.policy.error ? "destructive" :
                    uploadStates.policy.success ? "default" : "outline"
                  }>
                    {uploadStates.policy.loading ? "Loading" :
                     uploadStates.policy.error ? "Error" :
                     uploadStates.policy.success ? "Success" : "Ready"}
                  </Badge>
                </div>
                {uploadStates.policy.error && (
                  <p className="text-sm text-red-600 mt-2">{uploadStates.policy.error}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Store Actions</CardTitle>
              <CardDescription>Available operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>addRcsaEntries()</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>setPolicyExtraction()</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>clearImports()</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>uploadRcsaFile()</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>uploadPolicyFile()</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Component */}
        <PolicyImporterWithStore
          onComplete={(extraction) => {
            console.log('Policy analysis complete:', extraction);
          }}
        />

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Zustand Store Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  Centralized state management
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  Async actions with loading states
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  Optimized re-renders with selectors
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  DevTools integration
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  Type-safe actions and state
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Usage Example</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
{`// In your component
import { usePolicyUpload } from '@/lib/stores/importStore';

const { uploadFile, loading, error } = usePolicyUpload();

// Upload a file
await uploadFile(selectedFile);

// Access results
const extraction = usePolicyExtraction();`}
              </pre>
            </CardContent>
          </Card>
        </div>

        {/* Raw State Debug */}
        {process.env.NODE_ENV === 'development' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Debug: Raw Store State</CardTitle>
              <CardDescription>Development only - Raw Zustand state</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify({
                  rcsaEntries,
                  policyExtraction,  
                  uploadStates
                }, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 