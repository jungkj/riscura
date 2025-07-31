'use client';

import { useState, useEffect, useCallback } from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisyDialog, DaisyDialogContent, DaisyDialogHeader, DaisyDialogTitle, DaisyDialogTrigger } from '@/components/ui/DaisyDialog';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  Filter,
  Search,
  MoreHorizontal,
  ArrowRight,
  Calendar,
  Target,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertCircle,
  XCircle,
  CheckCircle2,
  Flag,
  Link,
  MessageSquare,
  History,
  Grid3X3,
  List,
  BookOpen,
  BarChart3,
  Settings,
  RefreshCw
} from 'lucide-react';
import RiskCard, { RiskData } from './RiskCard';

interface RiskScenario {
  id: string;
  scenario: string;
  category: string;
  addedToRegister: boolean;
}

const VantaInspiredRiskInterface = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeTab, setActiveTab] = useState('register');
  const [selectedRisk, setSelectedRisk] = useState<RiskData | null>(null);

  const risks: RiskData[] = [
    {
      id: 'R-001',
      title: 'Segregation of duties has not been established',
      description: 'Resulting in conflicts of interest and potential fraud risks in financial processes.',
      category: 'Information security operations',
      severity: 'Critical',
      likelihood: 4,
      impact: 5,
      riskScore: 20,
      status: 'In Progress',
      owner: 'Jane Nguyen',
      assignee: 'Mark Allen',
      createdDate: '2024-01-01',
      dueDate: '2024-01-31',
      lastUpdated: '2024-01-15',
      controls: ['Access reviews conducted', 'Segregation controls implemented'],
      attachments: 3,
      comments: 5,
      linkedVendors: ['TaskNimbus'],
      treatmentPlan: 'Mitigate risk through enhanced controls and monitoring',
      progress: 65,
      tags: ['financial', 'fraud'],
      trend: 'up',
      mitigationActions: ['Implement new approval workflow', 'Conduct user access review'],
      completedActions: 1,
    },
    {
      id: 'R-002',
      title: 'E-commerce portal is offline',
      description: 'Critical business system unavailability affecting customer transactions and revenue.',
      category: 'Asset management',
      severity: 'High',
      likelihood: 3,
      impact: 4,
      riskScore: 12,
      status: 'Open',
      owner: 'Sarah Chen',
      assignee: 'Mike Johnson',
      createdDate: '2024-01-05',
      dueDate: '2024-01-25',
      lastUpdated: '2024-01-14',
      controls: ['Backup systems', 'Monitoring alerts'],
      attachments: 2,
      comments: 8,
      linkedVendors: [],
      treatmentPlan: 'Accept risk with enhanced monitoring',
      progress: 30,
      tags: ['availability', 'revenue'],
      trend: 'stable',
      mitigationActions: ['Increase server capacity', 'Improve monitoring alerts'],
      completedActions: 0,
    },
    {
      id: 'R-003',
      title: 'Contacts are not maintained',
      description: 'Resulting in delays in breach response and reporting to regulatory authorities.',
      category: 'Business continuity',
      severity: 'Medium',
      likelihood: 2,
      impact: 3,
      riskScore: 6,
      status: 'Mitigated',
      owner: 'Lisa Wang',
      assignee: 'David Kim',
      createdDate: '2024-01-03',
      dueDate: '2024-01-20',
      lastUpdated: '2024-01-12',
      controls: ['Contact database updated', 'Regular reviews scheduled'],
      attachments: 1,
      comments: 3,
      linkedVendors: [],
      treatmentPlan: 'Transfer risk through insurance coverage',
      progress: 100,
      tags: ['compliance', 'response'],
      trend: 'down',
      mitigationActions: ['Update contact list quarterly'],
      completedActions: 1,
    }
  ];

  const riskLibrary: RiskScenario[] = [
    {
      id: 'RL-001',
      scenario: 'AI cost benefit analysis is not complete',
      category: 'Software development',
      addedToRegister: true
    },
    {
      id: 'RL-002',
      scenario: 'Evolving AI legal and regulatory landscape',
      category: 'Privacy',
      addedToRegister: true
    },
    {
      id: 'RL-003',
      scenario: 'Hard to control or define AI related risks',
      category: 'Software development',
      addedToRegister: false
    },
    {
      id: 'RL-004',
      scenario: 'Metrics for safety, stability, failure modes',
      category: 'Acquisition',
      addedToRegister: true
    },
    {
      id: 'RL-005',
      scenario: 'Lack of a clearly documented AI policy',
      category: 'Artificial intelligence',
      addedToRegister: false
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-orange-100 text-orange-800';
      case 'Mitigated': return 'bg-green-100 text-green-800';
      case 'Accepted': return 'bg-purple-100 text-purple-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Mitigated':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'Active':
        return <DaisyAlertCircle className="w-4 h-4" >
  ;
</DaisyAlertCircle>
      case 'In Progress':
        return <Clock className="w-4 h-4" />;
      case 'Accepted':
        return <Flag className="w-4 h-4" />;
      case 'Closed':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 15) return 'text-red-600 bg-red-50';
    if (score >= 10) return 'text-orange-600 bg-orange-50';
    if (score >= 5) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const filteredRisks = risks.filter(risk => {
    const matchesSearch = risk.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         risk.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         risk.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || risk.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || risk.status === filterStatus;
    
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    return date.toLocaleDateString();
  };

  const getRiskStats = () => {
    const total = risks.length;
    const critical = risks.filter(r => r.severity === 'Critical').length;
    const open = risks.filter(r => r.status === 'Active').length;
    const overdue = risks.filter(r => new Date(r.dueDate) < new Date()).length;
    
    return { total, critical, open, overdue };
  };

  const stats = getRiskStats();

  const handleRiskView = useCallback((risk: RiskData) => {
    console.log('View risk:', risk);
    setSelectedRisk(risk);
  }, []);

  const handleRiskEdit = useCallback((risk: RiskData) => {
    console.log('Edit risk:', risk);
    setSelectedRisk(risk);
  }, []);

  const handleRiskArchive = useCallback((risk: RiskData) => {
    console.log('Archive risk:', risk);
    // TODO: Archive risk
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Risk Management</h1>
            <p className="text-sm text-gray-600 mt-1">
              Comprehensive risk assessment and mitigation tracking
              <span className="ml-2 text-gray-400">
                • Last updated {formatLastUpdated(lastUpdated)}
              </span>
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <DaisyInput
                placeholder="Search risks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80 focus:ring-[#199BEC] focus:border-[#199BEC]"
              />
            </div>
            
            {/* Filters */}
            <DaisySelect value={filterSeverity} onValueChange={setFilterSeverity} />
              <DaisySelectTrigger className="w-32" />
                <DaisySelectValue placeholder="Severity" /></DaisyInput>
              <DaisySelectContent />
                <DaisySelectItem value="all">All Severity</DaisySelectContent>
                <DaisySelectItem value="Critical">Critical</DaisySelectItem>
                <DaisySelectItem value="High">High</DaisySelectItem>
                <DaisySelectItem value="Medium">Medium</DaisySelectItem>
                <DaisySelectItem value="Low">Low</DaisySelectItem>
              </DaisySelectContent>
            </DaisySelect>

            <DaisySelect value={filterStatus} onValueChange={setFilterStatus} />
              <DaisySelectTrigger className="w-32" />
                <DaisySelectValue placeholder="Status" /></DaisySelect>
              <DaisySelectContent />
                <DaisySelectItem value="all">All Status</DaisySelectContent>
                <DaisySelectItem value="Active">Active</DaisySelectItem>
                <DaisySelectItem value="In Progress">In Progress</DaisySelectItem>
                <DaisySelectItem value="Mitigated">Mitigated</DaisySelectItem>
                <DaisySelectItem value="Accepted">Accepted</DaisySelectItem>
                <DaisySelectItem value="Closed">Closed</DaisySelectItem>
              </DaisySelectContent>
            </DaisySelect>
            
            {/* View Mode Toggle */}
            <div className="flex items-center border border-gray-200 rounded-lg p-1">
              <DaisyButton
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8 p-0" />
                <Grid3X3 className="w-4 h-4" />
              </DaisyButton>
              <DaisyButton
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 w-8 p-0" />
                <List className="w-4 h-4" />
              </DaisyButton>
            </div>
            
            {/* Action Buttons */}
            <DaisyButton variant="outline" size="sm" >
  <Download className="w-4 h-4 mr-2" />
</DaisyButton>
              Export
            </DaisyButton>
            <DaisyButton className="bg-[#199BEC] hover:bg-[#0f7dc7] text-white" >
  <Plus className="w-4 h-4 mr-2" />
</DaisyButton>
              New Risk
            </DaisyButton>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Total Risks:</span>
            <DaisyBadge variant="outline" className="font-medium" >
  {stats.total}
</DaisyBadge>
            </DaisyBadge>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Critical:</span>
            <DaisyBadge className="bg-red-100 text-red-800 border-red-200" >
  {stats.critical}
</DaisyBadge>
            </DaisyBadge>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Open:</span>
            <DaisyBadge className="bg-orange-100 text-orange-800 border-orange-200" >
  {stats.open}
</DaisyBadge>
            </DaisyBadge>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Overdue:</span>
            <DaisyBadge className="bg-red-100 text-red-800 border-red-200" >
  {stats.overdue}
</DaisyBadge>
            </DaisyBadge>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Showing:</span>
            <DaisyBadge variant="outline" >
  {filteredRisks.length} of {stats.total}
</DaisyBadge>
            </DaisyBadge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <DaisyTabs value={activeTab} onValueChange={setActiveTab} className="space-y-6" />
          {/* Tab Navigation */}
          <DaisyTabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 bg-gray-100 p-1 rounded-lg" />
            <DaisyTabsTrigger 
              value="register" 
              className="data-[state=active]:bg-white data-[state=active]:text-[#199BEC] data-[state=active]:shadow-sm" />
              <List className="w-4 h-4 mr-2" />
              Risk Register
            </DaisyTabs>
            <DaisyTabsTrigger 
              value="heatmap"
              className="data-[state=active]:bg-white data-[state=active]:text-[#199BEC] data-[state=active]:shadow-sm" />
              <BarChart3 className="w-4 h-4 mr-2" />
              Risk Heatmap
            </DaisyTabsTrigger>
            <DaisyTabsTrigger 
              value="library"
              className="data-[state=active]:bg-white data-[state=active]:text-[#199BEC] data-[state=active]:shadow-sm" />
              <BookOpen className="w-4 h-4 mr-2" />
              Risk Library
            </DaisyTabsTrigger>
            <DaisyTabsTrigger 
              value="analytics"
              className="data-[state=active]:bg-white data-[state=active]:text-[#199BEC] data-[state=active]:shadow-sm" />
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </DaisyTabsTrigger>
          </DaisyTabsList>

          {/* Tab Content */}
          <DaisyTabsContent value="register" className="space-y-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRisks.map((risk, index) => (
                <RiskCard
                  key={risk.id}
                  risk={risk}
                  onView={handleRiskView}
                  onEdit={handleRiskEdit}
                  onArchive={handleRiskArchive}
                  className={`transition-all duration-300 transform opacity-0 translate-y-4 animate-in`}
                  style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
                />
              ))}
            </div>

            {filteredRisks.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No risks found</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Try adjusting your search terms or filters to find relevant risks.
                </p>
              </div>
            )}
          </DaisyTabsContent>

          <DaisyTabsContent value="heatmap" className="space-y-6" />
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Risk Heatmap</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Interactive risk heatmap visualization will be displayed here.
              </p>
            </div>
          </DaisyTabsContent>

          <DaisyTabsContent value="library" className="space-y-6" />
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Risk Library</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Browse and add pre-defined risk scenarios from the library.
              </p>
            </div>
          </DaisyTabsContent>

          <DaisyTabsContent value="analytics" className="space-y-6" />
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Risk Analytics</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Comprehensive risk analytics and reporting dashboard.
              </p>
            </div>
          </DaisyTabsContent>
        </DaisyTabs>
      </div>

      {/* Risk Detail Modal */}
      {selectedRisk && (
        <DaisyDialog open={!!selectedRisk} onOpenChange={() => setSelectedRisk(null)} />
          <DaisyDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" >
  <DaisyDialogHeader />
</DaisyDialog>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <DaisyDialogTitle className="text-xl">{selectedRisk.title}</DaisyDialogTitle>
                  <DaisyBadge className={`text-xs ${getSeverityColor(selectedRisk.severity)}`}>
                    {selectedRisk.severity}
                  </DaisyBadge>
                  <DaisyBadge className={`text-xs ${getStatusColor(selectedRisk.status)}`}>
                    {getStatusIcon(selectedRisk.status)}
                    <span className="ml-1">{selectedRisk.status}</span>
                  </DaisyBadge>
                </div>
                <div className="flex items-center space-x-2">
                  <DaisyButton variant="outline" size="sm" >
  <Edit className="w-4 h-4 mr-2" />
</DaisyButton>
                    Edit
                  </DaisyButton>
                  <DaisyButton variant="outline" size="sm" >
  <History className="w-4 h-4 mr-2" />
</DaisyButton>
                    History
                  </DaisyButton>
                </div>
              </div>
            </DaisyDialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Risk Details</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Risk ID:</span>
                      <span className="font-mono">{selectedRisk.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span>{selectedRisk.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Owner:</span>
                      <span>{selectedRisk.owner}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Assignee:</span>
                      <span>{selectedRisk.assignee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Due Date:</span>
                      <span>{selectedRisk.dueDate}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Risk Assessment</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Likelihood:</span>
                      <span>{selectedRisk.likelihood}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Impact:</span>
                      <span>{selectedRisk.impact}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Risk Score:</span>
                      <span className={`font-medium ${getRiskScoreColor(selectedRisk.riskScore).split(' ')[0]}`}>
                        {selectedRisk.riskScore}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Progress:</span>
                      <span>{selectedRisk.progress}%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600 text-sm leading-relaxed">{selectedRisk.description}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Treatment Plan</h4>
                <p className="text-gray-600 text-sm leading-relaxed">{selectedRisk.treatmentPlan}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Controls</h4>
                <div className="space-y-2">
                  {selectedRisk.controls.map((control, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>{control}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedRisk.linkedVendors.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Linked Vendors</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRisk.linkedVendors.map((vendor, index) => (
                      <DaisyBadge key={index} variant="outline" className="text-xs" >
  {vendor}
</DaisyBadge>
                      </DaisyBadge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DaisyDialogContent>
        </DaisyDialog>
      )}
    </div>
  );
};

export default VantaInspiredRiskInterface;
             