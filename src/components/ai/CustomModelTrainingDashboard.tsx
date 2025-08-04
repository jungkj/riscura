import React, { useState, useEffect } from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { 
  Brain, 
  Database,
  TrendingUp,
  Play,
  Settings,
  BookOpen,
  TestTube,
  Rocket,
  Monitor,
  Clock,
  CheckCircle,
  AlertTriangle,
  Upload,
  RefreshCw
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
  customModelTrainingService,
  type TrainingJob,
  type KnowledgeBase,
  type ABTestExperiment,
  type ModelDeployment,
  type ModelPerformance
} from '@/services/CustomModelTrainingService';

interface CustomModelTrainingDashboardProps {
  organizationId: string;
  className?: string;
  refreshInterval?: number;
}

interface TrainingMetrics {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalModels: number;
  deployedModels: number;
  knowledgeBases: number;
  activeExperiments: number;
}

interface ModelOverview {
  id: string;
  name: string;
  status: string;
  accuracy: number;
  lastUpdated: Date;
  version: string;
  deploymentStatus: string;
}

export const CustomModelTrainingDashboard: React.FC<CustomModelTrainingDashboardProps> = ({
  organizationId,
  className,
  refreshInterval = 30000
}) => {
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [experiments, setExperiments] = useState<ABTestExperiment[]>([]);
  const [deployments, setDeployments] = useState<ModelDeployment[]>([]);
  const [performance, setPerformance] = useState<ModelPerformance[]>([]);
  const [metrics, setMetrics] = useState<TrainingMetrics | null>(null);
  const [modelOverviews, setModelOverviews] = useState<ModelOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  // Fetch training data
  const fetchTrainingData = async () => {
    try {
      setLoading(true);
      
      // Get training jobs for organization
      const jobs = await customModelTrainingService.getOrganizationModels(organizationId);
      setTrainingJobs(jobs);
      
      // Generate mock data for other components
      const mockKnowledgeBases = await generateMockKnowledgeBases();
      setKnowledgeBases(mockKnowledgeBases);
      
      const mockExperiments = await generateMockExperiments();
      setExperiments(mockExperiments);
      
      const mockDeployments = await generateMockDeployments();
      setDeployments(mockDeployments);
      
      const mockPerformance = await generateMockPerformance();
      setPerformance(mockPerformance);
      
      // Calculate metrics
      const trainingMetrics = calculateTrainingMetrics(jobs, mockKnowledgeBases, mockExperiments, mockDeployments);
      setMetrics(trainingMetrics);
      
      // Generate model overviews
      const overviews = generateModelOverviews(jobs, mockDeployments);
      setModelOverviews(overviews);
      
    } catch (error) {
      // console.error('Error fetching training data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock knowledge bases
  const generateMockKnowledgeBases = async (): Promise<KnowledgeBase[]> => {
    return [
      {
        id: 'kb-1',
        name: 'Risk Management Policies',
        description: 'Company risk management policies and procedures',
        organizationId,
        version: '1.2.0',
        documents: [],
        embeddings: {
          vectorDimension: 1536,
          indexType: 'faiss',
          indexConfig: {},
          totalVectors: 250,
          lastUpdated: new Date()
        },
        indexConfig: { similarity: 'cosine', numResults: 10, threshold: 0.8 },
        accessConfig: { permissions: ['read'], userGroups: ['analysts'], apiAccess: true },
        qualityMetrics: {
          averageQuality: 85,
          totalDocuments: 250,
          categoryCoverage: { policies: 100, procedures: 80, guidelines: 75 },
          lastAssessment: new Date()
        },
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }
    ];
  };

  // Generate mock experiments
  const generateMockExperiments = async (): Promise<ABTestExperiment[]> => {
    return [
      {
        id: 'exp-1',
        name: 'Risk Classification Model A/B Test',
        description: 'Testing new risk classification model against baseline',
        status: 'running',
        hypothesis: 'New model will improve accuracy by 15%',
        variants: [
          {
            id: 'variant-a',
            name: 'Baseline Model',
            modelId: 'model-baseline',
            version: '1.0.0',
            configuration: { temperature: 0.7, maxTokens: 1000 },
            allocation: 50,
            status: 'active'
          },
          {
            id: 'variant-b',
            name: 'Enhanced Model',
            modelId: 'model-enhanced',
            version: '2.0.0',
            configuration: { temperature: 0.5, maxTokens: 1500, useAdvancedFeatures: true },
            allocation: 50,
            status: 'active'
          }
        ],
        trafficAllocation: { strategy: 'random', allocations: { 'variant-a': 50, 'variant-b': 50 } },
        successMetrics: [
          {
            name: 'Accuracy',
            type: 'quality',
            target: 0.85,
            direction: 'increase',
            significance: 'primary'
          }
        ],
        experimentConfig: {
          minSampleSize: 1000,
          maxDuration: 30,
          significanceLevel: 0.05,
          power: 0.8,
          earlyStoppingEnabled: true
        },
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    ];
  };

  // Generate mock deployments
  const generateMockDeployments = async (): Promise<ModelDeployment[]> => {
    return [
      {
        id: 'deploy-1',
        modelId: 'model-1',
        version: '1.0.0',
        target: {
          id: 'target-prod',
          name: 'Production Environment',
          environment: 'production',
          type: 'api',
          configuration: {
            replicas: 3,
            resources: { cpu: '1', memory: '2Gi', storage: '5Gi' },
            environment: { NODE_ENV: 'production', API_VERSION: 'v1' },
            healthCheck: { path: '/health', interval: 30, timeout: 5, retries: 3 }
          },
          resources: { cpu: '2', memory: '4Gi', storage: '10Gi' },
          scaling: { minReplicas: 2, maxReplicas: 10, targetCPU: 70, targetMemory: 80 },
          monitoring: { metrics: ['requests', 'latency', 'errors'], alerts: [], dashboard: 'grafana' }
        },
        status: 'deployed',
        health: {
          status: 'healthy',
          uptime: 99.9,
          errorRate: 0.1,
          latency: 125,
          throughput: 1000
        },
        metrics: {
          requestCount: 50000,
          successRate: 99.9,
          averageLatency: 125,
          errorCount: 50,
          lastUpdated: new Date()
        },
        rolloutStrategy: { type: 'immediate', percentage: 100 },
        rollbackConfig: {
          enabled: true,
          triggers: ['error_rate_high'],
          maxRollbackAttempts: 3
        },
        deployedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        lastHealthCheck: new Date()
      }
    ];
  };

  // Generate mock performance data
  const generateMockPerformance = async (): Promise<ModelPerformance[]> => {
    return [
      {
        modelId: 'model-1',
        version: '1.0.0',
        period: { start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), end: new Date() },
        metrics: {
          accuracy: 0.87,
          latency: { p50: 100, p95: 200, p99: 300, average: 125 },
          throughput: 1000,
          errorRate: 0.1,
          userSatisfaction: 4.2,
          businessMetrics: {
            costPerPrediction: 0.01,
            revenueImpact: 50000,
            customerSatisfaction: 4.2,
            operationalEfficiency: 85
          },
          technicalMetrics: {
            memoryUsage: 2.5,
            cpuUtilization: 65,
            diskUsage: 80,
            networkLatency: 10
          }
        },
        degradationAlerts: [],
        driftDetection: {
          detected: false,
          severity: 'low',
          driftType: 'data',
          confidence: 0.3,
          affectedFeatures: [],
          recommendations: [],
          detectedAt: new Date()
        },
        feedbackAnalysis: {
          totalFeedback: 500,
          averageRating: 4.2,
          sentimentDistribution: { positive: 70, neutral: 25, negative: 5 },
          commonIssues: ['Slow response times', 'Occasional accuracy issues'],
          improvements: ['Better feature engineering', 'More training data']
        },
        recommendations: [
          {
            type: 'retrain',
            priority: 'medium',
            description: 'Consider retraining with recent data to improve accuracy',
            expectedImpact: '5% accuracy improvement',
            effort: 'medium'
          }
        ]
      }
    ];
  };

  // Calculate training metrics
  const calculateTrainingMetrics = (
    jobs: TrainingJob[],
    kbs: KnowledgeBase[],
    exps: ABTestExperiment[],
    deps: ModelDeployment[]
  ): TrainingMetrics => {
    return {
      totalJobs: jobs.length,
      activeJobs: jobs.filter(job => job.status === 'training' || job.status === 'pending').length,
      completedJobs: jobs.filter(job => job.status === 'completed').length,
      failedJobs: jobs.filter(job => job.status === 'failed').length,
      totalModels: jobs.filter(job => job.status === 'completed').length,
      deployedModels: deps.filter(dep => dep.status === 'deployed').length,
      knowledgeBases: kbs.length,
      activeExperiments: exps.filter(exp => exp.status === 'running').length
    };
  };

  // Generate model overviews
  const generateModelOverviews = (
    jobs: TrainingJob[],
    deployments: ModelDeployment[]
  ): ModelOverview[] => {
    return jobs
      .filter(job => job.status === 'completed')
      .map(job => {
        const deployment = deployments.find(dep => dep.modelId === `model-${job.id}`);
        return {
          id: job.id,
          name: job.name,
          status: job.status,
          accuracy: job.metrics?.accuracy?.[job.metrics.accuracy.length - 1] || 0,
          lastUpdated: job.completedAt || job.createdAt,
          version: '1.0.0',
          deploymentStatus: deployment?.status || 'not_deployed'
        };
      });
  };

  // Start training job
  const handleStartTraining = async (jobId: string) => {
    try {
      await customModelTrainingService.startTraining(jobId);
      await fetchTrainingData();
    } catch (error) {
      // console.error('Error starting training:', error);
    }
  };

  // Auto-refresh data
  useEffect(() => {
    fetchTrainingData();
    
    const interval = setInterval(fetchTrainingData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, organizationId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'deployed':
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'training':
      case 'running': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'pending':
      case 'deploying': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'failed':
      case 'unhealthy': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'deployed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'training':
      case 'running': return <Play className="h-4 w-4 text-blue-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed': return <DaisyAlertTriangle className="h-4 w-4 text-red-600" >
  ;
</DaisyAlertTriangle>
      default: return <Monitor className="h-4 w-4 text-gray-600" />;
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading && !metrics) {
    return (
      <DaisyCard className={cn("w-full", className)} >
  <DaisyCardBody >
</DaisyCard>
          <DaisyCardTitle className="flex items-center gap-2" >
  <Brain className="h-5 w-5 text-blue-600 animate-pulse" />
</DaisyCardTitle>
            Loading Custom Model Training Dashboard...
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
            <Brain className="h-6 w-6 text-blue-600" />
            Custom Model Training
          </h1>
          <p className="text-gray-600">Train and deploy organization-specific AI models</p>
        </div>
        <div className="flex items-center gap-2">
          <DaisyButton variant="outline" size="sm" >
  <Upload className="h-4 w-4 mr-1" />
</DaisyButton>
            Import Data
          </DaisyButton>
          <DaisyButton variant="outline" size="sm" onClick={fetchTrainingData} disabled={loading} >
  <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
</DaisyButton>
            Refresh
          </DaisyButton>
          <DaisyButton size="sm" >
  <Play className="h-4 w-4 mr-1" />
</DaisyButton>
            New Training Job
          </DaisyButton>
        </div>
      </div>

      {/* Training Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DaisyCard >
  <DaisyCardBody className="p-4" >
  </DaisyCard>
</DaisyCardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Training Jobs</p>
                  <p className="text-2xl font-bold text-blue-600">{metrics.activeJobs}</p>
                </div>
                <Play className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {metrics.totalJobs} total jobs
              </div>
            </DaisyCardBody>
          </DaisyCard>

          <DaisyCard >
  <DaisyCardBody className="p-4" >
  </DaisyCard>
</DaisyCardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Deployed Models</p>
                  <p className="text-2xl font-bold text-green-600">{metrics.deployedModels}</p>
                </div>
                <Rocket className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {metrics.totalModels} trained models
              </div>
            </DaisyCardBody>
          </DaisyCard>

          <DaisyCard >
  <DaisyCardBody className="p-4" >
  </DaisyCard>
</DaisyCardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Knowledge Bases</p>
                  <p className="text-2xl font-bold text-purple-600">{metrics.knowledgeBases}</p>
                </div>
                <Database className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Active knowledge sources
              </div>
            </DaisyCardBody>
          </DaisyCard>

          <DaisyCard >
  <DaisyCardBody className="p-4" >
  </DaisyCard>
</DaisyCardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">A/B Experiments</p>
                  <p className="text-2xl font-bold text-orange-600">{metrics.activeExperiments}</p>
                </div>
                <TestTube className="h-8 w-8 text-orange-600" />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Running experiments
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </div>
      )}

      <DaisyTabs value={activeTab} onValueChange={setActiveTab} >
          <DaisyTabsList className="grid w-full grid-cols-6" >
            <DaisyTabsTrigger value="overview">Overview</DaisyTabs>
          <DaisyTabsTrigger value="training">Training Jobs</DaisyTabsTrigger>
          <DaisyTabsTrigger value="knowledge">Knowledge Bases</DaisyTabsTrigger>
          <DaisyTabsTrigger value="experiments">A/B Testing</DaisyTabsTrigger>
          <DaisyTabsTrigger value="deployments">Deployments</DaisyTabsTrigger>
          <DaisyTabsTrigger value="performance">Performance</DaisyTabsTrigger>
        </DaisyTabsList>

        {/* Overview Tab */}
        <DaisyTabsContent value="overview" className="space-y-6" >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Training Status Distribution */}
            <DaisyCard >
  <DaisyCardBody >
</DaisyTabsContent>
                <DaisyCardTitle className="flex items-center gap-2" >
  <TrendingUp className="h-5 w-5 text-blue-600" />
</DaisyCardTitle>
                  Training Job Status
                </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  {metrics && (
</DaisyCardBody>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Active', value: metrics.activeJobs, color: '#3b82f6' },
                            { name: 'Completed', value: metrics.completedJobs, color: '#10b981' },
                            { name: 'Failed', value: metrics.failedJobs, color: '#ef4444' }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[...Array(3)].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <DaisyTooltip /></DaisyTooltip>
                    </ResponsiveContainer>
                  </div>
                )}
              </DaisyCardBody>
            </DaisyCard>

            {/* Model Performance Overview */}
            <DaisyCard >
  <DaisyCardBody >
</DaisyCard>
                <DaisyCardTitle className="flex items-center gap-2" >
  <TrendingUp className="h-5 w-5 text-green-600" />
</DaisyCardTitle>
                  Model Performance Trends
                </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="h-64">
</DaisyCardBody>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performance.slice(0, 7).map((p, i) => ({
                      day: `Day ${i + 1}`,
                      accuracy: (p.metrics?.accuracy || 0) * 100,
                      latency: p.metrics?.latency?.average || 0
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <DaisyTooltip>
                        <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="accuracy" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Accuracy (%)" />
                      <Line 
                        type="monotone" 
                        dataKey="latency" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Latency (ms)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </DaisyTooltip>
            </DaisyCard>
          </div>

          {/* Recent Models */}
          <DaisyCard >
  <DaisyCardBody >
</DaisyCard>
              <DaisyCardTitle className="flex items-center gap-2" >
  <Brain className="h-5 w-5 text-purple-600" />
</DaisyCardTitle>
                Recent Models
              </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="space-y-3">
</DaisyCardBody>
                {modelOverviews.slice(0, 5).map((model) => (
                  <div key={model.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(model.status)}
                      <div>
                        <p className="font-medium">{model.name}</p>
                        <p className="text-xs text-gray-500">
                          Version {model.version} • Updated {model.lastUpdated.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm">
                        <span className="text-gray-500">Accuracy:</span>
                        <span className="ml-1 font-medium">{(model.accuracy * 100).toFixed(1)}%</span>
                      </div>
                      <DaisyBadge className={getStatusColor(model.deploymentStatus)} >
  {model.deploymentStatus}
</DaisyBadge>
                      </DaisyBadge>
                    </div>
                  </div>
                ))}
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>

        {/* Training Jobs Tab */}
        <DaisyTabsContent value="training" className="space-y-4" >
            <DaisyCard >
  <DaisyCardBody >
</DaisyTabsContent>
              <DaisyCardTitle className="flex items-center gap-2" >
  <Play className="h-5 w-5 text-blue-600" />
</DaisyCardTitle>
                Training Jobs ({trainingJobs.length})
              </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="space-y-3">
</DaisyCardBody>
                {trainingJobs.map((job) => (
                  <div key={job.id} className="border rounded p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <h4 className="font-medium">{job.name}</h4>
                          <p className="text-sm text-gray-500">
                            Started {job.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DaisyBadge className={getStatusColor(job.status)} >
  {job.status}
</DaisyBadge>
                        </DaisyBadge>
                        {job.status === 'pending' && (
                          <DaisyButton 
                            size="sm" 
                            onClick={() => handleStartTraining(job.id)} />
                            <Play className="h-3 w-3 mr-1" />
                            Start
                          </DaisyButton>
                        )}
                      </div>
                    </div>
                    
                    {job.status === 'training' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          {/* @ts-ignore */}
                          <span>{job.progress?.progressPercentage?.toFixed(1) || 0}%</span>
                        </div>
                        {/* @ts-ignore */}
                        <DaisyProgress value={job.progress?.progressPercentage || 0} />
<div className="grid grid-cols-3 gap-4 text-xs text-gray-500">
                          <div>
                            {/* @ts-ignore */}
                            <span>Epoch:</span> {job.progress?.currentEpoch || 0}/{job.progress?.totalEpochs || 0}
                          </div>
                          <div>
                            {/* @ts-ignore */}
                            <span>Steps:</span> {job.progress?.currentStep?.toLocaleString() || 0}
                          </div>
                          <div>
                            {/* @ts-ignore */}
                            <span>ETA:</span> {Math.round((job.progress?.remainingTime || 0) / 60)}m
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* @ts-ignore */}
                    {job.status === 'completed' && job.metrics?.accuracy?.length > 0 && (
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Final Accuracy:</span>
                          <span className="ml-1 font-medium">
                            {/* @ts-ignore */}
                            {((job.metrics?.accuracy?.[job.metrics.accuracy.length - 1] || 0) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Training Loss:</span>
                          <span className="ml-1 font-medium">
                            {/* @ts-ignore */}
                            {job.metrics?.trainingLoss?.[job.metrics.trainingLoss.length - 1]?.toFixed(3) || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Duration:</span>
                          <span className="ml-1 font-medium">
                            {job.completedAt && job.startedAt ? 
                              Math.round((job.completedAt.getTime() - job.startedAt.getTime()) / (1000 * 60)) + 'm' : 
                              'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Cost:</span>
                          <span className="ml-1 font-medium">
                            {/* @ts-ignore */}
                            ${job.resources?.estimatedCost?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </DaisyProgress>
          </DaisyCard>
        </DaisyTabsContent>

        {/* Knowledge Bases Tab */}
        <DaisyTabsContent value="knowledge" className="space-y-4" >
            <DaisyCard >
  <DaisyCardBody >
</DaisyTabsContent>
              <DaisyCardTitle className="flex items-center gap-2" >
  <BookOpen className="h-5 w-5 text-purple-600" />
</DaisyCardTitle>
                Knowledge Bases ({knowledgeBases.length})
              </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="space-y-4">
</DaisyCardBody>
                {knowledgeBases.map((kb) => (
                  <div key={kb.id} className="border rounded p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{kb.name}</h4>
                        <p className="text-sm text-gray-500">{kb.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <DaisyBadge variant="outline">v{kb.version}</DaisyBadge>
                        <DaisyButton size="sm" variant="outline" >
  <Settings className="h-3 w-3 mr-1" />
</DaisyButton>
                          Manage
                        </DaisyButton>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Documents:</span>
                        <span className="ml-1 font-medium">{kb.qualityMetrics?.totalDocuments || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Quality Score:</span>
                        <span className="ml-1 font-medium">{kb.qualityMetrics?.averageQuality?.toFixed(1) || 'N/A'}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Embeddings:</span>
                        <span className="ml-1 font-medium">{kb.embeddings?.totalVectors || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Updated:</span>
                        <span className="ml-1 font-medium">{kb.updatedAt ? new Date(kb.updatedAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>

        {/* A/B Testing Tab */}
        <DaisyTabsContent value="experiments" className="space-y-4" >
            <DaisyCard >
  <DaisyCardBody >
</DaisyTabsContent>
              <DaisyCardTitle className="flex items-center gap-2" >
  <TestTube className="h-5 w-5 text-orange-600" />
</DaisyCardTitle>
                A/B Test Experiments ({experiments.length})
              </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="space-y-4">
</DaisyCardBody>
                {experiments.map((experiment) => (
                  <div key={experiment.id} className="border rounded p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{experiment.name}</h4>
                        <p className="text-sm text-gray-500">{experiment.hypothesis}</p>
                      </div>
                      <DaisyBadge className={getStatusColor(experiment.status)} >
  {experiment.status}
</DaisyBadge>
                      </DaisyBadge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        {experiment.variants?.map((variant) => (
                          <div key={variant.id} className="border rounded p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{variant.name}</span>
                              <span className="text-sm text-gray-500">{variant.allocation}%</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Model: {variant.modelId} v{variant.version}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Success Metric:</span>
                          <span className="ml-1 font-medium">
                            {experiment.successMetrics?.[0]?.name || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Target:</span>
                          <span className="ml-1 font-medium">
                            {experiment.successMetrics?.[0]?.target ? 
                              (experiment.successMetrics[0].target * 100).toFixed(1) + '%' : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Duration:</span>
                          <span className="ml-1 font-medium">
                            {experiment.experimentConfig?.maxDuration || 'N/A'} days
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>

        {/* Deployments Tab */}
        <DaisyTabsContent value="deployments" className="space-y-4" >
            <DaisyCard >
  <DaisyCardBody >
</DaisyTabsContent>
              <DaisyCardTitle className="flex items-center gap-2" >
  <Rocket className="h-5 w-5 text-green-600" />
</DaisyCardTitle>
                Model Deployments ({deployments.length})
              </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="space-y-4">
</DaisyCardBody>
                {deployments.map((deployment) => (
                  <div key={deployment.id} className="border rounded p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">
                          Model {deployment.modelId} v{deployment.version}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {deployment.target?.name || 'Unknown'} • {deployment.target?.environment || 'Unknown'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <DaisyBadge className={getStatusColor(deployment.status)} >
  {deployment.status}
</DaisyBadge>
                        </DaisyBadge>
                        <DaisyBadge className={getStatusColor(deployment.health?.status || 'unknown')} >
  {deployment.health?.status || 'unknown'}
</DaisyBadge>
                        </DaisyBadge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Uptime:</span>
                        <span className="ml-1 font-medium">{deployment.health?.uptime?.toFixed(2) || 'N/A'}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Requests:</span>
                        <span className="ml-1 font-medium">{deployment.metrics?.requestCount?.toLocaleString() || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Latency:</span>
                        <span className="ml-1 font-medium">{deployment.health?.latency || 'N/A'}ms</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Error Rate:</span>
                        <span className="ml-1 font-medium">{deployment.health?.errorRate?.toFixed(2) || 'N/A'}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>

        {/* Performance Tab */}
        <DaisyTabsContent value="performance" className="space-y-4" >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DaisyCard >
  <DaisyCardBody >
</DaisyTabsContent>
                <DaisyCardTitle>Performance Metrics</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="h-64">
</DaisyCardBody>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performance.slice(0, 7).map((p, i) => ({
                      day: `Day ${i + 1}`,
                      accuracy: (p.metrics?.accuracy || 0) * 100,
                      throughput: (p.metrics?.throughput || 0) / 10, // Scale for visibility
                      satisfaction: (p.metrics?.userSatisfaction || 0) * 20 // Scale for visibility
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <DaisyTooltip>
                        <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="accuracy" 
                        stackId="1"
                        stroke="#10b981" 
                        fill="#10b981"
                        fillOpacity={0.3}
                        name="Accuracy (%)" />
                      <Area 
                        type="monotone" 
                        dataKey="throughput" 
                        stackId="2"
                        stroke="#3b82f6" 
                        fill="#3b82f6"
                        fillOpacity={0.3}
                        name="Throughput (10x RPS)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </DaisyTooltip>
            </DaisyCard>

            <DaisyCard >
  <DaisyCardBody >
</DaisyCard>
                <DaisyCardTitle>Business Impact</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="space-y-4">
</DaisyCardBody>
                  {performance.slice(0, 1).map((p) => (
                    <div key={p.modelId} className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 border rounded">
                          <div className="text-2xl font-bold text-green-600">
                            ${p.metrics?.businessMetrics?.revenueImpact?.toLocaleString() || '0'}
                          </div>
                          <div className="text-sm text-gray-500">Revenue Impact</div>
                        </div>
                        <div className="text-center p-3 border rounded">
                          <div className="text-2xl font-bold text-blue-600">
                            {p.metrics?.businessMetrics?.operationalEfficiency || 0}%
                          </div>
                          <div className="text-sm text-gray-500">Efficiency</div>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-medium mb-2">Recent Feedback</h5>
                        <div className="space-y-2">
                          {p.feedbackAnalysis?.commonIssues?.map((issue, index) => (
                            <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                              <DaisyAlertTriangle className="h-3 w-3 text-yellow-500" >
  {issue}
</DaisyAlertTriangle>
                            </div>
                          )) || <div className="text-sm text-gray-600">No issues reported</div>}
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-medium mb-2">Recommendations</h5>
                        <div className="space-y-2">
                          {p.recommendations?.map((rec, index) => (
                            <div key={index} className="text-sm">
                              <div className="flex items-center gap-2">
                                <DaisyBadge className={getStatusColor(rec.priority)} >
  {rec.priority}
</DaisyBadge>
                                </DaisyBadge>
                                <span className="font-medium">{rec.type}</span>
                              </div>
                              <p className="text-gray-600 mt-1">{rec.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </DaisyCardBody>
            </DaisyCard>
          </div>
        </DaisyTabsContent>
      </DaisyTabs>
    </div>
  );
}; 