'use client';

import { EnhancedRiskRegistry } from '@/pages/risks/EnhancedRiskRegistry';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function RisksPage() {
  return (
    <ProtectedRoute>
      <EnhancedRiskRegistry />
    </ProtectedRoute>
  );
} 