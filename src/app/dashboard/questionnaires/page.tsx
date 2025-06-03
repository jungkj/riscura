'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import QuestionnairesPage from '@/pages/dashboard/questionnaires/QuestionnairesPage';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Brain } from 'lucide-react';

export default function QuestionnairesPageRoute() {
  return (
    <DashboardLayout
      title="Intelligent Questionnaires"
      subtitle="AI-powered risk assessments and compliance audits"
      actions={
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Brain className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Questionnaire
          </Button>
        </div>
      }
    >
      <QuestionnairesPage />
    </DashboardLayout>
  );
} 