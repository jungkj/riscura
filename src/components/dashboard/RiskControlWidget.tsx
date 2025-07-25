'use client';

import React, { useState, useEffect } from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Shield,
  Target,
  TrendingUp,
  ExternalLink,
  Database,
  Users,
  CheckCircle,
  AlertTriangle,
  Zap,
  BarChart3,
  Activity,
  ArrowRight
} from 'lucide-react';

interface ProboMetrics {
  totalControls: number;
  implementedControls: number;
  vendorAssessments: number;
  complianceFrameworks: number;
  riskReduction: number;
  lastUpdated: Date;
}

interface ProboInsights {
  controlCoverage: number;
  riskReduction: number;
  complianceImprovement: number;
  vendorRiskScore: number;
  recommendations: string[];
}

interface RiskControlWidgetProps {
  variant?: 'compact' | 'detailed' | 'metrics-only';
  showActions?: boolean;
  className?: string;
}

export function RiskControlWidget({ 
  variant = 'detailed', 
  showActions = true,
  className = '' 
}: RiskControlWidgetProps) {
  const router = useRouter();
  const [metrics, setMetrics] = useState<ProboMetrics | null>(null);
  const [insights, setInsights] = useState<ProboInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProboData();
  }, []);

  const fetchProboData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/risk-insights');
      const data = await response.json();

      if (data.success) {
        setMetrics(data.data.metrics);
        setInsights(data.data.insights);
      } else {
        setError(data.error || 'Failed to fetch risk control data');
      }
    } catch (err) {
      setError('Network error while fetching risk control data');
      console.error('Error fetching risk control data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProboAction = (action: string) => {
    switch (action) {
      case 'hub':
        router.push('/dashboard/probo');
        break;
      case 'controls':
        router.push('/dashboard/probo?tab=controls-library');
        break;
      case 'vendor-assessment':
        router.push('/dashboard/probo?tab=vendor-assessment');
        break;
      case 'soc2':
        router.push('/dashboard/probo?tab=soc2-assessment');
        break;
      default:
        router.push('/dashboard/probo');
    }
  };

  if (loading) {
    return (
      <DaisyCard className={`bg-[#FAFAFA] border-[#D8C3A5] ${className}`}>
        <DaisyCardHeader>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#199BEC]/20 rounded animate-pulse" />
            <div className="w-32 h-5 bg-gray-200 rounded animate-pulse" />
          </div>
        
        <DaisyCardContent>
          <div className="space-y-3">
            <div className="w-full h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </DaisyCardBody>
      </DaisyCard>
    );
  }

  if (error) {
    return (
      <DaisyCard className={`bg-[#FAFAFA] border-[#D8C3A5] ${className}`}>
        <DaisyCardHeader>
          <DaisyCardTitle className="text-[#191919] font-inter flex items-center gap-2">
            <DaisyAlertTriangle className="h-5 w-5 text-red-500" />
            Risk Control Center
          </DaisyCardTitle>
        
        <DaisyCardContent>
          <p className="text-sm text-red-600">{error}</p>
          <DaisyButton 
            variant="outline" 
            size="sm" 
            onClick={fetchProboData}
            className="mt-2"
          >
            Retry
          </DaisyButton>
        </DaisyCardBody>
      </DaisyCard>
    );
  }

  if (variant === 'compact') {
    return (
      <DaisyCard className={`bg-gradient-to-r from-[#199BEC]/5 to-[#199BEC]/10 border-[#199BEC]/20 ${className}`}>
        <DaisyCardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#199BEC]/10 rounded-lg">
                <Zap className="h-5 w-5 text-[#199BEC]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#191919]">AI Risk Analysis</h3>
                <p className="text-sm text-[#A8A8A8]">
                  {metrics?.totalControls || 0} controls available
                </p>
              </div>
            </div>
            <DaisyButton 
              size="sm"
              onClick={() => handleProboAction('hub')}
              className="bg-[#199BEC] hover:bg-[#199BEC]/90 text-white"
            >
              Open
            </DaisyButton>
          </div>
        </DaisyCardBody>
      </DaisyCard>
    );
  }

  if (variant === 'metrics-only') {
    return (
      <DaisyCard className={`bg-[#FAFAFA] border-[#D8C3A5] ${className}`}>
        <DaisyCardHeader>
          <DaisyCardTitle className="text-[#191919] font-inter flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#199BEC]" />
            Risk Control Metrics
          </DaisyCardTitle>
        
        <DaisyCardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#199BEC]">
                {metrics?.totalControls || 0}
              </div>
              <p className="text-sm text-[#A8A8A8]">Total Controls</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {insights?.riskReduction || 0}%
              </div>
              <p className="text-sm text-[#A8A8A8]">Risk Reduction</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {metrics?.vendorAssessments || 0}
              </div>
              <p className="text-sm text-[#A8A8A8]">Vendor Assessments</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {insights?.complianceImprovement || 0}%
              </div>
              <p className="text-sm text-[#A8A8A8]">Compliance Boost</p>
            </div>
          </div>
        </DaisyCardBody>
      </DaisyCard>
    );
  }

  // Detailed variant (default)
  return (
    <DaisyCard className={`bg-[#FAFAFA] border-[#D8C3A5] ${className}`}>
      <DaisyCardHeader>
        <div className="flex items-center justify-between">
          <DaisyCardTitle className="text-[#191919] font-inter flex items-center gap-2">
            <div className="p-2 bg-[#199BEC]/10 rounded-lg">
              <Shield className="h-5 w-5 text-[#199BEC]" />
            </div>
            Risk Control Center
          </DaisyCardTitle>
          <DaisyBadge variant="outline" className="bg-[#199BEC]/10 text-[#199BEC] border-[#199BEC]/30">
            Active
          </DaisyBadge>
        </div>
      

      <DaisyCardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div 
            className="text-center p-3 bg-white rounded-lg border border-gray-100"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Database className="h-6 w-6 text-[#199BEC] mx-auto mb-2" />
            <div className="text-xl font-bold text-[#191919]">
              {metrics?.totalControls || 0}
            </div>
            <p className="text-xs text-[#A8A8A8]">Security Controls</p>
          </motion.div>

          <motion.div 
            className="text-center p-3 bg-white rounded-lg border border-gray-100"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-xl font-bold text-[#191919]">
              {metrics?.implementedControls || 0}
            </div>
            <p className="text-xs text-[#A8A8A8]">Implemented</p>
          </motion.div>

          <motion.div 
            className="text-center p-3 bg-white rounded-lg border border-gray-100"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Users className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <div className="text-xl font-bold text-[#191919]">
              {metrics?.vendorAssessments || 0}
            </div>
            <p className="text-xs text-[#A8A8A8]">Vendor Assessments</p>
          </motion.div>

          <motion.div 
            className="text-center p-3 bg-white rounded-lg border border-gray-100"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-xl font-bold text-[#191919]">
              {insights?.riskReduction || 0}%
            </div>
            <p className="text-xs text-[#A8A8A8]">Risk Reduction</p>
          </motion.div>
        </div>

        {/* Control Coverage Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-[#191919]">Control Coverage</span>
            <span className="text-sm text-[#A8A8A8]">
              {insights?.controlCoverage || 0}%
            </span>
          </div>
          <DaisyProgress 
            value={insights?.controlCoverage || 0} 
            className="h-2"
          />
        </div>

        {/* Quick Insights */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-[#191919] flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#199BEC]" />
            Key Insights
          </h4>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#A8A8A8]">Compliance Improvement</span>
              <span className="font-medium text-green-600">
                +{insights?.complianceImprovement || 0}%
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#A8A8A8]">Average Vendor Risk</span>
              <span className="font-medium text-orange-600">
                {insights?.vendorRiskScore || 0}/100
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {showActions && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[#191919]">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              <DaisyButton
                variant="outline"
                size="sm"
                onClick={() => handleProboAction('controls')}
                className="justify-start text-xs"
              >
                <Target className="h-3 w-3 mr-2" />
                Browse Controls
              </DaisyButton>
              <DaisyButton
                variant="outline"
                size="sm"
                onClick={() => handleProboAction('vendor-assessment')}
                className="justify-start text-xs"
              >
                <Users className="h-3 w-3 mr-2" />
                Assess Vendor
              </DaisyButton>
              <DaisyButton
                variant="outline"
                size="sm"
                onClick={() => handleProboAction('soc2')}
                className="justify-start text-xs"
              >
                <CheckCircle className="h-3 w-3 mr-2" />
                SOC 2 Status
              </DaisyButton>
              <DaisyButton
                variant="outline"
                size="sm"
                onClick={() => handleProboAction('hub')}
                className="justify-start text-xs"
              >
                <ArrowRight className="h-3 w-3 mr-2" />
                Open Hub
              </DaisyButton>
            </div>
          </div>
        )}

        {/* Last Updated */}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-[#A8A8A8]">
            Last updated: {metrics?.lastUpdated ? new Date(metrics.lastUpdated).toLocaleTimeString() : 'Never'}
          </p>
        </div>
      </DaisyCardBody>
    </DaisyCard>
  );
}

export default RiskControlWidget; 