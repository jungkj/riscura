'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DaisyTooltip, DaisyTooltipContent, DaisyTooltipTrigger } from '@/components/ui/DaisyTooltip';

// Chart Components
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
         ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

// Icons
import {
  BarChart3, TrendingUp, AlertTriangle, CheckCircle, Shield, Eye,
  MoreHorizontal, Maximize, Minimize, RefreshCw, Download, Settings,
  Brain, Zap, Target, Activity, PieChart as PieChartIcon, LineChart as LineChartIcon,
  AreaChart as AreaChartIcon, Clock, Users, DollarSign, Globe
} from 'lucide-react';

// Types
import type { Risk } from '@/types';

interface DashboardWidget {
  id: string;
  title: string;
  type: 'chart' | 'metric' | 'list' | 'ai' | 'custom';
  position: { x: number; y: number; w: number; h: number };
  data?: any;
  config?: any;
  visible: boolean;
}

interface DashboardGridProps {
  widgets: DashboardWidget[];
  onWidgetToggle: (widgetId: string) => void;
  onLayoutReset: () => void;
  layoutMode: 'grid' | 'masonry' | 'flex';
  viewMode: 'executive' | 'analyst' | 'operator' | 'auditor';
  data: {
    risks: Risk[];
    realTime: any;
    ai: { enabled: boolean };
  };
}

// Mock chart data
const generateChartData = (type: string) => {
  switch (type) {
    case 'risk-trend':
      return Array.from({ length: 12 }, (_, i) => ({
        month: `Month ${i + 1}`,
        risks: Math.floor(Math.random() * 50) + 100,
        critical: Math.floor(Math.random() * 10) + 5,
        high: Math.floor(Math.random() * 15) + 10,
        medium: Math.floor(Math.random() * 20) + 15,
        low: Math.floor(Math.random() * 25) + 20,
      }));
    case 'compliance-score':
      return [
        { name: 'SOC2', value: 94, color: '#10B981' },
        { name: 'ISO27001', value: 87, color: '#3B82F6' },
        { name: 'GDPR', value: 91, color: '#8B5CF6' },
        { name: 'PCI DSS', value: 89, color: '#F59E0B' },
        { name: 'HIPAA', value: 92, color: '#EF4444' },
      ];
    case 'risk-distribution':
      return [
        { name: 'Technology', value: 35, color: '#3B82F6' },
        { name: 'Financial', value: 25, color: '#10B981' },
        { name: 'Operational', value: 20, color: '#F59E0B' },
        { name: 'Compliance', value: 15, color: '#8B5CF6' },
        { name: 'Strategic', value: 5, color: '#EF4444' },
      ];
    default:
      return [];
  }
};

export function DashboardGrid({
  widgets,
  onWidgetToggle,
  onLayoutReset,
  layoutMode,
  viewMode,
  data
}: DashboardGridProps) {
  const [expandedWidget, setExpandedWidget] = useState<string | null>(null);
  const [refreshingWidget, setRefreshingWidget] = useState<string | null>(null);

  const handleWidgetRefresh = useCallback(async (widgetId: string) => {
    setRefreshingWidget(widgetId);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshingWidget(null);
  }, []);

  const renderWidget = (widget: DashboardWidget) => {
    if (!widget.visible) return null;

    const isExpanded = expandedWidget === widget.id;
    const isRefreshing = refreshingWidget === widget.id;

  return (
    <motion.div
        key={widget.id}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`${isExpanded ? 'col-span-full row-span-2' : ''}`}
      >
        <DaisyCard className="h-full bg-[#FAFAFA] border-[#D8C3A5] hover:shadow-lg transition-shadow font-inter" >
  <DaisyCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" />
</DaisyCard>
            <DaisyCardTitle className="text-base font-semibold text-[#191919] font-inter" >
  {widget.title}
</DaisyCardTitle>
            </DaisyCardTitle>
            <div className="flex items-center space-x-1">
              <DaisyTooltip />
                <DaisyTooltipTrigger asChild />
                  <DaisyButton
                    variant="ghost"
                    size="sm"
                    onClick={() => handleWidgetRefresh(widget.id)}
                    disabled={isRefreshing}
                    className="bg-transparent text-[#A8A8A8] hover:text-[#191919] hover:bg-[#D8C3A5]/20 font-inter" />
                    <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </DaisyTooltip>
                </DaisyTooltipTrigger>
                <DaisyTooltipContent>Refresh Widget</DaisyTooltipContent>
              </DaisyTooltip>

              <DaisyTooltip />
                <DaisyTooltipTrigger asChild />
                  <DaisyButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedWidget(isExpanded ? null : widget.id)}
                    className="bg-transparent text-[#A8A8A8] hover:text-[#191919] hover:bg-[#D8C3A5]/20 font-inter" />
                    {isExpanded ? <Minimize className="w-3 h-3" /> : <Maximize className="w-3 h-3" />}
                  </DaisyTooltip>
                </DaisyTooltipTrigger>
                <DaisyTooltipContent>{isExpanded ? 'Minimize' : 'Expand'}</DaisyTooltipContent>
              </DaisyTooltip>

              <DaisyDropdownMenu />
                <DaisyDropdownMenuTrigger asChild />
                  <DaisyButton 
                    variant="ghost" 
                    size="sm"
                    className="bg-transparent text-[#A8A8A8] hover:text-[#191919] hover:bg-[#D8C3A5]/20 font-inter" >
  <MoreHorizontal className="w-3 h-3" />
</DaisyDropdownMenu>
                  </DaisyButton>
                </DaisyDropdownMenuTrigger>
                <DaisyDropdownMenuContent align="end" className="bg-[#FAFAFA] border-[#D8C3A5]" />
                  <DaisyDropdownMenuItem className="text-[#191919] hover:bg-[#D8C3A5]/20 font-inter" />
                    <Download className="w-3 h-3 mr-2" />
                    Export Data
                  </DaisyDropdownMenuContent>
                  <DaisyDropdownMenuItem className="text-[#191919] hover:bg-[#D8C3A5]/20 font-inter" />
                    <Settings className="w-3 h-3 mr-2" />
                    Configure
                  </DaisyDropdownMenuItem>
                  <DaisyDropdownMenuItem 
                    onClick={() => onWidgetToggle(widget.id)}
                    className="text-[#191919] hover:bg-[#D8C3A5]/20 font-inter" />
                    <Eye className="w-3 h-3 mr-2" />
                    Hide Widget
                  </DaisyDropdownMenuItem>
                </DaisyDropdownMenuContent>
              </DaisyDropdownMenu>
            </div>
          
          
          <DaisyCardContent className="p-4" >
  {renderWidgetContent(widget, isExpanded, data)}
</DaisyCardContent>
          </DaisyCardContent>
        </DaisyCard>
      </motion.div>
    );
  };

  const renderWidgetContent = (widget: DashboardWidget, isExpanded: boolean, data: any) => {
    switch (widget.id) {
      case 'metrics':
        return <MetricsWidget data={data.realTime} expanded={isExpanded} />;
      case 'risk-heatmap':
        return <RiskHeatmapWidget risks={data.risks} expanded={isExpanded} />;
      case 'ai-insights':
        return <AIInsightsWidget enabled={data.ai.enabled} expanded={isExpanded} />;
      case 'compliance':
        return <ComplianceWidget expanded={isExpanded} />;
      case 'recent-activity':
        return <RecentActivityWidget expanded={isExpanded} />;
      case 'predictive':
        return <PredictiveWidget expanded={isExpanded} />;
      default:
        return <div className="text-[#A8A8A8] font-inter">Widget content not available</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Widget Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-[#191919] font-inter">
            Dashboard Widgets
          </h2>
          <DaisyBadge variant="outline" className="text-xs border-[#D8C3A5] text-[#191919] font-inter" >
  {widgets.filter(w => w.visible).length} of {widgets.length} visible
</DaisyBadge>
          </DaisyBadge>
        </div>

        <div className="flex items-center space-x-2">
          <DaisyButton variant="outline" size="sm" onClick={onLayoutReset} className="border-[#D8C3A5] text-[#191919] hover:bg-[#D8C3A5]/20 font-inter" >
  Reset Layout
</DaisyButton>
          </DaisyButton>
        </div>
      </div>

      {/* Widgets Grid */}
      <motion.div 
        layout
        className={`grid gap-6 ${
          layoutMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : layoutMode === 'masonry'
            ? 'columns-1 md:columns-2 lg:columns-3 xl:columns-4'
            : 'flex flex-wrap'
        }`}
      >
        <AnimatePresence mode="popLayout">
          {widgets.map(renderWidget)}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// Widget Components
function MetricsWidget({ data, expanded }: { data: any; expanded: boolean }) {
  const metrics = [
    { label: 'Total Risks', value: data.totalRisks, trend: '+2.3%', positive: false, icon: <BarChart3 className="w-4 h-4" /> },
    { label: 'High Priority', value: data.highPriorityRisks, trend: '-5.1%', positive: true, icon: <DaisyAlertTriangle className="w-4 h-4" >
  },
</DaisyAlertTriangle>
    { label: 'Compliance Score', value: `${data.complianceScore}%`, trend: '+1.2%', positive: true, icon: <CheckCircle className="w-4 h-4" /> },
    { label: 'Active Controls', value: data.controlsActive, trend: '+3.4%', positive: true, icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-4">
      <div className={`grid gap-4 ${expanded ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'}`}>
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2 text-[#A8A8A8]">
              {metric.icon}
              <span className="text-xs font-medium font-inter">{metric.label}</span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-[#191919] font-inter">
                {metric.value}
              </span>
              <span className={`text-xs font-medium font-inter ${
                metric.positive ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.trend}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function RiskHeatmapWidget({ risks, expanded }: { risks: Risk[]; expanded: boolean }) {
  const chartData = generateChartData('risk-trend');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#A8A8A8] font-inter">Risk Trends</h3>
        <DaisyBadge variant="outline" className="text-xs border-[#D8C3A5] text-[#191919] font-inter" >
  {risks.length} Total Risks
</DaisyBadge>
        </DaisyBadge>
      </div>

      <div className={`${expanded ? 'h-96' : 'h-48'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D8C3A5" />
            <XAxis dataKey="month" tick={{ fill: '#A8A8A8', fontSize: 12, fontFamily: 'Inter' }} />
            <YAxis tick={{ fill: '#A8A8A8', fontSize: 12, fontFamily: 'Inter' }} />
            <Area type="monotone" dataKey="risks" stackId="1" stroke="#191919" fill="#191919" fillOpacity={0.6} />
            <Area type="monotone" dataKey="critical" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.8} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AIInsightsWidget({ enabled, expanded }: { enabled: boolean; expanded: boolean }) {
  const insights = [
    { id: 1, title: 'Emerging Cybersecurity Threat', severity: 'high', confidence: 92 },
    { id: 2, title: 'Compliance Gap Detected', severity: 'medium', confidence: 87 },
    { id: 3, title: 'Process Optimization Opportunity', severity: 'low', confidence: 94 },
  ];

  if (!enabled) {

  return (
    <div className="flex items-center justify-center h-32 text-[#A8A8A8]">
        <div className="text-center space-y-2">
          <Brain className="w-8 h-8 mx-auto opacity-50" />
          <p className="text-sm font-inter">AI Insights Disabled</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="w-4 h-4 text-[#191919]" />
          <h3 className="text-sm font-medium text-[#A8A8A8] font-inter">AI Insights</h3>
        </div>
        <DaisyBadge className="bg-[#191919] text-[#FAFAFA] text-xs font-inter" >
  Live
</DaisyBadge>
        </DaisyBadge>
      </div>

      <div className="space-y-3">
        {insights.slice(0, expanded ? insights.length : 2).map((insight) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-3 rounded-lg bg-[#F5F1E9] border border-[#D8C3A5]"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-[#191919] font-inter">
                  {insight.title}
                </h4>
                <div className="flex items-center space-x-2">
                  <DaisyBadge 
                    variant={insight.severity === 'high' ? 'destructive' : insight.severity === 'medium' ? 'default' : 'secondary'}
                    className="text-xs font-inter" >
  {insight.severity}
</DaisyBadge>
                  </DaisyBadge>
                  <span className="text-xs text-[#A8A8A8] font-inter">
                    {insight.confidence}% confidence
                  </span>
                </div>
              </div>
              <Zap className="w-4 h-4 text-[#191919]" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ComplianceWidget({ expanded }: { expanded: boolean }) {
  const complianceData = generateChartData('compliance-score');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#A8A8A8] font-inter">Compliance Status</h3>
        <DaisyBadge variant="outline" className="text-xs border-[#D8C3A5] text-[#191919] font-inter" >
  94% Average
</DaisyBadge>
        </DaisyBadge>
      </div>

      <div className={`${expanded ? 'h-96' : 'h-48'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={complianceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D8C3A5" />
            <XAxis dataKey="name" tick={{ fill: '#A8A8A8', fontSize: 12, fontFamily: 'Inter' }} />
            <YAxis tick={{ fill: '#A8A8A8', fontSize: 12, fontFamily: 'Inter' }} />
            <Bar dataKey="value" fill="#191919" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RecentActivityWidget({ expanded }: { expanded: boolean }) {
  const activities = [
    { id: 1, type: 'risk', title: 'New cybersecurity risk identified', time: '2 mins ago', user: 'Sarah Chen' },
    { id: 2, type: 'control', title: 'Control testing completed', time: '15 mins ago', user: 'Mike Johnson' },
    { id: 3, type: 'compliance', title: 'SOC2 audit scheduled', time: '1 hour ago', user: 'Elena Rodriguez' },
    { id: 4, type: 'document', title: 'Policy document updated', time: '2 hours ago', user: 'David Kim' },
    { id: 5, type: 'workflow', title: 'Risk assessment approved', time: '3 hours ago', user: 'Lisa Wang' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#A8A8A8] font-inter">Recent Activity</h3>
        <Activity className="w-4 h-4 text-[#A8A8A8]" />
      </div>

      <div className="space-y-3">
        {activities.slice(0, expanded ? activities.length : 3).map((activity) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start space-x-3 p-2 rounded-lg hover:bg-[#D8C3A5]/20 transition-colors"
          >
            <div className={`w-2 h-2 rounded-full mt-2 ${
              activity.type === 'risk' ? 'bg-red-500' :
              activity.type === 'control' ? 'bg-blue-500' :
              activity.type === 'compliance' ? 'bg-green-500' :
              activity.type === 'document' ? 'bg-[#191919]' :
              'bg-orange-500'
            }`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#191919] font-medium truncate font-inter">
                {activity.title}
              </p>
              <div className="flex items-center space-x-2 text-xs text-[#A8A8A8] font-inter">
                <span>{activity.time}</span>
                <span>•</span>
                <span>{activity.user}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PredictiveWidget({ expanded }: { expanded: boolean }) {
  const predictions = [
    { metric: 'Risk Exposure', current: 75, predicted: 68, confidence: 89, trend: 'decreasing' },
    { metric: 'Compliance Score', current: 94, predicted: 96, confidence: 92, trend: 'increasing' },
    { metric: 'Control Effectiveness', current: 87, predicted: 91, confidence: 85, trend: 'increasing' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-[#191919]" />
          <h3 className="text-sm font-medium text-[#A8A8A8] font-inter">Predictive Analytics</h3>
        </div>
        <DaisyBadge variant="outline" className="text-xs border-[#D8C3A5] text-[#191919] font-inter" >
  AI Powered
</DaisyBadge>
        </DaisyBadge>
      </div>

      <div className="space-y-3">
        {predictions.slice(0, expanded ? predictions.length : 2).map((prediction, index) => (
          <motion.div
            key={prediction.metric}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#191919] font-inter">
                {prediction.metric}
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-[#A8A8A8] font-inter">
                  {prediction.current} → {prediction.predicted}
                </span>
                <div className={`w-1 h-1 rounded-full ${
                  prediction.trend === 'increasing' ? 'bg-green-500' : 'bg-red-500'
                }`} />
              </div>
            </div>
            <div className="space-y-1">
              <DaisyProgress value={prediction.predicted} className="h-2" />
              <div className="flex justify-between text-xs text-[#A8A8A8] font-inter">
                <span>Confidence: {prediction.confidence}%</span>
                <span>30-day forecast</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 