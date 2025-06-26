'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { MainContentArea } from '@/components/layout/MainContentArea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EnhancedProboService } from '@/services/EnhancedProboService';
import { CreateRiskModal } from './CreateRiskModal';
import ExportService from '@/services/ExportService';
import {
  Plus,
  LayoutGrid,
  List,
  Filter,
  Download,
  Search,
  AlertTriangle,
  Shield,
  CheckCircle,
  Clock,
  Users,
  Calendar,
  MoreHorizontal,
  Eye,
  Edit,
  Target,
  Map,
  BarChart3,
  Zap,
  ArrowRight,
  Link2,
} from 'lucide-react';

// Types
export interface Risk {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'open' | 'in-progress' | 'mitigated' | 'closed' | 'monitoring';
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  impact: 1 | 2 | 3 | 4 | 5;
  likelihood: 1 | 2 | 3 | 4 | 5;
  riskScore: number;
  owner: {
    name: string;
    email: string;
  };
  framework: string[];
  dueDate: Date;
  lastUpdated: Date;
  controls: number;
  treatment: 'accept' | 'mitigate' | 'transfer' | 'avoid' | 'none';
  progress: number;
}

// Sample Risk Data
const sampleRisks: Risk[] = [
  {
    id: 'RSK-001',
    title: 'Data breach through third-party vendor',
    description: 'Potential data exposure due to inadequate security controls at third-party vendors handling sensitive customer information.',
    category: 'Data Security',
    status: 'open',
    riskLevel: 'critical',
    impact: 5,
    likelihood: 4,
    riskScore: 20,
    owner: {
      name: 'Sarah Chen',
      email: 'sarah.chen@company.com',
    },
    framework: ['SOC 2', 'GDPR'],
    dueDate: new Date('2024-02-15'),
    lastUpdated: new Date('2024-01-15'),
    controls: 3,
    treatment: 'mitigate',
    progress: 25,
  },
  {
    id: 'RSK-002',
    title: 'Unauthorized access to financial systems',
    description: 'Risk of unauthorized access to critical financial systems due to weak authentication mechanisms.',
    category: 'Access Control',
    status: 'in-progress',
    riskLevel: 'high',
    impact: 4,
    likelihood: 3,
    riskScore: 12,
    owner: {
      name: 'Michael Rodriguez',
      email: 'michael.rodriguez@company.com',
    },
    framework: ['SOC 2', 'ISO 27001'],
    dueDate: new Date('2024-01-30'),
    lastUpdated: new Date('2024-01-14'),
    controls: 5,
    treatment: 'mitigate',
    progress: 65,
  },
  {
    id: 'RSK-003',
    title: 'Compliance violation in data retention',
    description: 'Potential violation of data retention policies leading to regulatory penalties.',
    category: 'Compliance',
    status: 'monitoring',
    riskLevel: 'medium',
    impact: 3,
    likelihood: 2,
    riskScore: 6,
    owner: {
      name: 'Emma Johnson',
      email: 'emma.johnson@company.com',
    },
    framework: ['GDPR', 'CCPA'],
    dueDate: new Date('2024-03-01'),
    lastUpdated: new Date('2024-01-13'),
    controls: 2,
    treatment: 'accept',
    progress: 80,
  },
];

// Risk Level Configuration
const getRiskLevelConfig = (level: string) => {
  const configs = {
    'critical': { 
      color: 'text-semantic-error', 
      bg: 'bg-semantic-error/10', 
      border: 'border-semantic-error',
      icon: AlertTriangle 
    },
    'high': { 
      color: 'text-semantic-warning', 
      bg: 'bg-semantic-warning/10', 
      border: 'border-semantic-warning',
      icon: AlertTriangle 
    },
    'medium': { 
      color: 'text-interactive-primary', 
      bg: 'bg-interactive-primary/10', 
      border: 'border-interactive-primary',
      icon: Shield 
    },
    'low': { 
      color: 'text-semantic-success', 
      bg: 'bg-semantic-success/10', 
      border: 'border-semantic-success',
      icon: CheckCircle 
    },
  };
  return configs[level as keyof typeof configs] || configs.medium;
};

// Status Configuration
const getStatusConfig = (status: string) => {
  const configs = {
    'open': { variant: 'destructive' as const, icon: AlertTriangle },
    'in-progress': { variant: 'secondary' as const, icon: Clock },
    'mitigated': { variant: 'outline' as const, icon: Shield },
    'closed': { variant: 'secondary' as const, icon: CheckCircle },
    'monitoring': { variant: 'secondary' as const, icon: Eye },
  };
  return configs[status as keyof typeof configs] || configs.open;
};

// Risk Card Component
const RiskCard: React.FC<{ risk: Risk; onAction: (action: string, risk: Risk) => void }> = ({ 
  risk, 
  onAction 
}) => {
  const riskConfig = getRiskLevelConfig(risk.riskLevel);
  const statusConfig = getStatusConfig(risk.status);
  const StatusIcon = statusConfig.icon;
  const RiskIcon = riskConfig.icon;

  const isOverdue = risk.dueDate < new Date() && risk.status !== 'closed';

  return (
    <div className="p-enterprise-4 border border-border rounded-lg hover:shadow-notion-sm transition-all duration-200 bg-white">
      {/* Header */}
      <div className="flex items-start justify-between mb-enterprise-3">
        <div className="flex-1">
          <div className="flex items-center space-x-enterprise-2 mb-enterprise-1">
            <span className="text-caption font-medium text-text-tertiary">{risk.id}</span>
            <Badge variant={statusConfig.variant} className="text-caption">
              <StatusIcon className="h-3 w-3 mr-enterprise-1" />
              {risk.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          </div>
          <h3 className="text-body-base font-semibold text-text-primary mb-enterprise-1">
            {risk.title}
          </h3>
          <p className="text-caption text-text-secondary line-clamp-2">
            {risk.description}
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0"
          onClick={() => onAction('menu', risk)}
        >
          <MoreHorizontal className="h-3 w-3" />
        </Button>
      </div>

      {/* Risk Level & Score */}
      <div className="flex items-center justify-between mb-enterprise-3">
        <div className={cn(
          "inline-flex items-center px-enterprise-2 py-enterprise-1 rounded-full border text-caption font-medium",
          riskConfig.color,
          riskConfig.bg,
          riskConfig.border
        )}>
          <RiskIcon className="h-3 w-3 mr-enterprise-1" />
          {risk.riskLevel.charAt(0).toUpperCase() + risk.riskLevel.slice(1)}
        </div>
        <div className="flex items-center space-x-enterprise-3 text-caption text-text-secondary">
          <span>Score: {risk.riskScore}</span>
          <span>Impact: {risk.impact}</span>
          <span>Likelihood: {risk.likelihood}</span>
        </div>
      </div>

      {/* Progress */}
      {risk.status !== 'closed' && (
        <div className="mb-enterprise-3">
          <div className="flex items-center justify-between mb-enterprise-1">
            <span className="text-caption text-text-secondary">Progress</span>
            <span className="text-caption font-medium text-text-primary">{risk.progress}%</span>
          </div>
          <div className="w-full bg-surface-secondary rounded-full h-2">
            <div
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                risk.progress >= 80 ? "bg-semantic-success" :
                risk.progress >= 50 ? "bg-semantic-warning" : "bg-semantic-error"
              )}
              style={{ width: `${risk.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="space-y-enterprise-2">
        {/* Owner & Category */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-enterprise-2">
            <div className="h-5 w-5 rounded-full bg-surface-secondary flex items-center justify-center">
              <Users className="h-3 w-3 text-text-tertiary" />
            </div>
            <span className="text-caption text-text-secondary">{risk.owner.name}</span>
          </div>
          <Badge variant="outline" className="text-caption">
            {risk.category}
          </Badge>
        </div>

        {/* Due Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-enterprise-2">
            <Calendar className={cn(
              "h-3 w-3",
              isOverdue ? "text-semantic-error" : "text-text-tertiary"
            )} />
            <span className={cn(
              "text-caption",
              isOverdue ? "text-semantic-error font-medium" : "text-text-secondary"
            )}>
              Due: {risk.dueDate.toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center space-x-enterprise-1">
            <Shield className="h-3 w-3 text-text-tertiary" />
            <span className="text-caption text-text-secondary">{risk.controls} controls</span>
          </div>
        </div>

        {/* Framework Tags */}
        <div className="flex flex-wrap gap-enterprise-1">
          {risk.framework.slice(0, 2).map((framework) => (
            <Badge key={framework} variant="outline" className="text-caption">
              {framework}
            </Badge>
          ))}
          {risk.framework.length > 2 && (
            <Badge variant="outline" className="text-caption">
              +{risk.framework.length - 2}
            </Badge>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-enterprise-3 pt-enterprise-3 border-t border-border">
        <div className="flex items-center space-x-enterprise-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-enterprise-2"
            onClick={() => onAction('view', risk)}
          >
            <Eye className="h-3 w-3 mr-enterprise-1" />
            View
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-enterprise-2"
            onClick={() => onAction('edit', risk)}
          >
            <Edit className="h-3 w-3 mr-enterprise-1" />
            Edit
          </Button>
        </div>
        <span className="text-caption text-text-tertiary">
          Updated {risk.lastUpdated.toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

// Risk Register Component
const RiskRegister: React.FC = () => {
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Filter risks based on search and filters
  const filteredRisks = sampleRisks.filter(risk => {
    const matchesSearch = risk.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         risk.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || risk.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || risk.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleRiskAction = (action: string, risk: Risk) => {
    switch (action) {
      case 'view':
        // Navigate to risk detail view
        toast.success(`Viewing details for ${risk.title}`);
        break;
      case 'edit':
        // Open edit modal
        toast.success(`Editing ${risk.title}`);
        break;
      case 'delete':
        // Confirm and delete risk
        if (confirm(`Are you sure you want to delete "${risk.title}"?`)) {
          toast.success(`Deleted ${risk.title}`);
        }
        break;
      case 'assign':
        // Assign to user
        toast.success(`Assigning ${risk.title}`);
        break;
      default:
        toast(`Action "${action}" not yet implemented for ${risk.title}`);
    }
  };

  const categories = [...new Set(sampleRisks.map(r => r.category))];
  const statuses = [...new Set(sampleRisks.map(r => r.status))];

  return (
    <div className="space-y-enterprise-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-enterprise-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-enterprise-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-text-tertiary" />
            <Input
              placeholder="Search risks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-enterprise-8 w-64"
            />
          </div>

          {/* Filters */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statuses.map(status => (
                <SelectItem key={status} value={status}>
                  {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-enterprise-2">
          <div className="flex items-center border border-border rounded-lg p-1">
            <Button
              variant={viewMode === 'card' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('card')}
              className="h-6 px-enterprise-2"
            >
              <LayoutGrid className="h-3 w-3" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-6 px-enterprise-2"
            >
              <List className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <span className="text-caption text-text-secondary">
          {filteredRisks.length} risk{filteredRisks.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Risk Display */}
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-enterprise-4">
          {filteredRisks.map((risk) => (
            <RiskCard
              key={risk.id}
              risk={risk}
              onAction={handleRiskAction}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-enterprise-8">
          <List className="h-8 w-8 text-text-tertiary mx-auto mb-enterprise-2" />
          <p className="text-body-sm text-text-secondary">
            Table view will integrate with VantaDataTable component
          </p>
        </div>
      )}

      {/* Empty State */}
      {filteredRisks.length === 0 && (
        <div className="text-center py-enterprise-12">
          <AlertTriangle className="h-12 w-12 text-text-tertiary mx-auto mb-enterprise-4" />
          <h3 className="text-heading-base font-semibold text-text-primary mb-enterprise-2">
            No risks found
          </h3>
          <p className="text-body-base text-text-secondary mb-enterprise-4">
            Try adjusting your filters or search terms.
          </p>
          <Button variant="outline">
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

// Main Risk Management Dashboard
export const RiskManagementDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('register');
  const [proboMappings, setProboMappings] = useState<any[]>([]);
  const [isLoadingMappings, setIsLoadingMappings] = useState(false);
  const [isCreateRiskModalOpen, setIsCreateRiskModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const totalRisks = sampleRisks.length;
  const openRisks = sampleRisks.filter(r => r.status === 'open').length;
  const criticalRisks = sampleRisks.filter(r => r.riskLevel === 'critical').length;
  const avgRiskScore = Math.round(sampleRisks.reduce((sum, r) => sum + r.riskScore, 0) / totalRisks);

  // Load Probo control mappings
  useEffect(() => {
    const loadProboMappings = async () => {
      setIsLoadingMappings(true);
      try {
        const proboService = EnhancedProboService.getInstance();
        const mappings = await proboService.mapControlsToRisks('org-1'); // Replace with actual org ID
        setProboMappings(mappings);
      } catch (error) {
        console.error('Failed to load Probo mappings:', error);
      } finally {
        setIsLoadingMappings(false);
      }
    };

    if (activeTab === 'controls') {
      loadProboMappings();
    }
  }, [activeTab]);

  const handleImportProboControls = async () => {
    try {
      const response = await fetch('/api/controls/probo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import',
          organizationId: 'org-1', // Replace with actual org ID
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success('Probo controls imported successfully!');
        // Controls imported successfully, result contains import details
      }
    } catch (error) {
      console.error('Failed to import Probo controls:', error);
      toast.error('Failed to import Probo controls');
    }
  };

  const handleExportRisks = async (format: 'csv' | 'pdf' | 'json' = 'csv') => {
    try {
      await ExportService.exportRisks(sampleRisks, { format });
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleCreateRisk = () => {
    setIsCreateRiskModalOpen(true);
  };

  const handleRiskCreated = (newRisk: any) => {
    // In a real app, you would refresh the data
    setRefreshKey(prev => prev + 1);
    toast.success('Risk created successfully!');
  };

  const handleOpenSettings = () => {
    toast.success('Opening risk management settings...');
    // Navigate to settings page or open settings modal
  };

  return (
    <MainContentArea
      title="Risk Management"
      subtitle="Comprehensive risk identification, assessment, and mitigation"
      breadcrumbs={[
        { label: 'Risk Management', current: true },
      ]}
      primaryAction={{
        label: 'New Risk',
        onClick: handleCreateRisk,
        icon: Plus,
      }}
      secondaryActions={[
        {
          label: 'Export CSV',
          onClick: () => handleExportRisks('csv'),
          icon: Download,
          variant: 'outline',
        },
        {
          label: 'Export PDF',
          onClick: () => handleExportRisks('pdf'),
          icon: Download,
          variant: 'outline',
        },
        {
          label: 'Settings',
          onClick: handleOpenSettings,
          icon: Filter,
          variant: 'outline',
        },
      ]}
      stats={[
        {
          label: 'total risks',
          value: totalRisks,
          variant: 'default',
        },
        {
          label: 'open risks',
          value: openRisks,
          variant: 'destructive',
        },
        {
          label: 'critical risks',
          value: criticalRisks,
          variant: 'destructive',
        },
        {
          label: 'avg risk score',
          value: avgRiskScore,
          variant: 'warning',
        },
      ]}
      maxWidth="2xl"
    >
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-enterprise-6">
        <TabsList>
          <TabsTrigger value="register">Risk Register</TabsTrigger>
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
          <TabsTrigger value="heatmap">Heat Map</TabsTrigger>
          <TabsTrigger value="controls">
            <Shield className="h-4 w-4 mr-2" />
            Probo Controls
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
      </Tabs>

      <TabsContent value="register">
        <RiskRegister />
      </TabsContent>

      <TabsContent value="assessment">
        <div className="text-center py-enterprise-12">
          <Target className="h-12 w-12 text-text-tertiary mx-auto mb-enterprise-4" />
          <h3 className="text-heading-base font-semibold text-text-primary mb-enterprise-2">
            Risk Assessment
          </h3>
          <p className="text-body-base text-text-secondary">
            Interactive risk matrix and evaluation forms.
          </p>
        </div>
      </TabsContent>

      <TabsContent value="heatmap">
        <div className="text-center py-enterprise-12">
          <Map className="h-12 w-12 text-text-tertiary mx-auto mb-enterprise-4" />
          <h3 className="text-heading-base font-semibold text-text-primary mb-enterprise-2">
            Risk Heat Map
          </h3>
          <p className="text-body-base text-text-secondary">
            Interactive risk positioning and grouping.
          </p>
        </div>
      </TabsContent>

      <TabsContent value="controls" className="space-y-6">
        {/* Probo Integration Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#199BEC]/10 rounded-lg">
                  <Shield className="h-6 w-6 text-[#199BEC]" />
                </div>
                <div>
                  <CardTitle className="text-lg">Probo Security Controls</CardTitle>
                  <CardDescription>
                    AI-powered risk-control mapping with 651+ industry-standard controls
                  </CardDescription>
                </div>
              </div>
              <Button onClick={handleImportProboControls} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Import Controls</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                Probo integration automatically maps your risks to relevant security controls, 
                providing AI-powered recommendations for risk mitigation strategies.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Risk-Control Mappings */}
        {isLoadingMappings ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#199BEC] mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Loading control mappings...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sampleRisks.map((risk) => {
              const mapping = proboMappings.find(m => m.riskId === risk.id);
              const coveragePercentage = mapping?.coveragePercentage || 0;
              const controlCount = mapping?.controlIds?.length || 0;
              
              return (
                <Card key={risk.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {risk.id}
                          </Badge>
                          <Badge 
                            variant={risk.riskLevel === 'critical' ? 'destructive' : 
                                   risk.riskLevel === 'high' ? 'secondary' : 'outline'}
                          >
                            {risk.riskLevel.toUpperCase()}
                          </Badge>
                        </div>
                        <CardTitle className="text-base">{risk.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {risk.description}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#199BEC]">{controlCount}</div>
                        <div className="text-xs text-gray-500">Controls</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Coverage Progress */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Control Coverage</span>
                          <span>{coveragePercentage}%</span>
                        </div>
                        <Progress value={coveragePercentage} className="h-2" />
                      </div>

                      {/* Recommendations */}
                      {mapping?.recommendations && mapping.recommendations.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">AI Recommendations</h4>
                          <ul className="space-y-1">
                            {mapping.recommendations.map((rec: string, index: number) => (
                              <li key={index} className="text-xs text-gray-600 flex items-start">
                                <ArrowRight className="h-3 w-3 mt-0.5 mr-2 flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex space-x-2 pt-2">
                        <Button variant="outline" size="sm" className="flex items-center space-x-1">
                          <Link2 className="h-3 w-3" />
                          <span>View Controls</span>
                        </Button>
                        <Button variant="outline" size="sm" className="flex items-center space-x-1">
                          <Target className="h-3 w-3" />
                          <span>Create Tasks</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </TabsContent>

      <TabsContent value="analytics">
        <div className="text-center py-enterprise-12">
          <BarChart3 className="h-12 w-12 text-text-tertiary mx-auto mb-enterprise-4" />
          <h3 className="text-heading-base font-semibold text-text-primary mb-enterprise-2">
            Risk Analytics
          </h3>
          <p className="text-body-base text-text-secondary">
            Comprehensive risk metrics and trends.
          </p>
        </div>
      </TabsContent>

      {/* Create Risk Modal */}
      <CreateRiskModal
        open={isCreateRiskModalOpen}
        onOpenChange={setIsCreateRiskModalOpen}
        onRiskCreated={handleRiskCreated}
      />
    </MainContentArea>
  );
};

export default RiskManagementDashboard; 