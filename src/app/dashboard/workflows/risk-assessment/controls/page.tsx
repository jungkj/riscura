'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Shield, 
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  BarChart3,
  FileText,
  Plus,
  Filter
} from 'lucide-react';

interface Control {
  id: string;
  title: string;
  description: string;
  framework: string;
  status: 'implemented' | 'partial' | 'not-implemented' | 'under-review';
  effectiveness: number;
  lastTested: string;
  linkedRisks: number;
  category: string;
}

interface ControlStats {
  total: number;
  implemented: number;
  partial: number;
  notImplemented: number;
  averageEffectiveness: number;
}

export default function ReviewRiskControlsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [controls, setControls] = useState<Control[]>([]);
  const [stats, setStats] = useState<ControlStats>({
    total: 0,
    implemented: 0,
    partial: 0,
    notImplemented: 0,
    averageEffectiveness: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    fetchControls();
  }, []);

  const fetchControls = async () => {
    try {
      const response = await fetch('/api/controls');
      if (!response.ok) throw new Error('Failed to fetch controls');
      
      const data = await response.json();
      const controlsData = data.data || [];
      setControls(controlsData);
      
      // Calculate stats
      const implemented = controlsData.filter((c: Control) => c.status === 'implemented').length;
      const partial = controlsData.filter((c: Control) => c.status === 'partial').length;
      const notImplemented = controlsData.filter((c: Control) => c.status === 'not-implemented').length;
      const avgEffectiveness = controlsData.length > 0
        ? controlsData.reduce((sum: number, c: Control) => sum + c.effectiveness, 0) / controlsData.length
        : 0;
      
      setStats({
        total: controlsData.length,
        implemented,
        partial,
        notImplemented,
        averageEffectiveness: Math.round(avgEffectiveness)
      });
    } catch (error) {
      console.error('Failed to fetch controls:', error);
      toast({
        title: 'Error',
        description: 'Failed to load controls',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'not-implemented': return 'bg-red-100 text-red-800';
      case 'under-review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'implemented': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'partial': return <DaisyAlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'not-implemented': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'under-review': return <Clock className="h-4 w-4 text-blue-600" />;
      default: return null;
    }
  };

  const filteredControls = controls.filter(control => {
    const categoryMatch = selectedCategory === 'all' || control.category === selectedCategory;
    const statusMatch = selectedStatus === 'all' || control.status === selectedStatus;
    return categoryMatch && statusMatch;
  });

  const categories = Array.from(new Set(controls.map(c => c.category)));

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <DaisyButton
              variant="ghost"
              onClick={() => router.push('/dashboard/quick-actions')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quick Actions
            </DaisyButton>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Review Risk Controls</h1>
                <p className="text-gray-600 mt-1">Evaluate effectiveness of current risk controls</p>
              </div>
              <DaisyBadge variant="outline" className="text-sm">
                <Clock className="h-4 w-4 mr-1" />
                20-30 min
              </DaisyBadge>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <DaisyCard>
              <DaisyCardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Controls</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Shield className="h-8 w-8 text-gray-400" />
                </div>
              </DaisyCardBody>
            </DaisyCard>

            <DaisyCard>
              <DaisyCardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Implemented</p>
                    <p className="text-2xl font-bold text-green-600">{stats.implemented}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-400" />
                </div>
              </DaisyCardBody>
            </DaisyCard>

            <DaisyCard>
              <DaisyCardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Partial</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.partial}</p>
                  </div>
                  <DaisyAlertTriangle className="h-8 w-8 text-yellow-400" />
                </div>
              </DaisyCardBody>
            </DaisyCard>

            <DaisyCard>
              <DaisyCardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Not Implemented</p>
                    <p className="text-2xl font-bold text-red-600">{stats.notImplemented}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-400" />
                </div>
              </DaisyCardBody>
            </DaisyCard>

            <DaisyCard>
              <DaisyCardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg. Effectiveness</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.averageEffectiveness}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-400" />
                </div>
              </DaisyCardBody>
            </DaisyCard>
          </div>

          {/* Main Content */}
          <DaisyTabs defaultValue="controls" className="space-y-4">
            <DaisyTabsList>
              <DaisyTabsTrigger value="controls">All Controls</DaisyTabsTrigger>
              <DaisyTabsTrigger value="effectiveness">Effectiveness Analysis</DaisyTabsTrigger>
              <DaisyTabsTrigger value="recommendations">Recommendations</DaisyTabsTrigger>
            </DaisyTabsList>

            {/* Controls Tab */}
            <DaisyTabsContent value="controls">
              {/* Filters */}
              <DaisyCard className="mb-4">
                <DaisyCardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Filters:</span>
                    </div>
                    
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-1 border rounded-md text-sm"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>

                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="px-3 py-1 border rounded-md text-sm"
                    >
                      <option value="all">All Statuses</option>
                      <option value="implemented">Implemented</option>
                      <option value="partial">Partial</option>
                      <option value="not-implemented">Not Implemented</option>
                      <option value="under-review">Under Review</option>
                    </select>

                    <div className="ml-auto">
                      <DaisyButton size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Control
                      </DaisyButton>
                    </div>
                  </div>
                </DaisyCardBody>
              </DaisyCard>

              {/* Controls List */}
              {loading ? (
                <DaisyCard>
                  <DaisyCardContent className="p-12 text-center">
                    <p className="text-gray-500">Loading controls...</p>
                  </DaisyCardBody>
                </DaisyCard>
              ) : filteredControls.length === 0 ? (
                <DaisyCard>
                  <DaisyCardContent className="p-12 text-center">
                    <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No controls found</h3>
                    <p className="text-gray-600">
                      {selectedCategory !== 'all' || selectedStatus !== 'all' 
                        ? 'Try adjusting your filters'
                        : 'Add your first control to get started'}
                    </p>
                  </DaisyCardBody>
                </DaisyCard>
              ) : (
                <div className="grid gap-4">
                  {filteredControls.map((control) => (
                    <DaisyCard key={control.id} className="hover:shadow-md transition-shadow">
                      <DaisyCardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {getStatusIcon(control.status)}
                              <h3 className="text-lg font-semibold text-gray-900">
                                {control.title}
                              </h3>
                              <DaisyBadge className={getStatusColor(control.status)}>
                                {control.status.replace('-', ' ').toUpperCase()}
                              </DaisyBadge>
                              <DaisyBadge variant="outline">
                                {control.framework}
                              </DaisyBadge>
                            </div>
                            
                            <p className="text-gray-600 mb-4">{control.description}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-sm text-gray-500">Effectiveness</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <DaisyProgress value={control.effectiveness} className="h-2 flex-1" />
                                  <span className="text-sm font-medium">{control.effectiveness}%</span>
                                </div>
                              </div>
                              
                              <div>
                                <p className="text-sm text-gray-500">Category</p>
                                <p className="text-sm font-medium mt-1">{control.category}</p>
                              </div>
                              
                              <div>
                                <p className="text-sm text-gray-500">Linked Risks</p>
                                <p className="text-sm font-medium mt-1">{control.linkedRisks}</p>
                              </div>
                              
                              <div>
                                <p className="text-sm text-gray-500">Last Tested</p>
                                <p className="text-sm font-medium mt-1">{control.lastTested}</p>
                              </div>
                            </div>
                          </div>
                          
                          <DaisyButton variant="outline" size="sm" className="ml-4">
                            Review
                          </DaisyButton>
                        </div>
                      </DaisyCardBody>
                    </DaisyCard>
                  ))}
                </div>
              )}
            </DaisyTabsContent>

            {/* Effectiveness Analysis Tab */}
            <DaisyTabsContent value="effectiveness">
              <DaisyCard>
                <DaisyCardHeader>
                  <DaisyCardTitle>Control Effectiveness Overview</DaisyCardTitle>
                
                <DaisyCardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Effectiveness by Category</h4>
                      <div className="space-y-3">
                        {categories.map(category => {
                          const categoryControls = controls.filter(c => c.category === category);
                          const avgEffectiveness = categoryControls.length > 0
                            ? Math.round(categoryControls.reduce((sum, c) => sum + c.effectiveness, 0) / categoryControls.length)
                            : 0;
                          
                          return (
                            <div key={category} className="flex items-center gap-4">
                              <div className="w-32 text-sm font-medium">{category}</div>
                              <div className="flex-1">
                                <DaisyProgress value={avgEffectiveness} className="h-3" />
                              </div>
                              <div className="w-16 text-sm text-right">{avgEffectiveness}%</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Key Insights</h4>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                          <p className="text-sm text-gray-600">
                            {stats.implemented} controls are fully implemented and operational
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <DaisyAlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <p className="text-sm text-gray-600">
                            {stats.partial} controls require additional work for full implementation
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                          <p className="text-sm text-gray-600">
                            {stats.notImplemented} controls are not yet implemented
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </DaisyCardBody>
              </DaisyCard>
            </DaisyTabsContent>

            {/* Recommendations Tab */}
            <DaisyTabsContent value="recommendations">
              <DaisyCard>
                <DaisyCardHeader>
                  <DaisyCardTitle>Control Improvement Recommendations</DaisyCardTitle>
                
                <DaisyCardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 rounded-lg">
                      <h4 className="font-medium text-red-900 mb-2">Critical Priority</h4>
                      <ul className="space-y-2 text-sm text-red-800">
                        <li>• Implement {stats.notImplemented} controls that are currently not operational</li>
                        <li>• Focus on controls linked to high-risk areas</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-2">High Priority</h4>
                      <ul className="space-y-2 text-sm text-yellow-800">
                        <li>• Complete implementation of {stats.partial} partially implemented controls</li>
                        <li>• Review and test controls that haven't been tested in 30+ days</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Continuous Improvement</h4>
                      <ul className="space-y-2 text-sm text-blue-800">
                        <li>• Improve effectiveness of controls below 70% effectiveness rating</li>
                        <li>• Establish regular testing schedule for all controls</li>
                        <li>• Document control procedures and test results</li>
                      </ul>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                      <DaisyButton variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Export Report
                      </DaisyButton>
                      <DaisyButton>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Create Action Plan
                      </DaisyButton>
                    </div>
                  </div>
                </DaisyCardBody>
              </DaisyCard>
            </DaisyTabsContent>
          </DaisyTabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}