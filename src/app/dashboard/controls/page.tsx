'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Temporarily import the component dynamically to avoid build issues
import dynamic from 'next/dynamic';

const EnhancedControlRegistry = dynamic(() => import('@/pages/controls/EnhancedControlRegistry'), {
  ssr: false,
  loading: () => <div>Loading controls...</div>,
});

export default function ControlsPage() {
  return (
    <ProtectedRoute>
      <EnhancedControlRegistry />
    </ProtectedRoute>
  );
}
