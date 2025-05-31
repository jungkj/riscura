'use client';

import QuestionnairePage from '@/pages/questionnaires/QuestionnairePage';
import MainLayout from '@/layouts/MainLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function QuestionnairesPageRoute() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <QuestionnairePage />
      </MainLayout>
    </ProtectedRoute>
  );
} 