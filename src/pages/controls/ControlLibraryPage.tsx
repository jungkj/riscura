import { useState } from 'react';
import { ControlLibraryView } from '@/components/controls/ControlLibraryView';
import { useControls } from '@/context/ControlContext';
import { Control } from '@/types';

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Icons
import { Plus, Shield, BarChart3, Network, Calendar } from 'lucide-react';

export default function ControlLibraryPage() {
  const { getControlStats, getControlCoverage } = useControls();
  const [activeTab, setActiveTab] = useState('library');
  const [selectedControl, setSelectedControl] = useState<Control | null>(null);

  const stats = getControlStats();
  const coverage = getControlCoverage();

  const handleCreateControl = () => {
    console.log('Create control clicked');
    // TODO: Implement control creation modal or navigation
  };

  const handleEditControl = (control: Control) => {
    setSelectedControl(control);
    // Navigate to edit form or open edit modal
  };

  const handleTestControl = (control: Control) => {
    console.log('Test control:', control.id);
    // TODO: Implement control testing workflow
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Control Management</h1>
          <p className="text-muted-foreground">
            Comprehensive control library with effectiveness tracking and risk mapping
          </p>
        </div>
        <Button onClick={handleCreateControl}>
          <Plus className="mr-2 h-4 w-4" />
          Add Control
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Controls</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">High Effectiveness</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.byEffectiveness.high || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Performing optimally
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Coverage</CardTitle>
            <Network className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {coverage.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Risks with controls
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tests</CardTitle>
            <Calendar className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.overdueTests}
            </div>
            <p className="text-xs text-muted-foreground">
              Need immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="library" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Control Library
          </TabsTrigger>
          <TabsTrigger value="mapping" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Risk Mapping
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Testing Schedule
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-4">
          <ControlLibraryView
            onCreateControl={handleCreateControl}
            onEditControl={handleEditControl}
            onTestControl={handleTestControl}
          />
        </TabsContent>

        <TabsContent value="mapping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Control-Risk Mapping
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Visual mapping of controls to risks with effectiveness ratings
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Control-Risk mapping interface coming soon</p>
                <p className="text-sm">
                  This will show visual relationships between controls and risks
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Control Testing Schedule
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage control testing schedules and track effectiveness
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Overdue Tests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{stats.overdueTests}</div>
                      <p className="text-xs text-muted-foreground">Require immediate attention</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Due This Week</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-600">3</div>
                      <p className="text-xs text-muted-foreground">Scheduled for testing</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Completed This Month</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">12</div>
                      <p className="text-xs text-muted-foreground">Tests completed</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Detailed testing schedule interface coming soon</p>
                  <p className="text-sm">
                    This will include calendar view and testing workflows
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Control Effectiveness Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Effectiveness trend chart coming soon</p>
                    <p className="text-sm">
                      Will show effectiveness trends over time using Recharts
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-green-600">
                        {stats.byEffectiveness.high || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">High</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-yellow-600">
                        {stats.byEffectiveness.medium || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Medium</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-red-600">
                        {stats.byEffectiveness.low || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Low</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Control Coverage Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Coverage heat map coming soon</p>
                    <p className="text-sm">
                      Will show control coverage gaps and overlaps
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Risks with Controls</span>
                      <Badge variant="outline">{coverage.length}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Coverage Gaps</span>
                      <Badge variant="destructive">{stats.coverageGaps}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Average Effectiveness</span>
                      <Badge variant="secondary">{stats.averageEffectiveness.toFixed(1)}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Control Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.byType.preventive || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Preventive</div>
                  <div className="text-xs text-muted-foreground">
                    {stats.total > 0 ? Math.round(((stats.byType.preventive || 0) / stats.total) * 100) : 0}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.byType.detective || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Detective</div>
                  <div className="text-xs text-muted-foreground">
                    {stats.total > 0 ? Math.round(((stats.byType.detective || 0) / stats.total) * 100) : 0}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.byType.corrective || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Corrective</div>
                  <div className="text-xs text-muted-foreground">
                    {stats.total > 0 ? Math.round(((stats.byType.corrective || 0) / stats.total) * 100) : 0}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Control Detail Dialog */}
      <Dialog open={!!selectedControl} onOpenChange={() => setSelectedControl(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedControl?.title}</DialogTitle>
            <DialogDescription>
              Control details and effectiveness information
            </DialogDescription>
          </DialogHeader>
          {selectedControl && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <p className="text-sm text-muted-foreground">{selectedControl.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Effectiveness</label>
                  <p className="text-sm text-muted-foreground">{selectedControl.effectiveness}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Owner</label>
                  <p className="text-sm text-muted-foreground">{selectedControl.owner}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Frequency</label>
                  <p className="text-sm text-muted-foreground">{selectedControl.frequency}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <p className="text-sm text-muted-foreground mt-1">{selectedControl.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <p className="text-sm text-muted-foreground">{selectedControl.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Linked Risks</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedControl.linkedRisks.length} risk(s)
                  </p>
                </div>
              </div>
              {selectedControl.evidence.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Evidence ({selectedControl.evidence.length})</label>
                  <div className="mt-2 space-y-2">
                    {selectedControl.evidence.slice(0, 3).map((evidence) => (
                      <div key={evidence.id} className="flex items-center space-x-2 text-sm">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span>{evidence.name}</span>
                      </div>
                    ))}
                    {selectedControl.evidence.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{selectedControl.evidence.length - 3} more files
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}