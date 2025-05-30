import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Settings,
  Activity,
  BarChart3,
  Zap,
  FileText,
  Network,
  Eye
} from 'lucide-react';

import { aiIntegrationService } from '@/services/AIIntegrationService';
import { multiTenantAIService } from '@/services/MultiTenantAIService';
import { generateId } from '@/lib/utils';
import type { 
  AIServiceRequest, 
  AIServiceResponse, 
  AIIntegrationContext 
} from '@/services/AIIntegrationService';

// Service health type
interface ServiceHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, boolean>;
  uptime: number;
}

// Analysis type union
type AnalysisType = 'risk_analysis' | 'compliance_check' | 'control_recommendation' | 'proactive_monitoring' | 'custom_query';

interface ComprehensiveAIDashboardProps {
  userId: string;
  organizationId: string;
  tenantId?: string;
  userRole: 'admin' | 'analyst' | 'user';
}

export const ComprehensiveAIDashboard: React.FC<ComprehensiveAIDashboardProps> = ({
  userId,
  organizationId,
  tenantId,
  userRole = 'user'
}) => {
  const [activeTab, setActiveTab] = useState('analysis');
  const [queryText, setQueryText] = useState('');
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<AnalysisType>('risk_analysis');
  const [responses, setResponses] = useState<AIServiceResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [serviceHealth, setServiceHealth] = useState<ServiceHealthStatus | null>(null);

  // Load service health on component mount
  useEffect(() => {
    loadServiceHealth();
  }, []);

  const loadServiceHealth = async () => {
    try {
      const health = await aiIntegrationService.getServiceHealth();
      setServiceHealth(health);
    } catch (error) {
      console.error('Error loading service health:', error);
    }
  };

  const processAIQuery = async () => {
    if (!queryText.trim()) return;

    setLoading(true);
    try {
      const context: AIIntegrationContext = {
        tenantId,
        userId,
        sessionId: generateId('session'),
        organizationId,
        requestId: generateId('request'),
        timestamp: new Date(),
        source: 'comprehensive_dashboard',
        metadata: {
          userRole,
          analysisType: selectedAnalysisType
        }
      };

      const request: AIServiceRequest = {
        type: selectedAnalysisType,
        content: queryText,
        context,
        options: {
          securityLevel: 'enhanced',
          enableProactiveMonitoring: true
        }
      };

      const response = await aiIntegrationService.processAIRequest(request);
      setResponses(prev => [response, ...prev]);
      setQueryText('');
    } catch (error) {
      console.error('Error processing AI query:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalysisTypeChange = (value: string) => {
    setSelectedAnalysisType(value as AnalysisType);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAnalysisTypeIcon = (type: string) => {
    switch (type) {
      case 'risk_analysis': return <AlertTriangle className="w-4 h-4" />;
      case 'compliance_check': return <Shield className="w-4 h-4" />;
      case 'control_recommendation': return <Settings className="w-4 h-4" />;
      case 'proactive_monitoring': return <Eye className="w-4 h-4" />;
      case 'custom_query': return <Brain className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Intelligence Center</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive AI-powered risk management and compliance analysis
          </p>
        </div>
        {serviceHealth && (
          <Badge className={getStatusColor(serviceHealth.status)}>
            <Activity className="w-3 h-3 mr-1" />
            {serviceHealth.status.toUpperCase()}
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="tenants" className="flex items-center gap-2">
            <Network className="w-4 h-4" />
            Tenants
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* AI Analysis Tab */}
        <TabsContent value="analysis">
          <div className="space-y-6">
            {/* Query Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI Analysis Query
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="query">Query or Description</Label>
                    <Textarea
                      id="query"
                      placeholder="Describe your risk management question, compliance concern, or analysis request..."
                      value={queryText}
                      onChange={(e) => setQueryText(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="analysis-type">Analysis Type</Label>
                      <Select value={selectedAnalysisType} onValueChange={handleAnalysisTypeChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="risk_analysis">Risk Analysis</SelectItem>
                          <SelectItem value="compliance_check">Compliance Check</SelectItem>
                          <SelectItem value="control_recommendation">Control Recommendations</SelectItem>
                          <SelectItem value="proactive_monitoring">Proactive Monitoring</SelectItem>
                          <SelectItem value="custom_query">Custom Query</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={processAIQuery} 
                      disabled={loading || !queryText.trim()}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Analyze
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-4">
              {responses.map((response) => (
                <Card key={response.requestId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {getAnalysisTypeIcon(response.type)}
                        {response.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        <Badge variant={response.metadata.securityApproved ? 'default' : 'destructive'}>
                          {response.confidence.toFixed(0)}% Confidence
                        </Badge>
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        {response.metadata.processingTime}ms
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="prose max-w-none">
                      <p>{response.content}</p>
                    </div>

                    {response.recommendations && response.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Recommendations</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {response.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm text-gray-700">{String(rec)}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {response.insights && response.insights.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Key Insights</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {response.insights.map((insight, index) => (
                            <li key={index} className="text-sm text-gray-700">{String(insight)}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Model: {response.metadata.modelUsed}</span>
                        <span>Sources: {response.sources.join(', ')}</span>
                        {response.metadata.tenantIsolated && (
                          <Badge variant="outline">Tenant Isolated</Badge>
                        )}
                      </div>
                      {response.warnings && response.warnings.length > 0 && (
                        <Badge variant="destructive">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {response.warnings.length} Warning{response.warnings.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Service Health Tab */}
        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                AI Services Health Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {serviceHealth ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(serviceHealth.services).map(([service, isHealthy]) => (
                      <div key={service} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium capitalize">
                            {service.replace(/([A-Z])/g, ' $1').trim()}
                          </h3>
                          {isHealthy ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {isHealthy ? 'Operational' : 'Issues Detected'}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-sm text-gray-600">
                      Overall Status: <span className={`font-medium ${
                        serviceHealth.status === 'healthy' ? 'text-green-600' :
                        serviceHealth.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {serviceHealth.status.toUpperCase()}
                      </span>
                    </span>
                    <Button variant="outline" onClick={loadServiceHealth}>
                      Refresh Status
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading service health...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs with placeholder content */}
        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Compliance monitoring dashboard implementation...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>AI Insights & Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p>AI insights and analytics dashboard implementation...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tenants">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Tenant Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Multi-tenant management dashboard implementation...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>AI Configuration Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p>AI configuration settings implementation...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComprehensiveAIDashboard; 