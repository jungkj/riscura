'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { MainContentArea, ContentSection, ContentCard } from '@/components/layout/MainContentArea';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SecuritySettingsModal } from './SecuritySettingsModal';
import ExportService from '@/services/ExportService';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Eye,
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  Settings,
  Download,
  RefreshCw,
  MoreHorizontal,
  Target,
  Zap,
} from 'lucide-react';

// ========== TYPES ==========
interface SecurityMetric {
  id: string;
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  status: 'critical' | 'warning' | 'good' | 'excellent';
  description?: string;
  icon: React.ElementType;
}

interface ThreatAlert {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  timestamp: Date;
  status: 'active' | 'investigating' | 'resolved';
  source: string;
  description: string;
}

interface ComplianceFramework {
  id: string;
  name: string;
  shortName: string;
  compliance: number;
  status: 'compliant' | 'partial' | 'non-compliant';
  controls: {
    total: number;
    implemented: number;
    tested: number;
    exceptions: number;
  };
  lastAssessment: Date;
  nextAssessment: Date;
  proboIntegrated?: boolean;
  proboControlsAvailable?: number;
}

// ========== SAMPLE DATA ==========
const securityMetrics: SecurityMetric[] = [
  {
    id: 'security-score',
    label: 'Security Score',
    value: 94,
    trend: 'up',
    trendValue: '2.1%',
    status: 'excellent',
    icon: Shield,
  },
  {
    id: 'threat-level',
    label: 'Current Threat Level',
    value: 'Medium',
    status: 'warning',
    icon: AlertTriangle,
  },
  {
    id: 'active-incidents',
    label: 'Active Incidents',
    value: 3,
    trend: 'down',
    trendValue: '40%',
    status: 'good',
    icon: Activity,
  },
  {
    id: 'compliance-score',
    label: 'Compliance Score',
    value: '96.2%',
    trend: 'up',
    trendValue: '1.5%',
    status: 'excellent',
    icon: CheckCircle,
  },
  {
    id: 'vulnerabilities',
    label: 'Critical Vulnerabilities',
    value: 2,
    trend: 'down',
    trendValue: '60%',
    status: 'good',
    icon: Zap,
  },
  {
    id: 'user-activity',
    label: 'Anomalous User Activity',
    value: 8,
    trend: 'stable',
    status: 'warning',
    icon: Users,
  }
];

const threatAlerts: ThreatAlert[] = [
  {
    id: 'alert-001',
    title: 'Suspicious login attempts detected',
    severity: 'high',
    category: 'Authentication',
    timestamp: new Date('2024-01-15T10:30:00'),
    status: 'investigating',
    source: 'SIEM',
    description: 'Multiple failed login attempts from unusual geographic locations'
  },
  {
    id: 'alert-002',
    title: 'Unusual data access pattern',
    severity: 'medium',
    category: 'Data Access',
    timestamp: new Date('2024-01-15T09:15:00'),
    status: 'active',
    source: 'DLP',
    description: 'User accessing large volumes of sensitive data outside normal hours'
  },
  {
    id: 'alert-003',
    title: 'Potential malware detected',
    severity: 'critical',
    category: 'Endpoint Security',
    timestamp: new Date('2024-01-15T08:45:00'),
    status: 'resolved',
    source: 'EDR',
    description: 'Malicious file detected and quarantined on endpoint device'
  }
];

const complianceFrameworks: ComplianceFramework[] = [
  {
    id: 'soc2',
    name: 'SOC 2 Type II',
    shortName: 'SOC 2',
    compliance: 96,
    status: 'compliant',
    controls: { total: 67, implemented: 65, tested: 62, exceptions: 2 },
    lastAssessment: new Date('2024-01-01'),
    nextAssessment: new Date('2024-07-01'),
    proboIntegrated: true,
    proboControlsAvailable: 180
  },
  {
    id: 'iso27001',
    name: 'ISO 27001:2022',
    shortName: 'ISO 27001',
    compliance: 89,
    status: 'partial',
    controls: { total: 93, implemented: 85, tested: 78, exceptions: 8 },
    lastAssessment: new Date('2023-12-15'),
    nextAssessment: new Date('2024-06-15'),
    proboIntegrated: true,
    proboControlsAvailable: 220
  },
  {
    id: 'gdpr',
    name: 'General Data Protection Regulation',
    shortName: 'GDPR',
    compliance: 98,
    status: 'compliant',
    controls: { total: 42, implemented: 42, tested: 40, exceptions: 0 },
    lastAssessment: new Date('2024-01-10'),
    nextAssessment: new Date('2024-04-10'),
    proboIntegrated: false,
    proboControlsAvailable: 0
  },
  {
    id: 'nist',
    name: 'NIST Cybersecurity Framework',
    shortName: 'NIST CSF',
    compliance: 92,
    status: 'compliant',
    controls: { total: 108, implemented: 102, tested: 95, exceptions: 6 },
    lastAssessment: new Date('2023-12-01'),
    nextAssessment: new Date('2024-03-01'),
    proboIntegrated: true,
    proboControlsAvailable: 251
  }
];

// ========== SECURITY METRICS OVERVIEW ==========
const SecurityMetricsOverview: React.FC = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-semantic-success border-semantic-success/20 bg-semantic-success/5';
      case 'good': return 'text-semantic-success border-semantic-success/20 bg-semantic-success/5';
      case 'warning': return 'text-semantic-warning border-semantic-warning/20 bg-semantic-warning/5';
      case 'critical': return 'text-semantic-error border-semantic-error/20 bg-semantic-error/5';
      default: return 'text-text-secondary border-border bg-surface-secondary';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-semantic-success" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-semantic-error" />;
      default: return null;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-enterprise-4">
      {securityMetrics.map((metric) => {
        const IconComponent = metric.icon;
        
        return (
          <div
            key={metric.id}
            className={cn(
              "p-enterprise-4 rounded-lg border transition-all duration-200 hover:shadow-notion-sm",
              getStatusColor(metric.status)
            )}
          >
            <div className="flex items-start justify-between mb-enterprise-2">
              <div className="flex items-center space-x-enterprise-2">
                <div className="p-enterprise-2 rounded-lg bg-white/50">
                  <IconComponent className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-body-sm font-medium">{metric.label}</h3>
                  {metric.description && (
                    <p className="text-caption text-current/70">{metric.description}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-end justify-between">
              <div className="text-heading-lg font-bold">{metric.value}</div>
              {metric.trend && metric.trendValue && (
                <div className="flex items-center space-x-enterprise-1">
                  {getTrendIcon(metric.trend)}
                  <span className="text-caption font-medium">{metric.trendValue}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ========== THREAT ALERTS ==========
const ThreatAlertsPanel: React.FC = () => {
  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'critical': 'destructive',
      'high': 'destructive',
      'medium': 'secondary',
      'low': 'outline',
    };

    return (
      <DaisyBadge variant={variants[severity]} className="text-caption" >
  {severity.toUpperCase()}
</DaisyBadge>
      </DaisyBadge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'active': 'destructive',
      'investigating': 'secondary',
      'resolved': 'default',
    };

    return (
      <DaisyBadge variant={variants[status]} className="text-caption" >
  {status.charAt(0).toUpperCase() + status.slice(1)}
</DaisyBadge>
      </DaisyBadge>
    );
  };

  return (
    <ContentCard 
      title="Security Alerts" 
      subtitle="Real-time threat detection and incident alerts"
      action={{
        label: 'View All',
        onClick: () => {
          // Navigate to alerts page or show alerts modal
          // This would typically use router.push('/security/alerts')
        },
        variant: 'outline',
      }}
      className="shadow-notion-sm"
    >
      <div className="space-y-enterprise-3">
        {threatAlerts.map((alert) => (
          <div
            key={alert.id}
            className="p-enterprise-4 border border-border rounded-lg hover:bg-surface-secondary/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-enterprise-2">
              <div className="flex-1">
                <div className="flex items-center space-x-enterprise-2 mb-enterprise-1">
                  <h4 className="text-body-sm font-semibold text-text-primary">
                    {alert.title}
                  </h4>
                  {getSeverityBadge(alert.severity)}
                  {getStatusBadge(alert.status)}
                </div>
                <p className="text-caption text-text-secondary mb-enterprise-2">
                  {alert.description}
                </p>
                <div className="flex items-center space-x-enterprise-4 text-caption text-text-tertiary">
                  <span>{alert.category}</span>
                  <span>•</span>
                  <span>{alert.source}</span>
                  <span>•</span>
                  <span>{alert.timestamp.toLocaleTimeString()}</span>
                </div>
              </div>
              <DaisyButton variant="ghost" size="sm" className="h-6 w-6 p-0" >
  <MoreHorizontal className="h-3 w-3" />
</DaisyButton>
              </DaisyButton>
            </div>
          </div>
        ))}
      </div>
    </ContentCard>
  );
};

// ========== COMPLIANCE FRAMEWORKS ==========
const ComplianceFrameworksPanel: React.FC = () => {
  const getComplianceColor = (compliance: number) => {
    if (compliance >= 95) return 'text-semantic-success';
    if (compliance >= 85) return 'text-semantic-warning';
    return 'text-semantic-error';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'compliant': 'default',
      'partial': 'secondary',
      'non-compliant': 'destructive',
    };

    return (
      <DaisyBadge variant={variants[status]} className="text-caption" >
  {status.replace('-', ' ')}
</DaisyBadge>
      </DaisyBadge>
    );
  };

  return (
    <ContentCard 
      title="Compliance Frameworks" 
      subtitle="Framework compliance status and control implementation"
      action={{
        label: 'Manage',
        onClick: () => {
          // Navigate to compliance frameworks management page
          // This would typically use router.push('/security/compliance')
        },
        variant: 'outline',
      }}
      className="shadow-notion-sm"
    >
      <div className="space-y-enterprise-4">
        {complianceFrameworks.map((framework) => (
          <div
            key={framework.id}
            className="p-enterprise-4 border border-border rounded-lg hover:bg-surface-secondary/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-enterprise-3">
              <div>
                <div className="flex items-center space-x-enterprise-2 mb-enterprise-1">
                  <h4 className="text-body-sm font-semibold text-text-primary">
                    {framework.name}
                  </h4>
                  {getStatusBadge(framework.status)}
                </div>
                <div className="flex items-center space-x-enterprise-2">
                  <div className={cn("text-heading-base font-bold", getComplianceColor(framework.compliance))}>
                    {framework.compliance}%
                  </div>
                  <span className="text-caption text-text-secondary">compliance</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-enterprise-3">
              <div className="flex items-center justify-between text-caption text-text-secondary mb-enterprise-1">
                <span>Control Implementation</span>
                <span>{framework.controls.implemented}/{framework.controls.total}</span>
              </div>
              <div className="w-full bg-surface-secondary rounded-full h-2">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    getComplianceColor(framework.compliance).includes('success') ? 'bg-semantic-success' :
                    getComplianceColor(framework.compliance).includes('warning') ? 'bg-semantic-warning' :
                    'bg-semantic-error'
                  )}
                  style={{
                    width: `${(framework.controls.implemented / framework.controls.total) * 100}%`
                  }} />
              </div>
            </div>

            {/* Control Stats */}
            <div className="grid grid-cols-4 gap-enterprise-2">
              <div className="text-center">
                <div className="text-body-sm font-semibold text-text-primary">
                  {framework.controls.total}
                </div>
                <div className="text-caption text-text-secondary">Total</div>
              </div>
              <div className="text-center">
                <div className="text-body-sm font-semibold text-semantic-success">
                  {framework.controls.implemented}
                </div>
                <div className="text-caption text-text-secondary">Implemented</div>
              </div>
              <div className="text-center">
                <div className="text-body-sm font-semibold text-interactive-primary">
                  {framework.controls.tested}
                </div>
                <div className="text-caption text-text-secondary">Tested</div>
              </div>
              <div className="text-center">
                <div className="text-body-sm font-semibold text-semantic-error">
                  {framework.controls.exceptions}
                </div>
                <div className="text-caption text-text-secondary">Exceptions</div>
              </div>
            </div>

            {/* Assessment Dates */}
            <DaisySeparator className="my-enterprise-3" />
<div className="flex items-center justify-between text-caption text-text-secondary">
              <span>Last: {framework.lastAssessment.toLocaleDateString()}</span>
              <span>Next: {framework.nextAssessment.toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </ContentCard>
  );
};

// ========== SECURITY CONTROLS MONITORING ==========
const SecurityControlsMonitoring: React.FC = () => {
  const controlCategories = [
    { id: 'access', label: 'Access Controls', implemented: 45, total: 50, effectiveness: 96 },
    { id: 'data', label: 'Data Protection', implemented: 32, total: 35, effectiveness: 94 },
    { id: 'network', label: 'Network Security', implemented: 28, total: 30, effectiveness: 92 },
    { id: 'endpoint', label: 'Endpoint Security', implemented: 22, total: 25, effectiveness: 88 },
    { id: 'incident', label: 'Incident Response', implemented: 18, total: 20, effectiveness: 90 },
  ];

  return (
    <ContentCard 
      title="Security Controls" 
      subtitle="Implementation status and effectiveness monitoring"
      className="shadow-notion-sm"
    >
      <div className="space-y-enterprise-4">
        {controlCategories.map((category) => (
          <div key={category.id} className="space-y-enterprise-2">
            <div className="flex items-center justify-between">
              <span className="text-body-sm font-medium text-text-primary">
                {category.label}
              </span>
              <div className="flex items-center space-x-enterprise-4">
                <span className="text-caption text-text-secondary">
                  {category.implemented}/{category.total}
                </span>
                <span className="text-caption font-medium text-text-primary">
                  {category.effectiveness}% effective
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-enterprise-2">
              <div className="flex-1 bg-surface-secondary rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-interactive-primary transition-all duration-300"
                  style={{
                    width: `${(category.implemented / category.total) * 100}%`
                  }} />
              </div>
              <div className="w-16 bg-surface-secondary rounded-full h-2">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    category.effectiveness >= 95 ? 'bg-semantic-success' :
                    category.effectiveness >= 85 ? 'bg-semantic-warning' :
                    'bg-semantic-error'
                  )}
                  style={{
                    width: `${category.effectiveness}%`
                  }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </ContentCard>
  );
};

// ========== MAIN SECURITY DASHBOARD ==========
export const SecurityDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const handleOpenSettings = () => {
    setIsSettingsModalOpen(true);
  };

  const handleGenerateReport = async () => {
    try {
      await ExportService.exportSecurityReport({ format: 'pdf' });
    } catch (error) {
      console.error('Report generation failed:', error);
    }
  };

  const handleRefreshData = () => {
    // TODO: Implement data refresh logic
    // This would typically trigger a data refresh from the backend
    // For now, we'll just show a toast notification
  };

  const handleSettingsUpdated = (settings: any) => {
    // Settings have been updated successfully
    // The SecuritySettingsModal will handle the toast notification
  };

  return (
    <MainContentArea
      title="Security & Compliance"
      subtitle="Enterprise security monitoring and compliance management"
      breadcrumbs={[
        { label: 'Security', current: true },
      ]}
      primaryAction={{
        label: 'Security Settings',
        onClick: handleOpenSettings,
        icon: Settings,
      }}
      secondaryActions={[
        {
          label: 'Generate Report',
          onClick: handleGenerateReport,
          icon: Download,
          variant: 'outline',
        },
        {
          label: 'Refresh Data',
          onClick: handleRefreshData,
          icon: RefreshCw,
          variant: 'outline',
        },
      ]}
      stats={[
        {
          label: 'security score',
          value: 94,
          trend: 'up',
          trendValue: '2.1%',
          variant: 'success',
        },
        {
          label: 'active threats',
          value: 3,
          trend: 'down',
          trendValue: '40%',
          variant: 'default',
        },
        {
          label: 'compliance',
          value: '96.2%',
          trend: 'up',
          trendValue: '1.5%',
          variant: 'success',
        },
      ]}
      maxWidth="2xl"
    >
      {/* Tabs */}
      <DaisyTabs value={activeTab} onValueChange={setActiveTab} className="mb-enterprise-6" >
          <DaisyTabsList >
            <DaisyTabsTrigger value="overview">Overview</DaisySeparator>
          <DaisyTabsTrigger value="threats">Threat Monitoring</DaisyTabsTrigger>
          <DaisyTabsTrigger value="compliance">Compliance</DaisyTabsTrigger>
          <DaisyTabsTrigger value="controls">Controls</DaisyTabsTrigger>
          <DaisyTabsTrigger value="audit">Audit Trail</DaisyTabsTrigger>
        </DaisyTabsList>
      </DaisyTabs>

      <DaisyTabsContent value="overview" className="space-y-enterprise-6" >
          {/* Security Metrics */}
        <ContentSection 
          title="Security Metrics"
          subtitle="Real-time security posture and key performance indicators"
        >
          <SecurityMetricsOverview />
        </ContentSection>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-enterprise-6">
          <ThreatAlertsPanel />
          <SecurityControlsMonitoring />
        </div>

        {/* Compliance Frameworks */}
        <ContentSection>
          <ComplianceFrameworksPanel />
        </ContentSection>
      </DaisyTabsContent>

      <DaisyTabsContent value="threats" className="space-y-enterprise-6" >
          <div className="text-center py-enterprise-12">
          <DaisyAlertTriangle className="h-12 w-12 text-text-tertiary mx-auto mb-enterprise-4" >
  <h3 className="text-heading-base font-semibold text-text-primary mb-enterprise-2">
</DaisyTabsContent>
            Threat Monitoring
          </h3>
          <p className="text-body-base text-text-secondary">
            Advanced threat detection and incident response dashboard.
          </p>
        </div>
      </DaisyTabsContent>

      <DaisyTabsContent value="compliance" className="space-y-enterprise-6" >
          <div className="text-center py-enterprise-12">
          <CheckCircle className="h-12 w-12 text-text-tertiary mx-auto mb-enterprise-4" />
          <h3 className="text-heading-base font-semibold text-text-primary mb-enterprise-2">
            Compliance Management
          </h3>
          <p className="text-body-base text-text-secondary">
            Framework compliance tracking and automated reporting.
          </p>
        </div>
      </DaisyTabsContent>

      <DaisyTabsContent value="controls" className="space-y-enterprise-6" >
          <div className="text-center py-enterprise-12">
          <Shield className="h-12 w-12 text-text-tertiary mx-auto mb-enterprise-4" />
          <h3 className="text-heading-base font-semibold text-text-primary mb-enterprise-2">
            Security Controls
          </h3>
          <p className="text-body-base text-text-secondary">
            Control implementation and effectiveness monitoring.
          </p>
        </div>
      </DaisyTabsContent>

      <DaisyTabsContent value="audit" className="space-y-enterprise-6" >
          <div className="text-center py-enterprise-12">
          <Activity className="h-12 w-12 text-text-tertiary mx-auto mb-enterprise-4" />
          <h3 className="text-heading-base font-semibold text-text-primary mb-enterprise-2">
            Audit Trail
          </h3>
          <p className="text-body-base text-text-secondary">
            Comprehensive audit logging and compliance tracking.
          </p>
        </div>
      </DaisyTabsContent>

      {/* Security Settings Modal */}
      <SecuritySettingsModal
        open={isSettingsModalOpen}
        onOpenChange={setIsSettingsModalOpen}
        onSettingsUpdated={handleSettingsUpdated} />
    </MainContentArea>
  );
};

export default SecurityDashboard; 