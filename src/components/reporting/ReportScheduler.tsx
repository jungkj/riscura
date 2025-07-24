'use client';

import React, { useState, useEffect } from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyCheckbox } from '@/components/ui/DaisyCheckbox';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyTable, DaisyTableBody, DaisyTableCell, DaisyTableHead, DaisyTableHeader, DaisyTableRow } from '@/components/ui/DaisyTable';
import { DaisyDialog, DaisyDialogContent, DaisyDialogDescription, DaisyDialogHeader, DaisyDialogTitle, DaisyDialogTrigger } from '@/components/ui/DaisyDialog';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
import { DaisySwitch } from '@/components/ui/DaisySwitch';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Edit,
  Trash2,
  Play,
  Pause,
  MoreHorizontal,
  Mail,
  FileText,
  AlertCircle,
  CheckCircle,
  Info,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, addWeeks, addMonths, addQuarters } from 'date-fns';

interface ScheduledReport {
  id: string;
  name: string;
  description?: string;
  reportType: string;
  template: string;
  format: string[];
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // HH:mm format
  timezone: string;
  enabled: boolean;
  recipients: string[];
  parameters: Record<string, any>;
  filters: Record<string, any>;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  failureCount: number;
  createdAt: Date;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

interface ReportSchedulerProps {
  onSchedule?: (schedule: Partial<ScheduledReport>) => Promise<void>;
  onUpdate?: (id: string, schedule: Partial<ScheduledReport>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onToggle?: (id: string, enabled: boolean) => Promise<void>;
  onRunNow?: (id: string) => Promise<void>;
}

export default function ReportScheduler({
  onSchedule,
  onUpdate,
  onDelete,
  onToggle,
  onRunNow
}: ReportSchedulerProps) {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<ScheduledReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduledReport | null>(null);
  const [formData, setFormData] = useState<Partial<ScheduledReport>>({
    name: '',
    description: '',
    reportType: '',
    template: '',
    format: ['pdf'],
    frequency: 'weekly',
    time: '09:00',
    timezone: 'UTC',
    enabled: true,
    recipients: [],
    parameters: {},
    filters: {},
  });

  // Available report types and templates
  const reportTypes = [
    { value: 'RISK_ASSESSMENT', label: 'Risk Assessment' },
    { value: 'COMPLIANCE_STATUS', label: 'Compliance Status' },
    { value: 'CONTROL_EFFECTIVENESS', label: 'Control Effectiveness' },
    { value: 'EXECUTIVE_SUMMARY', label: 'Executive Summary' },
    { value: 'AUDIT_TRAIL', label: 'Audit Trail' },
  ];

  const timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'Asia/Shanghai', label: 'Shanghai' },
  ];

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/reports/schedule');
      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules || []);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load scheduled reports',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateNextRun = (schedule: Partial<ScheduledReport>): Date => {
    const now = new Date();
    const [hours, minutes] = schedule.time?.split(':').map(Number) || [9, 0];
    
    let nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);
    
    // If the time has already passed today, start from tomorrow
    if (nextRun <= now) {
      nextRun = addDays(nextRun, 1);
    }
    
    switch (schedule.frequency) {
      case 'daily':
        // Already set to next day if needed
        break;
      case 'weekly':
        const targetDay = schedule.dayOfWeek || 1; // Default to Monday
        const currentDay = nextRun.getDay();
        const daysUntilTarget = (targetDay - currentDay + 7) % 7;
        if (daysUntilTarget === 0 && nextRun <= now) {
          nextRun = addWeeks(nextRun, 1);
        } else {
          nextRun = addDays(nextRun, daysUntilTarget);
        }
        break;
      case 'monthly':
        const targetDate = schedule.dayOfMonth || 1;
        nextRun.setDate(targetDate);
        if (nextRun <= now) {
          nextRun = addMonths(nextRun, 1);
          nextRun.setDate(targetDate);
        }
        break;
      case 'quarterly':
        nextRun.setDate(1); // First day of month
        if (nextRun <= now) {
          nextRun = addQuarters(nextRun, 1);
        }
        break;
    }
    
    return nextRun;
  };

  const handleCreate = async () => {
    try {
      const scheduleData = {
        ...formData,
        nextRun: calculateNextRun(formData),
        runCount: 0,
        failureCount: 0,
      };

      if (onSchedule) {
        await onSchedule(scheduleData);
      } else {
        // Default create behavior
        const response = await fetch('/api/reports/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scheduleData),
        });

        if (!response.ok) {
          throw new Error('Failed to create schedule');
        }
      }

      toast({
        title: 'Success',
        description: 'Report schedule created successfully',
      });

      setIsCreateDialogOpen(false);
      resetForm();
      loadSchedules();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create report schedule',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedSchedule) return;

    try {
      const scheduleData = {
        ...formData,
        nextRun: calculateNextRun(formData),
      };

      if (onUpdate) {
        await onUpdate(selectedSchedule.id, scheduleData);
      } else {
        // Default update behavior
        const response = await fetch(`/api/reports/schedule/${selectedSchedule.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scheduleData),
        });

        if (!response.ok) {
          throw new Error('Failed to update schedule');
        }
      }

      toast({
        title: 'Success',
        description: 'Report schedule updated successfully',
      });

      setIsEditDialogOpen(false);
      resetForm();
      loadSchedules();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update report schedule',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (onDelete) {
        await onDelete(id);
      } else {
        // Default delete behavior
        const response = await fetch(`/api/reports/schedule/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete schedule');
        }
      }

      toast({
        title: 'Success',
        description: 'Report schedule deleted successfully',
      });

      loadSchedules();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete report schedule',
        variant: 'destructive',
      });
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      if (onToggle) {
        await onToggle(id, enabled);
      } else {
        // Default toggle behavior
        const response = await fetch(`/api/reports/schedule/${id}/toggle`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled }),
        });

        if (!response.ok) {
          throw new Error('Failed to toggle schedule');
        }
      }

      toast({
        title: 'Success',
        description: `Report schedule ${enabled ? 'enabled' : 'disabled'}`,
      });

      loadSchedules();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle report schedule',
        variant: 'destructive',
      });
    }
  };

  const handleRunNow = async (id: string) => {
    try {
      if (onRunNow) {
        await onRunNow(id);
      } else {
        // Default run now behavior
        const response = await fetch(`/api/reports/schedule/${id}/run`, {
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error('Failed to run report');
        }
      }

      toast({
        title: 'Success',
        description: 'Report generation started',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to run report',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (schedule: ScheduledReport) => {
    setSelectedSchedule(schedule);
    setFormData({
      name: schedule.name,
      description: schedule.description,
      reportType: schedule.reportType,
      template: schedule.template,
      format: schedule.format,
      frequency: schedule.frequency,
      dayOfWeek: schedule.dayOfWeek,
      dayOfMonth: schedule.dayOfMonth,
      time: schedule.time,
      timezone: schedule.timezone,
      enabled: schedule.enabled,
      recipients: schedule.recipients,
      parameters: schedule.parameters,
      filters: schedule.filters,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      reportType: '',
      template: '',
      format: ['pdf'],
      frequency: 'weekly',
      time: '09:00',
      timezone: 'UTC',
      enabled: true,
      recipients: [],
      parameters: {},
      filters: {},
    });
    setSelectedSchedule(null);
  };

  const getFrequencyBadge = (frequency: string) => {
    const colors = {
      daily: 'bg-blue-100 text-blue-800',
      weekly: 'bg-green-100 text-green-800',
      monthly: 'bg-purple-100 text-purple-800',
      quarterly: 'bg-orange-100 text-orange-800',
    };

    return (
      <DaisyBadge className={colors[frequency as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {frequency}
      </DaisyBadge>
    );
  };

  const getStatusIcon = (schedule: ScheduledReport) => {
    if (!schedule.enabled) {
      return <Pause className="h-4 w-4 text-gray-500" />;
    }
    
    if (schedule.failureCount > 0) {
      return <DaisyAlertCircle className="h-4 w-4 text-red-500" />;
    }
    
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const ScheduleForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <DaisyLabel htmlFor="name">Schedule Name</DaisyLabel>
          <DaisyInput
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Weekly Risk Report"
          />
        </div>
        <div className="space-y-2">
          <DaisyLabel htmlFor="reportType">Report Type</DaisyLabel>
          <DaisySelect
            value={formData.reportType}
            onValueChange={(value) => setFormData({ ...formData, reportType: value })}
          >
            <DaisySelectTrigger>
              <DaisySelectValue placeholder="Select report type" />
            </SelectTrigger>
            <DaisySelectContent>
              {reportTypes.map((type) => (
                <DaisySelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </DaisySelect>
        </div>
      </div>

      <div className="space-y-2">
        <DaisyLabel htmlFor="description">Description (Optional)</DaisyLabel>
        <DaisyInput
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of this scheduled report"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <DaisyLabel>Frequency</DaisyLabel>
          <DaisySelect
            value={formData.frequency}
            onValueChange={(value) => setFormData({ ...formData, frequency: value as any })}
          >
            <DaisySelectTrigger>
              <DaisySelectValue />
            </SelectTrigger>
            <DaisySelectContent>
              <DaisySelectItem value="daily">Daily</SelectItem>
              <DaisySelectItem value="weekly">Weekly</SelectItem>
              <DaisySelectItem value="monthly">Monthly</SelectItem>
              <DaisySelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </DaisySelect>
        </div>

        {formData.frequency === 'weekly' && (
          <div className="space-y-2">
            <DaisyLabel>Day of Week</DaisyLabel>
            <DaisySelect
              value={formData.dayOfWeek?.toString()}
              onValueChange={(value) => setFormData({ ...formData, dayOfWeek: parseInt(value) })}
            >
              <DaisySelectTrigger>
                <DaisySelectValue />
              </SelectTrigger>
              <DaisySelectContent>
                {daysOfWeek.map((day) => (
                  <DaisySelectItem key={day.value} value={day.value.toString()}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </DaisySelect>
          </div>
        )}

        {formData.frequency === 'monthly' && (
          <div className="space-y-2">
            <DaisyLabel>Day of Month</DaisyLabel>
            <DaisyInput
              type="number"
              min="1"
              max="31"
              value={formData.dayOfMonth}
              onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
              placeholder="1-31"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <DaisyLabel>Time</DaisyLabel>
          <DaisyInput
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <DaisyLabel>Timezone</DaisyLabel>
          <DaisySelect
            value={formData.timezone}
            onValueChange={(value) => setFormData({ ...formData, timezone: value })}
          >
            <DaisySelectTrigger>
              <DaisySelectValue />
            </SelectTrigger>
            <DaisySelectContent>
              {timezones.map((tz) => (
                <DaisySelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </DaisySelect>
        </div>
      </div>

      <div className="space-y-2">
        <DaisyLabel>Output Formats</DaisyLabel>
        <div className="flex gap-4">
          {['pdf', 'excel', 'csv'].map((format) => (
            <div key={format} className="flex items-center space-x-2">
              <DaisyCheckbox
                id={format}
                checked={formData.format?.includes(format)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFormData({ ...formData, format: [...(formData.format || []), format] });
                  } else {
                    setFormData({ ...formData, format: formData.format?.filter(f => f !== format) });
                  }
                }}
              />
              <DaisyLabel htmlFor={format} className="capitalize">{format}</DaisyLabel>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <DaisySwitch
          id="enabled"
          checked={formData.enabled}
          onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
        />
        <DaisyLabel htmlFor="enabled">Enable this schedule</DaisyLabel>
      </div>

      <div className="flex justify-end gap-2">
        <DaisyButton
          variant="outline"
          onClick={() => {
            if (isEdit) {
              setIsEditDialogOpen(false);
            } else {
              setIsCreateDialogOpen(false);
            }
            resetForm();
          }}
        >
          Cancel
        </DaisyButton>
        <DaisyButton onClick={isEdit ? handleUpdate : handleCreate}>
          {isEdit ? 'Update Schedule' : 'Create Schedule'}
        </DaisyButton>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Report Scheduler</h2>
          <p className="text-muted-foreground">
            Manage automated report generation and delivery
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DaisyButton onClick={loadSchedules} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </DaisyButton>
          <DaisyButton onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Schedule
          </DaisyButton>
        </div>
      </div>

      {/* Schedules Table */}
      <DaisyCard>
        <DaisyCardContent className="p-0">
          <DaisyTable>
            <DaisyTableHeader>
              <DaisyTableRow>
                <DaisyTableHead>Name</DaisyTableHead>
                <DaisyTableHead>Type</DaisyTableHead>
                <DaisyTableHead>Frequency</DaisyTableHead>
                <DaisyTableHead>Next Run</DaisyTableHead>
                <DaisyTableHead>Status</DaisyTableHead>
                <DaisyTableHead>Recipients</DaisyTableHead>
                <DaisyTableHead>Stats</DaisyTableHead>
                <DaisyTableHead className="w-32">Actions</DaisyTableHead>
              </DaisyTableRow>
            </DaisyTableHeader>
            <DaisyTableBody>
              {isLoading ? (
                <DaisyTableRow>
                  <DaisyTableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Loading schedules...
                    </div>
                  </DaisyTableCell>
                </DaisyTableRow>
              ) : schedules.length === 0 ? (
                <DaisyTableRow>
                  <DaisyTableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <DaisyCalendar className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No scheduled reports found</p>
                    </div>
                  </DaisyTableCell>
                </DaisyTableRow>
              ) : (
                schedules.map((schedule) => (
                  <DaisyTableRow key={schedule.id}>
                    <DaisyTableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{schedule.name}</span>
                        {schedule.description && (
                          <span className="text-xs text-muted-foreground">{schedule.description}</span>
                        )}
                      </div>
                    </DaisyTableCell>
                    <DaisyTableCell>
                      <DaisyBadge variant="outline">{schedule.reportType.replace('_', ' ')}</DaisyBadge>
                    </DaisyTableCell>
                    <DaisyTableCell>
                      {getFrequencyBadge(schedule.frequency)}
                    </DaisyTableCell>
                    <DaisyTableCell>
                      {schedule.nextRun ? (
                        <div className="flex flex-col">
                          <span className="text-sm">{format(new Date(schedule.nextRun), 'MMM dd, yyyy')}</span>
                          <span className="text-xs text-muted-foreground">{format(new Date(schedule.nextRun), 'HH:mm zzz')}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </DaisyTableCell>
                    <DaisyTableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(schedule)}
                        <span className="text-sm">
                          {schedule.enabled ? 'Active' : 'Paused'}
                        </span>
                      </div>
                    </DaisyTableCell>
                    <DaisyTableCell>
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{schedule.recipients.length}</span>
                      </div>
                    </DaisyTableCell>
                    <DaisyTableCell>
                      <div className="flex flex-col text-xs">
                        <span>Runs: {schedule.runCount}</span>
                        {schedule.failureCount > 0 && (
                          <span className="text-red-600">Failures: {schedule.failureCount}</span>
                        )}
                      </div>
                    </DaisyTableCell>
                    <DaisyTableCell>
                      <div className="flex items-center gap-1">
                        <DaisyButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRunNow(schedule.id)}
                          disabled={!schedule.enabled}
                        >
                          <Play className="h-4 w-4" />
                        </DaisyButton>
                        <DaisyButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggle(schedule.id, !schedule.enabled)}
                        >
                          {schedule.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </DaisyButton>
                        <DaisyButton
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(schedule)}
                        >
                          <Edit className="h-4 w-4" />
                        </DaisyButton>
                        <DaisyButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(schedule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </DaisyButton>
                      </div>
                    </DaisyTableCell>
                  </DaisyTableRow>
                ))
              )}
            </DaisyTableBody>
          </DaisyTable>
        </DaisyCardBody>
      </DaisyCard>

      {/* Create Schedule Dialog */}
      <DaisyDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DaisyDialogContent className="max-w-2xl">
          <DaisyDialogHeader>
            <DaisyDialogTitle>Create New Schedule</DaisyDialogTitle>
            <DaisyDialogDescription>
              Set up automated report generation and delivery
            </DaisyDialogDescription>
          </DaisyDialogHeader>
          <ScheduleForm />
        </DaisyDialogContent>
      </DaisyDialog>

      {/* Edit Schedule Dialog */}
      <DaisyDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DaisyDialogContent className="max-w-2xl">
          <DaisyDialogHeader>
            <DaisyDialogTitle>Edit Schedule</DaisyDialogTitle>
            <DaisyDialogDescription>
              Update the scheduled report configuration
            </DaisyDialogDescription>
          </DaisyDialogHeader>
          <ScheduleForm isEdit />
        </DaisyDialogContent>
      </DaisyDialog>
    </div>
  );
} 