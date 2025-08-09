'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ComplianceDashboard from '@/components/compliance/ComplianceDashboard';

export default function CompliancePage() {
  return (
    <ProtectedRoute>
      <div className="p-6">
        <ComplianceDashboard />
      </div>
    </ProtectedRoute>
  );
} 