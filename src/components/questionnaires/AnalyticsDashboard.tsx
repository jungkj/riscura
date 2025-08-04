'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard'
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisySelect } from '@/components/ui/DaisySelect';
import {
import { DaisyCardTitle, DaisySelectTrigger, DaisySelectContent, DaisySelectItem, DaisySelectValue, DaisyTabsTrigger, DaisyDropdownMenu, DaisyDropdownMenuTrigger, DaisyDropdownMenuContent, DaisyDropdownMenuItem, DaisyTooltip } from '@/components/ui/daisy-components';
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { AIEnhancedAnalytics } from './AIEnhancedAnalytics';

import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart
} from 'recharts';

// import {
  TrendingUp, TrendingDown, BarChart3,
  Download, RefreshCw, Users, Target,
  CheckCircle, ArrowUp, ArrowDown, Minus
} from 'lucide-react'

// Mock data generation
const generateMockData = () => {
  const responsesTrend = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    responses: Math.floor(Math.random() * 50) + 20,
    completions: Math.floor(Math.random() * 40) + 15,
    abandonments: Math.floor(Math.random() * 10) + 2
  }))

  const completionRates = Array.from({ length: 12 }, (_, i) => ({
    questionnaire: `Q${i + 1}`,
    completionRate: Math.floor(Math.random() * 40) + 60,
    totalResponses: Math.floor(Math.random() * 100) + 50,
    avgTime: Math.floor(Math.random() * 20) + 15
  }));

  const scoreDistribution = Array.from({ length: 10 }, (_, i) => ({
    scoreRange: `${i * 10}-${(i + 1) * 10}`,
    count: Math.floor(Math.random() * 30) + 5,
    percentage: Math.floor(Math.random() * 15) + 5
  }));

  const performanceMetrics = [
    { category: 'Cybersecurity', avgScore: 78, responses: 156, completion: 87 },
    { category: 'Compliance', avgScore: 85, responses: 124, completion: 92 },
    { category: 'Risk Assessment', avgScore: 72, responses: 98, completion: 79 },
    { category: 'Vendor Assessment', avgScore: 81, responses: 87, completion: 88 }
  ];

  return {
    responsesTrend,
    completionRates,
    scoreDistribution,
    performanceMetrics
  }
}

interface AnalyticsDashboardProps {
  className?: string;
}

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const [data, setData] = useState(generateMockData());
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData(generateMockData())
      setLastUpdated(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setData(generateMockData());
    setLastUpdated(new Date());
    setIsLoading(false);
  }

  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    // console.log(`Exporting analytics in ${format} format...`)
  }

  // Calculate summary metrics
  const totalResponses = data.responsesTrend.reduce((sum, day) => sum + day.responses, 0)
  const totalCompletions = data.responsesTrend.reduce((sum, day) => sum + day.completions, 0);
  const avgCompletionRate = Math.round((totalCompletions / totalResponses) * 100);
  const _avgScore = Math.round(data.performanceMetrics.reduce((sum, metric) => sum + metric.avgScore, 0) / data.performanceMetrics.length);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {

  return (
    <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-notion-text-primary">Analytics Dashboard</h2>
          <p className="text-sm text-notion-text-secondary">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <DaisySelect value={timeRange} onValueChange={(_value: any) => setTimeRange(value)} />
            <DaisySelectTrigger className="w-32">
                <DaisySelectValue />
</DaisySelect>
            <DaisySelectContent >
                <DaisySelectItem value="7d">Last 7 days</DaisySelectItem>
              <DaisySelectItem value="30d">Last 30 days</DaisySelectItem>
              <DaisySelectItem value="90d">Last 90 days</DaisySelectItem>
              <DaisySelectItem value="1y">Last year</DaisySelectItem>
            </DaisySelectContent>
          </DaisySelect>

          <DaisyButton variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} >
  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
</DaisyButton>
            Refresh
          </DaisyButton>

          <DaisyDropdownMenu >
              <DaisyDropdownMenuTrigger asChild >
                <DaisyButton variant="outline" size="sm" >
  <Download className="w-4 h-4 mr-2" />
</DaisyDropdownMenu>
                Export
              </DaisyButton>
            </DaisyDropdownMenuTrigger>
            <DaisyDropdownMenuContent >
                <DaisyDropdownMenuItem onClick={() => handleExport('csv')} />
                Export as CSV
              </DaisyDropdownMenuContent>
              <DaisyDropdownMenuItem onClick={() => handleExport('excel')} />
                Export as Excel
              </DaisyDropdownMenuItem>
              <DaisyDropdownMenuItem onClick={() => handleExport('pdf')} />
                Export as PDF
              </DaisyDropdownMenuItem>
            </DaisyDropdownMenuContent>
          </DaisyDropdownMenu>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <DaisyCard >
  <DaisyCardBody className="p-6" >
  </DaisyCard>
</DaisyCardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-notion-text-secondary">Total Responses</p>
                  <p className="text-2xl font-bold text-notion-text-primary">{totalResponses.toLocaleString()}</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-500">+12.5%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <DaisyCard >
  <DaisyCardBody className="p-6" >
  </DaisyCard>
</DaisyCardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-notion-text-secondary">Avg Completion Rate</p>
                  <p className="text-2xl font-bold text-notion-text-primary">{avgCompletionRate}%</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-500">+3.2%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <DaisyCard >
  <DaisyCardBody className="p-6" >
  </DaisyCard>
</DaisyCardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-notion-text-secondary">Average Score</p>
                  <p className="text-2xl font-bold text-notion-text-primary">{avgScore}</p>
                  <div className="flex items-center mt-1">
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    <span className="text-sm text-red-500">-1.8%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <DaisyCard >
  <DaisyCardBody className="p-6" >
  </DaisyCard>
</DaisyCardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-notion-text-secondary">Active Users</p>
                  <p className="text-2xl font-bold text-notion-text-primary">1,247</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-500">+8.1%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </motion.div>
      </div>

      {/* Charts Placeholder - will add charts in next step */}
      <DaisyTabs defaultValue="trends" className="space-y-6" >
          <DaisyTabsList className="grid w-full grid-cols-5" >
            <DaisyTabsTrigger value="trends">Response Trends</DaisyTabs>
          <DaisyTabsTrigger value="completion">Completion Analysis</DaisyTabsTrigger>
          <DaisyTabsTrigger value="scores">Score Distribution</DaisyTabsTrigger>
          <DaisyTabsTrigger value="performance">Performance Metrics</DaisyTabsTrigger>
          <DaisyTabsTrigger value="ai-analytics">AI Analytics</DaisyTabsTrigger>
        </DaisyTabsList>

        <DaisyTabsContent value="trends" className="space-y-6" >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Response Trends Chart */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <DaisyCard >
  <DaisyCardBody >
</DaisyTabsContent>
                  <DaisyCardTitle className="flex items-center justify-between" >
  <span>
</DaisyCardTitle>Response Trends</span>
                    <DaisyBadge variant="outline">Last 30 days</DaisyBadge>
                  </DaisyCardTitle>
                </DaisyCardBody>
                <DaisyCardBody >
  <ResponsiveContainer width="100%" height={300}>
</DaisyCardBody>
                    <LineChart data={data.responsesTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <DaisyTooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="responses" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Responses" />
                      <Line 
                        type="monotone" 
                        dataKey="completions" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Completions" />
                      <Line 
                        type="monotone" 
                        dataKey="abandonments" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        name="Abandonments" />
                    </LineChart>
                  </ResponsiveContainer>
                </DaisyTooltip>
              </DaisyCard>
            </motion.div>

            {/* Response by Hour */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 }}
            >
              <DaisyCard >
  <DaisyCardBody >
</DaisyCard>
                  <DaisyCardTitle>Daily Activity Pattern</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <ResponsiveContainer width="100%" height={300}>
</DaisyCardBody>
                    <AreaChart data={data.responsesTrend.slice(-7)}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <DaisyTooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="responses" 
                        stackId="1"
                        stroke="#8884d8" 
                        fill="#8884d8"
                        fillOpacity={0.6}
                        name="Responses" />
                      <Area 
                        type="monotone" 
                        dataKey="completions" 
                        stackId="1"
                        stroke="#82ca9d" 
                        fill="#82ca9d"
                        fillOpacity={0.6}
                        name="Completions" />
                    </AreaChart>
                  </ResponsiveContainer>
                </DaisyTooltip>
              </DaisyCard>
            </motion.div>
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="completion" className="space-y-6" >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Completion Rates by Questionnaire */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <DaisyCard >
  <DaisyCardBody >
</DaisyTabsContent>
                  <DaisyCardTitle>Completion Rates by Questionnaire</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <ResponsiveContainer width="100%" height={300}>
</DaisyCardBody>
                    <BarChart data={data.completionRates}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="questionnaire" className="text-xs" />
                      <YAxis className="text-xs" />
                      <DaisyTooltip content={<CustomTooltip />} />
                      <Bar dataKey="completionRate" fill="#10b981" name="Completion Rate %" />
                    </BarChart>
                  </ResponsiveContainer>
                </DaisyTooltip>
              </DaisyCard>
            </motion.div>

            {/* Completion Rate Breakdown */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 }}
            >
              <DaisyCard >
  <DaisyCardBody >
</DaisyCard>
                  <DaisyCardTitle>Completion Breakdown</DaisyCardTitle>
                </DaisyCardBody>
                <DaisyCardBody className="space-y-4" >
  <div className="space-y-3">
</DaisyCardBody>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Completed</span>
                        <span className="font-medium">{totalCompletions}</span>
                      </div>
                      <DaisyProgress value={65} className="h-2" />
</div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>In Progress</span>
                        <span className="font-medium">289</span>
                      </div>
                      <DaisyProgress value={25} className="h-2" />
</div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Abandoned</span>
                        <span className="font-medium">127</span>
                      </div>
                      <DaisyProgress value={10} className="h-2" />
</div>
                  </div>

                  {/* Pie chart for completion breakdown */}
                  <div className="mt-6">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Completed', value: totalCompletions, fill: '#10b981' },
                            { name: 'In Progress', value: 289, fill: '#f59e0b' },
                            { name: 'Abandoned', value: 127, fill: '#ef4444' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                        </Pie>
                        <DaisyTooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </DaisyProgress>
              </DaisyCard>
            </motion.div>
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="scores" className="space-y-6" >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Distribution */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <DaisyCard >
  <DaisyCardBody >
</DaisyTabsContent>
                  <DaisyCardTitle>Score Distribution</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <ResponsiveContainer width="100%" height={300}>
</DaisyCardBody>
                    <BarChart data={data.scoreDistribution}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="scoreRange" className="text-xs" />
                      <YAxis className="text-xs" />
                      <DaisyTooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#6366f1" name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </DaisyTooltip>
              </DaisyCard>
            </motion.div>

            {/* Score Trends */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 }}
            >
              <DaisyCard >
  <DaisyCardBody >
</DaisyCard>
                  <DaisyCardTitle>Score Trends</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <ResponsiveContainer width="100%" height={300}>
</DaisyCardBody>
                    <LineChart data={data.responsesTrend.map((item, index) => ({
                      ...item,
                      avgScore: 70 + Math.sin(index * 0.2) * 10 + Math.random() * 5
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis domain={[60, 90]} className="text-xs" />
                      <DaisyTooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="avgScore" 
                        stroke="#f59e0b" 
                        strokeWidth={3}
                        name="Average Score" />
                    </LineChart>
                  </ResponsiveContainer>
                </DaisyTooltip>
              </DaisyCard>
            </motion.div>
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="performance" className="space-y-6" >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance by Category */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <DaisyCard >
  <DaisyCardBody >
</DaisyTabsContent>
                  <DaisyCardTitle>Performance by Category</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <ResponsiveContainer width="100%" height={300}>
</DaisyCardBody>
                    <ComposedChart data={data.performanceMetrics}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="category" className="text-xs" />
                      <YAxis yAxisId="left" className="text-xs" />
                      <YAxis yAxisId="right" orientation="right" className="text-xs" />
                      <DaisyTooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="avgScore" fill="#3b82f6" name="Avg Score" />
                      <Line yAxisId="right" type="monotone" dataKey="completion" stroke="#10b981" strokeWidth={2} name="Completion %" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </DaisyTooltip>
              </DaisyCard>
            </motion.div>

            {/* Performance Summary */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 }}
            >
              <DaisyCard >
  <DaisyCardBody >
</DaisyCard>
                  <DaisyCardTitle>Performance Summary</DaisyCardTitle>
                </DaisyCardBody>
                <DaisyCardBody className="space-y-4" >
  {data.performanceMetrics.map((metric, index) => (
</DaisyCardBody>
                    <div key={index} className="flex items-center justify-between p-3 bg-notion-bg-tertiary rounded-lg">
                      <div>
                        <p className="font-medium text-notion-text-primary">{metric.category}</p>
                        <p className="text-sm text-notion-text-secondary">{metric.responses} responses</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg text-notion-text-primary">{metric.avgScore}</p>
                        <p className="text-sm text-notion-text-secondary">{metric.completion}% completion</p>
                      </div>
                    </div>
                  ))}
                </DaisyCardBody>
              </DaisyCard>
            </motion.div>
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="ai-analytics" className="space-y-6" >
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <AIEnhancedAnalytics />
          </motion.div>
        </DaisyTabsContent>
      </DaisyTabs>
    </div>
  );
} 