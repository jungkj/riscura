'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function CompliancePage() {
  return (
    <ProtectedRoute>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Compliance</h1>
          <p className="text-gray-600">Framework status and compliance tracking</p>
        </div>
        
        <div className="bg-white rounded-lg border p-6">
          <p className="text-gray-600">Compliance dashboard coming soon...</p>
        </div>
      </div>
    </ProtectedRoute>
  );
} 