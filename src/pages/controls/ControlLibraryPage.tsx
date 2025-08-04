import { useState } from 'react';
import { Control } from '@/types';

// UI Components
import {
  DaisyTabs,
  DaisyTabsContent,
  DaisyTabsList,
  DaisyTabsTrigger,
} from '@/components/ui/DaisyTabs';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Icons
import { Plus, Shield, BarChart3, Network, Calendar } from 'lucide-react';

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';

export default function ControlLibraryPage() {
  const [activeTab, setActiveTab] = useState('library');
  const [selectedControl, setSelectedControl] = useState<Control | null>(null);

  // Mock stats for display
  const _stats = {
    total: 15,
    byEffectiveness: { high: 8, medium: 5, low: 2 },
    byType: { preventive: 6, detective: 5, corrective: 4 },
    byStatus: { active: 12, inactive: 3 },
    averageEffectiveness: 3.2,
    overdueTests: 2,
    coverageGaps: 1,
  };

  const coverage = [
    { riskId: 'risk-1', controlCount: 3, effectivenessScore: 4.2 },
    { riskId: 'risk-2', controlCount: 2, effectivenessScore: 3.8 },
    { riskId: 'risk-3', controlCount: 4, effectivenessScore: 4.5 },
  ];

  const handleCreateControl = () => {
    // console.log('Create control clicked');
    // TODO: Implement control creation modal or navigation
  };

  const handleEditControl = (control: Control) => {
    setSelectedControl(control);
    // Navigate to edit form or open edit modal
  };

  const handleTestControl = (control: Control) => {
    // console.log('Test control:', control.id);
    // TODO: Implement control testing workflow
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-inter">Control Management</h1>
          <p className="text-gray-600 font-inter">
            Comprehensive control library with effectiveness tracking and risk mapping
          </p>
        </div>
        <DaisyButton
          onClick={handleCreateControl}
          className="bg-gradient-to-r from-[#191919] to-[#191919] text-white hover:from-[#2a2a2a] hover:to-[#2a2a2a] border-0 shadow-md hover:shadow-lg transition-all duration-300 font-inter font-medium"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Control
        </DaisyButton>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DaisyCard className="bg-white border border-gray-100 hover:border-[#191919] transition-all duration-300 shadow-sm hover:shadow-lg">
          <DaisyCardBody className="flex flex-row items-center justify-between space-y-0 pb-2">
            <DaisyCardTitle className="text-sm font-medium text-gray-600">
              Total Controls
            </DaisyCardTitle>
            <Shield className="h-4 w-4 text-gray-400" />
          </DaisyCardBody>
          <DaisyCardBody>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <p className="text-xs text-gray-600">Across all categories</p>
          </DaisyCardBody>
        </DaisyCard>

        <DaisyCard className="bg-white border border-gray-100 hover:border-[#191919] transition-all duration-300 shadow-sm hover:shadow-lg">
          <DaisyCardBody className="flex flex-row items-center justify-between space-y-0 pb-2">
            <DaisyCardTitle className="text-sm font-medium text-gray-600">
              High Effectiveness
            </DaisyCardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </DaisyCardBody>
          <DaisyCardBody>
            <div className="text-2xl font-bold text-green-600">
              {stats.byEffectiveness.high || 0}
            </div>
            <p className="text-xs text-gray-600">Performing optimally</p>
          </DaisyCardBody>
        </DaisyCard>

        <DaisyCard className="bg-white border border-gray-100 hover:border-[#191919] transition-all duration-300 shadow-sm hover:shadow-lg">
          <DaisyCardBody className="flex flex-row items-center justify-between space-y-0 pb-2">
            <DaisyCardTitle className="text-sm font-medium text-gray-600">
              Risk Coverage
            </DaisyCardTitle>
            <Network className="h-4 w-4 text-[#191919]" />
          </DaisyCardBody>
          <DaisyCardBody>
            <div className="text-2xl font-bold text-[#191919]">{coverage.length}</div>
            <p className="text-xs text-gray-600">Risks with controls</p>
          </DaisyCardBody>
        </DaisyCard>

        <DaisyCard className="bg-white border border-gray-100 hover:border-[#191919] transition-all duration-300 shadow-sm hover:shadow-lg">
          <DaisyCardBody className="flex flex-row items-center justify-between space-y-0 pb-2">
            <DaisyCardTitle className="text-sm font-medium text-gray-600">
              Overdue Tests
            </DaisyCardTitle>
            <Calendar className="h-4 w-4 text-red-600" />
          </DaisyCardBody>
          <DaisyCardBody>
            <div className="text-2xl font-bold text-red-600">{stats.overdueTests}</div>
            <p className="text-xs text-gray-600">Need immediate attention</p>
          </DaisyCardBody>
        </DaisyCard>
      </div>

      {/* Main Content Tabs */}
      <DaisyTabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <DaisyTabsList className="grid w-full grid-cols-4 bg-white border border-gray-100 p-1 shadow-sm rounded-xl">
          <DaisyTabsTrigger
            value="library"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#191919] data-[state=active]:to-[#191919] data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 hover:text-gray-900 transition-all duration-200 font-medium rounded-lg flex items-center gap-2"
          >
            <Shield className="h-4 w-4" />
            Control Library
          </DaisyTabsTrigger>
          <DaisyTabsTrigger
            value="mapping"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#191919] data-[state=active]:to-[#191919] data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 hover:text-gray-900 transition-all duration-200 font-medium rounded-lg flex items-center gap-2"
          >
            <Network className="h-4 w-4" />
            Risk Mapping
          </DaisyTabsTrigger>
          <DaisyTabsTrigger
            value="testing"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#191919] data-[state=active]:to-[#191919] data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 hover:text-gray-900 transition-all duration-200 font-medium rounded-lg flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Testing Schedule
          </DaisyTabsTrigger>
          <DaisyTabsTrigger
            value="analytics"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#191919] data-[state=active]:to-[#191919] data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 hover:text-gray-900 transition-all duration-200 font-medium rounded-lg flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </DaisyTabsTrigger>
        </DaisyTabsList>

        <DaisyTabsContent value="library" className="space-y-4">
          <DaisyCard className="bg-white border border-gray-100 shadow-sm">
            <DaisyCardBody className="p-8 text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400 opacity-50" />
              <h3 className="text-lg font-medium mb-2 text-gray-900">Control Library</h3>
              <p className="text-gray-600">Control library interface will be available here.</p>
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>

        <DaisyTabsContent value="mapping" className="space-y-4">
          <DaisyCard className="bg-white border border-gray-100 shadow-sm">
            <DaisyCardBody>
              <DaisyCardTitle className="flex items-center gap-2 text-gray-900">
                <Network className="h-5 w-5" />
                Control-Risk Mapping
              </DaisyCardTitle>
              <p className="text-sm text-gray-600">
                Visual mapping of controls to risks with effectiveness ratings
              </p>
            </DaisyCardBody>
            <DaisyCardBody>
              <div className="text-center py-8 text-gray-600">
                <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Control-Risk mapping interface coming soon</p>
                <p className="text-sm">
                  This will show visual relationships between controls and risks
                </p>
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>

        <DaisyTabsContent value="testing" className="space-y-4">
          <DaisyCard className="bg-white border border-gray-100 shadow-sm">
            <DaisyCardBody>
              <DaisyCardTitle className="flex items-center gap-2 text-gray-900">
                <Calendar className="h-5 w-5" />
                Control Testing Schedule
              </DaisyCardTitle>
              <p className="text-sm text-gray-600">
                Manage control testing schedules and track effectiveness
              </p>
            </DaisyCardBody>
            <DaisyCardBody>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <DaisyCard className="bg-white border border-gray-100 shadow-sm">
                    <DaisyCardBody className="pb-2">
                      <DaisyCardTitle className="text-base text-gray-900">
                        Overdue Tests
                      </DaisyCardTitle>
                    </DaisyCardBody>
                    <DaisyCardBody>
                      <div className="text-2xl font-bold text-red-600">{stats.overdueTests}</div>
                      <p className="text-xs text-gray-600">Require immediate attention</p>
                    </DaisyCardBody>
                  </DaisyCard>

                  <DaisyCard className="bg-white border border-gray-100 shadow-sm">
                    <DaisyCardBody className="pb-2">
                      <DaisyCardTitle className="text-base text-gray-900">
                        Due This Week
                      </DaisyCardTitle>
                    </DaisyCardBody>
                    <DaisyCardBody>
                      <div className="text-2xl font-bold text-yellow-600">3</div>
                      <p className="text-xs text-gray-600">Scheduled for testing</p>
                    </DaisyCardBody>
                  </DaisyCard>

                  <DaisyCard className="bg-white border border-gray-100 shadow-sm">
                    <DaisyCardBody className="pb-2">
                      <DaisyCardTitle className="text-base text-gray-900">
                        Completed This Month
                      </DaisyCardTitle>
                    </DaisyCardBody>
                    <DaisyCardBody>
                      <div className="text-2xl font-bold text-green-600">12</div>
                      <p className="text-xs text-gray-600">Tests completed</p>
                    </DaisyCardBody>
                  </DaisyCard>
                </div>

                <div className="text-center py-8 text-gray-600">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Detailed testing schedule interface coming soon</p>
                  <p className="text-sm">This will include calendar view and testing workflows</p>
                </div>
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>

        <DaisyTabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DaisyCard className="bg-white border border-gray-100 shadow-sm">
              <DaisyCardBody>
                <DaisyCardTitle className="text-base text-gray-900">
                  Control Effectiveness Trends
                </DaisyCardTitle>
              </DaisyCardBody>
              <DaisyCardBody>
                <div className="space-y-4">
                  <div className="text-center py-8 text-gray-600">
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
                      <div className="text-xs text-gray-600">High</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-yellow-600">
                        {stats.byEffectiveness.medium || 0}
                      </div>
                      <div className="text-xs text-gray-600">Medium</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-red-600">
                        {stats.byEffectiveness.low || 0}
                      </div>
                      <div className="text-xs text-gray-600">Low</div>
                    </div>
                  </div>
                </div>
              </DaisyCardBody>
            </DaisyCard>

            <DaisyCard className="bg-white border border-gray-100 shadow-sm">
              <DaisyCardBody>
                <DaisyCardTitle className="text-base text-gray-900">
                  Control Coverage Analysis
                </DaisyCardTitle>
              </DaisyCardBody>
              <DaisyCardBody>
                <div className="space-y-4">
                  <div className="text-center py-8 text-gray-600">
                    <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Coverage heat map coming soon</p>
                    <p className="text-sm">Will show control coverage gaps and overlaps</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Risks with Controls</span>
                      <DaisyBadge
                        variant="outline"
                        className="bg-secondary/20 text-muted-foreground border-0"
                      >
                        {coverage.length}
                      </DaisyBadge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Coverage Gaps</span>
                      <DaisyBadge variant="error" className="bg-red-100 text-red-700 border-0">
                        {stats.coverageGaps}
                      </DaisyBadge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Average Effectiveness</span>
                      <DaisyBadge
                        variant="secondary"
                        className="bg-secondary/20 text-muted-foreground border-0"
                      >
                        {stats.averageEffectiveness.toFixed(1)}
                      </DaisyBadge>
                    </div>
                  </div>
                </div>
              </DaisyCardBody>
            </DaisyCard>
          </div>

          <DaisyCard className="bg-white border border-gray-100 shadow-sm">
            <DaisyCardBody>
              <DaisyCardTitle className="text-base text-gray-900">
                Control Type Distribution
              </DaisyCardTitle>
            </DaisyCardBody>
            <DaisyCardBody>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#191919]">
                    {stats.byType.preventive || 0}
                  </div>
                  <div className="text-sm text-gray-600">Preventive</div>
                  <div className="text-xs text-gray-600">
                    {stats.total > 0
                      ? Math.round(((stats.byType.preventive || 0) / stats.total) * 100)
                      : 0}
                    %
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.byType.detective || 0}
                  </div>
                  <div className="text-sm text-gray-600">Detective</div>
                  <div className="text-xs text-gray-600">
                    {stats.total > 0
                      ? Math.round(((stats.byType.detective || 0) / stats.total) * 100)
                      : 0}
                    %
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.byType.corrective || 0}
                  </div>
                  <div className="text-sm text-gray-600">Corrective</div>
                  <div className="text-xs text-gray-600">
                    {stats.total > 0
                      ? Math.round(((stats.byType.corrective || 0) / stats.total) * 100)
                      : 0}
                    %
                  </div>
                </div>
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>
      </DaisyTabs>

      {/* Control Detail Dialog */}
      <Dialog open={!!selectedControl} onOpenChange={() => setSelectedControl(null)}>
        <DialogContent className="max-w-2xl bg-white border border-gray-100 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900">{selectedControl?.title}</DialogTitle>
            <DialogDescription className="text-gray-600">
              Control details and effectiveness information
            </DialogDescription>
          </DialogHeader>
          {Boolean(selectedControl) && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-900">Type</label>
                  <p className="text-sm text-gray-600">{selectedControl.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900">Effectiveness</label>
                  <p className="text-sm text-gray-600">{selectedControl.effectiveness}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900">Owner</label>
                  <p className="text-sm text-gray-600">{selectedControl.owner}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900">Frequency</label>
                  <p className="text-sm text-gray-600">{selectedControl.frequency}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900">Description</label>
                <p className="text-sm text-gray-600 mt-1">{selectedControl.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-900">Status</label>
                  <p className="text-sm text-gray-600">{selectedControl.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900">Linked Risks</label>
                  <p className="text-sm text-gray-600">
                    {selectedControl.linkedRisks.length} risk(s)
                  </p>
                </div>
              </div>
              {selectedControl.evidence.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Evidence ({selectedControl.evidence.length})
                  </label>
                  <div className="mt-2 space-y-2">
                    {selectedControl.evidence.slice(0, 3).map((evidence) => (
                      <div key={evidence.id} className="flex items-center space-x-2 text-sm">
                        <Shield className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{evidence.name}</span>
                      </div>
                    ))}
                    {selectedControl.evidence.length > 3 && (
                      <p className="text-xs text-gray-600">
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
