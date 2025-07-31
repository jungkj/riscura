'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { 
  Calendar,
  Clock,
  Send,
  Mail,
  Users,
  FileText,
  Settings,
  Play,
  Pause,
  Edit,
  Trash2,
  Copy,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Zap,
  Bell,
  Filter,
  Search,
  Plus,
  MoreHorizontal,
  Target,
  Repeat,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  User,
  Building,
  Globe,
  Smartphone,
  Monitor,
  Printer,
  Cloud,
  Database,
  Link,
  Tag,
  Star,
  Archive,
  History
} from 'lucide-react';

// Scheduling types
interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  reportTemplate: string;
  schedule: ReportSchedule;
  recipients: Recipient[];
  deliveryOptions: DeliveryOptions;
  filters: ReportFilters;
  status: 'active' | 'paused' | 'error' | 'completed';
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  interval: number;
  daysOfWeek?: number[]; // 0-6, Sunday = 0
  dayOfMonth?: number; // 1-31
  time: string; // HH:MM format
  timezone: string;
  startDate: Date;
  endDate?: Date;
  customCron?: string;
}

interface Recipient {
  id: string;
  type: 'user' | 'group' | 'external';
  name: string;
  email: string;
  role?: string;
  department?: string;
  preferences: {
    format: 'pdf' | 'excel' | 'powerpoint' | 'html';
    includeCharts: boolean;
    includeRawData: boolean;
    compression: boolean;
  };
}

interface DeliveryOptions {
  method: 'email' | 'slack' | 'teams' | 'webhook' | 'ftp' | 'sharepoint';
  subject?: string;
  message?: string;
  attachmentName?: string;
  webhookUrl?: string;
  slackChannel?: string;
  teamsChannel?: string;
  ftpPath?: string;
  sharepointPath?: string;
  retryAttempts: number;
  retryDelay: number; // minutes
}

interface ReportFilters {
  dateRange: {
    type: 'relative' | 'absolute';
    relativePeriod?: string; // 'last-30-days', 'last-quarter', etc.
    startDate?: Date;
    endDate?: Date;
  };
  departments?: string[];
  riskCategories?: string[];
  complianceFrameworks?: string[];
  severityLevels?: string[];
  customFilters?: Record<string, any>;
}

interface ReportExecution {
  id: string;
  reportId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  logs: string[];
  outputFiles?: string[];
  error?: string;
  metrics: {
    recordsProcessed: number;
    executionTime: number;
    fileSize: number;
  };
}

// Sample data
const SAMPLE_REPORTS: ScheduledReport[] = [
  {
    id: '1',
    name: 'Weekly Executive Risk Summary',
    description: 'High-level risk overview for executive team',
    reportTemplate: 'executive-summary',
    schedule: {
      frequency: 'weekly',
      interval: 1,
      daysOfWeek: [1], // Monday
      time: '09:00',
      timezone: 'America/New_York',
      startDate: new Date('2024-01-01')
    },
    recipients: [
      {
        id: 'r1',
        type: 'user',
        name: 'John Smith',
        email: 'john.smith@company.com',
        role: 'CEO',
        preferences: {
          format: 'pdf',
          includeCharts: true,
          includeRawData: false,
          compression: false
        }
      }
    ],
    deliveryOptions: {
      method: 'email',
      subject: 'Weekly Risk Summary - {{date}}',
      message: 'Please find attached the weekly risk summary report.',
      attachmentName: 'Risk_Summary_{{date}}.pdf',
      retryAttempts: 3,
      retryDelay: 15
    },
    filters: {
      dateRange: {
        type: 'relative',
        relativePeriod: 'last-7-days'
      },
      severityLevels: ['high', 'critical']
    },
    status: 'active',
    lastRun: new Date(Date.now() - 86400000 * 2),
    nextRun: new Date(Date.now() + 86400000 * 5),
    runCount: 12,
    createdBy: 'admin',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    name: 'Monthly Compliance Dashboard',
    description: 'Comprehensive compliance status report',
    reportTemplate: 'compliance-dashboard',
    schedule: {
      frequency: 'monthly',
      interval: 1,
      dayOfMonth: 1,
      time: '08:00',
      timezone: 'America/New_York',
      startDate: new Date('2024-01-01')
    },
    recipients: [
      {
        id: 'r2',
        type: 'group',
        name: 'Compliance Team',
        email: 'compliance@company.com',
        preferences: {
          format: 'excel',
          includeCharts: true,
          includeRawData: true,
          compression: true
        }
      }
    ],
    deliveryOptions: {
      method: 'email',
      subject: 'Monthly Compliance Report - {{month}} {{year}}',
      message: 'Monthly compliance status and metrics report attached.',
      attachmentName: 'Compliance_Report_{{month}}_{{year}}.xlsx',
      retryAttempts: 2,
      retryDelay: 30
    },
    filters: {
      dateRange: {
        type: 'relative',
        relativePeriod: 'last-month'
      },
      complianceFrameworks: ['SOX', 'ISO27001', 'GDPR']
    },
    status: 'active',
    lastRun: new Date(Date.now() - 86400000 * 30),
    nextRun: new Date(Date.now() + 86400000 * 15),
    runCount: 3,
    createdBy: 'compliance.manager',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-02-01')
  }
];

const SAMPLE_EXECUTIONS: ReportExecution[] = [
  {
    id: 'e1',
    reportId: '1',
    startTime: new Date(Date.now() - 3600000),
    endTime: new Date(Date.now() - 3300000),
    status: 'completed',
    progress: 100,
    logs: [
      'Started report generation',
      'Fetching risk data...',
      'Processing 247 risk records',
      'Generating charts and visualizations',
      'Creating PDF output',
      'Sending email to recipients',
      'Report completed successfully'
    ],
    outputFiles: ['risk_summary_2024_03_15.pdf'],
    metrics: {
      recordsProcessed: 247,
      executionTime: 300, // seconds
      fileSize: 2.4 // MB
    }
  }
];

// Main automated reports component
interface AutomatedReportsProps {
  onCreateReport?: (report: Partial<ScheduledReport>) => void;
  onUpdateReport?: (reportId: string, updates: Partial<ScheduledReport>) => void;
  onDeleteReport?: (reportId: string) => void;
  onRunReport?: (reportId: string) => void;
  className?: string;
}

export const AutomatedReports: React.FC<AutomatedReportsProps> = ({
  onCreateReport,
  onUpdateReport,
  onDeleteReport,
  onRunReport,
  className = ''
}) => {
  const [reports, setReports] = useState<ScheduledReport[]>(SAMPLE_REPORTS);
  const [executions, setExecutions] = useState<ReportExecution[]>(SAMPLE_EXECUTIONS);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showExecutionHistory, setShowExecutionHistory] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState<'list' | 'calendar' | 'analytics'>('list');

  // Filter reports
  const filteredReports = reports.filter(report => {
    if (filterStatus !== 'all' && report.status !== filterStatus) return false;
    if (searchQuery && !report.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Toggle report status
  const toggleReportStatus = useCallback((reportId: string) => {
    setReports(prev => prev.map(report => 
      report.id === reportId 
        ? { 
            ...report, 
            status: report.status === 'active' ? 'paused' : 'active',
            updatedAt: new Date()
          }
        : report
    ));
  }, []);

  // Run report immediately
  const runReportNow = useCallback((reportId: string) => {
    const newExecution: ReportExecution = {
      id: Date.now().toString(),
      reportId,
      startTime: new Date(),
      status: 'running',
      progress: 0,
      logs: ['Starting report execution...'],
      metrics: {
        recordsProcessed: 0,
        executionTime: 0,
        fileSize: 0
      }
    };

    setExecutions(prev => [newExecution, ...prev]);
    onRunReport?.(reportId);

    // Simulate execution progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        setExecutions(prev => prev.map(exec => 
          exec.id === newExecution.id 
            ? {
                ...exec,
                status: 'completed',
                progress: 100,
                endTime: new Date(),
                logs: [...exec.logs, 'Report completed successfully'],
                outputFiles: [`report_${Date.now()}.pdf`],
                metrics: {
                  recordsProcessed: Math.floor(Math.random() * 500) + 100,
                  executionTime: Math.floor(Math.random() * 300) + 60,
                  fileSize: Math.random() * 5 + 1
                }
              }
            : exec
        ));
      } else {
        setExecutions(prev => prev.map(exec => 
          exec.id === newExecution.id 
            ? { ...exec, progress, logs: [...exec.logs, `Processing... ${Math.floor(progress)}%`] }
            : exec
        ));
      }
    }, 1000);
  }, [onRunReport]);

  // Delete report
  const deleteReport = useCallback((reportId: string) => {
    setReports(prev => prev.filter(report => report.id !== reportId));
    onDeleteReport?.(reportId);
  }, [onDeleteReport]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format next run time
  const formatNextRun = (date: Date | undefined) => {
    if (!date) return 'Not scheduled';
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `In ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `In ${hours} hour${hours > 1 ? 's' : ''}`;
    return 'Soon';
  };

  // Render report card
  const renderReportCard = (report: ScheduledReport) => (
    <DaisyCard key={report.id} className="hover:shadow-md transition-shadow" >
  <DaisyCardHeader className="pb-3" />
</DaisyCard>
        <div className="flex items-start justify-between">
          <div>
            <DaisyCardTitle className="text-lg">{report.name}</DaisyCardTitle>
            <p className="text-sm text-gray-600 mt-1">{report.description}</p>
          </div>
          <div className="flex items-center space-x-2">
            <DaisyBadge className={getStatusColor(report.status)} >
  {report.status}
</DaisyBadge>
            </DaisyBadge>
            <DaisyButton
              variant="ghost"
              size="sm"
              onClick={() => setSelectedReport(report.id)} />
              <MoreHorizontal className="w-4 h-4" />
            </DaisyButton>
          </div>
        </div>
      
      <DaisyCardContent >
  <div className="space-y-3">
</DaisyCardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Schedule</div>
              <div className="font-medium capitalize">
                {report.schedule.frequency} at {report.schedule.time}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Next Run</div>
              <div className="font-medium">{formatNextRun(report.nextRun)}</div>
            </div>
            <div>
              <div className="text-gray-500">Recipients</div>
              <div className="font-medium">{report.recipients.length} recipient{report.recipients.length > 1 ? 's' : ''}</div>
            </div>
            <div>
              <div className="text-gray-500">Runs</div>
              <div className="font-medium">{report.runCount} completed</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <DaisyButton
                variant="outline"
                size="sm"
                onClick={() => toggleReportStatus(report.id)} />
                {report.status === 'active' ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </>
                )}
              </DaisyButton>
              <DaisyButton
                variant="outline"
                size="sm"
                onClick={() => runReportNow(report.id)} />
                <Play className="w-4 h-4 mr-2" />
                Run Now
              </DaisyButton>
            </div>
            
            <div className="flex items-center space-x-1">
              <DaisyButton variant="ghost" size="sm" >
  <Edit className="w-4 h-4" />
</DaisyButton>
              </DaisyButton>
              <DaisyButton variant="ghost" size="sm" >
  <Copy className="w-4 h-4" />
</DaisyButton>
              </DaisyButton>
              <DaisyButton 
                variant="ghost" 
                size="sm" 
                onClick={() => deleteReport(report.id)}
                className="text-red-600 hover:text-red-700" />
                <Trash2 className="w-4 h-4" />
              </DaisyButton>
            </div>
          </div>
        </div>
      </DaisyCardContent>
    </DaisyCard>
  );

  // Render execution history
  const renderExecutionHistory = () => (
    <DaisyCard >
  <DaisyCardHeader />
</DaisyCard>
        <DaisyCardTitle className="flex items-center" >
  <History className="w-5 h-5 mr-2" />
</DaisyCardTitle>
          Execution History
        </DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <div className="space-y-4">
</DaisyCardContent>
          {executions.map(execution => {
            const report = reports.find(r => r.id === execution.reportId);
            return (
              <div key={execution.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium">{report?.name}</div>
                    <div className="text-sm text-gray-500">
                      Started: {execution.startTime.toLocaleString()}
                    </div>
                  </div>
                  <DaisyBadge className={getStatusColor(execution.status)} >
  {execution.status}
</DaisyBadge>
                  </DaisyBadge>
                </div>

                {execution.status === 'running' && (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{Math.floor(execution.progress)}%</span>
                    </div>
                    <DaisyProgress value={execution.progress} className="h-2" />
                  </div>
                )}

                {execution.status === 'completed' && (
                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <div className="text-gray-500">Records</div>
                      <div className="font-medium">{execution.metrics.recordsProcessed.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Duration</div>
                      <div className="font-medium">{Math.floor(execution.metrics.executionTime / 60)}m {execution.metrics.executionTime % 60}s</div>
                    </div>
                    <div>
                      <div className="text-gray-500">File Size</div>
                      <div className="font-medium">{execution.metrics.fileSize.toFixed(1)} MB</div>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  <div className="font-medium mb-1">Execution Log:</div>
                  <div className="bg-gray-50 p-2 rounded max-h-20 overflow-y-auto">
                    {execution.logs.map((log, index) => (
                      <div key={index}>{log}</div>
                    ))}
                  </div>
                </div>

                {execution.outputFiles && execution.outputFiles.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-sm font-medium mb-2">Output Files:</div>
                    <div className="flex flex-wrap gap-2">
                      {execution.outputFiles.map(file => (
                        <DaisyButton key={file} variant="outline" size="sm" >
  <Download className="w-3 h-3 mr-2" />
</DaisyProgress>
                          {file}
                        </DaisyButton>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DaisyCardContent>
    </DaisyCard>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Automated Reports</h2>
          <p className="text-gray-600">Schedule and manage automated report generation</p>
        </div>
        <div className="flex items-center space-x-3">
          <DaisyButton
            variant="outline"
            onClick={() => setShowExecutionHistory(!showExecutionHistory)} />
            <History className="w-4 h-4 mr-2" />
            Execution History
          </DaisyButton>
          <DaisyButton onClick={() => setShowCreateForm(true)} />
            <Plus className="w-4 h-4 mr-2" />
            New Report
          </DaisyButton>
        </div>
      </div>

      {/* Filters and Search */}
      <DaisyCard >
  <DaisyCardContent className="pt-6" >
  </DaisyCard>
</DaisyCardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-gray-400" />
                <DaisyInput
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <DaisyButton
                variant={currentView === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('list')} />
                <FileText className="w-4 h-4" />
              </DaisyInput>
              <DaisyButton
                variant={currentView === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('calendar')} />
                <DaisyCalendar className="w-4 h-4" /></DaisyButton>
              <DaisyButton
                variant={currentView === 'analytics' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('analytics')} />
                <Target className="w-4 h-4" />
              </DaisyButton>
            </div>
          </div>
        </DaisyCardContent>
      </DaisyCard>

      {/* Reports List */}
      {currentView === 'list' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredReports.map(renderReportCard)}
        </div>
      )}

      {/* Calendar View */}
      {currentView === 'calendar' && (
        <DaisyCard >
  <DaisyCardHeader />
</DaisyCard>
            <DaisyCardTitle className="flex items-center" >
  <DaisyCalendar className="w-5 h-5 mr-2" />
</DaisyCardTitle>
              Report Schedule Calendar
            </DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <div className="text-center py-12 text-gray-500">
</DaisyCardContent>
              <DaisyCalendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Calendar view coming soon</p>
              <p className="text-sm">Visualize report schedules in calendar format</p>
            </div>
          </DaisyCalendar>
        </DaisyCard>
      )}

      {/* Analytics View */}
      {currentView === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <DaisyCard >
  <DaisyCardHeader />
</DaisyCard>
              <DaisyCardTitle className="text-sm">Report Statistics</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <div className="space-y-4">
</DaisyCardContent>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Active Reports</span>
                    <span className="font-medium">{reports.filter(r => r.status === 'active').length}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Total Executions</span>
                    <span className="font-medium">{reports.reduce((sum, r) => sum + r.runCount, 0)}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Success Rate</span>
                    <span className="font-medium">98.5%</span>
                  </div>
                </div>
              </div>
            </DaisyCardContent>
          </DaisyCard>

          <DaisyCard >
  <DaisyCardHeader />
</DaisyCard>
              <DaisyCardTitle className="text-sm">Delivery Methods</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <div className="space-y-3">
</DaisyCardContent>
                {['email', 'slack', 'teams'].map(method => (
                  <div key={method} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{method}</span>
                    <DaisyBadge variant="secondary" >
  {reports.filter(r => r.deliveryOptions.method === method).length}
</DaisyBadge>
                    </DaisyBadge>
                  </div>
                ))}
              </div>
            </DaisyCardContent>
          </DaisyCard>

          <DaisyCard >
  <DaisyCardHeader />
</DaisyCard>
              <DaisyCardTitle className="text-sm">Upcoming Reports</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <div className="space-y-3">
</DaisyCardContent>
                {reports
                  .filter(r => r.nextRun && r.status === 'active')
                  .sort((a, b) => (a.nextRun?.getTime() || 0) - (b.nextRun?.getTime() || 0))
                  .slice(0, 3)
                  .map(report => (
                    <div key={report.id} className="text-sm">
                      <div className="font-medium">{report.name}</div>
                      <div className="text-gray-500">{formatNextRun(report.nextRun)}</div>
                    </div>
                  ))}
              </div>
            </DaisyCardContent>
          </DaisyCard>
        </div>
      )}

      {/* Execution History */}
      {showExecutionHistory && renderExecutionHistory()}

      {/* Create Report Form */}
      {showCreateForm && (
        <DaisyCard >
  <DaisyCardHeader />
</DaisyCard>
            <DaisyCardTitle>Create New Automated Report</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <div className="text-center py-12 text-gray-500">
</DaisyCardContent>
              <Plus className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Report creation form coming soon</p>
              <p className="text-sm">Configure report templates, schedules, and delivery options</p>
              <DaisyButton 
                className="mt-4" 
                onClick={() => setShowCreateForm(false)} />
                Close
              </DaisyButton>
            </div>
          </DaisyCardContent>
        </DaisyCard>
      )}
    </div>
  );
};

export default AutomatedReports; 