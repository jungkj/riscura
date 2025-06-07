'use client';

import React from 'react';
import EnterpriseDataTable, { ColumnDefinition } from './enterprise-data-table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Shield, AlertTriangle, CheckCircle, Clock, Archive, Download, Send } from 'lucide-react';

// ========== RISK DATA INTERFACE ==========
export interface RiskData {
  id: string;
  title: string;
  description: string;
  category: string;
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  impact: number;
  likelihood: number;
  riskScore: number;
  owner: {
    name: string;
    email: string;
    avatar?: string;
  };
  department: string;
  status: 'Open' | 'In Review' | 'Mitigated' | 'Accepted' | 'Closed';
  dateIdentified: string;
  lastReviewed: string;
  dueDate: string;
  controls: string[];
  inherentRisk: number;
  residualRisk: number;
  riskTrend: 'Increasing' | 'Stable' | 'Decreasing';
  tags: string[];
}

// ========== SAMPLE DATA ==========
const sampleRiskData: RiskData[] = [
  {
    id: 'RISK-001',
    title: 'Data Breach in Customer Database',
    description: 'Potential unauthorized access to customer personal data through security vulnerabilities',
    category: 'Cyber Security',
    riskLevel: 'Critical',
    impact: 5,
    likelihood: 3,
    riskScore: 15,
    owner: {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
    },
    department: 'IT Security',
    status: 'In Review',
    dateIdentified: '2024-01-15',
    lastReviewed: '2024-01-20',
    dueDate: '2024-02-15',
    controls: ['Multi-factor Authentication', 'Data Encryption', 'Access Controls'],
    inherentRisk: 20,
    residualRisk: 15,
    riskTrend: 'Decreasing',
    tags: ['GDPR', 'Critical Infrastructure'],
  },
  {
    id: 'RISK-002',
    title: 'Regulatory Compliance Gap',
    description: 'Non-compliance with updated financial regulations may result in penalties',
    category: 'Regulatory',
    riskLevel: 'High',
    impact: 4,
    likelihood: 4,
    riskScore: 16,
    owner: {
      name: 'Michael Chen',
      email: 'michael.chen@company.com',
    },
    department: 'Legal & Compliance',
    status: 'Open',
    dateIdentified: '2024-01-10',
    lastReviewed: '2024-01-18',
    dueDate: '2024-03-01',
    controls: ['Compliance Monitoring', 'Regular Audits'],
    inherentRisk: 16,
    residualRisk: 12,
    riskTrend: 'Stable',
    tags: ['SOX', 'Financial Reporting'],
  },
  {
    id: 'RISK-003',
    title: 'Supply Chain Disruption',
    description: 'Key supplier dependency creates vulnerability to business continuity',
    category: 'Operational',
    riskLevel: 'Medium',
    impact: 3,
    likelihood: 3,
    riskScore: 9,
    owner: {
      name: 'David Rodriguez',
      email: 'david.rodriguez@company.com',
    },
    department: 'Operations',
    status: 'Mitigated',
    dateIdentified: '2023-12-05',
    lastReviewed: '2024-01-12',
    dueDate: '2024-04-30',
    controls: ['Supplier Diversification', 'Contingency Planning'],
    inherentRisk: 12,
    residualRisk: 6,
    riskTrend: 'Decreasing',
    tags: ['Business Continuity', 'Third Party'],
  },
  {
    id: 'RISK-004',
    title: 'Market Volatility Impact',
    description: 'Economic uncertainties affecting revenue and investment portfolio',
    category: 'Financial',
    riskLevel: 'Medium',
    impact: 4,
    likelihood: 2,
    riskScore: 8,
    owner: {
      name: 'Emily Watson',
      email: 'emily.watson@company.com',
    },
    department: 'Finance',
    status: 'Accepted',
    dateIdentified: '2023-11-20',
    lastReviewed: '2024-01-05',
    dueDate: '2024-06-30',
    controls: ['Portfolio Diversification', 'Hedging Strategies'],
    inherentRisk: 10,
    residualRisk: 8,
    riskTrend: 'Stable',
    tags: ['Market Risk', 'Portfolio Management'],
  },
  {
    id: 'RISK-005',
    title: 'Key Personnel Departure',
    description: 'Loss of critical expertise in core business functions',
    category: 'Human Resources',
    riskLevel: 'Low',
    impact: 2,
    likelihood: 3,
    riskScore: 6,
    owner: {
      name: 'Jessica Park',
      email: 'jessica.park@company.com',
    },
    department: 'Human Resources',
    status: 'Closed',
    dateIdentified: '2023-10-15',
    lastReviewed: '2023-12-20',
    dueDate: '2024-01-31',
    controls: ['Succession Planning', 'Knowledge Documentation'],
    inherentRisk: 9,
    residualRisk: 3,
    riskTrend: 'Decreasing',
    tags: ['Talent Management', 'Knowledge Transfer'],
  },
];

// ========== CUSTOM RENDERERS ==========
const RiskLevelCell: React.FC<{ value: string }> = ({ value }) => {
  const getVariant = (level: string) => {
    switch (level) {
      case 'Critical': return 'destructive';
      case 'High': return 'destructive';
      case 'Medium': return 'outline';
      case 'Low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getIcon = (level: string) => {
    switch (level) {
      case 'Critical': return <AlertTriangle className="h-3 w-3 mr-1" />;
      case 'High': return <AlertTriangle className="h-3 w-3 mr-1" />;
      case 'Medium': return <Shield className="h-3 w-3 mr-1" />;
      case 'Low': return <CheckCircle className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };

  return (
    <Badge variant={getVariant(value) as any} className="text-xs font-medium flex items-center">
      {getIcon(value)}
      {value}
    </Badge>
  );
};

const StatusCell: React.FC<{ value: string }> = ({ value }) => {
  const getVariant = (status: string) => {
    switch (status) {
      case 'Open': return 'destructive';
      case 'In Review': return 'outline';
      case 'Mitigated': return 'secondary';
      case 'Accepted': return 'outline';
      case 'Closed': return 'secondary';
      default: return 'secondary';
    }
  };

  const getIcon = (status: string) => {
    switch (status) {
      case 'Open': return <AlertTriangle className="h-3 w-3 mr-1" />;
      case 'In Review': return <Clock className="h-3 w-3 mr-1" />;
      case 'Mitigated': return <Shield className="h-3 w-3 mr-1" />;
      case 'Accepted': return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'Closed': return <CheckCircle className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };

  return (
    <Badge variant={getVariant(value) as any} className="text-xs font-medium flex items-center">
      {getIcon(value)}
      {value}
    </Badge>
  );
};

const RiskScoreCell: React.FC<{ risk: RiskData }> = ({ risk }) => {
  const getScoreColor = (score: number) => {
    if (score >= 15) return 'text-semantic-error bg-semantic-error/10';
    if (score >= 10) return 'text-semantic-warning bg-semantic-warning/10';
    if (score >= 5) return 'text-semantic-info bg-semantic-info/10';
    return 'text-semantic-success bg-semantic-success/10';
  };

  return (
    <div className="flex items-center space-x-enterprise-2">
      <div className={`px-2 py-1 rounded text-xs font-semibold ${getScoreColor(risk.riskScore)}`}>
        {risk.riskScore}
      </div>
      <div className="text-caption text-text-tertiary">
        {risk.impact} × {risk.likelihood}
      </div>
    </div>
  );
};

const OwnerCell: React.FC<{ owner: RiskData['owner'] }> = ({ owner }) => {
  const initials = owner.name.split(' ').map(n => n[0]).join('');
  
  return (
    <div className="flex items-center space-x-enterprise-2">
      <Avatar className="w-6 h-6">
        <AvatarFallback className="text-xs bg-interactive-primary text-white">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="text-body-sm text-text-primary font-medium truncate">
          {owner.name}
        </div>
        <div className="text-caption text-text-tertiary truncate">
          {owner.email}
        </div>
      </div>
    </div>
  );
};

const TrendCell: React.FC<{ value: string }> = ({ value }) => {
  const getColor = (trend: string) => {
    switch (trend) {
      case 'Increasing': return 'text-semantic-error';
      case 'Stable': return 'text-semantic-warning';
      case 'Decreasing': return 'text-semantic-success';
      default: return 'text-text-tertiary';
    }
  };

  return (
    <span className={`text-body-sm font-medium ${getColor(value)}`}>
      {value}
    </span>
  );
};

// ========== MAIN COMPONENT ==========
export const RiskRegisterTable: React.FC = () => {
  const columns: ColumnDefinition<RiskData>[] = [
    {
      key: 'id',
      label: 'Risk ID',
      sortable: true,
      searchable: true,
      render: (value) => (
        <span className="text-body-sm font-mono text-interactive-primary">
          {value}
        </span>
      ),
    },
    {
      key: 'title',
      label: 'Risk Title',
      sortable: true,
      searchable: true,
      render: (value, row) => (
        <div className="min-w-0">
          <div className="text-body-sm text-text-primary font-medium truncate">
            {value}
          </div>
          <div className="text-caption text-text-tertiary truncate">
            {row.description}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      searchable: true,
      render: (value) => (
        <Badge variant="outline" className="text-xs border-border">
          {value}
        </Badge>
      ),
    },
    {
      key: 'riskLevel',
      label: 'Risk Level',
      type: 'status-badge',
      sortable: true,
      render: (value) => <RiskLevelCell value={value} />,
    },
    {
      key: 'riskScore',
      label: 'Risk Score',
      sortable: true,
      render: (value, row) => <RiskScoreCell risk={row} />,
    },
    {
      key: 'owner',
      label: 'Risk Owner',
      searchable: true,
      render: (value) => <OwnerCell owner={value} />,
      accessor: (row) => row.owner.name,
    },
    {
      key: 'department',
      label: 'Department',
      sortable: true,
      searchable: true,
    },
    {
      key: 'status',
      label: 'Status',
      type: 'status-badge',
      sortable: true,
      render: (value) => <StatusCell value={value} />,
    },
    {
      key: 'riskTrend',
      label: 'Trend',
      sortable: true,
      render: (value) => <TrendCell value={value} />,
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      type: 'date',
      sortable: true,
    },
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
    },
  ];

  const bulkActions = [
    {
      key: 'assign',
      label: 'Assign',
      icon: Send,
      action: (selectedRows: RiskData[]) => {
        console.log('Assigning risks:', selectedRows.map(r => r.id));
      },
    },
    {
      key: 'export',
      label: 'Export',
      icon: Download,
      action: (selectedRows: RiskData[]) => {
        console.log('Exporting risks:', selectedRows.map(r => r.id));
      },
    },
    {
      key: 'archive',
      label: 'Archive',
      icon: Archive,
      variant: 'destructive' as const,
      action: (selectedRows: RiskData[]) => {
        console.log('Archiving risks:', selectedRows.map(r => r.id));
      },
    },
  ];

  const handleRowClick = (row: RiskData) => {
    console.log('Viewing risk details:', row.id);
    // Navigate to risk details page
  };

  const handleRowSelect = (selectedRows: RiskData[]) => {
    console.log('Selected risks:', selectedRows.map(r => r.id));
  };

  return (
    <div className="space-y-enterprise-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Risk Register</h1>
          <p className="text-body-base text-text-secondary">
            Comprehensive view of organizational risks and their management status
          </p>
        </div>
        
        <div className="flex items-center space-x-enterprise-3">
          <Badge variant="outline" className="text-body-sm border-border">
            {sampleRiskData.length} total risks
          </Badge>
          <Badge variant="destructive" className="text-body-sm">
            {sampleRiskData.filter(r => r.riskLevel === 'Critical' || r.riskLevel === 'High').length} high priority
          </Badge>
        </div>
      </div>

      {/* Risk Register Table */}
      <EnterpriseDataTable
        data={sampleRiskData}
        columns={columns}
        onRowClick={handleRowClick}
        onRowSelect={handleRowSelect}
        bulkActions={bulkActions}
        className="shadow-notion-md"
      />
    </div>
  );
};

export default RiskRegisterTable; 