import React from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Eye, Edit3, AlertTriangle, Shield, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Risk } from '@/types';
import {
  ContentSelectionProvider,
  EnhancedSelectableContent,
  ContentSelectionControls,
} from '@/components/ai/ContentSelectionProvider';

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';

export default function RiskDetailPageWithSelection() {
  const params = useParams();
  const id = params?.id as string;
  
  // Mock risk data instead of using context hook
  const mockRisks: Risk[] = [
    {
      id: 'risk-1',
      title: 'Data Breach Risk',
      description: 'Risk of unauthorized access to sensitive customer data through system vulnerabilities',
      category: 'technology',
      likelihood: 3,
      impact: 5,
      riskScore: 15,
      riskLevel: 'high',
      owner: 'admin',
      status: 'identified',
      controls: ['control-1', 'control-2'],
      evidence: [],
      createdAt: new Date('2024-01-15').toISOString(),
      updatedAt: new Date('2024-01-20').toISOString(),
      dateIdentified: new Date('2024-01-15'),
    },
    {
      id: 'risk-2',
      title: 'Operational Process Risk',
      description: 'Risk of process failures leading to service disruption',
      category: 'operational',
      likelihood: 2,
      impact: 3,
      riskScore: 6,
      riskLevel: 'medium',
      owner: 'manager',
      status: 'assessed',
      controls: ['control-3'],
      evidence: [],
      createdAt: new Date('2024-01-20').toISOString(),
      updatedAt: new Date('2024-01-25').toISOString(),
      dateIdentified: new Date('2024-01-20'),
    },
  ];
  
  const risk = mockRisks.find(r => r.id === id);

  if (!risk) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Risk Not Found
          </h1>
          <p className="text-muted-foreground">
            The requested risk could not be found.
          </p>
          <Button className="mt-4" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-secondary/20 text-foreground border-border';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'in progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'closed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-secondary/20 text-foreground border-border';
    }
  };

  return (
    <ContentSelectionProvider
      enableBatching={true}
      enableAnalysis={true}
      maxHistory={20}
      availableActions={['explain', 'improve', 'analyze-risk', 'suggest-controls', 'compliance-check', 'alternatives']}
    >
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Risks
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              View History
            </Button>
            <Button size="sm">
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Risk
            </Button>
          </div>
        </div>

        {/* Risk Overview */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">
                  <EnhancedSelectableContent 
                    contentType="risk" 
                    contentId={risk.id}
                    sectionType="title"
                    showQualityScore={true}
                  >
                    {risk.title}
                  </EnhancedSelectableContent>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getRiskLevelColor(risk.riskLevel || 'medium')}>
                    {risk.riskLevel || 'Medium'} Risk
                  </Badge>
                  <Badge className={getStatusColor(risk.status)}>
                    {risk.status}
                  </Badge>
                  <Badge variant="outline">
                    {risk.category}
                  </Badge>
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <div className="flex items-center gap-1 mb-1">
                  <Calendar className="w-3 h-3" />
                  Created: {risk.dateIdentified ? new Date(risk.dateIdentified).toLocaleDateString() : 'N/A'}
                </div>
                <div>ID: {risk.id}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Risk Description
                </h3>
                <EnhancedSelectableContent 
                  contentType="risk" 
                  contentId={risk.id}
                  sectionType="description"
                  showQualityScore={true}
                >
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {risk.description}
                  </p>
                </EnhancedSelectableContent>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Risk Metrics</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Likelihood:</span>
                    <EnhancedSelectableContent 
                      contentType="risk" 
                      contentId={risk.id}
                      sectionType="likelihood"
                    >
                      <Badge variant="outline">{risk.likelihood}</Badge>
                    </EnhancedSelectableContent>
                  </div>
                  <div className="flex justify-between">
                    <span>Impact:</span>
                    <EnhancedSelectableContent 
                      contentType="risk" 
                      contentId={risk.id}
                      sectionType="impact"
                    >
                      <Badge variant="outline">{risk.impact}</Badge>
                    </EnhancedSelectableContent>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk Score:</span>
                    <EnhancedSelectableContent 
                      contentType="risk" 
                      contentId={risk.id}
                      sectionType="riskScore"
                    >
                      <Badge variant="secondary">{risk.riskScore}</Badge>
                    </EnhancedSelectableContent>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Assessment Details */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Impact Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Impact Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedSelectableContent 
                contentType="risk" 
                contentId={risk.id}
                sectionType="impactAnalysis"
                showQualityScore={true}
              >
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-medium mb-1">Financial Impact</h4>
                    <p className="text-muted-foreground">
                      Potential financial losses could range from $50,000 to $500,000 
                      depending on the severity and duration of the incident.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Operational Impact</h4>
                    <p className="text-muted-foreground">
                      Could result in 2-7 days of system downtime affecting customer 
                      service and internal operations.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Reputational Impact</h4>
                    <p className="text-muted-foreground">
                      May damage customer trust and brand reputation, potentially 
                      leading to customer churn and negative media coverage.
                    </p>
                  </div>
                </div>
              </EnhancedSelectableContent>
            </CardContent>
          </Card>

          {/* Existing Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Existing Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedSelectableContent 
                contentType="control" 
                contentId={`${risk.id}-controls`}
                sectionType="existingControls"
                showQualityScore={true}
              >
                <div className="space-y-3">
                  {risk.existingControls?.map((control, index) => (
                    <div key={index} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {control.type}
                        </Badge>
                        <Badge 
                          variant="secondary" 
                          className={control.effectiveness === 'High' ? 'bg-green-100 text-green-800' : 
                                    control.effectiveness === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                                    'bg-red-100 text-red-800'}
                        >
                          {control.effectiveness}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-sm mb-1">{control.name}</h4>
                      <p className="text-xs text-muted-foreground">{control.description}</p>
                    </div>
                  )) || (
                    <p className="text-sm text-muted-foreground">
                      No existing controls have been documented for this risk.
                    </p>
                  )}
                </div>
              </EnhancedSelectableContent>
            </CardContent>
          </Card>
        </div>

        {/* Mitigation Strategy */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Mitigation Strategy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EnhancedSelectableContent 
              contentType="risk" 
              contentId={risk.id}
              sectionType="mitigationStrategy"
              showQualityScore={true}
            >
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Recommended Actions</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span>Implement automated backup systems with 4-hour recovery time objectives</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span>Establish redundant data centers in geographically separated locations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span>Conduct quarterly disaster recovery testing and documentation updates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span>Train staff on incident response procedures and communication protocols</span>
                    </li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Implementation Timeline</h4>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Phase 1 (0-3 months):</span>
                      <p className="text-muted-foreground">Backup system implementation and testing</p>
                    </div>
                    <div>
                      <span className="font-medium">Phase 2 (3-6 months):</span>
                      <p className="text-muted-foreground">Secondary data center establishment</p>
                    </div>
                    <div>
                      <span className="font-medium">Phase 3 (6-9 months):</span>
                      <p className="text-muted-foreground">Staff training and procedure documentation</p>
                    </div>
                    <div>
                      <span className="font-medium">Ongoing:</span>
                      <p className="text-muted-foreground">Quarterly testing and continuous improvement</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Success Metrics</h4>
                  <div className="text-sm space-y-1">
                    <p>• Recovery Time Objective (RTO): 4 hours</p>
                    <p>• Recovery Point Objective (RPO): 1 hour</p>
                    <p>• System availability: 99.9% uptime</p>
                    <p>• Successful DR test completion: 100% quarterly</p>
                  </div>
                </div>
              </div>
            </EnhancedSelectableContent>
          </CardContent>
        </Card>

        {/* Content Selection Controls */}
        <ContentSelectionControls />
      </div>
    </ContentSelectionProvider>
  );
} 