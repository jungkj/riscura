import React, { useState, useEffect } from 'react';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisySelect } from '@/components/ui/DaisySelect';
// import { 
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
// import { multiTenantAIService } from '@/services/MultiTenantAIService';
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
      // console.error('Error loading service health:', error);
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
      // console.error('Error processing AI query:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalysisTypeChange = (_value: string) => {
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

  const getAnalysisTypeIcon = (_type: string) => {
    switch (type) {
      case 'risk_analysis': return <DaisyAlertTriangle className="w-4 h-4" >
  ;
</DaisyAlertTriangle>
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
        {Boolean(serviceHealth) && (
          <DaisyBadge className={getStatusColor(serviceHealth.status)} >
  <Activity className="w-3 h-3 mr-1" />
</DaisyBadge>
            {serviceHealth.status.toUpperCase()}
          </DaisyBadge>
        )}
      </div>

      <DaisyTabs value={activeTab} onValueChange={setActiveTab} >
          <DaisyTabsList className="grid w-full grid-cols-6" >
            <DaisyTabsTrigger value="analysis" className="flex items-center gap-2" >
              <Brain className="w-4 h-4" />
            Analysis
          </DaisyTabs>
          <DaisyTabsTrigger value="monitoring" className="flex items-center gap-2" >
              <Eye className="w-4 h-4" />
            Monitoring
          </DaisyTabsTrigger>
          <DaisyTabsTrigger value="compliance" className="flex items-center gap-2" >
              <Shield className="w-4 h-4" />
            Compliance
          </DaisyTabsTrigger>
          <DaisyTabsTrigger value="insights" className="flex items-center gap-2" >
              <BarChart3 className="w-4 h-4" />
            Insights
          </DaisyTabsTrigger>
          <DaisyTabsTrigger value="tenants" className="flex items-center gap-2" >
              <Network className="w-4 h-4" />
            Tenants
          </DaisyTabsTrigger>
          <DaisyTabsTrigger value="settings" className="flex items-center gap-2" >
              <Settings className="w-4 h-4" />
            Settings
          </DaisyTabsTrigger>
        </DaisyTabsList>

        {/* AI Analysis Tab */}
        <DaisyTabsContent value="analysis" >
            <div className="space-y-6">
            {/* Query Input */}
            <DaisyCard >
  <DaisyCardBody >
</DaisyTabsContent>
                <DaisyCardTitle className="flex items-center gap-2" >
  <Brain className="w-5 h-5" />
</DaisyCardTitle>
                  AI Analysis Query
                </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody className="space-y-4" >
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
</DaisyCardBody>
                  <div className="md:col-span-2">
                    <DaisyLabel htmlFor="query">Query or Description</DaisyLabel>
                    <DaisyTextarea
                      id="query"
                      placeholder="Describe your risk management question, compliance concern, or analysis request..."
                      value={queryText}
                      onChange={(e) = />
setQueryText(e.target.value)}
                      rows={3} />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <DaisyLabel htmlFor="analysis-type">Analysis Type</DaisyTextarea>
                      <DaisySelect value={selectedAnalysisType} onValueChange={handleAnalysisTypeChange} >
                          <DaisySelectTrigger>
                            <DaisySelectValue />
</DaisySelect>
                        <DaisySelectContent >
                            <DaisySelectItem value="risk_analysis">Risk Analysis</DaisySelectItem>
                          <DaisySelectItem value="compliance_check">Compliance Check</DaisySelectItem>
                          <DaisySelectItem value="control_recommendation">Control Recommendations</DaisySelectItem>
                          <DaisySelectItem value="proactive_monitoring">Proactive Monitoring</DaisySelectItem>
                          <DaisySelectItem value="custom_query">Custom Query</DaisySelectItem>
                        </DaisySelectContent>
                      </DaisySelect>
                    </div>
                    <DaisyButton 
                      onClick={processAIQuery} 
                      disabled={loading || !queryText.trim()}
                      className="w-full">
          {loading ? (

        </DaisyButton>
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
                    </DaisyButton>
                  </div>
                </div>
              </DaisyCardBody>
            </DaisyCard>

            {/* Results */}
            <div className="space-y-4">
              {responses.map((response) => (
                <DaisyCard key={response.requestId} >
  <DaisyCardBody >
</DaisyCard>
                    <div className="flex items-center justify-between">
                      <DaisyCardTitle className="flex items-center gap-2" >
  {getAnalysisTypeIcon(response.type)}
</DaisyCardTitle>
                        {response.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        <DaisyBadge variant={response.metadata.securityApproved ? 'default' : 'destructive'} >
  {response.confidence.toFixed(0)}% Confidence
</DaisyBadge>
                        </DaisyBadge>
                      </DaisyCardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        {response.metadata.processingTime}ms
                      </div>
                    </div>
                  
                  <DaisyCardBody className="space-y-4" >
  <div className="prose max-w-none">
</DaisyCardBody>
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
                          <DaisyBadge variant="outline">Tenant Isolated</DaisyBadge>
                        )}
                      </div>
                      {response.warnings && response.warnings.length > 0 && (
                        <DaisyBadge variant="error" >
  <DaisyAlertTriangle className="w-3 h-3 mr-1" >
  </DaisyBadge>
</DaisyAlert>
                          {response.warnings.length} Warning{response.warnings.length > 1 ? 's' : ''}
                        </DaisyBadge>
                      )}
                    </div>
                  </DaisyCardBody>
                </DaisyCard>
              ))}
            </div>
          </div>
        </DaisyTabsContent>

        {/* Service Health Tab */}
        <DaisyTabsContent value="monitoring" >
            <DaisyCard >
  <DaisyCardBody >
</DaisyTabsContent>
              <DaisyCardTitle className="flex items-center gap-2" >
  <Activity className="w-5 h-5" />
</DaisyCardTitle>
                AI Services Health Status
              </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  {serviceHealth ? (
</DaisyCardBody>
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
                            <DaisyAlertTriangle className="w-5 h-5 text-red-600" >
  )}
</DaisyAlertTriangle>
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
                    <DaisyButton variant="outline" onClick={loadServiceHealth}>
          Refresh Status

        </DaisyButton>
                    </DaisyButton>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading service health...</p>
                </div>
              )}
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>

        {/* Other tabs with placeholder content */}
        <DaisyTabsContent value="compliance" >
            <DaisyCard >
  <DaisyCardBody >
</DaisyTabsContent>
              <DaisyCardTitle>Compliance Monitoring</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <p>
</DaisyCardBody>Compliance monitoring dashboard implementation...</p>
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>

        <DaisyTabsContent value="insights" >
            <DaisyCard >
  <DaisyCardBody >
</DaisyTabsContent>
              <DaisyCardTitle>AI Insights & Analytics</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <p>
</DaisyCardBody>AI insights and analytics dashboard implementation...</p>
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>

        <DaisyTabsContent value="tenants" >
            <DaisyCard >
  <DaisyCardBody >
</DaisyTabsContent>
              <DaisyCardTitle>Multi-Tenant Management</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <p>
</DaisyCardBody>Multi-tenant management dashboard implementation...</p>
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>

        <DaisyTabsContent value="settings" >
            <DaisyCard >
  <DaisyCardBody >
</DaisyTabsContent>
              <DaisyCardTitle>AI Configuration Settings</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <p>
</DaisyCardBody>AI configuration settings implementation...</p>
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>
      </DaisyTabs>
    </div>
  );
};

export default ComprehensiveAIDashboard; 