import { useState, useEffect } from 'react';
import { Risk } from '@/types';
import { RiskListView } from '@/components/risks/RiskListView';
import { RiskMatrix } from '@/components/risks/RiskMatrix';
import DocumentUpload from '@/components/documents/DocumentUpload';

// Enhanced UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EnhancedStatsCard } from '@/components/ui/enhanced-stats-card';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { CommandPaletteDialog } from '@/components/ui/command-palette';
import { EnhancedRiskMatrix } from '@/components/risks/EnhancedRiskMatrix';
import { RiskDistributionChart } from '@/components/risks/RiskDistributionChart';
import { AdvancedFilters } from '@/components/risks/AdvancedFilters';
import { TrendingUp } from 'lucide-react';

// Icons
import {
  Plus,
  FileText,
  BarChart3,
  Upload,
  Brain,
  Shield,
  AlertTriangle,
  Target,
  Activity,
  Command,
  Search,
  Filter,
  Download,
  RefreshCw,
  PieChart,
} from 'lucide-react';

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';

export default function RiskListPage() {
  // Mock data instead of using context hook
  const mockRisks: Risk[] = [
    {
      id: 'risk-1',
      title: 'Data Breach Risk',
      description: 'Risk of unauthorized access to sensitive customer data',
      category: 'technology',
      likelihood: 3,
      impact: 5,
      riskScore: 15,
      riskLevel: 'high',
      owner: 'admin',
      status: 'identified',
      controls: ['control-1', 'control-2'],
      evidence: [],
      createdAt: new Date('2024-01-15').toISOString(),
      updatedAt: new Date('2024-01-20').toISOString(),
      dateIdentified: new Date('2024-01-15'),
    },
    {
      id: 'risk-2',
      title: 'Operational Process Risk',
      description: 'Risk of process failures leading to service disruption',
      category: 'operational',
      likelihood: 2,
      impact: 3,
      riskScore: 6,
      riskLevel: 'medium',
      owner: 'manager',
      status: 'assessed',
      controls: ['control-3'],
      evidence: [],
      createdAt: new Date('2024-01-20').toISOString(),
      updatedAt: new Date('2024-01-25').toISOString(),
      dateIdentified: new Date('2024-01-20'),
    },
  ];

  const mockStats = {
    total: 8,
    byLevel: {
      critical: 1,
      high: 3,
      medium: 3,
      low: 1,
    },
    byCategory: {
      operational: 4,
      financial: 2,
      strategic: 1,
      compliance: 1,
      technology: 0,
    },
    byStatus: {
      identified: 3,
      assessed: 2,
      mitigated: 2,
      closed: 1,
    },
  };

  const selectedRisks = mockRisks;
  const stats = mockStats;

  const [activeTab, setActiveTab] = useState('list');
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle document upload
  const handleDocumentUpload = async (files: Array<{ id: string; name: string; size: number; type: string }>) => {
    console.log('Documents uploaded:', files);
    // Documents are now available for AI analysis
  };

  const handleRiskClick = (risk: Risk) => {
    setSelectedRisk(risk);
  };

  const handleCreateRisk = () => {
    console.log('Create risk clicked');
    // TODO: Implement risk creation modal or navigation
  };

  const handleEditRisk = (risk: Risk) => {
    setSelectedRisk(risk);
    // Navigate to edit form or open edit modal
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const breadcrumbItems = [
    { label: 'Risk Management', current: true }
  ];

  return (
    <div className="min-h-screen notion-content">
      <div className="container mx-auto py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="notion-fade-in">
          <BreadcrumbNav items={breadcrumbItems} />
        </div>

        {/* Header */}
        <div className="flex justify-between items-start notion-fade-in">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground tracking-tight">
              Risk Management
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Comprehensive risk assessment and management platform with AI-powered insights
            </p>
            <div className="flex items-center space-x-4 pt-2">
              <Button
                onClick={() => setCommandPaletteOpen(true)}
                className="notion-button-ghost"
              >
                <Command className="w-4 h-4 mr-2" />
                Command Palette
                <kbd className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
              </Button>
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="notion-button-ghost"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          <Button onClick={handleCreateRisk} className="notion-button-primary">
            <Plus className="mr-2 h-5 w-5" />
            Add Risk
          </Button>
        </div>

        {/* Enhanced Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 notion-fade-in">
          <EnhancedStatsCard
            title="Total Risks"
            value={stats.total}
            subtitle="Across all categories"
            icon={Shield}
            iconColor="text-foreground"
            iconBgColor="bg-secondary"
            trend={{
              value: 5,
              label: 'vs last month',
              direction: 'up'
            }}
            progress={{
              value: stats.total,
              max: 100,
              color: 'medium'
            }}
          />
          
          <EnhancedStatsCard
            title="Critical Risks"
            value={stats.byLevel.critical || 0}
            subtitle="Require immediate attention"
            icon={AlertTriangle}
            iconColor="text-red-600"
            iconBgColor="bg-red-50 dark:bg-red-950/20"
            trend={{
              value: 12,
              label: 'vs last month',
              direction: 'down'
            }}
            progress={{
              value: stats.byLevel.critical || 0,
              max: 20,
              color: 'critical'
            }}
          />
          
          <EnhancedStatsCard
            title="High Risks"
            value={stats.byLevel.high || 0}
            subtitle="Need mitigation plans"
            icon={Target}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-50 dark:bg-orange-950/20"
            trend={{
              value: 8,
              label: 'vs last month',
              direction: 'neutral'
            }}
            progress={{
              value: stats.byLevel.high || 0,
              max: 30,
              color: 'high'
            }}
          />
          
          <EnhancedStatsCard
            title="Medium Risks"
            value={stats.byLevel.medium || 0}
            subtitle="Monitor regularly"
            icon={Activity}
            iconColor="text-yellow-600"
            iconBgColor="bg-yellow-50 dark:bg-yellow-950/20"
            trend={{
              value: 3,
              label: 'vs last month',
              direction: 'up'
            }}
            progress={{
              value: stats.byLevel.medium || 0,
              max: 50,
              color: 'medium'
            }}
          />
        </div>

        {/* Quick Actions */}
        <Card className="notion-card notion-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-foreground" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                onClick={handleCreateRisk}
                className="notion-button-outline h-auto p-4 flex flex-col items-center gap-2"
              >
                <Plus className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Add Risk</div>
                  <div className="text-xs text-muted-foreground">Create new risk</div>
                </div>
              </Button>
              
              <Button
                onClick={() => setActiveTab('analytics')}
                className="notion-button-outline h-auto p-4 flex flex-col items-center gap-2"
              >
                <BarChart3 className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Analytics</div>
                  <div className="text-xs text-muted-foreground">View insights</div>
                </div>
              </Button>
              
              <Button
                onClick={() => setActiveTab('matrix')}
                className="notion-button-outline h-auto p-4 flex flex-col items-center gap-2"
              >
                <Target className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Risk Matrix</div>
                  <div className="text-xs text-muted-foreground">Visual analysis</div>
                </div>
              </Button>
              
              <Button className="notion-button-outline h-auto p-4 flex flex-col items-center gap-2">
                <Brain className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">AI Analysis</div>
                  <div className="text-xs text-muted-foreground">Get recommendations</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="notion-fade-in">
          <TabsList className="notion-tabs-list">
            <TabsTrigger value="list" className="notion-tab-trigger">
              <FileText className="w-4 h-4 mr-2" />
              List View
            </TabsTrigger>
            <TabsTrigger value="matrix" className="notion-tab-trigger">
              <BarChart3 className="w-4 h-4 mr-2" />
              Risk Matrix
            </TabsTrigger>
            <TabsTrigger value="analytics" className="notion-tab-trigger">
              <PieChart className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            <Card className="notion-card">
              <CardHeader>
                <CardTitle>Risk Register</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedRisks.map((risk) => (
                    <div
                      key={risk.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleRiskClick(risk)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-medium">{risk.title}</h3>
                          <p className="text-sm text-muted-foreground">{risk.description}</p>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              risk.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                              risk.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {risk.riskLevel} Risk
                            </span>
                            <span className="text-xs text-muted-foreground">{risk.category}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{risk.riskScore}</div>
                          <div className="text-xs text-muted-foreground">Risk Score</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matrix" className="space-y-6">
            <Card className="notion-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-foreground" />
                  Enhanced Risk Matrix
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Interactive risk visualization with impact vs probability analysis
                </p>
              </CardHeader>
              <CardContent>
                <EnhancedRiskMatrix />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="notion-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-foreground" />
                    Risk Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RiskDistributionChart />
                </CardContent>
              </Card>

              <Card className="notion-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-foreground" />
                    Risk Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Risk trend analysis coming soon
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <Card className="notion-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-foreground" />
                  Document Upload & AI Analysis
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Upload documents for AI-powered risk extraction and analysis
                </p>
              </CardHeader>
              <CardContent>
                <DocumentUpload
                  onUpload={async (formData) => {
                    console.log('Document uploaded:', formData);
                    // Process the uploaded documents
                  }}
                  maxFiles={5}
                  organizationId="demo-org"
                  userId="demo-user"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <Card className="notion-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-foreground" />
                  AI Risk Insights
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  AI-powered recommendations and risk analysis
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-secondary/50 rounded-lg border">
                    <h4 className="font-medium text-foreground mb-2">Risk Assessment Summary</h4>
                    <p className="text-sm text-muted-foreground">
                      AI analysis shows {stats.byLevel.critical} critical risks requiring immediate attention.
                      Focus areas include cybersecurity, compliance, and operational risks.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-secondary/50 rounded-lg border">
                    <h4 className="font-medium text-foreground mb-2">Recommendations</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Prioritize cybersecurity risk mitigation</li>
                      <li>• Review and update compliance controls</li>
                      <li>• Implement enhanced monitoring for high-risk areas</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton
        onPrimaryAction={handleCreateRisk}
        actions={[
          {
            icon: Plus,
            label: 'Add New Risk',
            onClick: handleCreateRisk
          }
        ]}
      />

      {/* Command Palette */}
      <CommandPaletteDialog
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onCreateRisk={handleCreateRisk}
        onFilter={() => setActiveTab('list')}
        onExport={() => console.log('Export')}
        onSettings={() => console.log('Settings')}
      />

      {/* Risk Detail Dialog */}
      <Dialog open={!!selectedRisk} onOpenChange={() => setSelectedRisk(null)}>
        <DialogContent className="notion-card max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {selectedRisk?.title}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedRisk?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRisk && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Category</label>
                  <p className="text-sm text-muted-foreground capitalize">{selectedRisk.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Risk Level</label>
                  <p className={`text-sm font-medium ${
                    selectedRisk.riskLevel === 'critical' ? 'text-red-600' :
                    selectedRisk.riskLevel === 'high' ? 'text-orange-600' :
                    selectedRisk.riskLevel === 'medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {selectedRisk.riskLevel?.toUpperCase()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Likelihood</label>
                  <p className="text-sm text-muted-foreground">{selectedRisk.likelihood}/5</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Impact</label>
                  <p className="text-sm text-muted-foreground">{selectedRisk.impact}/5</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}