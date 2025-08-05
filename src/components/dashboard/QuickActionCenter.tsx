'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { useRouter } from 'next/navigation';
import { DaisyCardTitle, DaisyCalendar } from '@/components/ui/daisy-components';

// import {
  Plus, FileText, Shield, BarChart3, AlertTriangle, CheckCircle,
  Settings, Upload, Download, Eye, Target, Users, Calendar, Clock,
  Zap, Search, Filter, RefreshCw, Activity
} from 'lucide-react';
import Image from 'next/image';

interface QuickActionCenterProps {
  viewMode: 'executive' | 'analyst' | 'operator' | 'auditor';
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  href?: string;
  onClick?: () => void;
  badge?: string;
  shortcut?: string;
  roles: string[];
}

export function QuickActionCenter({ viewMode }: QuickActionCenterProps) {
  const router = useRouter();
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch recent actions from API
    const fetchRecentActions = async () => {
      try {
        const response = await fetch('/api/dashboard/recent-actions')
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setRecentActions(data.data.slice(0, 3));
          }
        }
      } catch (error) {
        // console.error('Failed to fetch recent actions:', error)
      } finally {
        setLoading(false);
      }
    }
    fetchRecentActions();
  }, []);

  const allActions: QuickAction[] = [
    {
      id: 'create-risk',
      title: 'Create Risk',
      description: 'Add new risk to registry',
      icon: <Plus className="w-5 h-5" />,
      color: 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700',
      href: '/dashboard/risks/new',
      shortcut: 'Ctrl+R',
      roles: ['executive', 'analyst', 'operator']
    },
    {
      id: 'vendor-assessment',
      title: 'Assess Vendor',
      description: 'AI-powered vendor security assessment',
      icon: <Shield className="w-5 h-5" />,
      color: 'bg-[#199BEC]/10 hover:bg-[#199BEC]/20 border-[#199BEC]/30 text-[#199BEC]',
      href: '/dashboard/probo?tab=vendor-assessment',
      badge: 'AI',
      shortcut: 'Ctrl+V',
      roles: ['executive', 'analyst', 'operator']
    },
    {
      id: 'controls-library',
      title: 'Browse Controls',
      description: 'Enterprise security controls',
      icon: <Target className="w-5 h-5" />,
      color: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700',
      href: '/dashboard/probo?tab=controls-library',
      roles: ['executive', 'analyst', 'operator']
    },
    {
      id: 'create-control',
      title: 'Add Control',
      description: 'Register new control',
      icon: <Shield className="w-5 h-5" />,
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700',
      href: '/dashboard/controls/new',
      shortcut: 'Ctrl+C',
      roles: ['executive', 'analyst', 'operator']
    },
    {
      id: 'soc2-assessment',
      title: 'SOC 2 Assessment',
      description: 'Framework compliance tracking',
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700',
      href: '/dashboard/probo?tab=soc2-assessment',
      badge: 'SOC 2',
      roles: ['executive', 'analyst', 'auditor']
    },
    {
      id: 'upload-document',
      title: 'Upload Document',
      description: 'Add compliance document',
      icon: <Upload className="w-5 h-5" />,
      color: 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700',
      href: '/dashboard/documents/upload',
      roles: ['executive', 'analyst', 'operator', 'auditor']
    },
    {
      id: 'generate-report',
      title: 'Generate Report',
      description: 'Create compliance report',
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'bg-secondary/20 hover:bg-secondary/30 border-border text-foreground',
      href: '/dashboard/reporting',
      badge: 'AI',
      roles: ['executive', 'analyst', 'auditor']
    },
    {
      id: 'risk-control-center',
      title: 'Risk Control Center',
      description: 'AI-powered compliance hub',
      icon: <Activity className="w-5 h-5" />,
      color: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700',
      href: '/dashboard/probo',
      badge: 'Hub',
      roles: ['executive', 'analyst', 'operator', 'auditor']
    },
    {
      id: 'schedule-audit',
      title: 'Schedule Audit',
      description: 'Plan compliance audit',
      icon: <DaisyCalendar className="w-5 h-5" />
,
      color: 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700',
      href: '/dashboard/workflows/audit',
      roles: ['executive', 'auditor']
    },
    {
      id: 'review-alerts',
      title: 'Review Alerts',
      description: 'Check critical notifications',
      icon: <DaisyAlertTriangle className="w-5 h-5" >
  ,
</DaisyCalendar>
      color: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700',
      href: '/dashboard/alerts',
      badge: '3',
      roles: ['executive', 'analyst', 'operator']
    },
    {
      id: 'ai-analysis',
      title: 'AI Analysis',
      description: 'Run intelligent assessment',
      icon: <Image src="/images/logo/riscura.png" alt="Riscura" width={20} height={20} />,
      color: 'bg-[#199BEC]/10 hover:bg-[#199BEC]/20 border-[#199BEC]/30 text-[#199BEC]',
      href: '/dashboard/ai-insights',
      badge: 'New',
      roles: ['executive', 'analyst']
    },
    {
      id: 'team-management',
      title: 'Manage Team',
      description: 'User access & permissions',
      icon: <Users className="w-5 h-5" />,
      color: 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700',
      href: '/dashboard/team',
      roles: ['executive']
    },
    {
      id: 'control-testing',
      title: 'Test Controls',
      description: 'Execute control tests',
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-700',
      href: '/dashboard/controls/testing',
      shortcut: 'Ctrl+T',
      roles: ['analyst', 'operator']
    },
    {
      id: 'export-data',
      title: 'Export Data',
      description: 'Download reports & data',
      icon: <Download className="w-5 h-5" />,
      color: 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200 text-cyan-700',
      onClick: () => console.log('Export triggered'),
      roles: ['executive', 'analyst', 'auditor']
    },
    {
      id: 'dashboard-config',
      title: 'Configure',
      description: 'Customize dashboard',
      icon: <Settings className="w-5 h-5" />,
      color: 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700',
      href: '/dashboard/settings',
      roles: ['executive', 'analyst', 'operator', 'auditor']
    },
    {
      id: 'global-search',
      title: 'Search All',
      description: 'Find across platform',
      icon: <Search className="w-5 h-5" />,
      color: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700',
      shortcut: 'Ctrl+/',
      onClick: () => console.log('Global search'),
      roles: ['executive', 'analyst', 'operator', 'auditor']
    }
  ];

  // Filter actions based on user role
  const filteredActions = allActions.filter(action => 
    action.roles.includes(viewMode)
  )

  // Prioritize actions based on role with Probo integration
  const getPrioritizedActions = () => {
    const roleBasedOrder = {
      executive: ['risk-control-center', 'vendor-assessment', 'generate-report', 'ai-analysis', 'review-alerts', 'schedule-audit', 'team-management'],
      analyst: ['controls-library', 'soc2-assessment', 'create-risk', 'control-testing', 'ai-analysis', 'generate-report', 'review-alerts'],
      operator: ['controls-library', 'create-control', 'control-testing', 'upload-document', 'create-risk', 'review-alerts'],
      auditor: ['soc2-assessment', 'generate-report', 'upload-document', 'schedule-audit', 'export-data', 'dashboard-config']
    }

    const priority = roleBasedOrder[viewMode] || [];
    const prioritized = priority.map(id => filteredActions.find(action => action.id === id)).filter((action): action is QuickAction => action !== undefined);
    const remaining = filteredActions.filter(action => !priority.includes(action.id));
    
    return [...prioritized, ...remaining].slice(0, 8); // Limit to 8 actions
  }

  const handleActionClick = (_action: QuickAction) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.href) {
      router.push(action.href);
    }
  }

  return (
    <DaisyCard className="bg-[#FAFAFA] border-[#D8C3A5]" >
  <DaisyCardBody >
</DaisyCard>
        <div className="flex items-center justify-between">
          <DaisyCardTitle className="text-lg font-semibold text-[#191919] font-inter" >
  Quick Actions
</DaisyCardTitle>
          </DaisyCardTitle>
          <p className="text-sm text-[#A8A8A8] font-inter">
            {viewMode === 'executive' ? 'Executive shortcuts' : 'Analyst tools'}
          </p>
        </div>
      

      <DaisyCardBody >
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
</DaisyCardBody>
          {getPrioritizedActions().map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <DaisyButton
                variant="outline"
                className={`h-auto p-2 border-2 transition-all duration-200 hover:shadow-md ${action.color}`}
                onClick={() => handleActionClick(action)}
              >
                <div className="flex flex-col items-center space-y-1 text-center">
                  <div className="relative">
                    {action.icon}
                    {action.badge && (
                      <DaisyBadge 
                        className="absolute -top-1 -right-1 text-xs px-1 py-0 h-3 min-w-3"
                        variant={action.badge === 'AI' ? 'default' : action.badge === 'New' ? 'secondary' : 'destructive'} >
  {action.badge}
</DaisyButton>
                      </DaisyBadge>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-xs leading-tight">
                      {action.title}
                    </div>
                    <div className="text-xs opacity-75 mt-0.5">
                      {action.description}
                    </div>
                    {action.shortcut && (
                      <div className="text-xs opacity-60 mt-0.5 font-mono">
                        {action.shortcut}
                      </div>
                    )}
                  </div>
                </div>
              </DaisyButton>
            </motion.div>
          ))}
        </div>

        {/* Recent Actions */}
        <div className="mt-6 pt-4 border-t border-[#D8C3A5]">
          <h4 className="text-sm font-medium text-[#A8A8A8] mb-3 font-inter">Recent Actions</h4>
          <div className="space-y-2">
            {loading ? (
              <div className="text-sm text-[#A8A8A8] font-inter">Loading recent actions...</div>
            ) : recentActions.length > 0 ? (
              recentActions.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-sm text-[#191919] font-inter">{item.action}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-[#A8A8A8] font-inter">
                    <Clock className="w-3 h-3" />
                    <span>{item.time}</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-sm text-[#A8A8A8] font-inter">No recent actions to display</div>
            )}
          </div>
        </div>

        {/* Keyboard Shortcuts Info */}
        <div className="mt-4 p-3 bg-[#FAFAFA] rounded-lg">
          <div className="flex items-center space-x-2 text-xs text-[#A8A8A8] font-inter">
            <Target className="w-3 h-3" />
            <span>Pro tip: Use keyboard shortcuts for faster navigation</span>
          </div>
        </div>
      </DaisyCardBody>
    </DaisyCard>
  );
} 