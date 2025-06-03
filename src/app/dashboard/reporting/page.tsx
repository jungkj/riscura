'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import ReportingPage from '@/pages/dashboard/reporting/ReportingPage';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Download } from 'lucide-react';

export default function ReportingPageRoute() {
  return (
    <DashboardLayout
      title="Advanced Reporting"
      subtitle="AI-powered analytics and report generation"
      actions={
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Report
          </Button>
        </div>
      }
    >
      <ReportingPage />
    </DashboardLayout>
  );
} 