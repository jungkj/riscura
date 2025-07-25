"use client";

import React from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import { 
  Shield, 
  TrendingUp, 
  Calendar, 
  User, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Edit,
  ExternalLink
} from 'lucide-react';
import { Risk, Control, RiskLevel } from '@/types/rcsa.types';
import { useRCSA } from '@/context/RCSAContext';
import { rcsaHelpers } from '@/lib/api/rcsa-client';

interface RiskOverviewTabProps {
  risk: Risk;
  relatedControls: Control[];
}

// Helper function to get risk level color
function getRiskLevelColor(level: RiskLevel): string {
  switch (level) {
    case 'LOW':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'HIGH':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'CRITICAL':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

// Helper function to get status color
function getStatusColor(status: Risk['status']): string {
  switch (status) {
    case 'IDENTIFIED':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'ASSESSED':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'MITIGATED':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'CLOSED':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

export function RiskOverviewTab({ risk, relatedControls }: RiskOverviewTabProps) {
  const { navigateToControl } = useRCSA();

  // Calculate risk metrics
  const riskScore = rcsaHelpers.calculateRiskScore(risk.likelihood, risk.impact);
  const riskLevel = rcsaHelpers.calculateRiskLevel(riskScore);
  
  // Calculate control effectiveness
  const averageEffectiveness = relatedControls.length > 0
    ? relatedControls.reduce((sum, control) => sum + control.effectiveness, 0) / relatedControls.length
    : 0;

  // Count controls by status
  const controlCounts = relatedControls.reduce((counts, control) => {
    counts[control.status] = (counts[control.status] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString();
  };

  const handleControlClick = (controlId: string) => {
    navigateToControl(controlId, {
      fromEntity: 'risk',
      fromId: risk.id,
      maintainContext: true
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Risk Information */}
      <div className="lg:col-span-2 space-y-6">
        {/* Risk Description */}
        <DaisyCard>
          <DaisyCardHeader>
            <DaisyCardTitle className="flex items-center gap-2">
              <DaisyAlertTriangle className="h-5 w-5" />
              Risk Description
            </DaisyCardTitle>
          
          <DaisyCardContent>
            <p className="text-foreground leading-relaxed">
              {risk.description}
            </p>
            
            {/* Risk Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Category</p>
                <DaisyBadge variant="outline" className="capitalize">
                  {risk.category.toLowerCase().replace('_', ' ')}
                </DaisyBadge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <DaisyBadge className={getStatusColor(risk.status)}>
                  {risk.status.toLowerCase().replace('_', ' ')}
                </DaisyBadge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Owner</p>
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span className="text-sm">{risk.owner || 'Unassigned'}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Created</p>
                <div className="flex items-center gap-1">
                  <DaisyCalendar className="h-3 w-3" />
                  <span className="text-sm">{formatDate(risk.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* AI Confidence */}
            {risk.aiConfidence && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    AI Confidence Score
                  </span>
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    {Math.round(risk.aiConfidence * 100)}%
                  </span>
                </div>
                <DaisyProgress 
                  value={risk.aiConfidence * 100} 
                  className="mt-2 h-2"
                />
              </div>
            )}
          </DaisyCardBody>
        </DaisyCard>

        {/* Related Controls */}
        <DaisyCard>
          <DaisyCardHeader>
            <div className="flex items-center justify-between">
              <DaisyCardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Related Controls
                <DaisyBadge variant="secondary">{relatedControls.length}</DaisyBadge>
              </DaisyCardTitle>
              <DaisyButton variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Manage Controls
              </DaisyButton>
            </div>
          
          <DaisyCardContent>
            {relatedControls.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No controls mapped to this risk yet.</p>
                <DaisyButton variant="outline" className="mt-4">
                  Map Controls
                </DaisyButton>
              </div>
            ) : (
              <div className="space-y-4">
                {relatedControls.map((control) => (
                  <div
                    key={control.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleControlClick(control.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{control.title}</h4>
                        <DaisyBadge variant="outline" className="text-xs">
                          {control.type}
                        </DaisyBadge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {control.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-muted-foreground">
                          Status: {control.status}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Effectiveness: {rcsaHelpers.formatEffectiveness(control.effectiveness)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className={`text-sm font-medium ${rcsaHelpers.getEffectivenessColor(control.effectiveness)}`}>
                          {rcsaHelpers.formatEffectiveness(control.effectiveness)}
                        </div>
                        <DaisyProgress 
                          value={control.effectiveness * 100} 
                          className="w-16 h-2 mt-1"
                        />
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DaisyCardBody>
        </DaisyCard>
      </div>

      {/* Sidebar - Risk Metrics & Quick Actions */}
      <div className="space-y-6">
        {/* Risk Score Card */}
        <DaisyCard>
          <DaisyCardHeader>
            <DaisyCardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Risk Score
            </DaisyCardTitle>
          
          <DaisyCardContent>
            <div className="text-center">
              <div className={`text-4xl font-bold rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4 ${getRiskLevelColor(riskLevel)}`}>
                {riskScore}
              </div>
              <DaisyBadge className={getRiskLevelColor(riskLevel)} variant="secondary">
                {riskLevel} Risk
              </DaisyBadge>
            </div>
            
            <DaisySeparator className="my-4" />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{risk.likelihood}</div>
                <div className="text-xs text-muted-foreground">Likelihood</div>
                <DaisyProgress value={(risk.likelihood / 5) * 100} className="mt-1 h-1" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{risk.impact}</div>
                <div className="text-xs text-muted-foreground">Impact</div>
                <DaisyProgress value={(risk.impact / 5) * 100} className="mt-1 h-1" />
              </div>
            </div>
          </DaisyCardBody>
        </DaisyCard>

        {/* Control Effectiveness Summary */}
        <DaisyCard>
          <DaisyCardHeader>
            <DaisyCardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Control Effectiveness
            </DaisyCardTitle>
          
          <DaisyCardContent>
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-foreground">
                {Math.round(averageEffectiveness * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Average Effectiveness</div>
              <DaisyProgress value={averageEffectiveness * 100} className="mt-2" />
            </div>

            <DaisySeparator className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Controls</span>
                <span className="font-medium">{relatedControls.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Operational</span>
                <span className="font-medium">{controlCounts['OPERATIONAL'] || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Testing</span>
                <span className="font-medium">{controlCounts['TESTING'] || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Planned</span>
                <span className="font-medium">{controlCounts['PLANNED'] || 0}</span>
              </div>
            </div>
          </DaisyCardBody>
        </DaisyCard>

        {/* Timeline Card */}
        <DaisyCard>
          <DaisyCardHeader>
            <DaisyCardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timeline
            </DaisyCardTitle>
          
          <DaisyCardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Identified</span>
                <span className="text-sm font-medium">
                  {formatDate(risk.dateIdentified)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Last Assessed</span>
                <span className="text-sm font-medium">
                  {formatDate(risk.lastAssessed)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Next Review</span>
                <span className="text-sm font-medium">
                  {formatDate(risk.nextReview)}
                </span>
              </div>
            </div>
            
            <DaisyButton className="w-full mt-4" variant="outline">
              <DaisyCalendar className="h-4 w-4 mr-2" />
              Schedule Assessment
            </DaisyButton>
          </DaisyCardBody>
        </DaisyCard>

        {/* Quick Actions */}
        <DaisyCard>
          <DaisyCardHeader>
            <DaisyCardTitle>Quick Actions</DaisyCardTitle>
          
          <DaisyCardContent className="space-y-2">
            <DaisyButton className="w-full" variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Risk
            </DaisyButton>
            <DaisyButton className="w-full" variant="outline">
              <Shield className="h-4 w-4 mr-2" />
              Map Controls
            </DaisyButton>
            <DaisyButton className="w-full" variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              Start Assessment
            </DaisyButton>
            <DaisyButton className="w-full" variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Analytics
            </DaisyButton>
          </DaisyCardBody>
        </DaisyCard>
      </div>
    </div>
  );
}

export default RiskOverviewTab; 