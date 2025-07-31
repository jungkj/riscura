'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyScrollArea } from '@/components/ui/DaisyScrollArea';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Settings, 
  Clock,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Eye,
  FileText,
  Activity
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StatsModalData {
  type: 'totalRisks' | 'highRisks' | 'compliance' | 'activeControls' | 'pendingActions';
  title: string;
  value: string | number;
  description: string;
  details: {
    overview: string;
    breakdown?: Array<{
      label: string;
      value: number;
      color: string;
      percentage?: number;
    }>;
    recentItems?: Array<{
      id: string;
      title: string;
      status: string;
      date: string;
      priority?: 'high' | 'medium' | 'low';
    }>;
    insights?: Array<{
      text: string;
      type: 'positive' | 'negative' | 'neutral';
    }>;
  };
  actions: Array<{
    label: string;
    href: string;
    variant: 'primary' | 'secondary' | 'danger';
  }>;
}

interface DashboardStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: StatsModalData | null;
}

export const DashboardStatsModal: React.FC<DashboardStatsModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const router = useRouter();

  if (!data) return null;

  const getIcon = () => {
    switch (data.type) {
      case 'totalRisks':
        return <Shield className="w-6 h-6 text-blue-600" />;
      case 'highRisks':
        return <DaisyAlertTriangle className="w-6 h-6 text-red-600" >
  ;
</DaisyAlertTriangle>
      case 'compliance':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'activeControls':
        return <Settings className="w-6 h-6 text-purple-600" />;
      case 'pendingActions':
        return <Clock className="w-6 h-6 text-orange-600" />;
      default:
        return <Activity className="w-6 h-6 text-gray-600" />;
    }
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <DaisyDialog open={isOpen} onOpenChange={onClose} />
      <DaisyDialogContent className="max-w-4xl max-h-[85vh]" style={{ backgroundColor: '#FFFFFF' }}>
        <DaisyDialogHeader >
  <DaisyDialogTitle className="flex items-center space-x-3 text-[#191919]" />
</DaisyDialog>
            {getIcon()}
            <span className="font-bold">{data.title}</span>
            <DaisyBadge 
              variant="outline" 
              className="ml-2 text-lg px-3 py-1 border-[#D8C3A5] text-[#191919] bg-[#FAFAFA]" >
  {data.value}
</DaisyBadge>
            </DaisyBadge>
          </DaisyDialogTitle>
          <DaisyDialogDescription className="text-[#A8A8A8] font-semibold" >
  {data.description}
</DaisyDialogDescription>
          </DaisyDialogDescription>
        </DaisyDialogHeader>

        <DaisyScrollArea className="max-h-[60vh] pr-4" />
          <div className="space-y-6">
            {/* Overview Section */}
            <DaisyCard className="border-2 border-[#D8C3A5] bg-[#FAFAFA]" >
  <DaisyCardHeader />
</DaisyScrollArea>
                <DaisyCardTitle className="text-[#191919] font-bold flex items-center" >
  <Eye className="w-5 h-5 mr-2" />
</DaisyCardTitle>
                  Overview
                </DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <p className="text-[#191919] font-semibold leading-relaxed">
</DaisyCardContent>
                  {data.details.overview}
                </p>
              </DaisyCardContent>
            </DaisyCard>

            {/* Breakdown Section */}
            {data.details.breakdown && (
              <DaisyCard className="border-2 border-[#D8C3A5] bg-[#FAFAFA]" >
  <DaisyCardHeader />
</DaisyCard>
                  <DaisyCardTitle className="text-[#191919] font-bold flex items-center" >
  <TrendingUp className="w-5 h-5 mr-2" />
</DaisyCardTitle>
                    Breakdown
                  </DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <div className="space-y-4">
</DaisyCardContent>
                    {data.details.breakdown.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[#191919] font-semibold">{item.label}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-[#191919] font-bold">{item.value}</span>
                            {item.percentage && (
                              <DaisyBadge variant="outline" className="border-[#D8C3A5] text-[#191919]" >
  {item.percentage}%
</DaisyBadge>
                              </DaisyBadge>
                            )}
                          </div>
                        </div>
                        {item.percentage && (
                          <DaisyProgress 
                            value={item.percentage} 
                            className="h-2"
                            style={{ backgroundColor: item.color }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </DaisyProgress>
              </DaisyCard>
            )}

            {/* Recent Items */}
            {data.details.recentItems && (
              <DaisyCard className="border-2 border-[#D8C3A5] bg-[#FAFAFA]" >
  <DaisyCardHeader />
</DaisyCard>
                  <DaisyCardTitle className="text-[#191919] font-bold flex items-center" >
  <Activity className="w-5 h-5 mr-2" />
</DaisyCardTitle>
                    Recent Activity
                  </DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <div className="space-y-3">
</DaisyCardContent>
                    {data.details.recentItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-[#D8C3A5] rounded-lg bg-white">
                        <div className="flex-1">
                          <h4 className="text-[#191919] font-semibold">{item.title}</h4>
                          <p className="text-[#A8A8A8] text-sm font-medium">{item.date}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {item.priority && (
                            <DaisyBadge 
                              variant={item.priority === 'high' ? 'destructive' : item.priority === 'medium' ? 'default' : 'secondary'}
                              className="text-xs" >
  {item.priority}
</DaisyBadge>
                            </DaisyBadge>
                          )}
                          <DaisyBadge variant="outline" className="border-[#D8C3A5] text-[#191919]" >
  {item.status}
</DaisyBadge>
                          </DaisyBadge>
                        </div>
                      </div>
                    ))}
                  </div>
                </DaisyCardContent>
              </DaisyCard>
            )}

            {/* Insights */}
            {data.details.insights && (
              <DaisyCard className="border-2 border-[#D8C3A5] bg-[#FAFAFA]" >
  <DaisyCardHeader />
</DaisyCard>
                  <DaisyCardTitle className="text-[#191919] font-bold flex items-center" >
  <FileText className="w-5 h-5 mr-2" />
</DaisyCardTitle>
                    Key Insights
                  </DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <div className="space-y-3">
</DaisyCardContent>
                    {data.details.insights.map((insight, index) => (
                      <div 
                        key={index} 
                        className={`p-3 rounded-lg border ${
                          insight.type === 'positive' ? 'border-green-200 bg-green-50' :
                          insight.type === 'negative' ? 'border-red-200 bg-red-50' :
                          'border-[#D8C3A5] bg-white'
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          {insight.type === 'positive' && <TrendingUp className="w-4 h-4 text-green-600 mt-0.5" />}
                          {insight.type === 'negative' && <TrendingDown className="w-4 h-4 text-red-600 mt-0.5" />}
                          {insight.type === 'neutral' && <Activity className="w-4 h-4 text-[#191919] mt-0.5" />}
                          <p className="text-[#191919] font-semibold text-sm">{insight.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </DaisyCardContent>
              </DaisyCard>
            )}
          </div>
        </DaisyScrollArea>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-[#D8C3A5]">
          {data.actions.map((action, index) => (
            <DaisyButton
              key={index}
              variant={action.variant}
              onClick={() => handleNavigation(action.href)}
              className={`font-semibold ${
                action.variant === 'primary' ? 'bg-[#191919] text-[#FAFAFA] hover:bg-[#333333]' :
                action.variant === 'secondary' ? 'border-[#191919] text-[#191919] hover:bg-[#D8C3A5]' :
                ''
              }`}
            >
              {action.label}
              <ArrowRight className="w-4 h-4 ml-2" />
            </DaisyButton>
          ))}
        </div>
      </DaisyDialogContent>
    </DaisyDialog>
  );
}; 