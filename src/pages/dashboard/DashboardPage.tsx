'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import GuidedTour from '@/components/help/GuidedTour';
import { DashboardStatsModal } from '@/components/dashboard/DashboardStatsModal';

import {
  Shield,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  FileText,
  Clock,
  Settings,
  Activity,
  Zap,
  Upload,
  Target,
  Plus,
  Calendar,
  ArrowRight,
  MoreHorizontal,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Grid3X3,
  Users,
  MessageSquare,
  UserPlus,
  Share2,
  Bell,
  Briefcase
} from 'lucide-react';
import Image from 'next/image';

// Import the interactive risk heat map component
import { RiskHeatMap as InteractiveRiskHeatMap } from '@/components/ui/interactive-risk-heatmap';
import RiskControlWidget from '@/components/dashboard/RiskControlWidget';

// Types
interface DashboardStats {
  totalRisks: number;
  highRisks: number;
  complianceScore: number;
  activeControls: number;
  pendingActions: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  color: string;
  badge?: string;
}

interface RecentActivity {
  id: number;
  action: string;
  user: string;
  time: string;
  type: 'success' | 'info' | 'warning' | 'error';
  module: string;
  avatar?: string;
}

interface Insight {
  id: string;
  title: string;
  description: string;
  type: 'risk' | 'compliance' | 'opportunity' | 'alert';
  priority: 'high' | 'medium' | 'low';
  action?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalRisks: 0,
    highRisks: 0,
    complianceScore: 0,
    activeControls: 0,
    pendingActions: 0
  });
  const [loading, setLoading] = useState(true);
  const [showTour, setShowTour] = useState(false);
  const [selectedStatsModal, setSelectedStatsModal] = useState<any>(null);
  
  // Additional state for dynamic data
  const [criticalRisks, setCriticalRisks] = useState(0);
  const [mediumRisks, setMediumRisks] = useState(0);
  const [lowRisks, setLowRisks] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [complianceData, setComplianceData] = useState<any[]>([]);
  const [controlsData, setControlsData] = useState<any[]>([]);
  const [pendingActionsData, setPendingActionsData] = useState<any[]>([]);
  const [openItems, setOpenItems] = useState<any[]>([]);
  const [controlEffectivenessData, setControlEffectivenessData] = useState<any[]>([]);

  // Generate sparkline data for trends
  const generateSparkline = (trend: 'up' | 'down' | 'stable') => {
    const points = 7;
    const data = [];
    let value = 50;
    for (let i = 0; i < points; i++) {
      if (trend === 'up') {
        value += Math.random() * 10 - 2;
      } else if (trend === 'down') {
        value -= Math.random() * 10 - 2;
      } else {
        value += Math.random() * 6 - 3;
      }
      value = Math.max(20, Math.min(80, value));
      data.push(value);
    }
    return data;
  };

  // Simple sparkline component
  const Sparkline = ({ data, color = '#199BEC', trend }: { data: number[], color?: string, trend?: 'up' | 'down' | 'stable' }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 60;
    const height = 20;
    const points = data.map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="inline-flex items-center gap-1">
        <svg width={width} height={height} className="overflow-visible">
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {trend && (
          <span className={`text-xs font-medium ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600' : 
            'text-gray-500'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
    );
  };

  // Fetch real dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const results = await Promise.allSettled([
          fetch('/api/dashboard', { credentials: 'include' }),
          fetch('/api/risks?limit=200', { credentials: 'include' }),
          fetch('/api/compliance/assessments', { credentials: 'include' }),
          fetch('/api/controls?limit=200', { credentials: 'include' })
        ]);
        
        const dashboardRes = results[0].status === 'fulfilled' ? results[0].value : null;
        const risksRes = results[1].status === 'fulfilled' ? results[1].value : null;
        const complianceRes = results[2].status === 'fulfilled' ? results[2].value : null;
        const controlsRes = results[3].status === 'fulfilled' ? results[3].value : null;
        
        if (dashboardRes && dashboardRes.ok) {
          const dashboardData = await dashboardRes.json();
          if (dashboardData.success && dashboardData.data) {
            const metrics = dashboardData.data.metrics;
            
            // Get risk details from risks API
            let highRiskCount = 0;
            let criticalCount = 0;
            let mediumCount = 0;
            let lowCount = 0;
            let totalRisksFromAPI = 0;
            
            if (risksRes && risksRes.ok) {
              const risksData = await risksRes.json();
              if (risksData.success && risksData.data) {
                console.log('Dashboard processing risks:', risksData.data.length);
                totalRisksFromAPI = risksData.data.length;
                
                risksData.data.forEach((risk: any) => {
                  const riskLevel = risk.riskLevel?.toLowerCase() || 'low';
                  const riskScore = risk.riskScore || (risk.likelihood || 0) * (risk.impact || 0);
                  
                  // Count by actual risk level from RCSA data
                  if (riskLevel === 'critical') {
                    criticalCount++;
                    highRiskCount++; // Critical risks are also counted as high priority
                  } else if (riskLevel === 'high') {
                    highRiskCount++;
                  } else if (riskLevel === 'medium') {
                    mediumCount++;
                  } else {
                    lowCount++;
                  }
                });
                console.log('Risk counts - Critical:', criticalCount, 'High:', highRiskCount, 'Medium:', mediumCount, 'Low:', lowCount);
              }
            }
            
            setCriticalRisks(criticalCount);
            setMediumRisks(mediumCount);
            setLowRisks(lowCount);
            
            // Set open items (high and critical risks)
            if (risksData.data) {
              const highPriorityRisks = risksData.data
                .filter((r: any) => r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH')
                .slice(0, 5)
                .map((r: any) => ({
                  id: r.id,
                  title: r.title || r.riskName,
                  severity: r.riskLevel?.toLowerCase() || 'high',
                  category: r.category || 'Operational',
                  status: r.status || 'Open',
                  owner: r.assignedTo || 'Unassigned'
                }));
              setOpenItems(highPriorityRisks);
            }
            
            setStats({
              totalRisks: metrics.totalRisks || totalRisksFromAPI,
              highRisks: highRiskCount || metrics.highRisks || 0,
              complianceScore: metrics.complianceScore || 0,
              activeControls: metrics.activeControls || metrics.totalControls || 0,
              pendingActions: metrics.openTasks || metrics.overdueItems || 0
            });
            
            // Set recent activity
            if (dashboardData.data.recentActivity) {
              setRecentActivity(dashboardData.data.recentActivity.map((item: any) => ({
                ...item,
                type: item.type || 'risk',
                priority: item.priority || 'medium',
                status: item.status || 'Active'
              })));
            }
            
            // Set compliance data
            if (complianceRes && complianceRes.ok) {
              const compData = await complianceRes.json();
              if (compData.success && compData.data) {
                setComplianceData(compData.data.map((item: any) => ({
                  framework: item.framework || item.name,
                  score: item.complianceScore || 0
                })));
              }
            }
            
            // Set controls data and effectiveness breakdown
            if (controlsRes && controlsRes.ok) {
              const ctrlData = await controlsRes.json();
              if (ctrlData.success && ctrlData.data) {
                // Calculate control effectiveness distribution
                let highEff = 0, mediumEff = 0, lowEff = 0;
                ctrlData.data.forEach((control: any) => {
                  const effectiveness = typeof control.effectiveness === 'number' ? control.effectiveness : 50;
                  if (effectiveness >= 85) highEff++;
                  else if (effectiveness >= 60) mediumEff++;
                  else lowEff++;
                });
                
                setControlEffectivenessData([
                  { name: 'High', value: highEff, color: '#22c55e' },
                  { name: 'Medium', value: mediumEff, color: '#eab308' },
                  { name: 'Low', value: lowEff, color: '#ef4444' }
                ]);
                
                setControlsData(
                  ctrlData.data.map((item: any) => {
                    const normalizedType = typeof item.type === 'string'
                      ? item.type.toLowerCase()
                      : item.type;
                    let normalizedEffectiveness: string;
                    if (typeof item.effectiveness === 'number') {
                      const score = item.effectiveness;
                      normalizedEffectiveness = score >= 85 ? 'high' : score >= 60 ? 'medium' : 'low';
                    } else if (typeof item.effectiveness === 'string') {
                      normalizedEffectiveness = item.effectiveness.toLowerCase();
                    } else {
                      normalizedEffectiveness = 'medium';
                    }
                    return {
                      ...item,
                      type: normalizedType || 'preventive',
                      effectiveness: normalizedEffectiveness
                    };
                  })
                );
              }
            }
            
            // Mock pending actions for now
            setPendingActionsData([]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Check if user is new and should see the tour
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenDashboardTour');
    if (!hasSeenTour && !loading) {
      // Auto-start tour for new users after a short delay
      const tourTimer = setTimeout(() => {
        setShowTour(true);
      }, 2000);
      return () => clearTimeout(tourTimer);
    }
  }, [loading]);

  const quickActions: QuickAction[] = [
    {
      id: 'probo-hub',
      title: 'Probo Hub',
      description: 'Access integrated risk & compliance platform',
      icon: Briefcase,
      href: '/dashboard/probo',
      color: 'text-[#199BEC]',
      badge: 'Hub'
    },
    {
      id: 'probo-vendor-assessment',
      title: 'Assess Vendor',
      description: 'AI-powered vendor security assessment',
      icon: Shield,
      href: '/dashboard/probo?tab=vendor-assessment',
      color: 'text-[#199BEC]',
      badge: 'Probo'
    },
    {
      id: 'new-risk',
      title: 'Add New Risk',
      description: 'Document and assess a new risk',
      icon: Shield,
      href: '/dashboard/risks/new',
      color: 'text-red-600',
      badge: 'Quick'
    },
    {
      id: 'probo-controls',
      title: 'Browse Controls',
      description: 'Access security controls library',
      icon: Target,
      href: '/dashboard/probo?tab=controls-library',
      color: 'text-emerald-600',
      badge: 'Library'
    },
    {
      id: 'import-rcsa',
      title: 'Import RCSA',
      description: 'Upload risk assessment data',
      icon: Upload,
      href: '/dashboard/import/rcsa',
      color: 'text-blue-600'
    },
    {
      id: 'ask-aria',
      title: 'Ask ARIA',
      description: 'Get AI-powered insights',
      icon: () => <Image src="/images/logo/riscura.png" alt="Riscura" width={20} height={20} />,
      href: '/dashboard/aria',
      color: 'text-[#199BEC]',
      badge: 'AI'
    },
    {
      id: 'probo-soc2',
      title: 'SOC 2 Assessment',
      description: 'Framework compliance tracking',
      icon: CheckCircle2,
      href: '/dashboard/probo?tab=soc2-assessment',
      color: 'text-purple-600',
      badge: 'SOC 2'
    },
    {
      id: 'generate-report',
      title: 'Generate Report',
      description: 'Create compliance reports',
      icon: FileText,
      href: '/dashboard/reporting',
      color: 'text-green-600'
    },
    {
      id: 'risk-assessment',
      title: 'Risk Assessment',
      description: 'Conduct risk evaluation',
      icon: Target,
      href: '/dashboard/risks/assessment',
      color: 'text-orange-600'
    }
  ];

  // Recent activity is now fetched dynamically
  const formattedRecentActivity: RecentActivity[] = recentActivity.length > 0 ? recentActivity : [];

  const [insights, setInsights] = useState<Insight[]>([]);

  // Fetch insights
  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await fetch('/api/dashboard/insights');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setInsights(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch insights:', error);
      }
    };

    fetchInsights();
  }, []);

  // Use fetched insights or empty array
  const displayInsights = insights.length > 0 ? insights : [];



  const handleQuickAction = (href: string, actionId?: string) => {
    if (actionId === 'guided-tour') {
      setShowTour(true);
      return;
    }
    
    router.push(href);
    
    // Show success toast for certain actions
    if (actionId === 'new-risk') {
      toast({
        title: "Risk Creation",
        description: "Opening risk creation form...",
      });
    }
  };

  const handleTourComplete = () => {
    setShowTour(false);
    localStorage.setItem('hasSeenDashboardTour', 'true');
    toast({
      title: "Tour Complete!",
      description: "You're ready to start managing risks effectively.",
    });
  };

  const handleTourSkip = () => {
    setShowTour(false);
    localStorage.setItem('hasSeenDashboardTour', 'true');
  };

  const getStatsModalData = (type: string) => {
    switch (type) {
      case 'totalRisks':
        return {
          type: 'totalRisks' as const,
          title: 'Total Risks',
          value: stats.totalRisks,
          description: 'Complete overview of all identified risks across your organization',
          details: {
            overview: `Your organization currently has ${stats.totalRisks} identified risk${stats.totalRisks !== 1 ? 's' : ''} across various categories and business units. ${stats.totalRisks === 0 ? 'Start by identifying and documenting your organization\'s risks.' : 'This represents your current risk landscape that requires ongoing monitoring and management.'}`,
            breakdown: stats.totalRisks > 0 ? [
              { label: 'Critical Risks', value: criticalRisks || 0, color: '#ef4444', percentage: stats.totalRisks > 0 ? Math.round((criticalRisks / stats.totalRisks) * 100) : 0 },
              { label: 'High Risks', value: stats.highRisks || 0, color: '#f97316', percentage: stats.totalRisks > 0 ? Math.round((stats.highRisks / stats.totalRisks) * 100) : 0 },
              { label: 'Medium Risks', value: mediumRisks || 0, color: '#eab308', percentage: stats.totalRisks > 0 ? Math.round((mediumRisks / stats.totalRisks) * 100) : 0 },
              { label: 'Low Risks', value: lowRisks || 0, color: '#22c55e', percentage: stats.totalRisks > 0 ? Math.round((lowRisks / stats.totalRisks) * 100) : 0 }
            ] : [],
            recentItems: recentActivity.filter(item => item.type === 'risk').slice(0, 3).map(item => ({
              id: item.id,
              title: item.description,
              status: item.status || 'Active',
              date: item.time,
              priority: (item.priority || 'medium') as 'high' | 'medium' | 'low'
            })),
            insights: stats.totalRisks > 0 ? [
              { text: `You have ${stats.totalRisks} total risk${stats.totalRisks !== 1 ? 's' : ''} identified`, type: 'neutral' as const },
              stats.highRisks > 0 ? { text: `${stats.highRisks} risk${stats.highRisks !== 1 ? 's require' : ' requires'} immediate attention`, type: 'negative' as const } : null,
              stats.totalRisks > 10 ? { text: 'Consider grouping related risks for better management', type: 'neutral' as const } : null
            ].filter(Boolean) : [
              { text: 'No risks have been identified yet', type: 'neutral' as const },
              { text: 'Start by conducting a risk assessment', type: 'positive' as const }
            ]
          },
          actions: [
            { label: 'View All Risks', href: '/dashboard/risks', variant: 'default' as const },
            { label: 'Add New Risk', href: '/dashboard/risks/new', variant: 'secondary' as const },
            { label: 'Risk Reports', href: '/dashboard/reporting', variant: 'secondary' as const }
          ]
        };
      case 'highRisks':
        return {
          type: 'highRisks' as const,
          title: 'High Priority Risks',
          value: stats.highRisks,
          description: 'Critical and high-priority risks requiring immediate attention',
          details: {
            overview: stats.highRisks > 0 ? `You have ${stats.highRisks} high-priority risk${stats.highRisks !== 1 ? 's' : ''} that require${stats.highRisks === 1 ? 's' : ''} immediate attention and management. These risks pose significant threats to your organization and should be addressed promptly.` : 'No high-priority risks have been identified. Continue monitoring your risk landscape for any changes.',
            breakdown: stats.highRisks > 0 ? [
              { label: 'Critical Risks', value: criticalRisks || 0, color: '#dc2626', percentage: (criticalRisks && stats.highRisks > 0) ? Math.round((criticalRisks / (criticalRisks + stats.highRisks)) * 100) : 0 },
              { label: 'High Risks', value: stats.highRisks || 0, color: '#ea580c', percentage: stats.highRisks > 0 ? Math.round((stats.highRisks / (criticalRisks + stats.highRisks)) * 100) : 100 }
            ] : [],
            recentItems: recentActivity.filter(item => item.type === 'risk' && (item.priority === 'high' || item.priority === 'critical')).slice(0, 2).map(item => ({
              id: item.id,
              title: item.description,
              status: item.status || 'Active',
              date: item.time,
              priority: 'high' as const
            })),
            insights: stats.highRisks > 0 ? [
              { text: `${stats.highRisks} high-priority risk${stats.highRisks !== 1 ? 's' : ''} identified`, type: 'negative' as const },
              criticalRisks > 0 ? { text: `${criticalRisks} critical risk${criticalRisks !== 1 ? 's require' : ' requires'} executive attention`, type: 'negative' as const } : null
            ].filter(Boolean) : [
              { text: 'No high-priority risks identified', type: 'positive' as const }
            ]
          },
          actions: [
            { label: 'View High Priority', href: '/dashboard/risks?priority=high', variant: 'default' as const },
            { label: 'Risk Assessment', href: '/dashboard/risks/assessment', variant: 'secondary' as const }
          ]
        };
      case 'compliance':
        return {
          type: 'compliance' as const,
          title: 'Compliance Score',
          value: `${stats.complianceScore}%`,
          description: 'Overall compliance status across all regulatory frameworks',
          details: {
            overview: stats.complianceScore > 0 ? `Your organization maintains a ${stats.complianceScore}% compliance score across all applicable regulatory frameworks. ${stats.complianceScore >= 90 ? 'This reflects excellent adherence to industry standards and regulations.' : stats.complianceScore >= 70 ? 'There is room for improvement in your compliance posture.' : 'Immediate attention is required to improve compliance.'}` : 'No compliance assessments have been completed yet. Start by selecting applicable frameworks and conducting assessments.',
            breakdown: complianceData.length > 0 ? complianceData.map(item => ({
              label: item.framework,
              value: item.score,
              color: item.score >= 90 ? '#16a34a' : item.score >= 70 ? '#eab308' : '#ef4444',
              percentage: item.score
            })) : [],
            insights: stats.complianceScore > 0 ? [
              { text: `Overall compliance score: ${stats.complianceScore}%`, type: stats.complianceScore >= 90 ? 'positive' as const : stats.complianceScore >= 70 ? 'neutral' as const : 'negative' as const },
              complianceData.filter(item => item.score < 90).length > 0 ? { text: `${complianceData.filter(item => item.score < 90).length} framework${complianceData.filter(item => item.score < 90).length !== 1 ? 's need' : ' needs'} attention`, type: 'negative' as const } : null,
              complianceData.filter(item => item.score >= 90).length > 0 ? { text: `${complianceData.filter(item => item.score >= 90).length} framework${complianceData.filter(item => item.score >= 90).length !== 1 ? 's' : ''} at excellent compliance`, type: 'positive' as const } : null
            ].filter(Boolean) : [
              { text: 'No compliance assessments completed', type: 'neutral' as const },
              { text: 'Start by selecting applicable frameworks', type: 'positive' as const }
            ]
          },
          actions: [
            { label: 'Compliance Dashboard', href: '/dashboard/compliance', variant: 'default' as const },
            { label: 'Generate Report', href: '/dashboard/reporting', variant: 'secondary' as const }
          ]
        };
      case 'activeControls':
        return {
          type: 'activeControls' as const,
          title: 'Active Controls',
          value: stats.activeControls,
          description: 'Security controls currently active and protecting your organization',
          details: {
            overview: stats.activeControls > 0 ? `Your organization has ${stats.activeControls} active security control${stats.activeControls !== 1 ? 's' : ''} deployed across various domains, providing protection against identified risks.` : 'No security controls have been implemented yet. Start by identifying key controls for your highest risks.',
            breakdown: controlsData.length > 0 ? [
              { label: 'Preventive Controls', value: controlsData.filter(c => c.type === 'preventive').length, color: '#3b82f6', percentage: stats.activeControls > 0 ? Math.round((controlsData.filter(c => c.type === 'preventive').length / stats.activeControls) * 100) : 0 },
              { label: 'Detective Controls', value: controlsData.filter(c => c.type === 'detective').length, color: '#8b5cf6', percentage: stats.activeControls > 0 ? Math.round((controlsData.filter(c => c.type === 'detective').length / stats.activeControls) * 100) : 0 },
              { label: 'Corrective Controls', value: controlsData.filter(c => c.type === 'corrective').length, color: '#06b6d4', percentage: stats.activeControls > 0 ? Math.round((controlsData.filter(c => c.type === 'corrective').length / stats.activeControls) * 100) : 0 }
            ] : [],
            recentItems: recentActivity.filter(item => item.type === 'control').slice(0, 3).map(item => ({
              id: item.id,
              title: item.description,
              status: item.status || 'Active',
              date: item.time,
              priority: (item.priority || 'medium') as 'high' | 'medium' | 'low'
            })),
            insights: stats.activeControls > 0 ? [
              { text: `${stats.activeControls} control${stats.activeControls !== 1 ? 's are' : ' is'} currently active`, type: 'neutral' as const },
              controlsData.filter(c => c.effectiveness === 'high').length > 0 ? { text: `${controlsData.filter(c => c.effectiveness === 'high').length} high-effectiveness control${controlsData.filter(c => c.effectiveness === 'high').length !== 1 ? 's' : ''}`, type: 'positive' as const } : null
            ].filter(Boolean) : [
              { text: 'No controls implemented yet', type: 'neutral' as const },
              { text: 'Start by implementing controls for high risks', type: 'positive' as const }
            ]
          },
          actions: [
            { label: 'View Controls', href: '/dashboard/controls', variant: 'default' as const },
            { label: 'Control Testing', href: '/dashboard/controls/testing', variant: 'secondary' as const }
          ]
        };
      case 'pendingActions':
        return {
          type: 'pendingActions' as const,
          title: 'Pending Actions',
          value: stats.pendingActions,
          description: 'Outstanding actions and tasks requiring completion',
          details: {
            overview: stats.pendingActions > 0 ? `You have ${stats.pendingActions} pending action${stats.pendingActions !== 1 ? 's' : ''} that require${stats.pendingActions === 1 ? 's' : ''} attention. These may include risk assessments, control implementations, and compliance reviews.` : 'No pending actions at this time. All tasks are up to date.',
            breakdown: pendingActionsData.length > 0 ? [
              { label: 'Risk Assessments', value: pendingActionsData.filter(a => a.type === 'risk').length, color: '#ef4444', percentage: stats.pendingActions > 0 ? Math.round((pendingActionsData.filter(a => a.type === 'risk').length / stats.pendingActions) * 100) : 0 },
              { label: 'Control Updates', value: pendingActionsData.filter(a => a.type === 'control').length, color: '#f97316', percentage: stats.pendingActions > 0 ? Math.round((pendingActionsData.filter(a => a.type === 'control').length / stats.pendingActions) * 100) : 0 },
              { label: 'Compliance Reviews', value: pendingActionsData.filter(a => a.type === 'compliance').length, color: '#eab308', percentage: stats.pendingActions > 0 ? Math.round((pendingActionsData.filter(a => a.type === 'compliance').length / stats.pendingActions) * 100) : 0 }
            ] : [],
            recentItems: pendingActionsData.slice(0, 3).map(item => ({
              id: item.id,
              title: item.title,
              status: item.status,
              date: item.dueDate,
              priority: (item.priority || 'medium') as 'high' | 'medium' | 'low'
            })),
            insights: stats.pendingActions > 0 ? [
              { text: `${stats.pendingActions} action${stats.pendingActions !== 1 ? 's' : ''} pending completion`, type: 'neutral' as const },
              pendingActionsData.filter(a => a.status === 'overdue').length > 0 ? { text: `${pendingActionsData.filter(a => a.status === 'overdue').length} action${pendingActionsData.filter(a => a.status === 'overdue').length !== 1 ? 's are' : ' is'} overdue`, type: 'negative' as const } : null
            ].filter(Boolean) : [
              { text: 'All actions completed', type: 'positive' as const },
              { text: 'No pending tasks', type: 'positive' as const }
            ]
          },
          actions: [
            { label: 'View All Actions', href: '/dashboard/actions', variant: 'default' as const },
            { label: 'Create Action', href: '/dashboard/actions/new', variant: 'secondary' as const }
          ]
        };
      default:
        return null;
    }
  };

  const handleStatsCardClick = (type: string) => {
    const modalData = getStatsModalData(type);
    setSelectedStatsModal(modalData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 md:space-y-8" data-tour="dashboard-main">
      {/* Guided Tour Component */}
      {showTour && (
        <GuidedTour
          tourId="platform-overview"
          autoStart={true}
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
          showProgress={true}
          allowSkip={true}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between" data-tour="dashboard-header">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-[#191919]">Dashboard</h1>
            <Badge variant="secondary" className="bg-[#D8C3A5] text-[#191919] font-semibold">
              Live
            </Badge>
          </div>
          <p className="text-[#A8A8A8] font-semibold">Welcome back! Here's your risk management overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            onClick={() => setShowTour(true)}
            className="text-sm border-[#D8C3A5] text-[#191919] hover:bg-[#D8C3A5]"
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            Take Tour
          </Button>
          <Button 
            onClick={() => router.push('/dashboard/risks/new')}
            className="bg-[#191919] text-white hover:bg-[#333333]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Risk
          </Button>
        </div>
      </div>

      {/* Main Dashboard Grid - Enhanced Layout with Better Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column - Compact Stats & Quick Actions */}
        <div className="lg:col-span-4 space-y-4">
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card 
              className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer group" 
              onClick={() => handleStatsCardClick('totalRisks')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-3xl font-bold text-blue-900">{stats.totalRisks}</p>
                      <Sparkline data={generateSparkline('stable')} color="#3b82f6" trend="stable" />
                    </div>
                    <p className="text-sm font-medium text-blue-700">Total Risks</p>
                    <p className="text-xs text-blue-600 mt-1">RCSA Complete</p>
                  </div>
                  <div className="p-3 bg-blue-600 rounded-xl group-hover:bg-blue-700 transition-colors">  
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer group" 
              onClick={() => handleStatsCardClick('highRisks')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-3xl font-bold text-red-900">{stats.highRisks}</p>
                      <Sparkline data={generateSparkline(stats.highRisks > 10 ? 'up' : 'down')} color="#ef4444" trend={stats.highRisks > 10 ? 'up' : 'down'} />
                    </div>
                    <p className="text-sm font-medium text-red-700">High Priority</p>
                    <p className="text-xs text-red-600 mt-1">Material Risks</p>
                  </div>
                  <div className="p-3 bg-red-600 rounded-xl group-hover:bg-red-700 transition-colors">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer group" 
              onClick={() => handleStatsCardClick('complianceScore')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-green-900 mb-1">{stats.complianceScore}%</p>
                    <p className="text-sm font-medium text-green-700">Compliance</p>
                    <p className="text-xs text-green-600 mt-1">Multi-Framework</p>
                  </div>
                  <div className="p-3 bg-green-600 rounded-xl group-hover:bg-green-700 transition-colors">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer group" 
              onClick={() => handleStatsCardClick('activeControls')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-purple-900 mb-1">{stats.activeControls}</p>
                    <p className="text-sm font-medium text-purple-700">Controls</p>
                    <p className="text-xs text-purple-600 mt-1">Active & Tested</p>
                  </div>
                  <div className="p-3 bg-purple-600 rounded-xl group-hover:bg-purple-700 transition-colors">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions - Simplified Card */}
          <Card className="bg-white border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#199BEC]" />
                <span className="text-[#191919] font-bold text-base">Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-3 h-full">
                {quickActions.slice(0, 4).map((action) => (
                  <QuickActionCard
                    key={action.id}
                    title={action.title}
                    description={action.description}
                    icon={action.icon}
                    color={action.color}
                    badge={action.badge}
                    onClick={() => handleQuickAction(action.href, action.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Expanded Risk Heat Map Showcase */}
        <div className="lg:col-span-8">
          {/* Risk Heat Map - Extended */}
          <div data-tour="risk-heatmap" className="h-full">
            <InteractiveRiskHeatMap className="h-full" />
          </div>
        </div>
      </div>

      {/* Enhanced Dashboard Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Open Items - Critical/High Risks */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <span className="text-[#191919] font-bold">Open Items</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                {openItems.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {openItems.length > 0 ? (
                openItems.map((item) => (
                  <div key={item.id} className="p-2 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant={item.severity === 'critical' ? 'destructive' : 'default'}
                            className="text-xs"
                          >
                            {item.severity}
                          </Badge>
                          <span className="text-xs text-gray-500">{item.category}</span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 mt-1" />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No critical items</p>
              )}
            </div>
            {openItems.length > 0 && (
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full mt-3"
                onClick={() => router.push('/dashboard/risks')}
              >
                View All Risks
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Control Effectiveness Donut */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5 text-blue-500" />
              <span className="text-[#191919] font-bold">Control Effectiveness</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {controlEffectivenessData.length > 0 ? (
              <>
                {/* Simple SVG Donut Chart */}
                <div className="flex justify-center">
                  <svg width="160" height="160" viewBox="0 0 160 160">
                    {(() => {
                      const centerX = 80;
                      const centerY = 80;
                      const radius = 60;
                      const innerRadius = 35;
                      const total = controlEffectivenessData.reduce((sum, item) => sum + item.value, 0);
                      let cumulativeAngle = -90; // Start from top
                      
                      return controlEffectivenessData.map((item, index) => {
                        const percentage = (item.value / total) * 100;
                        const angle = (percentage / 100) * 360;
                        const startAngle = cumulativeAngle;
                        const endAngle = cumulativeAngle + angle;
                        cumulativeAngle += angle;
                        
                        const startAngleRad = (startAngle * Math.PI) / 180;
                        const endAngleRad = (endAngle * Math.PI) / 180;
                        
                        const x1 = centerX + radius * Math.cos(startAngleRad);
                        const y1 = centerY + radius * Math.sin(startAngleRad);
                        const x2 = centerX + radius * Math.cos(endAngleRad);
                        const y2 = centerY + radius * Math.sin(endAngleRad);
                        
                        const x3 = centerX + innerRadius * Math.cos(startAngleRad);
                        const y3 = centerY + innerRadius * Math.sin(startAngleRad);
                        const x4 = centerX + innerRadius * Math.cos(endAngleRad);
                        const y4 = centerY + innerRadius * Math.sin(endAngleRad);
                        
                        const largeArcFlag = angle > 180 ? 1 : 0;
                        
                        const pathData = [
                          `M ${x3} ${y3}`,
                          `L ${x1} ${y1}`,
                          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                          `L ${x4} ${y4}`,
                          `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x3} ${y3}`,
                          'Z'
                        ].join(' ');
                        
                        return (
                          <path
                            key={index}
                            d={pathData}
                            fill={item.color}
                            stroke="white"
                            strokeWidth="2"
                            className="hover:opacity-80 transition-opacity"
                          />
                        );
                      });
                    })()}
                    {/* Center text */}
                    <text x="80" y="75" textAnchor="middle" className="text-2xl font-bold fill-gray-900">
                      {controlEffectivenessData.length > 0 ? 
                        Math.round(
                          (controlEffectivenessData[0].value * 100 + 
                           controlEffectivenessData[1].value * 70 + 
                           controlEffectivenessData[2].value * 30) / 
                          controlEffectivenessData.reduce((a, b) => a + b.value, 0)
                        ) : 0}%
                    </text>
                    <text x="80" y="95" textAnchor="middle" className="text-xs fill-gray-500">
                      Overall
                    </text>
                  </svg>
                </div>
                <div className="flex justify-around mt-4">
                  {controlEffectivenessData.map((item) => (
                    <div key={item.name} className="text-center">
                      <div className="flex items-center gap-1">
                        <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-gray-600">{item.name}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-48">
                <p className="text-sm text-gray-500">No control data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-5 w-5 text-green-500" />
              <span className="text-[#191919] font-bold">Recent Activity</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                Live
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentActivity.length > 0 ? (
                recentActivity.slice(0, 6).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-2 pb-2 border-b last:border-0">
                    <div className={`mt-1 w-2 h-2 rounded-full ${
                      activity.type === 'success' ? 'bg-green-500' : 
                      activity.type === 'warning' ? 'bg-yellow-500' : 
                      activity.type === 'error' ? 'bg-red-500' : 
                      'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 line-clamp-1">{activity.action}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{activity.user}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{activity.time}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
            {recentActivity.length > 0 && (
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full mt-3"
                onClick={() => router.push('/dashboard/activity')}
              >
                View All Activity
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section - AI Insights Only */}
      <div className="grid grid-cols-1 gap-6 md:gap-8">
        {/* AI Insights */}
        <Card data-tour="ai-insights" className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image 
                  src="/images/logo/riscura.png" 
                  alt="Riscura" 
                  width={20} 
                  height={20}
                />
                <span className="text-[#191919] font-bold">AI Insights</span>
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 font-semibold text-xs">
                {insights.length} Insights
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {insights.map((insight) => (
                <div key={insight.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">{insight.title}</h4>
                        <Badge 
                          variant={insight.priority === 'high' ? 'destructive' : insight.priority === 'medium' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                      {insight.action && (
                        <Button variant="secondary" size="sm">
                          {insight.action}
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Collaboration Section - Small Team Features */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Team Status */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-[#191919] font-bold">Team Status</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-semibold text-xs">
                Live
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No team members yet</p>
              <p className="text-gray-400 text-xs mt-1">Invite your team to collaborate</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => router.push('/dashboard/team/invite')}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Team
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Team Actions */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-purple-600" />
              <span className="text-[#191919] font-bold">Team Actions</span>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 font-semibold text-xs">
                Small Team
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="ghost" 
              className="w-full justify-start h-auto p-3 hover:bg-gray-50"
              onClick={() => router.push('/dashboard/team/delegate')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <UserPlus className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm text-[#191919]">Delegate Risk</p>
                  <p className="text-xs text-gray-500">Assign ownership to team member</p>
                </div>
              </div>
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start h-auto p-3 hover:bg-gray-50"
              onClick={() => router.push('/dashboard/team/chat')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm text-[#191919]">Team Chat</p>
                  <p className="text-xs text-gray-500">Discuss risks and controls</p>
                </div>
              </div>
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start h-auto p-3 hover:bg-gray-50"
              onClick={() => router.push('/dashboard/team/notifications')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Bell className="h-4 w-4 text-orange-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm text-[#191919]">Team Alerts</p>
                  <p className="text-xs text-gray-500">Set up notifications for team</p>
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Small Team Insights */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-[#191919] font-bold">Team Efficiency</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800 font-semibold text-xs">
                Optimized
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Risk Resolution Rate</span>
                <span className="text-sm font-bold text-green-600">85%</span>
              </div>
              <Progress value={85} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Team Collaboration</span>
                <span className="text-sm font-bold text-blue-600">92%</span>
              </div>
              <Progress value={92} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Response Time</span>
                <span className="text-sm font-bold text-purple-600">2.1 hrs</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
            
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span>Team efficiency improved by 12% this month</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Modal */}
      <DashboardStatsModal
        isOpen={!!selectedStatsModal}
        onClose={() => setSelectedStatsModal(null)}
        data={selectedStatsModal}
      />
    </div>
  );
}

function QuickActionCard({ 
  title, 
  description, 
  icon: Icon, 
  color, 
  badge,
  onClick 
}: {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <div 
      className="p-3 border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group bg-white h-full flex flex-col"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg bg-gray-50 group-hover:bg-blue-50 transition-colors flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${color} group-hover:text-blue-600 transition-colors`} />
        </div>
        {badge && (
          <Badge 
            variant="secondary" 
            className={`text-xs font-semibold ml-auto ${
              badge === 'Quick' ? 'bg-green-100 text-green-800' :
              badge === 'AI' ? 'bg-blue-100 text-blue-800' :
              badge === 'Probo' ? 'bg-[#199BEC]/10 text-[#199BEC]' :
              badge === 'Hub' ? 'bg-[#199BEC]/10 text-[#199BEC]' :
              badge === 'SOC 2' ? 'bg-purple-100 text-purple-800' :
              badge === '650+' ? 'bg-emerald-100 text-emerald-800' :
              badge === 'New' ? 'bg-orange-100 text-orange-800' :
              badge === 'Team' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }`}
          >
            {badge}
          </Badge>
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-sm text-gray-900 mb-1 leading-tight">{title}</h3>
        <p className="text-xs text-gray-600 leading-tight">{description}</p>
      </div>
    </div>
  );
}

function ActivityItem({ 
  action, 
  user, 
  time, 
  type,
  module,
  avatar
}: { 
  action: string; 
  user: string; 
  time: string; 
  type: 'success' | 'info' | 'warning' | 'error';
  module: string;
  avatar?: string;
}) {
  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
      case 'warning':
        return { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' };
      case 'error':
        return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' };
      default:
        return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' };
    }
  };

  const getModuleBadgeColor = (module: string) => {
    const moduleLower = module.toLowerCase();
    switch (moduleLower) {
      case 'risk management':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'compliance':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'monitoring':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'controls':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'planning':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 mb-1">{action}</p>
        <div className="flex items-center space-x-2">
          <p className="text-xs text-gray-500">{user}</p>
          <span className="text-xs text-gray-400">•</span>
          <p className="text-xs text-gray-500">{time}</p>
          <span className="text-xs text-gray-400">•</span>
          <Badge className={`text-xs border ${getModuleBadgeColor(module)}`}>
            {module}
          </Badge>
        </div>
      </div>
      <div className={`p-1 rounded-full ${config.bg} flex-shrink-0`}>
        <Icon className={`w-3 h-3 ${config.color}`} />
      </div>
    </div>
  );
}