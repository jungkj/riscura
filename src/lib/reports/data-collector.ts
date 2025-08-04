import { PrismaClient, ReportType } from '@prisma/client';
import { subDays } from 'date-fns';

const prisma = new PrismaClient();

export interface ReportData {
  title: string;
  generatedAt: Date;
  period: {
    from: Date;
    to: Date;
  };
  sections: ReportSection[];
  summary: ReportSummary;
}

export interface ReportSection {
  title: string;
  type: 'table' | 'chart' | 'text' | 'metrics';
  data: any;
}

export interface ReportSummary {
  totalItems: number;
  keyMetrics: Record<string, number>;
  highlights: string[];
}

export class ReportDataCollector {
  async collectData(
    reportType: ReportType,
    parameters: Record<string, any>,
    organizationId: string
  ): Promise<ReportData> {
    const dateFrom = parameters.dateFrom || subDays(new Date(), 30);
    const dateTo = parameters.dateTo || new Date();

    switch (reportType) {
      case 'RISK_ASSESSMENT':
        return this.collectRiskAssessmentData(organizationId, dateFrom, dateTo, parameters);
      case 'CONTROL_EFFECTIVENESS':
        return this.collectControlEffectivenessData(organizationId, dateFrom, dateTo, parameters);
      case 'COMPLIANCE':
        return this.collectComplianceData(organizationId, dateFrom, dateTo, parameters);
      case 'AUDIT':
        return this.collectAuditData(organizationId, dateFrom, dateTo, parameters);
      case 'EXECUTIVE_DASHBOARD':
        return this.collectExecutiveDashboardData(organizationId, dateFrom, dateTo, parameters);
      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }
  }

  private async collectRiskAssessmentData(_organizationId: string,
    dateFrom: Date,
    dateTo: Date,
    parameters: Record<string, any>
  ): Promise<ReportData> {
    // Fetch risks with filters
    const risks = await prisma.risk.findMany({
      where: {
        organizationId,
        ...(parameters.riskCategories && {
          category: { in: parameters.riskCategories },
        }),
        ...(parameters.severities && {
          severity: { in: parameters.severities },
        }),
        ...(parameters.statuses && {
          status: { in: parameters.statuses },
        }),
      },
      include: {
        controls: {
          include: {
            control: true,
          },
        },
        assignedTo: true,
      },
    });

    // Calculate risk metrics
    const risksBySeverity = this.groupBy(risks, 'severity');
    const risksByCategory = this.groupBy(risks, 'category');
    const risksByStatus = this.groupBy(risks, 'status');

    // High and critical risks
    const highCriticalRisks = risks.filter(
      (r) => r.severity === 'HIGH' || r.severity === 'CRITICAL'
    );

    // Risks with inadequate controls
    const risksWithInadequateControls = risks.filter(
      (r) =>
        r.controls.length === 0 || r.controls.some((rc) => rc.control.effectiveness !== 'EFFECTIVE')
    );

    return {
      title: 'Risk Assessment Report',
      generatedAt: new Date(),
      period: { from: dateFrom, to: dateTo },
      sections: [
        {
          title: 'Executive Summary',
          type: 'metrics',
          data: {
            totalRisks: risks.length,
            highCriticalRisks: highCriticalRisks.length,
            risksWithInadequateControls: risksWithInadequateControls.length,
            averageRiskScore: this.calculateAverageRiskScore(risks),
          },
        },
        {
          title: 'Risk Distribution by Severity',
          type: 'chart',
          data: {
            type: 'pie',
            data: Object.entries(risksBySeverity).map(([severity, items]) => ({
              label: severity,
              value: items.length,
            })),
          },
        },
        {
          title: 'Risk Distribution by Category',
          type: 'chart',
          data: {
            type: 'bar',
            data: Object.entries(risksByCategory).map(([category, items]) => ({
              label: category,
              value: items.length,
            })),
          },
        },
        {
          title: 'Risk Details',
          type: 'table',
          data: {
            headers: ['Risk Name', 'Category', 'Severity', 'Status', 'Controls', 'Owner'],
            rows: risks.map((risk) => [
              risk.name,
              risk.category,
              risk.severity,
              risk.status,
              risk.controls.length,
              risk.assignedTo
                ? `${risk.assignedTo.firstName} ${risk.assignedTo.lastName}`
                : 'Unassigned',
            ]),
          },
        },
        {
          title: 'High & Critical Risks',
          type: 'table',
          data: {
            headers: ['Risk Name', 'Description', 'Impact', 'Mitigation Strategy'],
            rows: highCriticalRisks.map((risk) => [
              risk.name,
              risk.description || '',
              risk.impact || '',
              risk.mitigationStrategy || 'Not defined',
            ]),
          },
        },
      ],
      summary: {
        totalItems: risks.length,
        keyMetrics: {
          highCriticalRisks: highCriticalRisks.length,
          risksWithInadequateControls: risksWithInadequateControls.length,
          unassignedRisks: risks.filter((r) => !r.assignedTo).length,
        },
        highlights: [
          `${highCriticalRisks.length} high or critical risks require immediate attention`,
          `${risksWithInadequateControls.length} risks have inadequate control coverage`,
          `${Object.keys(risksByCategory).length} risk categories identified`,
        ],
      },
    };
  }

  private async collectControlEffectivenessData(_organizationId: string,
    dateFrom: Date,
    dateTo: Date,
    parameters: Record<string, any>
  ): Promise<ReportData> {
    // Fetch controls with test results
    const controls = await prisma.control.findMany({
      where: {
        organizationId,
        ...(parameters.controlTypes && {
          type: { in: parameters.controlTypes },
        }),
        ...(parameters.frequencies && {
          frequency: { in: parameters.frequencies },
        }),
      },
      include: {
        testScripts: {
          include: {
            testScript: {
              include: {
                testExecutions: {
                  where: {
                    executionDate: {
                      gte: dateFrom,
                      lte: dateTo,
                    },
                  },
                  orderBy: {
                    executionDate: 'desc',
                  },
                  take: 1,
                },
              },
            },
          },
        },
        risks: {
          include: {
            risk: true,
          },
        },
      },
    });

    // Calculate control effectiveness metrics
    const controlsByType = this.groupBy(controls, 'type');
    const controlsByEffectiveness = this.groupBy(controls, 'effectiveness');

    // Controls with recent test failures
    const failedControls = controls.filter((control) =>
      control.testScripts.some((ts) =>
        ts.testScript.testExecutions.some((te) => te.status === 'FAILED')
      )
    );

    // Controls without recent testing
    const untestedControls = controls.filter(
      (control) =>
        control.testScripts.length === 0 ||
        control.testScripts.every((ts) => ts.testScript.testExecutions.length === 0)
    );

    return {
      title: 'Control Effectiveness Report',
      generatedAt: new Date(),
      period: { from: dateFrom, to: dateTo },
      sections: [
        {
          title: 'Executive Summary',
          type: 'metrics',
          data: {
            totalControls: controls.length,
            effectiveControls: controlsByEffectiveness['EFFECTIVE']?.length || 0,
            failedControls: failedControls.length,
            untestedControls: untestedControls.length,
          },
        },
        {
          title: 'Control Effectiveness Distribution',
          type: 'chart',
          data: {
            type: 'pie',
            data: Object.entries(controlsByEffectiveness).map(([effectiveness, items]) => ({
              label: effectiveness,
              value: items.length,
            })),
          },
        },
        {
          title: 'Controls by Type',
          type: 'chart',
          data: {
            type: 'bar',
            data: Object.entries(controlsByType).map(([type, items]) => ({
              label: type,
              value: items.length,
            })),
          },
        },
        {
          title: 'Control Details',
          type: 'table',
          data: {
            headers: ['Control Name', 'Type', 'Frequency', 'Effectiveness', 'Last Test', 'Status'],
            rows: controls.map((control) => {
              const lastTest = control.testScripts
                .flatMap((ts) => ts.testScript.testExecutions)
                .sort((a, b) => b.executionDate.getTime() - a.executionDate.getTime())[0];

              return [
                control.name,
                control.type,
                control.frequency,
                control.effectiveness,
                lastTest ? lastTest.executionDate.toLocaleDateString() : 'Not tested',
                lastTest ? lastTest.status : 'N/A',
              ];
            }),
          },
        },
        {
          title: 'Failed Controls',
          type: 'table',
          data: {
            headers: ['Control Name', 'Description', 'Last Test Date', 'Failure Reason'],
            rows: failedControls.map((control) => {
              const failedTest = control.testScripts
                .flatMap((ts) => ts.testScript.testExecutions)
                .find((te) => te.status === 'FAILED');

              return [
                control.name,
                control.description || '',
                failedTest ? failedTest.executionDate.toLocaleDateString() : '',
                failedTest?.notes || 'No details provided',
              ];
            }),
          },
        },
      ],
      summary: {
        totalItems: controls.length,
        keyMetrics: {
          effectiveControls: controlsByEffectiveness['EFFECTIVE']?.length || 0,
          failedControls: failedControls.length,
          untestedControls: untestedControls.length,
          controlCoverage:
            controls.length > 0
              ? ((controls.length - untestedControls.length) / controls.length) * 100
              : 0,
        },
        highlights: [
          `${failedControls.length} controls failed recent testing`,
          `${untestedControls.length} controls have not been tested recently`,
          `${controls.length > 0 ? Math.round(((controls.length - untestedControls.length) / controls.length) * 100) : 0}% control test coverage`,
        ],
      },
    };
  }

  private async collectComplianceData(_organizationId: string,
    dateFrom: Date,
    dateTo: Date,
    parameters: Record<string, any>
  ): Promise<ReportData> {
    // This would integrate with compliance framework data
    // For now, returning a basic structure
    return {
      title: 'Compliance Report',
      generatedAt: new Date(),
      period: { from: dateFrom, to: dateTo },
      sections: [
        {
          title: 'Compliance Overview',
          type: 'text',
          data: 'Compliance data collection to be implemented',
        },
      ],
      summary: {
        totalItems: 0,
        keyMetrics: {},
        highlights: [],
      },
    };
  }

  private async collectAuditData(_organizationId: string,
    dateFrom: Date,
    dateTo: Date,
    parameters: Record<string, any>
  ): Promise<ReportData> {
    // This would integrate with audit data
    // For now, returning a basic structure
    return {
      title: 'Audit Report',
      generatedAt: new Date(),
      period: { from: dateFrom, to: dateTo },
      sections: [
        {
          title: 'Audit Summary',
          type: 'text',
          data: 'Audit data collection to be implemented',
        },
      ],
      summary: {
        totalItems: 0,
        keyMetrics: {},
        highlights: [],
      },
    };
  }

  private async collectExecutiveDashboardData(_organizationId: string,
    dateFrom: Date,
    dateTo: Date,
    parameters: Record<string, any>
  ): Promise<ReportData> {
    // Collect high-level metrics from multiple sources
    const [risks, controls, tasks] = await Promise.all([
      prisma.risk.findMany({ where: { organizationId } }),
      prisma.control.findMany({ where: { organizationId } }),
      prisma.task.findMany({
        where: {
          organizationId,
          createdAt: { gte: dateFrom, lte: dateTo },
        },
      }),
    ]);

    const highCriticalRisks = risks.filter(
      (r) => r.severity === 'HIGH' || r.severity === 'CRITICAL'
    );

    const effectiveControls = controls.filter((c) => c.effectiveness === 'EFFECTIVE');

    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');

    return {
      title: 'Executive Dashboard',
      generatedAt: new Date(),
      period: { from: dateFrom, to: dateTo },
      sections: [
        {
          title: 'Key Metrics',
          type: 'metrics',
          data: {
            totalRisks: risks.length,
            highCriticalRisks: highCriticalRisks.length,
            totalControls: controls.length,
            effectiveControls: effectiveControls.length,
            tasksCompleted: completedTasks.length,
            taskCompletionRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
          },
        },
        {
          title: 'Risk Overview',
          type: 'chart',
          data: {
            type: 'bar',
            data: [
              { label: 'Total Risks', value: risks.length },
              { label: 'High/Critical', value: highCriticalRisks.length },
              { label: 'Mitigated', value: risks.filter((r) => r.status === 'MITIGATED').length },
            ],
          },
        },
        {
          title: 'Control Effectiveness',
          type: 'chart',
          data: {
            type: 'pie',
            data: [
              { label: 'Effective', value: effectiveControls.length },
              {
                label: 'Partially Effective',
                value: controls.filter((c) => c.effectiveness === 'PARTIALLY_EFFECTIVE').length,
              },
              {
                label: 'Ineffective',
                value: controls.filter((c) => c.effectiveness === 'INEFFECTIVE').length,
              },
              {
                label: 'Not Evaluated',
                value: controls.filter((c) => c.effectiveness === 'NOT_EVALUATED').length,
              },
            ],
          },
        },
      ],
      summary: {
        totalItems: risks.length + controls.length + tasks.length,
        keyMetrics: {
          riskScore: this.calculateAverageRiskScore(risks),
          controlEffectiveness:
            controls.length > 0 ? (effectiveControls.length / controls.length) * 100 : 0,
          taskCompletionRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
        },
        highlights: [
          `${highCriticalRisks.length} high/critical risks identified`,
          `${controls.length > 0 ? Math.round((effectiveControls.length / controls.length) * 100) : 0}% controls rated as effective`,
          `${completedTasks.length} tasks completed in reporting period`,
        ],
      },
    };
  }

  // Helper methods
  private groupBy<T>(items: T[], key: keyof T): Record<string, T[]> {
    return items.reduce(
      (groups, item) => {
        const groupKey = String(item[key]);
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(item);
        return groups;
      },
      {} as Record<string, T[]>
    );
  }

  private calculateAverageRiskScore(_risks: any[]): number {
    if (risks.length === 0) return 0;

    const severityScores: Record<string, number> = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      CRITICAL: 4,
    };

    const totalScore = risks.reduce((sum, risk) => {
      return sum + (severityScores[risk.severity] || 0);
    }, 0);

    return totalScore / risks.length;
  }
}
