import React, { useState, useEffect } from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle, DaisyCardDescription, DaisySelect, DaisySelectTrigger, DaisySelectContent, DaisySelectItem, DaisySelectValue, DaisyTabsTrigger, DaisyTooltip } from '@/components/ui/daisy-components';
// import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ReferenceLine,
  AreaChart,
  Area
} from 'recharts';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  BarChart3,
  Activity,
  CheckCircle,
  Zap,
  Info,
  Eye,
  RefreshCw,
  LineChart as LineChartIcon
} from 'lucide-react';

// import { 
  predictiveRiskModelingService,
  type RiskForecast,
  type MonteCarloSimulation
} from '@/services/PredictiveRiskModelingService'
import { generateId } from '@/lib/utils';
import type { Risk } from '@/types';

interface DemoProps {
  riskId?: string;
  onInsightGenerated?: (insight: PredictiveInsight) => void;
}

interface PredictiveInsight {
  id: string;
  type: 'forecast' | 'scenario' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  timeframe: string;
  data: unknown;
  generatedAt: Date;
}

export const PredictiveRiskModelingDemo: React.FC<DemoProps> = ({
  riskId,
  onInsightGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentForecast, setCurrentForecast] = useState<RiskForecast | null>(null);
  const [currentSimulation, setCurrentSimulation] = useState<MonteCarloSimulation | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('ensemble');
  const [forecastHorizon, setForecastHorizon] = useState<number>(90);
  const [selectedScenario, setSelectedScenario] = useState<string>('all');
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [activeTab, setActiveTab] = useState('forecast');

  // Demo risk data
  const demoRisk: Risk = {
    id: riskId || 'demo-risk-001',
    title: 'Cybersecurity Incident Risk',
    description: 'Risk of data breach or cyber attack affecting customer data and operations',
    category: 'TECHNOLOGY' as const,
    likelihood: 3,
    impact: 4,
    riskScore: 12,
    owner: 'CISO',
    status: 'identified' as const,
    controls: [],
    evidence: [],
    createdAt: '2024-01-01',
    updatedAt: new Date().toISOString()
  }

  // Generate historical time series data for demo
  const generateHistoricalData = () => {
    const data: Array<{ timestamp: Date; value: number; metadata: { day: number; weekday: number; month: number; } }> = [];
    let currentValue = 5; // Starting risk level
    
    for (let i = 0; i < 100; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (100 - i));
      
      // Add some realistic variation
      const trend = Math.sin(i / 30) * 0.5; // Monthly cycle
      const noise = (Math.random() - 0.5) * 1; // Random noise
      const seasonality = Math.sin(i / 90) * 0.3; // Quarterly pattern
      
      currentValue = Math.max(1, Math.min(10, currentValue + trend + noise + seasonality));
      
      data.push({
        timestamp: date,
        value: Number(currentValue.toFixed(2)),
        metadata: {
          day: i,
          weekday: date.getDay(),
          month: date.getMonth()
        }
      });
    }
    
    return data;
  }

  const historicalData = generateHistoricalData();

  // Generate predictive forecast
  const generateForecast = async () => {
    setIsGenerating(true)
    try {
      const forecast = await predictiveRiskModelingService.generateRiskForecast(
        demoRisk,
        historicalData,
        { duration: forecastHorizon, unit: 'days' }
      );
      
      setCurrentForecast(forecast);
      
      // Generate insights from forecast
      const newInsights: PredictiveInsight[] = [
        {
          id: generateId('insight'),
          type: 'forecast',
          title: 'Risk Trend Prediction',
          description: `Risk level expected to ${forecast.predictions.length > 0 && 
            forecast.predictions[forecast.predictions.length - 1].predictedValue > 
            forecast.predictions[0].predictedValue ? 'increase' : 'decrease'} over next ${forecastHorizon} days`,
          confidence: forecast.confidence,
          impact: 'medium',
          timeframe: `${forecastHorizon} days`,
          data: forecast,
          generatedAt: new Date()
        }
      ]
      
      setInsights(prev => [...newInsights, ...prev]);
      
      if (onInsightGenerated) {
        newInsights.forEach(insight => onInsightGenerated(insight));
      }
      
    } catch (error) {
      // console.error('Error generating forecast:', error)
    } finally {
      setIsGenerating(false);
    }
  }

  // Run Monte Carlo simulation
  const runMonteCarloSimulation = async () => {
    setIsGenerating(true)
    try {
      // Create simulation variables based on historical data
      const variables = [
        {
          name: 'Risk_Score',
          distribution: {
            type: 'normal' as const,
            parameters: {},
            mean: 8,
            standardDeviation: 1.5
          },
          currentValue: 8,
          historicalData: historicalData.map(d => d.value),
          correlatedWith: ['External_Threats']
        },
        {
          name: 'External_Threats',
          distribution: {
            type: 'lognormal' as const,
            parameters: {},
            mean: 5,
            standardDeviation: 2
          },
          currentValue: 5,
          historicalData: Array.from({length: 100}, () => Math.random() * 10),
          correlatedWith: ['Risk_Score']
        }
      ]
      
      const simulation = await predictiveRiskModelingService.executeMonteCarloSimulation(
        variables,
        10000
      );
      
      setCurrentSimulation(simulation);
      
      // Generate insights from simulation
      const newInsights: PredictiveInsight[] = simulation.scenarios.map(scenario => ({
        id: generateId('insight'),
        type: 'scenario',
        title: scenario.name,
        description: scenario.description,
        confidence: scenario.probability * 100,
        impact: scenario.impact,
        timeframe: '3-6 months',
        data: scenario,
        generatedAt: new Date()
      }))
      
      setInsights(prev => [...newInsights, ...prev]);
      
    } catch (error) {
      // console.error('Error running Monte Carlo simulation:', error)
    } finally {
      setIsGenerating(false);
    }
  }

  // Prepare chart data
  const prepareForecastChartData = () => {
    if (!currentForecast) return []
    
    const historicalPoints = historicalData.slice(-30).map(point => ({
      date: point.timestamp.toLocaleDateString(),
      historical: point.value,
      type: 'historical'
    }));
    
    const forecastPoints = currentForecast.predictions.map(pred => ({
      date: pred.timestamp.toLocaleDateString(),
      predicted: pred.predictedValue,
      upper: pred.confidenceInterval.upper,
      lower: pred.confidenceInterval.lower,
      type: 'forecast'
    }));
    
    return [...historicalPoints, ...forecastPoints];
  }

  const prepareScenarioChartData = () => {
    if (!currentForecast) return [];
    
    return currentForecast.scenarios.map(scenario => ({
      name: scenario.name,
      probability: scenario.probability * 100,
      impact: scenario.impact,
      riskLevel: scenario.riskLevel
    }));
  }

  const prepareMonteCarloData = () => {
    if (!currentSimulation) return [];
    
    const summary = currentSimulation.results.summary;
    return Object.entries(summary.percentiles).map(([percentile, value]) => ({
      percentile: `P${percentile}`,
      value: Number(value.toFixed(2))
    }));
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'very_low': return 'text-green-600';
      case 'low': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-orange-500';
      case 'very_high': return 'text-red-500';
      default: return 'text-gray-500';
    }
  }

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'medium': return <DaisyAlertTriangle className="h-4 w-4 text-yellow-500" >
  ;
</DaisyAlertTriangle>
      case 'high': return <DaisyAlertTriangle className="h-4 w-4 text-orange-500" >
  ;
</DaisyAlertTriangle>
      case 'critical': return <DaisyAlertTriangle className="h-4 w-4 text-red-500" >
  ;
</DaisyAlertTriangle>
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  }

  useEffect(() => {
    // Auto-generate initial forecast
    generateForecast()
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            Predictive Risk Modeling
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-powered risk forecasting and scenario analysis
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <DaisySelect value={selectedModel} onValueChange={setSelectedModel} >
              <DaisySelectTrigger className="w-40">
                <DaisySelectValue placeholder="Select Model" />
</DaisySelect>
            <DaisySelectContent >
                <DaisySelectItem value="ensemble">Ensemble Model</DaisySelectItem>
              <DaisySelectItem value="arima">ARIMA</DaisySelectItem>
              <DaisySelectItem value="neural_network">Neural Network</DaisySelectItem>
              <DaisySelectItem value="random_forest">Random Forest</DaisySelectItem>
            </DaisySelectContent>
          </DaisySelect>
          
          <DaisySelect value={forecastHorizon.toString()} onValueChange={(v) => setForecastHorizon(Number(v))} />
            <DaisySelectTrigger className="w-32">
                <DaisySelectValue placeholder="Horizon" />
</DaisySelect>
            <DaisySelectContent >
                <DaisySelectItem value="30">30 Days</DaisySelectItem>
              <DaisySelectItem value="60">60 Days</DaisySelectItem>
              <DaisySelectItem value="90">90 Days</DaisySelectItem>
              <DaisySelectItem value="180">6 Months</DaisySelectItem>
            </DaisySelectContent>
          </DaisySelect>
          
          <DaisyButton 
            onClick={generateForecast} 
            disabled={isGenerating}
            className="bg-purple-600 hover:bg-purple-700">
          {isGenerating ? (

        </DaisyButton>
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Generate Forecast
          </DaisyButton>
        </div>
      </div>

      {/* Risk Overview */}
      <DaisyCard >
  <DaisyCardBody >
</DaisyCard>
          <DaisyCardTitle className="flex items-center gap-2" >
  <Target className="h-5 w-5 text-blue-600" />
</DaisyCardTitle>
            Risk Profile: {demoRisk.title}
          </DaisyCardTitle>
          <DaisyCardDescription>{demoRisk.description}</p>
        
        <DaisyCardBody >
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
</DaisyCardDescription>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Score</p>
              <div className="flex items-center gap-2">
                <DaisyBadge variant="outline" className="text-lg font-semibold" >
  {demoRisk.riskScore}
</DaisyBadge>
                </DaisyBadge>
                <span className="text-sm text-gray-500">/ 25</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Category</p>
              <DaisyBadge variant="secondary">{demoRisk.category}</DaisyBadge>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Owner</p>
              <p className="font-medium">{demoRisk.owner}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
              <DaisyBadge className="bg-green-100 text-green-800">{demoRisk.status}</DaisyBadge>
            </div>
          </div>
        </DaisyCardBody>
      </DaisyCard>

      {/* Main Analysis Tabs */}
      <DaisyTabs value={activeTab} onValueChange={setActiveTab} className="space-y-4" >
          <DaisyTabsList className="grid w-full grid-cols-4" >
            <DaisyTabsTrigger value="forecast" className="flex items-center gap-2" >
              <LineChartIcon className="h-4 w-4" />
            Forecast
          </DaisyTabs>
          <DaisyTabsTrigger value="scenarios" className="flex items-center gap-2" >
              <BarChart3 className="h-4 w-4" />
            Scenarios
          </DaisyTabsTrigger>
          <DaisyTabsTrigger value="simulation" className="flex items-center gap-2" >
              <Activity className="h-4 w-4" />
            Monte Carlo
          </DaisyTabsTrigger>
          <DaisyTabsTrigger value="insights" className="flex items-center gap-2" >
              <Eye className="h-4 w-4" />
            Insights
          </DaisyTabsTrigger>
        </DaisyTabsList>

        {/* Forecast Tab */}
        <DaisyTabsContent value="forecast" className="space-y-4" >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Forecast Chart */}
            <DaisyCard className="lg:col-span-2" >
  <DaisyCardBody >
</DaisyTabsContent>
                <DaisyCardTitle className="flex items-center gap-2" >
  <TrendingUp className="h-5 w-5 text-green-600" />
</DaisyCardTitle>
                  Risk Forecast - Next {forecastHorizon} Days
                </DaisyCardTitle>
                <DaisyCardDescription >
  Predicted risk levels with confidence intervals
</DaisyCardDescription>
                </p>
              
              <DaisyCardBody >
  <div className="h-80">
</DaisyCardBody>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={prepareForecastChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 10]} />
                      <DaisyTooltip>
                        <Legend />
                      <Area
                        type="monotone"
                        dataKey="upper"
                        stackId="1"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.1}
                        name="Upper Confidence" />
                      <Area
                        type="monotone"
                        dataKey="lower"
                        stackId="1"
                        stroke="#8884d8"
                        fill="#ffffff"
                        name="Lower Confidence" />
                      <Line
                        type="monotone"
                        dataKey="historical"
                        stroke="#2563eb"
                        strokeWidth={2}
                        name="Historical" />
                      <Line
                        type="monotone"
                        dataKey="predicted"
                        stroke="#dc2626"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Predicted" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </DaisyTooltip>
            </DaisyCard>

            {/* Forecast Metrics */}
            <DaisyCard >
  <DaisyCardBody >
</DaisyCard>
                <DaisyCardTitle>Forecast Confidence</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody className="space-y-4" >
  <div className="space-y-2">
</DaisyCardBody>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Overall Confidence</span>
                    <span className="text-sm">{currentForecast?.confidence.toFixed(1)}%</span>
                  </div>
                  <DaisyProgress value={currentForecast?.confidence || 0} className="h-2" />
</div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Model Accuracy</span>
                    <span className="text-sm">87.3%</span>
                  </div>
                  <DaisyProgress value={87.3} className="h-2" />
</div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Data Quality</span>
                    <span className="text-sm">92.1%</span>
                  </div>
                  <DaisyProgress value={92.1} className="h-2" />
</div>
              </DaisyProgress>
            </DaisyCard>

            {/* External Factors */}
            <DaisyCard >
  <DaisyCardBody >
</DaisyCard>
                <DaisyCardTitle>Influencing Factors</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody className="space-y-3" >
  {currentForecast?.externalFactors.slice(0, 5).map((factor, index) => (
</DaisyCardBody>
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="text-sm font-medium">{factor.name}</span>
                    <div className="flex items-center gap-2">
                      <DaisyBadge variant={factor.impact > 0 ? 'destructive' : 'default'} />
                        {factor.impact > 0 ? '+' : ''}{(factor.impact * 100).toFixed(1)}%
                      </DaisyBadge>
                      {factor.trend === 'increasing' ? (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      ) : factor.trend === 'decreasing' ? (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      ) : (
                        <Activity className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                  </div>
                )) || Array.from({length: 3}, (_, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="text-sm font-medium">
                      {['Market Volatility', 'Regulatory Changes', 'Technology Trends'][i]}
                    </span>
                    <div className="flex items-center gap-2">
                      <DaisyBadge variant={i === 0 ? 'destructive' : 'default'} >
  {['+12.3%', '-5.1%', '+8.7%'][i]}
</DaisyBadge>
                      </DaisyBadge>
                      {i === 0 ? (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      ) : i === 1 ? (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </DaisyCardBody>
            </DaisyCard>
          </div>
        </DaisyTabsContent>

        {/* Scenarios Tab */}
        <DaisyTabsContent value="scenarios" className="space-y-4" >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scenario Chart */}
            <DaisyCard className="lg:col-span-2" >
  <DaisyCardBody >
</DaisyTabsContent>
                <DaisyCardTitle className="flex items-center gap-2" >
  <BarChart3 className="h-5 w-5 text-blue-600" />
</DaisyCardTitle>
                  Risk Scenarios Analysis
                </DaisyCardTitle>
                <DaisyCardDescription >
  Probability and impact assessment of different scenarios
</DaisyCardDescription>
                </p>
              
              <DaisyCardBody >
  <div className="h-80">
</DaisyCardBody>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart data={prepareScenarioChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="probability" name="Probability" unit="%" />
                      <YAxis dataKey="impact" name="Impact" />
                      <DaisyTooltip cursor={{ strokeDasharray: '3 3' }}>
                        <Scatter dataKey="probability" fill="#8884d8" />
                      <ReferenceLine x={50} stroke="red" strokeDasharray="2 2" />
                      <ReferenceLine y={2.5} stroke="red" strokeDasharray="2 2" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </DaisyTooltip>
            </DaisyCard>

            {/* Scenario Details */}
            <DaisyCard >
  <DaisyCardBody >
</DaisyCard>
                <DaisyCardTitle>Scenario Details</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody className="space-y-4" >
  {currentForecast?.scenarios.map((scenario, index) => (
</DaisyCardBody>
                  <div key={index} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{scenario.name}</h4>
                      <DaisyBadge className={getRiskLevelColor(scenario.riskLevel)} >
  {scenario.riskLevel.replace('_', ' ')}
</DaisyBadge>
                      </DaisyBadge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {scenario.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span>Probability: {(scenario.probability * 100).toFixed(1)}%</span>
                      <span className="flex items-center gap-1">
                        {getImpactIcon(scenario.riskLevel)}
                        Impact: {scenario.impact}
                      </span>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    <p>Run forecast analysis to generate scenarios</p>
                  </div>
                )}
              </DaisyCardBody>
            </DaisyCard>

            {/* Mitigation Strategies */}
            <DaisyCard >
  <DaisyCardBody >
</DaisyCard>
                <DaisyCardTitle>Recommended Actions</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody className="space-y-3" >
  {currentForecast?.recommendations.map((rec, index) => (
</DaisyCardBody>
                  <div key={index} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{rec.title}</h4>
                      <DaisyBadge variant={rec.priority === 'high' ? 'destructive' : 'secondary'} >
  {rec.priority}
</DaisyBadge>
                      </DaisyBadge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {rec.description}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span>Timeline: {rec.implementation.timeline}</span>
                      <span>Cost: ${rec.implementation.cost.toLocaleString()}</span>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    <p>Recommendations will appear after forecast analysis</p>
                  </div>
                )}
              </DaisyCardBody>
            </DaisyCard>
          </div>
        </DaisyTabsContent>

        {/* Monte Carlo Tab */}
        <DaisyTabsContent value="simulation" className="space-y-4" >
            <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Monte Carlo Simulation</h3>
            <DaisyButton onClick={runMonteCarloSimulation} disabled={isGenerating} >
  {isGenerating ? (
</DaisyTabsContent>
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Activity className="h-4 w-4" />
              )}
              Run Simulation
            </DaisyButton>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribution Chart */}
            <DaisyCard className="lg:col-span-2" >
  <DaisyCardBody >
</DaisyCard>
                <DaisyCardTitle>Risk Distribution Analysis</DaisyCardTitle>
                <DaisyCardDescription >
  {currentSimulation?.iterations.toLocaleString()} Monte Carlo iterations
</DaisyCardDescription>
                </p>
              
              <DaisyCardBody >
  <div className="h-80">
</DaisyCardBody>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prepareMonteCarloData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="percentile" />
                      <YAxis />
                      <DaisyTooltip>
                        <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </DaisyTooltip>
            </DaisyCard>

            {/* Simulation Results */}
            <DaisyCard >
  <DaisyCardBody >
</DaisyCard>
                <DaisyCardTitle>Simulation Results</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody className="space-y-4" >
  {currentSimulation ? (
</DaisyCardBody>
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Mean Value</p>
                        <p className="text-lg font-semibold">
                          {currentSimulation.results.summary.meanValue.toFixed(2)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Std Deviation</p>
                        <p className="text-lg font-semibold">
                          {currentSimulation.results.summary.standardDeviation.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Value at Risk (95%)</p>
                      <div className="flex items-center gap-2">
                        <DaisyBadge variant="error" >
  {currentSimulation.results.riskMetrics.valueAtRisk[95]?.toFixed(2) || 'N/A'}
</DaisyBadge>
                        </DaisyBadge>
                        <span className="text-sm text-gray-500">5% chance of exceeding</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Probability of Loss</p>
                      <DaisyProgress 
                        value={currentSimulation.results.riskMetrics.probabilityOfLoss * 100} 
                        className="h-2" />
<span className="text-sm text-gray-500">
                        {(currentSimulation.results.riskMetrics.probabilityOfLoss * 100).toFixed(1)}%
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Run Monte Carlo simulation to see results</p>
                  </div>
                )}
              </DaisyProgress>
            </DaisyCard>

            {/* Sensitivity Analysis */}
            <DaisyCard >
  <DaisyCardBody >
</DaisyCard>
                <DaisyCardTitle>Sensitivity Analysis</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  {currentSimulation?.results.sensitivityAnalysis ? (
</DaisyCardBody>
                  <div className="space-y-3">
                    {currentSimulation.results.sensitivityAnalysis.map((analysis, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{analysis.variable}</span>
                          <DaisyBadge variant="outline" >
  {(analysis.impact * 100).toFixed(1)}%
</DaisyBadge>
                          </DaisyBadge>
                        </div>
                        <DaisyProgress value={analysis.impact * 100} className="h-2" />
<p className="text-xs text-gray-600 dark:text-gray-400">
                          {analysis.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Sensitivity analysis will appear after simulation</p>
                  </div>
                )}
              </DaisyProgress>
            </DaisyCard>
          </div>
        </DaisyTabsContent>

        {/* Insights Tab */}
        <DaisyTabsContent value="insights" className="space-y-4" >
            <div className="space-y-4">
            {insights.length > 0 ? (
              insights.map((insight) => (
                <DaisyCard key={insight.id} >
  <DaisyCardBody >
</DaisyTabsContent>
                    <div className="flex items-center justify-between">
                      <DaisyCardTitle className="flex items-center gap-2" >
  {insight.type === 'forecast' && 
</DaisyCardTitle><TrendingUp className="h-5 w-5 text-blue-600" />}
                        {insight.type === 'scenario' && <BarChart3 className="h-5 w-5 text-purple-600" />}
                        {insight.type === 'recommendation' && <Target className="h-5 w-5 text-green-600" />}
                        {insight.title}
                      </DaisyCardTitle>
                      <div className="flex items-center gap-2">
                        <DaisyBadge variant="outline" >
  {insight.confidence.toFixed(1)}% confidence
</DaisyBadge>
                        </DaisyBadge>
                        {getImpactIcon(insight.impact)}
                      </div>
                    </div>
                    <DaisyCardDescription >
  Generated {insight.generatedAt.toLocaleTimeString()} • {insight.timeframe}
</DaisyCardDescription>
                    </p>
                  
                  <DaisyCardBody >
  <p className="text-gray-700 dark:text-gray-300">
</DaisyCardBody>{insight.description}</p>
                  </DaisyCardBody>
                </DaisyCard>
              ))
            ) : (
              <DaisyCard >
  <DaisyCardBody className="text-center py-12" >
  </DaisyCard>
</DaisyCardBody>
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Generate forecasts or run simulations to see AI insights
                  </p>
                </DaisyCardBody>
              </DaisyCard>
            )}
          </div>
        </DaisyTabsContent>
      </DaisyTabs>
    </div>
  );
} 