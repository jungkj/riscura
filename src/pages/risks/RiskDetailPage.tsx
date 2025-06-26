"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, BarChart, Clipboard, FileText, Lightbulb, Shield, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Risk } from '@/types';

interface RiskDetailPageProps {
  riskId: string;
}

export default function RiskDetailPage({ riskId }: RiskDetailPageProps) {
  const router = useRouter();
  const [risk, setRisk] = useState<Risk | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate API call to fetch risk details
    const fetchRisk = async () => {
      setLoading(true);
      try {
        // Mock data - in a real app this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock risk data
        const mockRisk: Risk = {
          id: riskId || '1',
          title: 'Data Breach Vulnerability',
          description: 'Risk of unauthorized access to customer data due to weak encryption protocols and outdated access controls. This vulnerability was identified during the annual security assessment and confirmed by penetration testing.',
          category: 'technology',
          likelihood: 3,
          impact: 5,
          riskScore: 15,
          owner: 'Security Team',
          status: 'assessed',
          controls: ['c1', 'c2'],
          evidence: [],
          createdAt: '2025-01-15T10:30:00Z',
          updatedAt: '2025-01-20T14:45:00Z',
          aiConfidence: 0.92
        };
        
        setRisk(mockRisk);
      } catch (error) {
        console.error('Error fetching risk:', error);
        toast({
          title: 'Error',
          description: 'Failed to load risk details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchRisk();
  }, [riskId]);
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push('/risks')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="animate-pulse h-8 w-48 bg-muted rounded"></div>
        </div>
        
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-full bg-muted rounded"></div>
          <div className="h-32 w-full bg-muted rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-40 w-full bg-muted rounded"></div>
            <div className="h-40 w-full bg-muted rounded"></div>
            <div className="h-40 w-full bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!risk) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-xl font-semibold mb-2">Risk Not Found</h2>
        <p className="text-muted-foreground mb-4">The risk you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button onClick={() => router.push('/risks')}>
          Return to Risk Register
        </Button>
      </div>
    );
  }
  
  // Helper function to get severity class
  const getSeverityClass = (value: number, max: number = 5) => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
    if (percentage >= 50) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300";
    return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300";
  };
  
  // Get status badge
  const getStatusBadge = (status: Risk['status']) => {
    switch (status) {
      case 'identified':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Identified</Badge>;
      case 'assessed':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">Assessed</Badge>;
      case 'mitigated':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">Mitigated</Badge>;
      case 'closed':
        return <Badge className="bg-secondary/20 text-muted-foreground border-border">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push('/risks')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{risk.title}</h1>
          {risk.aiConfidence && (
            <Badge variant="outline">AI Identified</Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="danger" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Risk Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{risk.description}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Category</p>
                <p className="font-medium">{risk.category}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Owner</p>
                <p className="font-medium">{risk.owner}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <div>{getStatusBadge(risk.status)}</div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Created</p>
                <p className="font-medium">{new Date(risk.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center mb-4">
              <div className={`text-4xl font-bold rounded-full h-20 w-20 flex items-center justify-center ${getSeverityClass(risk.riskScore, 25)}`}>
                {risk.riskScore}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Likelihood</p>
                <Badge className={getSeverityClass(risk.likelihood)}>{risk.likelihood}/5</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Impact</p>
                <Badge className={getSeverityClass(risk.impact)}>{risk.impact}/5</Badge>
              </div>
            </div>
            
            <Alert className="mt-4">
              <BarChart className="h-4 w-4" />
              <AlertTitle>Risk Level</AlertTitle>
              <AlertDescription>
                This is classified as a {risk.riskScore >= 15 ? 'High' : risk.riskScore >= 8 ? 'Medium' : 'Low'} risk.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="controls" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="controls">
            <Shield className="h-4 w-4 mr-2" />
            Controls
          </TabsTrigger>
          <TabsTrigger value="assessment">
            <Clipboard className="h-4 w-4 mr-2" />
            Assessment
          </TabsTrigger>
          <TabsTrigger value="evidence">
            <FileText className="h-4 w-4 mr-2" />
            Evidence
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <Lightbulb className="h-4 w-4 mr-2" />
            AI Insights
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="controls" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Associated Controls</CardTitle>
              <CardDescription>
                Controls implemented to mitigate this risk
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">Data Encryption</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Implementation of AES-256 encryption for all stored customer data.
                      </p>
                    </div>
                    <Badge>Preventive</Badge>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>IT Security</span>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                      High Effectiveness
                    </Badge>
                  </div>
                </div>
                
                <div className="rounded-md border p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">Access Control Audit</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Quarterly review of all system access permissions and user rights.
                      </p>
                    </div>
                    <Badge>Detective</Badge>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>Internal Audit</span>
                    </div>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
                      Medium Effectiveness
                    </Badge>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full">
                  <Shield className="h-4 w-4 mr-2" />
                  Add Control
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="assessment" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
              <CardDescription>
                Detailed assessment of likelihood and impact
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Likelihood Assessment</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    The likelihood is rated as {risk.likelihood}/5 based on the following factors:
                  </p>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>Previous security incidents of similar nature</li>
                    <li>Known vulnerabilities in the current systems</li>
                    <li>Industry threat intelligence reports</li>
                    <li>Results from recent penetration testing</li>
                  </ul>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-2">Impact Assessment</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    The impact is rated as {risk.impact}/5 based on the following considerations:
                  </p>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>Potential financial loss from regulatory fines</li>
                    <li>Reputational damage and customer trust erosion</li>
                    <li>Cost of incident response and remediation</li>
                    <li>Potential legal liabilities</li>
                  </ul>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-2">Assessment Notes</h3>
                  <p className="text-sm text-muted-foreground">
                    This risk was reviewed and assessed by the Security Team on {new Date(risk.updatedAt).toLocaleDateString()}. 
                    The assessment considered both internal historical data and external threat intelligence.
                  </p>
                </div>
                
                <Button variant="outline" className="w-full">
                  <Edit className="h-4 w-4 mr-2" />
                  Update Assessment
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="evidence" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Supporting Evidence</CardTitle>
              <CardDescription>
                Documents and evidence related to this risk
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-12">
              <FileText className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Evidence Attached</h3>
              <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
                You haven't attached any supporting documentation or evidence to this risk yet.
              </p>
              <Button variant="outline">
                Upload Evidence
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recommendations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Recommendations</CardTitle>
              <CardDescription>
                AI-generated insights and control suggestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertTitle>AI Analysis</AlertTitle>
                  <AlertDescription>
                    Based on the risk profile and industry standards, the AI has generated the following recommendations.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  <div className="rounded-md border p-4">
                    <h3 className="font-medium mb-1">Implement Multi-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Adding MFA for all privileged access would significantly reduce the risk of unauthorized access.
                    </p>
                    <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                      98% Confidence
                    </Badge>
                  </div>
                  
                  <div className="rounded-md border p-4">
                    <h3 className="font-medium mb-1">Enhance Data Masking</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Implement data masking for sensitive information in non-production environments.
                    </p>
                    <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                      95% Confidence
                    </Badge>
                  </div>
                  
                  <div className="rounded-md border p-4">
                    <h3 className="font-medium mb-1">Regular Security Awareness Training</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Conduct quarterly security awareness training for all employees handling sensitive data.
                    </p>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
                      87% Confidence
                    </Badge>
                  </div>
                </div>
                
                <Button className="w-full">
                  Apply Recommendations
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}