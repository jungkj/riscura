'use client';

import React from 'react';
import RcsaImporter from '@/components/RcsaImporter';

export default function RcsaImporterDemo() {
  const handleImportComplete = (result: any) => {
    console.log('Import completed:', result);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            RCSA File Importer Demo
          </h1>
          <p className="text-lg text-gray-600">
            Drag and drop Excel files to import Risk and Control data
          </p>
        </div>

        <RcsaImporter 
          onImportComplete={handleImportComplete}
          className="mb-8"
        />

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            How to Use
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                📁 File Requirements
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Excel format (.xlsx or .xls)</li>
                <li>• Maximum size: 10MB</li>
                <li>• First worksheet will be processed</li>
                <li>• Headers in first 5 rows</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                📋 Expected Columns
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Risk ID (or Risk Identifier)</li>
                <li>• Risk Description (or Risk Desc)</li>
                <li>• Control ID (or Control Identifier)</li>
                <li>• Control Description (or Control Desc)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 