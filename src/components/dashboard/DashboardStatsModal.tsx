'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
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
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh]" style={{ backgroundColor: '#FFFFFF' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3 text-[#191919]">
            {getIcon()}
            <span className="font-bold">{data.title}</span>
            <Badge 
              variant="outline" 
              className="ml-2 text-lg px-3 py-1 border-[#199BEC]/20 text-[#199BEC] bg-[#199BEC]/5"
            >
              {data.value}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-[#A8A8A8] font-semibold">
            {data.description}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Overview Section */}
            <Card className="border-2 border-[#199BEC]/20 bg-[#199BEC]/5">
              <CardHeader>
                <CardTitle className="text-[#191919] font-bold flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 font-semibold leading-relaxed">
                  {data.details.overview}
                </p>
              </CardContent>
            </Card>

            {/* Breakdown Section */}
            {data.details.breakdown && (
              <Card className="border-2 border-[#199BEC]/20 bg-[#199BEC]/5">
                <CardHeader>
                  <CardTitle className="text-[#191919] font-bold flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.details.breakdown.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 font-semibold">{item.label}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-[#199BEC] font-bold">{item.value}</span>
                            {item.percentage && (
                              <Badge variant="outline" className="border-[#199BEC]/20 text-[#199BEC]">
                                {item.percentage}%
                              </Badge>
                            )}
                          </div>
                        </div>
                        {item.percentage && (
                          <Progress 
                            value={item.percentage} 
                            className="h-2"
                            style={{ backgroundColor: item.color }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Items */}
            {data.details.recentItems && (
              <Card className="border-2 border-[#199BEC]/20 bg-[#199BEC]/5">
                <CardHeader>
                  <CardTitle className="text-[#191919] font-bold flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.details.recentItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-[#199BEC]/20 rounded-lg bg-white">
                        <div className="flex-1">
                          <h4 className="text-gray-700 font-semibold">{item.title}</h4>
                          <p className="text-[#A8A8A8] text-sm font-medium">{item.date}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {item.priority && (
                            <Badge 
                              variant={item.priority === 'high' ? 'destructive' : item.priority === 'medium' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {item.priority}
                            </Badge>
                          )}
                          <Badge variant="outline" className="border-[#199BEC]/20 text-[#199BEC]">
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Insights */}
            {data.details.insights && (
              <Card className="border-2 border-[#199BEC]/20 bg-[#199BEC]/5">
                <CardHeader>
                  <CardTitle className="text-[#191919] font-bold flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.details.insights.map((insight, index) => (
                      <div 
                        key={index} 
                        className={`p-3 rounded-lg border ${
                          insight.type === 'positive' ? 'border-green-200 bg-green-50' :
                          insight.type === 'negative' ? 'border-red-200 bg-red-50' :
                          'border-[#199BEC]/20 bg-white'
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          {insight.type === 'positive' && <TrendingUp className="w-4 h-4 text-green-600 mt-0.5" />}
                          {insight.type === 'negative' && <TrendingDown className="w-4 h-4 text-red-600 mt-0.5" />}
                          {insight.type === 'neutral' && <Activity className="w-4 h-4 text-[#199BEC] mt-0.5" />}
                          <p className="text-gray-700 font-semibold text-sm">{insight.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-[#199BEC]/20">
          {data.actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              onClick={() => handleNavigation(action.href)}
              className={`font-semibold ${
                action.variant === 'primary' ? 'bg-[#191919] text-[#FAFAFA] hover:bg-[#333333]' :
                action.variant === 'secondary' ? 'border-[#191919] text-[#199BEC] hover:bg-[#199BEC]/10' :
                ''
              }`}
            >
              {action.label}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 