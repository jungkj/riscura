import { useState } from 'react';
import { Risk } from '@/types';
import { useRisks } from '@/context/RiskContext';
import { RiskListView } from '@/components/risks/RiskListView';
import { RiskMatrix } from '@/components/risks/RiskMatrix';
import DocumentUpload from '@/components/documents/DocumentUpload';

// UI Components
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

// Icons
import {
  Plus,
  FileText,
  BarChart3,
  Upload,
  Brain,
} from 'lucide-react';

export default function RiskListPage() {
  const { selectedRisks, getRiskStats } = useRisks();
  const [activeTab, setActiveTab] = useState('list');
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);

  const stats = getRiskStats();

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

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Risk Management</h1>
          <p className="text-muted-foreground">
            Comprehensive risk assessment and management platform
          </p>
        </div>
        <Button onClick={handleCreateRisk}>
          <Plus className="mr-2 h-4 w-4" />
          Add Risk
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Risks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Across all categories
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Risks</CardTitle>
            <BarChart3 className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.byLevel.critical || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risks</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.byLevel.high || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Need mitigation plans
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageScore.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of 25 maximum
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Risk List
          </TabsTrigger>
          <TabsTrigger value="matrix" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Risk Matrix
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Document Upload
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <RiskListView
            onCreateRisk={handleCreateRisk}
            onEditRisk={handleEditRisk}
            onViewRisk={handleRiskClick}
          />
        </TabsContent>

        <TabsContent value="matrix" className="space-y-4">
          <RiskMatrix
            onRiskClick={handleRiskClick}
            selectedRisks={selectedRisks}
          />
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <DocumentUpload
            onFilesUploaded={handleDocumentUpload}
            maxFiles={5}
          />
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Risk Analysis
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Upload documents to automatically identify risks and suggest controls
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Upload a document in the Document Upload tab to start AI analysis</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Risk Detail Dialog */}
      <Dialog open={!!selectedRisk} onOpenChange={() => setSelectedRisk(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedRisk?.title}</DialogTitle>
            <DialogDescription>
              Risk details and management information
            </DialogDescription>
          </DialogHeader>
          {selectedRisk && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <p className="text-sm text-muted-foreground">{selectedRisk.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <p className="text-sm text-muted-foreground">{selectedRisk.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Owner</label>
                  <p className="text-sm text-muted-foreground">{selectedRisk.owner}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Risk Score</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedRisk.riskScore} (L:{selectedRisk.likelihood} × I:{selectedRisk.impact})
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <p className="text-sm text-muted-foreground mt-1">{selectedRisk.description}</p>
              </div>
              {selectedRisk.aiConfidence && (
                <div>
                  <label className="text-sm font-medium">AI Confidence</label>
                  <p className="text-sm text-muted-foreground">
                    {Math.round(selectedRisk.aiConfidence * 100)}%
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}