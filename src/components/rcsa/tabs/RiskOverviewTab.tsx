"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Risk Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed">
              {risk.description}
            </p>
            
            {/* Risk Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Category</p>
                <Badge variant="outline" className="capitalize">
                  {risk.category.toLowerCase().replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <Badge className={getStatusColor(risk.status)}>
                  {risk.status.toLowerCase().replace('_', ' ')}
                </Badge>
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
                  <Calendar className="h-3 w-3" />
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
                <Progress 
                  value={risk.aiConfidence * 100} 
                  className="mt-2 h-2"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Related Controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Related Controls
                <Badge variant="secondary">{relatedControls.length}</Badge>
              </CardTitle>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Manage Controls
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {relatedControls.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No controls mapped to this risk yet.</p>
                <Button variant="outline" className="mt-4">
                  Map Controls
                </Button>
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
                        <Badge variant="outline" className="text-xs">
                          {control.type}
                        </Badge>
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
                        <Progress 
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
          </CardContent>
        </Card>
      </div>

      {/* Sidebar - Risk Metrics & Quick Actions */}
      <div className="space-y-6">
        {/* Risk Score Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Risk Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className={`text-4xl font-bold rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4 ${getRiskLevelColor(riskLevel)}`}>
                {riskScore}
              </div>
              <Badge className={getRiskLevelColor(riskLevel)} variant="secondary">
                {riskLevel} Risk
              </Badge>
            </div>
            
            <Separator className="my-4" />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{risk.likelihood}</div>
                <div className="text-xs text-muted-foreground">Likelihood</div>
                <Progress value={(risk.likelihood / 5) * 100} className="mt-1 h-1" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{risk.impact}</div>
                <div className="text-xs text-muted-foreground">Impact</div>
                <Progress value={(risk.impact / 5) * 100} className="mt-1 h-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Control Effectiveness Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Control Effectiveness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-foreground">
                {Math.round(averageEffectiveness * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Average Effectiveness</div>
              <Progress value={averageEffectiveness * 100} className="mt-2" />
            </div>

            <Separator className="my-4" />

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
          </CardContent>
        </Card>

        {/* Timeline Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
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
            
            <Button className="w-full mt-4" variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Assessment
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Risk
            </Button>
            <Button className="w-full" variant="outline">
              <Shield className="h-4 w-4 mr-2" />
              Map Controls
            </Button>
            <Button className="w-full" variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              Start Assessment
            </Button>
            <Button className="w-full" variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default RiskOverviewTab; 