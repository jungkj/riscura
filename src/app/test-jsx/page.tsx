import React from 'react';

export default function TestJSXPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">JSX Parsing Test</h1>
        <p className="text-gray-600 mb-4">
          This page tests if the infrastructure fix resolved the SWC JSX parsing issues.
        </p>
        <div className="space-y-2">
          <TestComponent title="Test 1" />
          <TestComponent title="Test 2" />
        </div>
      </div>
    </div>
  );
}

const TestComponent = ({ title }: { title: string }) => {
  return (
    <div className="p-3 bg-blue-50 rounded">
      <span className="font-medium">{title}</span>
    </div>
  );
};
