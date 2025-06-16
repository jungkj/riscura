'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function ActivityPage() {
  return (
    <ProtectedRoute>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Recent Activity</h1>
          <p className="text-gray-600">Latest updates and changes</p>
        </div>
        
        <div className="bg-white rounded-lg border p-6">
          <p className="text-gray-600">Activity feed coming soon...</p>
        </div>
      </div>
    </ProtectedRoute>
  );
} 