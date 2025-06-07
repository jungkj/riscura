'use client';

import QuestionnairesPage from '@/pages/dashboard/questionnaires/QuestionnairesPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function QuestionnairesPageRoute() {
  return (
    <ProtectedRoute>
      <QuestionnairesPage />
    </ProtectedRoute>
  );
} 