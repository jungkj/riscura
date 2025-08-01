'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import dynamic from 'next/dynamic';

const QuestionnairesPage = dynamic(
  () => import('@/pages/dashboard/questionnaires/QuestionnairesPage'),
  {
    ssr: false,
    loading: () => <div>Loading questionnaires...</div>,
  }
);

export default function QuestionnairesPageRoute() {
  return (
    <ProtectedRoute>
      <QuestionnairesPage />
    </ProtectedRoute>
  );
}
