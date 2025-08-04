import React, { useState, useEffect } from 'react';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
// import { 
  Shield, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  FileText,
  BarChart3,
  Download,
  RefreshCw,
  Activity,
  Clock,
  TrendingUp,
  Filter,
  Zap
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { cn } from '@/lib/utils';
import { 
  aiSecurityService,
  type AIAuditLog,
  type ComplianceReport,
  type SecurityAnalysis
} from '@/services/AISecurityService';
import type { SecurityEvent } from '@/types/ai-security.types';

interface AISecurityDashboardProps {
  organizationId: string;
  className?: string;
  refreshInterval?: number;
}

interface SecurityMetrics {
  totalAuditLogs: number;
  avgRiskScore: number;
  threatLevelDistribution: Record<string, number>;
  piiDetectionRate: number;
  complianceScore: number;
  recentAlerts: number;
  activeIncidents: number;
  resolvedIncidents: number;
}

interface SecurityTrend {
  date: string;
  riskScore: number;
  complianceScore: number;
  incidents: number;
  piiDetections: number;
}

export const AISecurityDashboard: React.FC<AISecurityDashboardProps> = ({
  organizationId,
  className,
  refreshInterval = 30000
}) => {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [auditLogs, setAuditLogs] = useState<AIAuditLog[]>([]);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [securityTrends, setSecurityTrends] = useState<SecurityTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [filterUserId, setFilterUserId] = useState<string>('');
  const [filterThreatLevel, setFilterThreatLevel] = useState<string>('');

  // Fetch security data
  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      
      // Get security metrics
      const securityMetrics = aiSecurityService.getSecurityMetrics();
      setMetrics({
        ...securityMetrics,
        recentAlerts: 5,
        activeIncidents: 2,
        resolvedIncidents: 8
      });
      
      // Get audit logs with filters
      const filters: Parameters<typeof aiSecurityService.getAuditLogs>[0] = {};
      if (filterUserId) filters.userId = filterUserId;
      if (filterThreatLevel) filters.threatLevel = filterThreatLevel as SecurityAnalysis['threatLevel'];
      
      const logs = await aiSecurityService.getAuditLogs(filters);
      setAuditLogs(logs);
      
      // Generate mock security trends for demo
      const trends = generateMockSecurityTrends();
      setSecurityTrends(trends);
      
      // Generate mock security events
      const events = generateMockSecurityEvents();
      setSecurityEvents(events);
      
    } catch (error) {
      // console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock security trends
  const generateMockSecurityTrends = (): SecurityTrend[] => {
    const days = parseInt(selectedTimeRange);
    const trends: SecurityTrend[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      trends.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        riskScore: 20 + Math.random() * 30,
        complianceScore: 85 + Math.random() * 10,
        incidents: Math.floor(Math.random() * 5),
        piiDetections: Math.floor(Math.random() * 10)
      });
    }
    
    return trends;
  };

  // Generate mock security events
  const generateMockSecurityEvents = (): SecurityEvent[] => {
    const events: SecurityEvent[] = [];
    const eventTypes = [
      'authentication_failure',
      'pii_exposure',
      'suspicious_activity',
      'compliance_violation'
    ] as const;
    
    for (let i = 0; i < 10; i++) {
      const event: SecurityEvent = {
        id: `event-${i}`,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        severity: ['info', 'warning', 'error', 'critical'][Math.floor(Math.random() * 4)] as SecurityEvent['severity'],
        source: 'ai_security_service',
        userId: `user-${Math.floor(Math.random() * 100)}`,
        sessionId: `session-${Math.floor(Math.random() * 1000)}`,
        data: { details: 'Mock security event data' },
        resolved: Math.random() > 0.3,
        resolvedAt: Math.random() > 0.5 ? new Date() : undefined,
        resolvedBy: Math.random() > 0.5 ? 'security-admin' : undefined
      };
      events.push(event);
    }
    
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  // Export audit logs
  const handleExportAuditLogs = async () => {
    try {
      const data = await aiSecurityService.exportAuditLogs('csv');
      const blob = new Blob([data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      // console.error('Error exporting audit logs:', error);
    }
  };

  // Auto-refresh data
  useEffect(() => {
    fetchSecurityData();
    
    const interval = setInterval(fetchSecurityData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, selectedTimeRange, filterUserId, filterThreatLevel]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getThreatLevelIcon = (level: string) => {
    switch (level) {
      case 'critical': return <DaisyAlertTriangle className="h-4 w-4 text-red-600" >
  ;
</DaisyAlertTriangle>
      case 'high': return <DaisyAlertTriangle className="h-4 w-4 text-orange-600" >
  ;
</DaisyAlertTriangle>
      case 'medium': return <Activity className="h-4 w-4 text-yellow-600" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

  if (loading && !metrics) {
    return (
      <DaisyCard className={cn("w-full", className)} >
  <DaisyCardBody >
</DaisyCard>
          <DaisyCardTitle className="flex items-center gap-2" >
  <Shield className="h-5 w-5 text-blue-600 animate-pulse" />
</DaisyCardTitle>
            Loading Security Dashboard...
          </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="space-y-3">
</DaisyCardBody>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </DaisyCardBody>
      </DaisyCard>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            AI Security Dashboard
          </h1>
          <p className="text-gray-600">Enterprise AI security monitoring and compliance</p>
        </div>
        <div className="flex items-center gap-2">
          <DaisyButton variant="outline" size="sm" onClick={handleExportAuditLogs} >
  <Download className="h-4 w-4 mr-1" />
</DaisyButton>
            Export Logs
          </DaisyButton>
          <DaisyButton variant="outline" size="sm" onClick={fetchSecurityData} disabled={loading} >
  <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
</DaisyButton>
            Refresh
          </DaisyButton>
        </div>
      </div>

      {/* Security Metrics Overview */}
      {Boolean(metrics) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DaisyCard >
  <DaisyCardBody className="p-4" >
  </DaisyCard>
</DaisyCardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Compliance Score</p>
                  <p className="text-2xl font-bold text-green-600">{metrics.complianceScore.toFixed(1)}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <DaisyProgress value={metrics.complianceScore} className="mt-2" / / /> </DaisyCard>

          <DaisyCard >
  <DaisyCardBody className="p-4" >
  </DaisyCard>
</DaisyCardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Risk Score</p>
                  <p className="text-2xl font-bold text-orange-600">{metrics.avgRiskScore.toFixed(1)}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-600" />
              </div>
              <DaisyProgress value={metrics.avgRiskScore} className="mt-2" / / /> </DaisyCard>

          <DaisyCard >
  <DaisyCardBody className="p-4" >
  </DaisyCard>
</DaisyCardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">PII Detection Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{metrics.piiDetectionRate.toFixed(1)}%</p>
                </div>
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
              <DaisyProgress value={metrics.piiDetectionRate} className="mt-2" / / /> </DaisyCard>

          <DaisyCard >
  <DaisyCardBody className="p-4" >
  </DaisyCard>
</DaisyCardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Audit Logs</p>
                  <p className="text-2xl font-bold text-[#191919]">{metrics.totalAuditLogs.toLocaleString()}</p>
                </div>
                <FileText className="h-8 w-8 text-[#191919]" />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Last 7 days
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </div>
      )}

      <DaisyTabs value={activeTab} onValueChange={setActiveTab} >
          <DaisyTabsList className="grid w-full grid-cols-5" >
            <DaisyTabsTrigger value="overview">Overview</DaisyTabs>
          <DaisyTabsTrigger value="audit-logs">Audit Logs</DaisyTabsTrigger>
          <DaisyTabsTrigger value="security-events">Security Events</DaisyTabsTrigger>
          <DaisyTabsTrigger value="compliance">Compliance</DaisyTabsTrigger>
          <DaisyTabsTrigger value="analytics">Analytics</DaisyTabsTrigger>
        </DaisyTabsList>

        {/* Overview Tab */}
        <DaisyTabsContent value="overview" className="space-y-6" >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Threat Level Distribution */}
            <DaisyCard >
  <DaisyCardBody >
</DaisyTabsContent>
                <DaisyCardTitle className="flex items-center gap-2" >
  <DaisyAlertTriangle className="h-5 w-5 text-orange-600" >
  </DaisyCardTitle>
</DaisyAlert>
                  Threat Level Distribution
                </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  {Boolean(metrics) && (
</DaisyCardBody>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={Object.entries(metrics.threatLevelDistribution).map(([level, count]) => ({
                            name: level,
                            value: count,
                            color: level === 'critical' ? '#ef4444' : 
                                   level === 'high' ? '#f97316' :
                                   level === 'medium' ? '#eab308' : '#22c55e'
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.entries(metrics.threatLevelDistribution).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <DaisyTooltip /></DaisyTooltip>
                    </ResponsiveContainer>
                  </div>
                )}
              </DaisyCardBody>
            </DaisyCard>

            {/* Security Trends */}
            <DaisyCard >
  <DaisyCardBody >
</DaisyCard>
                <DaisyCardTitle className="flex items-center gap-2" >
  <TrendingUp className="h-5 w-5 text-green-600" />
</DaisyCardTitle>
                  Security Trends
                </DaisyCardTitle>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedTimeRange}
                    onChange={(e) => setSelectedTimeRange(e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                  </select>
                </div>
              
              <DaisyCardBody >
  <div className="h-64">
</DaisyCardBody>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={securityTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <DaisyTooltip>
                        <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="riskScore" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        name="Risk Score" />
                      <Line 
                        type="monotone" 
                        dataKey="complianceScore" 
                        stroke="#22c55e" 
                        strokeWidth={2}
                        name="Compliance Score" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </DaisyTooltip>
            </DaisyCard>
          </div>

          {/* Recent Security Events */}
          <DaisyCard >
  <DaisyCardBody >
</DaisyCard>
              <DaisyCardTitle className="flex items-center gap-2" >
  <Activity className="h-5 w-5 text-blue-600" />
</DaisyCardTitle>
                Recent Security Events
              </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="space-y-2 max-h-64 overflow-y-auto">
</DaisyCardBody>
                {securityEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full", {
                        'bg-red-500': event.severity === 'critical' || event.severity === 'error',
                        'bg-yellow-500': event.severity === 'warning',
                        'bg-blue-500': event.severity === 'info'
                      })} />
                      <div>
                        <p className="text-sm font-medium">{event.type.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-gray-500">
                          {event.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DaisyBadge className={getSeverityColor(event.severity)} >
  {event.severity}
</DaisyBadge>
                      </DaisyBadge>
                      {event.resolved ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-orange-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>

        {/* Audit Logs Tab */}
        <DaisyTabsContent value="audit-logs" className="space-y-4" >
            {/* Filters */}
          <DaisyCard >
  <DaisyCardBody className="p-4" >
  </DaisyTabsContent>
</DaisyCardBody>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                <input
                  type="text"
                  placeholder="User ID"
                  value={filterUserId}
                  onChange={(e) => setFilterUserId(e.target.value)}
                  className="text-sm border rounded px-2 py-1" />
                <select
                  value={filterThreatLevel}
                  onChange={(e) => setFilterThreatLevel(e.target.value)}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="">All Threat Levels</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <DaisyButton 
                  variant="outline" 
                  size="sm"
                  onClick={() =>
          {
                    setFilterUserId('');
                    setFilterThreatLevel('');
                  }}
                >
                  Clear
                
        </DaisyButton>
              </div>
            </DaisyCardBody>
          </DaisyCard>

          {/* Audit Logs Table */}
          <DaisyCard >
  <DaisyCardBody >
</DaisyCard>
              <DaisyCardTitle className="flex items-center gap-2" >
  <FileText className="h-5 w-5 text-gray-600" />
</DaisyCardTitle>
                Audit Logs ({auditLogs.length})
              </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="space-y-2 max-h-96 overflow-y-auto">
</DaisyCardBody>
                {auditLogs.map((log) => (
                  <div key={log.id} className="border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getThreatLevelIcon(log.securityAnalysis.threatLevel)}
                        <span className="font-medium text-sm">{log.action.type}</span>
                        <DaisyBadge variant="outline">{log.userId}</DaisyBadge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {log.timestamp.toLocaleString()}
                        </span>
                        <DaisyBadge className={getSeverityColor(log.securityAnalysis.threatLevel)} >
  Risk: {log.riskScore}
</DaisyBadge>
                        </DaisyBadge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-gray-500">PII Detected:</span>
                        <span className="ml-1">{log.requestData.piiDetected.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Classification:</span>
                        <span className="ml-1">{log.classification.level}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Compliance Flags:</span>
                        <span className="ml-1">{log.complianceFlags.length}</span>
                      </div>
                    </div>
                    
                    {log.securityAnalysis.anomalies.length > 0 && (
                      <DaisyAlert className="mt-2" >
  <DaisyAlertTriangle className="h-4 w-4" />
</DaisyAlert>
                        <DaisyAlertDescription >
  {log.securityAnalysis.anomalies.length} security anomal{log.securityAnalysis.anomalies.length > 1 ? 'ies' : 'y'} detected
                </DaisyAlertDescription>
</DaisyAlert>
                </DaisyAlertDescription>
              </DaisyAlert>
                    )}
                  </div>
                ))}
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>

        {/* Security Events Tab */}
        <DaisyTabsContent value="security-events" className="space-y-4" >
            <DaisyCard >
  <DaisyCardBody >
</DaisyTabsContent>
              <DaisyCardTitle className="flex items-center gap-2" >
  <Zap className="h-5 w-5 text-yellow-600" />
</DaisyCardTitle>
                Security Events
              </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="space-y-3 max-h-96 overflow-y-auto">
</DaisyCardBody>
                {securityEvents.map((event) => (
                  <div key={event.id} className="border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-3 h-3 rounded-full", {
                          'bg-red-500': event.severity === 'critical' || event.severity === 'error',
                          'bg-yellow-500': event.severity === 'warning',
                          'bg-blue-500': event.severity === 'info'
                        })} />
                        <span className="font-medium">{event.type.replace(/_/g, ' ')}</span>
                        <DaisyBadge variant="outline">{event.userId}</DaisyBadge>
                      </div>
                      <div className="flex items-center gap-2">
                        <DaisyBadge className={getSeverityColor(event.severity)} >
  {event.severity}
</DaisyBadge>
                        </DaisyBadge>
                        {event.resolved ? (
                          <DaisyBadge className="bg-green-100 text-green-800">Resolved</DaisyBadge>
                        ) : (
                          <DaisyBadge className="bg-orange-100 text-orange-800">Active</DaisyBadge>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Source:</span> {event.source}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {event.timestamp.toLocaleString()}
                      {event.resolvedAt && (
                        <span className="ml-2">
                          • Resolved: {event.resolvedAt.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>

        {/* Compliance Tab */}
        <DaisyTabsContent value="compliance" className="space-y-4" >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['SOC2', 'ISO27001', 'GDPR'].map((standard) => (
              <DaisyCard key={standard} >
  <DaisyCardBody >
</DaisyTabsContent>
                  <DaisyCardTitle className="flex items-center gap-2" >
  <Shield className="h-5 w-5 text-green-600" />
</DaisyCardTitle>
                    {standard}
                  </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="space-y-3">
</DaisyCardBody>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Compliance Score</span>
                      <span className="font-bold text-green-600">95%</span>
                    </div>
                    <DaisyProgress value={95} className="h-2" />
<div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Access Controls: Compliant</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Data Protection: Compliant</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DaisyAlertTriangle className="h-4 w-4 text-yellow-600" >
  <span>
</DaisyProgress>Audit Trails: Review Needed</span>
                      </div>
                    </div>
                  </div>
                </DaisyCardBody>
              </DaisyCard>
            ))}
          </div>
        </DaisyTabsContent>

        {/* Analytics Tab */}
        <DaisyTabsContent value="analytics" className="space-y-4" >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DaisyCard >
  <DaisyCardBody >
</DaisyTabsContent>
                <DaisyCardTitle>PII Detection Over Time</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="h-64">
</DaisyCardBody>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={securityTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <DaisyTooltip>
                        <Area 
                        type="monotone" 
                        dataKey="piiDetections" 
                        stroke="#3b82f6" 
                        fill="#3b82f6"
                        fillOpacity={0.3}
                        name="PII Detections" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </DaisyTooltip>
            </DaisyCard>

            <DaisyCard >
  <DaisyCardBody >
</DaisyCard>
                <DaisyCardTitle>Security Incidents</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="h-64">
</DaisyCardBody>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={securityTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <DaisyTooltip>
                        <Bar 
                        dataKey="incidents" 
                        fill="#ef4444"
                        name="Incidents" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </DaisyTooltip>
            </DaisyCard>
          </div>
        </DaisyTabsContent>
      </DaisyTabs>
    </div>
  );
}; 