import { useState, useEffect } from 'react';
import { Risk } from '@/types';
import { useRisks } from '@/context/RiskContext';
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

export default function RiskListPage() {
  const { selectedRisks, getRiskStats } = useRisks();
  const [activeTab, setActiveTab] = useState('list');
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const stats = getRiskStats();

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
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="animate-fade-in-up">
          <BreadcrumbNav items={breadcrumbItems} />
        </div>

        {/* Header */}
        <div className="flex justify-between items-start animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
              Risk Management
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl">
              Comprehensive risk assessment and management platform with AI-powered insights
            </p>
            <div className="flex items-center space-x-4 pt-2">
              <Button
                onClick={() => setCommandPaletteOpen(true)}
                className="btn-ghost"
              >
                <Command className="w-4 h-4 mr-2" />
                Command Palette
                <kbd className="ml-2 text-xs bg-slate-100 px-1.5 py-0.5 rounded">⌘K</kbd>
              </Button>
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="btn-ghost"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          <Button onClick={handleCreateRisk} className="btn-primary">
            <Plus className="mr-2 h-5 w-5" />
            Add Risk
          </Button>
        </div>

        {/* Enhanced Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <EnhancedStatsCard
            title="Total Risks"
            value={stats.total}
            subtitle="Across all categories"
            icon={Shield}
            iconColor="text-slate-600"
            iconBgColor="bg-slate-100"
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
            iconBgColor="bg-red-50"
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
            iconBgColor="bg-orange-50"
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
            title="Average Score"
            value={stats.averageScore.toFixed(1)}
            subtitle="Out of 25 maximum"
            icon={Activity}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-50"
            trend={{
              value: 3,
              label: 'improvement',
              direction: 'down'
            }}
            progress={{
              value: stats.averageScore,
              max: 25,
              color: stats.averageScore > 15 ? 'high' : stats.averageScore > 8 ? 'medium' : 'low'
            }}
          />
        </div>

        {/* Enhanced Tabs with smooth transitions */}
        <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="risk-card p-1 w-fit">
              <TabsList className="grid w-full grid-cols-6 bg-transparent">
                <TabsTrigger 
                  value="list" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300"
                >
                  <FileText className="h-4 w-4" />
                  Risk List
                </TabsTrigger>
                <TabsTrigger 
                  value="matrix" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300"
                >
                  <BarChart3 className="h-4 w-4" />
                  Risk Matrix
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300"
                >
                  <PieChart className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger 
                  value="filters" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </TabsTrigger>
                <TabsTrigger 
                  value="upload" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300"
                >
                  <Upload className="h-4 w-4" />
                  Document Upload
                </TabsTrigger>
                <TabsTrigger 
                  value="ai" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300"
                >
                  <Brain className="h-4 w-4" />
                  AI Analysis
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="list" className="tab-content space-y-6">
              <RiskListView
                onCreateRisk={handleCreateRisk}
                onEditRisk={handleEditRisk}
                onViewRisk={handleRiskClick}
              />
            </TabsContent>

            <TabsContent value="matrix" className="tab-content space-y-6">
              <div className="risk-card p-6">
                <EnhancedRiskMatrix
                  onRiskClick={handleRiskClick}
                  selectedRisks={selectedRisks}
                  viewMode="matrix"
                  enableClustering={true}
                  enableExport={true}
                />
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="tab-content space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RiskDistributionChart 
                  distributionBy="level"
                  chartType="donut"
                />
                <RiskDistributionChart 
                  distributionBy="category"
                  chartType="bar"
                />
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <Card className="risk-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Risk Trends & Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="bg-gradient-to-br from-blue-100 to-purple-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="h-8 w-8 text-blue-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-slate-900 mb-2">
                        Advanced Analytics Coming Soon
                      </h4>
                      <p className="text-slate-600 max-w-md mx-auto">
                        Time-series analysis, trend predictions, and comparative visualizations will be available in the next update.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="filters" className="tab-content space-y-6">
              <AdvancedFilters />
            </TabsContent>

            <TabsContent value="upload" className="tab-content space-y-6">
              <div className="risk-card p-6">
                <DocumentUpload
                  onUpload={async (formData) => {
                    console.log('Document uploaded:', formData);
                    // Process the uploaded documents
                  }}
                  maxFiles={5}
                  organizationId="demo-org"
                  userId="demo-user"
                />
              </div>
            </TabsContent>

            <TabsContent value="ai" className="tab-content space-y-6">
              <Card className="risk-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">AI Risk Analysis</h3>
                      <p className="text-sm text-slate-600 font-normal">
                        Upload documents to automatically identify risks and suggest controls
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <div className="bg-gradient-to-br from-purple-100 to-blue-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Brain className="h-10 w-10 text-purple-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 mb-2">
                      Ready for AI Analysis
                    </h4>
                    <p className="text-slate-600 mb-6 max-w-md mx-auto">
                      Upload a document in the Document Upload tab to start AI-powered risk identification and analysis
                    </p>
                    <Button onClick={() => setActiveTab('upload')} className="btn-accent">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Documents
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Enhanced Risk Detail Dialog */}
        <Dialog open={!!selectedRisk} onOpenChange={() => setSelectedRisk(null)}>
          <DialogContent className="max-w-3xl risk-card border-0">
            <DialogHeader className="pb-6">
              <DialogTitle className="text-2xl font-semibold flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                {selectedRisk?.title}
              </DialogTitle>
              <DialogDescription className="text-base text-slate-600">
                {selectedRisk?.description}
              </DialogDescription>
            </DialogHeader>
            
            {selectedRisk && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="text-2xl font-bold text-slate-900">{selectedRisk.likelihood}</div>
                    <div className="text-sm text-slate-600">Likelihood</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="text-2xl font-bold text-slate-900">{selectedRisk.impact}</div>
                    <div className="text-sm text-slate-600">Impact</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="text-2xl font-bold text-slate-900">{selectedRisk.riskScore}</div>
                    <div className="text-sm text-slate-600">Risk Score</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="text-sm font-semibold text-slate-900 capitalize">{selectedRisk.status}</div>
                    <div className="text-sm text-slate-600">Status</div>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button onClick={() => handleEditRisk(selectedRisk)} className="btn-primary">
                    Edit Risk
                  </Button>
                  <Button onClick={() => setSelectedRisk(null)} className="btn-ghost">
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Floating Action Button */}
        <FloatingActionButton
          onPrimaryAction={handleCreateRisk}
          actions={[
            {
              icon: Search,
              label: 'Quick Search',
              onClick: () => setCommandPaletteOpen(true)
            },
            {
              icon: Filter,
              label: 'Open Filters',
              onClick: () => console.log('Open filters')
            },
            {
              icon: Download,
              label: 'Export Data',
              onClick: () => console.log('Export data')
            }
          ]}
        />

        {/* Command Palette */}
        <CommandPaletteDialog
          open={commandPaletteOpen}
          onOpenChange={setCommandPaletteOpen}
          onCreateRisk={handleCreateRisk}
          onFilter={() => console.log('Filter')}
          onExport={() => console.log('Export')}
          onSettings={() => console.log('Settings')}
        />
      </div>
    </div>
  );
}