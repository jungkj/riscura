'use client';

import EnhancedControlRegistry from '@/pages/controls/EnhancedControlRegistry';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function ControlsPage() {
  return (
    <ProtectedRoute>
      <EnhancedControlRegistry />
    </ProtectedRoute>
  );
}
