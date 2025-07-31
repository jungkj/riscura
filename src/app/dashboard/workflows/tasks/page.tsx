'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function TasksPage() {
  return (
    <ProtectedRoute>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">Workflow tasks and assignments</p>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <p className="text-gray-600">Task management coming soon...</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
