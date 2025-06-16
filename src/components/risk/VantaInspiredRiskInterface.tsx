'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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

interface Risk {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  likelihood: number;
  impact: number;
  riskScore: number;
  status: 'Active' | 'Mitigated' | 'Accepted' | 'In Progress' | 'Closed';
  owner: string;
  assignee: string;
  createdDate: string;
  dueDate: string;
  lastUpdated: string;
  controls: string[];
  attachments: number;
  comments: number;
  linkedVendors: string[];
  treatmentPlan: string;
  progress: number;
}

interface RiskScenario {
  id: string;
  scenario: string;
  category: string;
  addedToRegister: boolean;
}

export default function VantaInspiredRiskInterface() {
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [showAddRisk, setShowAddRisk] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('register');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Sample risk data matching Vanta's patterns
  const risks: Risk[] = [
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
      progress: 65
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
      status: 'Active',
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
      progress: 30
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
      progress: 100
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
        return <AlertCircle className="w-4 h-4" />;
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

  const handleRiskView = (risk: Risk) => {
    console.log('View risk:', risk);
    setSelectedRisk(risk);
  };

  const handleRiskEdit = (risk: Risk) => {
    console.log('Edit risk:', risk);
    setSelectedRisk(risk);
  };

  const handleRiskArchive = (risk: Risk) => {
    console.log('Archive risk:', risk);
    // TODO: Archive risk
  };

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
              <Input
                placeholder="Search risks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80 focus:ring-[#199BEC] focus:border-[#199BEC]"
              />
            </div>
            
            {/* Filters */}
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Mitigated">Mitigated</SelectItem>
                <SelectItem value="Accepted">Accepted</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            
            {/* View Mode Toggle */}
            <div className="flex items-center border border-gray-200 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8 p-0"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 w-8 p-0"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Action Buttons */}
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button className="bg-[#199BEC] hover:bg-[#0f7dc7] text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Risk
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Total Risks:</span>
            <Badge variant="outline" className="font-medium">
              {stats.total}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Critical:</span>
            <Badge className="bg-red-100 text-red-800 border-red-200">
              {stats.critical}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Open:</span>
            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
              {stats.open}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Overdue:</span>
            <Badge className="bg-red-100 text-red-800 border-red-200">
              {stats.overdue}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Showing:</span>
            <Badge variant="outline">
              {filteredRisks.length} of {stats.total}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation */}
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger 
              value="register" 
              className="data-[state=active]:bg-white data-[state=active]:text-[#199BEC] data-[state=active]:shadow-sm"
            >
              <List className="w-4 h-4 mr-2" />
              Risk Register
            </TabsTrigger>
            <TabsTrigger 
              value="heatmap"
              className="data-[state=active]:bg-white data-[state=active]:text-[#199BEC] data-[state=active]:shadow-sm"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Risk Heatmap
            </TabsTrigger>
            <TabsTrigger 
              value="library"
              className="data-[state=active]:bg-white data-[state=active]:text-[#199BEC] data-[state=active]:shadow-sm"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Risk Library
            </TabsTrigger>
            <TabsTrigger 
              value="analytics"
              className="data-[state=active]:bg-white data-[state=active]:text-[#199BEC] data-[state=active]:shadow-sm"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="register" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="heatmap" className="space-y-6">
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Risk Heatmap</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Interactive risk heatmap visualization will be displayed here.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="library" className="space-y-6">
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Risk Library</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Browse and add pre-defined risk scenarios from the library.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Risk Analytics</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Comprehensive risk analytics and reporting dashboard.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Risk Detail Modal */}
      {selectedRisk && (
        <Dialog open={!!selectedRisk} onOpenChange={() => setSelectedRisk(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <DialogTitle className="text-xl">{selectedRisk.title}</DialogTitle>
                  <Badge className={`text-xs ${getSeverityColor(selectedRisk.severity)}`}>
                    {selectedRisk.severity}
                  </Badge>
                  <Badge className={`text-xs ${getStatusColor(selectedRisk.status)}`}>
                    {getStatusIcon(selectedRisk.status)}
                    <span className="ml-1">{selectedRisk.status}</span>
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <History className="w-4 h-4 mr-2" />
                    History
                  </Button>
                </div>
              </div>
            </DialogHeader>
            
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
                  <div className="flex space-x-2">
                    {selectedRisk.linkedVendors.map((vendor, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {vendor}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 