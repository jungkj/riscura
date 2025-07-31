'use client';

import React from 'react';
import { MainContentArea } from '@/components/layout/MainContentArea';
import { VantaDataTable, DataTableColumn } from './VantaDataTable';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { Plus, Download, Settings } from 'lucide-react';

// Sample Risk Data
interface RiskRecord {
  id: string;
  title: string;
  category: string;
  status: 'open' | 'mitigated' | 'closed' | 'monitoring';
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  owner: {
    name: string;
    email: string;
  };
  progress: number;
  dueDate: Date;
}

const sampleRiskData: RiskRecord[] = [
  {
    id: 'RSK-001',
    title: 'Data breach through third-party vendor',
    category: 'Data Security',
    status: 'open',
    riskLevel: 'critical',
    owner: {
      name: 'Sarah Chen',
      email: 'sarah.chen@company.com',
    },
    progress: 25,
    dueDate: new Date('2024-02-15'),
  },
  {
    id: 'RSK-002',
    title: 'Unauthorized access to financial systems',
    category: 'Access Control',
    status: 'mitigated',
    riskLevel: 'high',
    owner: {
      name: 'Michael Rodriguez',
      email: 'michael.rodriguez@company.com',
    },
    progress: 85,
    dueDate: new Date('2024-01-30'),
  },
  {
    id: 'RSK-003',
    title: 'Compliance violation in data retention',
    category: 'Compliance',
    status: 'monitoring',
    riskLevel: 'medium',
    owner: {
      name: 'Emma Johnson',
      email: 'emma.johnson@company.com',
    },
    progress: 60,
    dueDate: new Date('2024-03-01'),
  },
  {
    id: 'RSK-004',
    title: 'Phishing attack targeting executives',
    category: 'Email Security',
    status: 'open',
    riskLevel: 'high',
    owner: {
      name: 'David Park',
      email: 'david.park@company.com',
    },
    progress: 10,
    dueDate: new Date('2024-02-01'),
  },
  {
    id: 'RSK-005',
    title: 'Legacy system vulnerability',
    category: 'Infrastructure',
    status: 'closed',
    riskLevel: 'low',
    owner: {
      name: 'Lisa Wang',
      email: 'lisa.wang@company.com',
    },
    progress: 100,
    dueDate: new Date('2024-01-25'),
  },
];

// Risk Register Table Example
export const RiskRegisterTable: React.FC = () => {
  const columns: DataTableColumn<RiskRecord>[] = [
    {
      key: 'id',
      title: 'Risk ID',
      type: 'text',
      sortable: true,
      width: '32',
    },
    {
      key: 'title',
      title: 'Risk Title',
      type: 'text',
      sortable: true,
    },
    {
      key: 'category',
      title: 'Category',
      type: 'text',
      sortable: true,
      filterable: true,
      filterOptions: [
        { label: 'Data Security', value: 'Data Security' },
        { label: 'Access Control', value: 'Access Control' },
        { label: 'Compliance', value: 'Compliance' },
        { label: 'Email Security', value: 'Email Security' },
        { label: 'Infrastructure', value: 'Infrastructure' },
      ],
    },
    {
      key: 'status',
      title: 'Status',
      type: 'status',
      sortable: true,
      filterable: true,
      filterOptions: [
        { label: 'Open', value: 'open' },
        { label: 'Mitigated', value: 'mitigated' },
        { label: 'Closed', value: 'closed' },
        { label: 'Monitoring', value: 'monitoring' },
      ],
    },
    {
      key: 'riskLevel',
      title: 'Risk Level',
      type: 'risk',
      sortable: true,
      filterable: true,
      filterOptions: [
        { label: 'Critical', value: 'critical' },
        { label: 'High', value: 'high' },
        { label: 'Medium', value: 'medium' },
        { label: 'Low', value: 'low' },
      ],
    },
    {
      key: 'owner',
      title: 'Owner',
      type: 'user',
      sortable: false,
    },
    {
      key: 'progress',
      title: 'Progress',
      type: 'progress',
      sortable: true,
      align: 'center',
    },
    {
      key: 'dueDate',
      title: 'Due Date',
      type: 'date',
      sortable: true,
    },
    {
      key: 'actions',
      title: 'Actions',
      type: 'actions',
      align: 'center',
      width: '20',
    },
  ];

  const handleRowAction = (action: string, row: RiskRecord) => {
    console.log(`Action: ${action}`, row);
  };

  const handleBulkAction = (action: string, rows: RiskRecord[]) => {
    console.log(`Bulk action: ${action}`, rows);
  };

  return (
    <MainContentArea
      title="Risk Register"
      subtitle="Comprehensive list of organizational risks and their mitigation status"
      breadcrumbs={[
        { label: 'Risk Management', href: '/dashboard/risks' },
        { label: 'Risk Register', current: true },
      ]}
      primaryAction={{
        label: 'Add Risk',
        onClick: () => console.log('Add risk'),
        icon: Plus,
      }}
      secondaryActions={[
        {
          label: 'Export',
          onClick: () => console.log('Export'),
          icon: Download,
          variant: 'outline',
        },
        {
          label: 'Settings',
          onClick: () => console.log('Settings'),
          icon: Settings,
          variant: 'outline',
        },
      ]}
      stats={[
        {
          label: 'total risks',
          value: sampleRiskData.length,
          variant: 'default',
        },
        {
          label: 'open risks',
          value: sampleRiskData.filter((r) => r.status === 'open').length,
          variant: 'destructive',
        },
        {
          label: 'mitigated',
          value: sampleRiskData.filter((r) => r.status === 'mitigated').length,
          variant: 'success',
        },
      ]}
      maxWidth="2xl"
    >
      <VantaDataTable
        columns={columns}
        data={sampleRiskData}
        onRowAction={handleRowAction}
        onBulkAction={handleBulkAction}
      />
    </MainContentArea>
  );
};

// Controls Table Example
interface ControlRecord {
  id: string;
  name: string;
  framework: string;
  status: 'implemented' | 'testing' | 'failed' | 'not-implemented';
  effectiveness: number;
  lastTested: Date;
  owner: {
    name: string;
    email: string;
  };
}

const sampleControlData: ControlRecord[] = [
  {
    id: 'CTL-001',
    name: 'Multi-Factor Authentication',
    framework: 'SOC 2',
    status: 'implemented',
    effectiveness: 95,
    lastTested: new Date('2024-01-10'),
    owner: {
      name: 'Alex Kim',
      email: 'alex.kim@company.com',
    },
  },
  {
    id: 'CTL-002',
    name: 'Data Encryption at Rest',
    framework: 'ISO 27001',
    status: 'testing',
    effectiveness: 87,
    lastTested: new Date('2024-01-08'),
    owner: {
      name: 'Maria Santos',
      email: 'maria.santos@company.com',
    },
  },
  {
    id: 'CTL-003',
    name: 'Access Review Process',
    framework: 'NIST',
    status: 'failed',
    effectiveness: 62,
    lastTested: new Date('2024-01-05'),
    owner: {
      name: 'John Smith',
      email: 'john.smith@company.com',
    },
  },
];

export const ControlsTable: React.FC = () => {
  const columns: DataTableColumn<ControlRecord>[] = [
    {
      key: 'id',
      title: 'Control ID',
      type: 'text',
      sortable: true,
    },
    {
      key: 'name',
      title: 'Control Name',
      type: 'text',
      sortable: true,
    },
    {
      key: 'framework',
      title: 'Framework',
      type: 'text',
      sortable: true,
      filterable: true,
      filterOptions: [
        { label: 'SOC 2', value: 'SOC 2' },
        { label: 'ISO 27001', value: 'ISO 27001' },
        { label: 'NIST', value: 'NIST' },
        { label: 'GDPR', value: 'GDPR' },
      ],
    },
    {
      key: 'status',
      title: 'Status',
      type: 'status',
      sortable: true,
      filterable: true,
      filterOptions: [
        { label: 'Implemented', value: 'implemented' },
        { label: 'Testing', value: 'testing' },
        { label: 'Failed', value: 'failed' },
        { label: 'Not Implemented', value: 'not-implemented' },
      ],
    },
    {
      key: 'effectiveness',
      title: 'Effectiveness',
      type: 'progress',
      sortable: true,
      align: 'center',
    },
    {
      key: 'owner',
      title: 'Owner',
      type: 'user',
      sortable: false,
    },
    {
      key: 'lastTested',
      title: 'Last Tested',
      type: 'date',
      sortable: true,
    },
    {
      key: 'actions',
      title: 'Actions',
      type: 'actions',
      align: 'center',
    },
  ];

  return (
    <MainContentArea
      title="Security Controls"
      subtitle="Monitor and manage security control implementation and effectiveness"
      breadcrumbs={[
        { label: 'Controls', href: '/dashboard/controls' },
        { label: 'All Controls', current: true },
      ]}
      primaryAction={{
        label: 'Add Control',
        onClick: () => console.log('Add control'),
        icon: Plus,
      }}
      maxWidth="2xl"
    >
      <VantaDataTable
        columns={columns}
        data={sampleControlData}
        onRowAction={(action, row) => console.log(action, row)}
        onBulkAction={(action, rows) => console.log(action, rows)}
      />
    </MainContentArea>
  );
};

export default { RiskRegisterTable, ControlsTable };
