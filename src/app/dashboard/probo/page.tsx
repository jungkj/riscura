'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Shield, 
  Target, 
  Search, 
  CheckCircle2, 
  ArrowLeft, 
  Building2, 
  Activity,
  Globe,
  Lock,
  TrendingUp,
  Plus,
  Eye,
  FileText
} from 'lucide-react';

function ProboPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'overview');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const vendorAssessmentData = [
    {
      id: 1,
      name: 'CloudSecure Inc.',
      status: 'Completed',
      riskScore: 'Low',
      lastAssessed: '2024-01-15',
      compliance: 95,
      controls: 42
    },
    {
      id: 2,
      name: 'DataFlow Systems',
      status: 'In Progress',
      riskScore: 'Medium',
      lastAssessed: '2024-01-10',
      compliance: 78,
      controls: 35
    },
    {
      id: 3,
      name: 'SecureNet Solutions',
      status: 'Pending',
      riskScore: 'High',
      lastAssessed: '2023-12-20',
      compliance: 65,
      controls: 28
    }
  ];

  const controlsLibraryData = [
    {
      id: 'AC-1',
      title: 'Access Control Policy and Procedures',
      framework: 'NIST 800-53',
      category: 'Access Control',
      implementation: 'Implemented',
      description: 'Develop, document, and disseminate access control policy and procedures.'
    },
    {
      id: 'AU-1',
      title: 'Audit and Accountability Policy',
      framework: 'NIST 800-53',
      category: 'Audit and Accountability',
      implementation: 'Implemented',
      description: 'Develop, document, and disseminate audit and accountability policy.'
    },
    {
      id: 'CA-1',
      title: 'Security Assessment and Authorization Policy',
      framework: 'NIST 800-53',
      category: 'Security Assessment',
      implementation: 'Planned',
      description: 'Develop, document, and disseminate security assessment policy.'
    },
    {
      id: 'CM-1',
      title: 'Configuration Management Policy',
      framework: 'NIST 800-53',
      category: 'Configuration Management',
      implementation: 'In Progress',
      description: 'Develop, document, and disseminate configuration management policy.'
    },
    {
      id: 'CP-1',
      title: 'Contingency Planning Policy',
      framework: 'NIST 800-53',
      category: 'Contingency Planning',
      implementation: 'Implemented',
      description: 'Develop, document, and disseminate contingency planning policy.'
    }
  ];

  const soc2Data = {
    overallScore: 94,
    categories: [
      { name: 'Security', score: 96, controls: 45, status: 'Compliant' },
      { name: 'Availability', score: 92, controls: 23, status: 'Compliant' },
      { name: 'Processing Integrity', score: 89, controls: 18, status: 'Minor Issues' },
      { name: 'Confidentiality', score: 97, controls: 31, status: 'Compliant' },
      { name: 'Privacy', score: 91, controls: 22, status: 'Compliant' }
    ]
  };

  const filteredControls = controlsLibraryData.filter(control =>
    control.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    control.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    control.framework.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Probo Integration</h1>
                <p className="text-gray-600">AI-Powered Risk Management Platform</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-semibold">
              Fully Integrated
            </Badge>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="vendor-assessment" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Vendor Assessment
              </TabsTrigger>
              <TabsTrigger value="controls-library" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Controls Library
              </TabsTrigger>
              <TabsTrigger value="soc2-assessment" className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                SOC 2
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Vendor Assessments</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">24</div>
                    <p className="text-xs text-muted-foreground">+3 from last month</p>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Security Controls</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">650+</div>
                    <p className="text-xs text-muted-foreground">Across all frameworks</p>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">94%</div>
                    <p className="text-xs text-muted-foreground">+2% from last quarter</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Start Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => setActiveTab('vendor-assessment')}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Start Vendor Assessment
                    </Button>
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => setActiveTab('controls-library')}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Browse Controls Library
                    </Button>
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => setActiveTab('soc2-assessment')}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Setup SOC 2 Framework
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Platform Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">AI-Powered Automation</p>
                        <p className="text-sm text-gray-600">Streamline vendor assessments</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Globe className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">650+ Security Controls</p>
                        <p className="text-sm text-gray-600">Comprehensive control library</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Lock className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">Compliance Workflows</p>
                        <p className="text-sm text-gray-600">Automate compliance tracking</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Vendor Assessment Tab */}
            <TabsContent value="vendor-assessment" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Vendor Security Assessment</h2>
                  <p className="text-gray-600">Analyze vendor security posture with AI</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Assessment
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {vendorAssessmentData.map((vendor) => (
                  <Card key={vendor.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <Building2 className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{vendor.name}</h3>
                            <p className="text-gray-600">Last assessed: {vendor.lastAssessed}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Risk Score</p>
                            <Badge 
                              className={
                                vendor.riskScore === 'Low' ? 'bg-green-100 text-green-800' :
                                vendor.riskScore === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }
                            >
                              {vendor.riskScore}
                            </Badge>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Compliance</p>
                            <p className="font-bold text-lg">{vendor.compliance}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Controls</p>
                            <p className="font-bold text-lg">{vendor.controls}</p>
                          </div>
                          <Badge 
                            className={
                              vendor.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              vendor.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }
                          >
                            {vendor.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Controls Library Tab */}
            <TabsContent value="controls-library" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Security Controls Library</h2>
                  <p className="text-gray-600">Access 650+ security controls across frameworks</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search controls..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Control
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredControls.map((control) => (
                  <Card key={control.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {control.id}
                            </Badge>
                            <Badge 
                              className={
                                control.implementation === 'Implemented' ? 'bg-green-100 text-green-800' :
                                control.implementation === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }
                            >
                              {control.implementation}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {control.framework}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-lg mb-2">{control.title}</h3>
                          <p className="text-gray-600 mb-3">{control.description}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {control.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          <Button size="sm">
                            Implement
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* SOC 2 Assessment Tab */}
            <TabsContent value="soc2-assessment" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">SOC 2 Framework Assessment</h2>
                  <p className="text-gray-600">Track compliance across SOC 2 categories</p>
                </div>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate SOC 2 Report
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Overall SOC 2 Compliance</span>
                    <Badge className="bg-green-100 text-green-800 text-lg px-3 py-1">
                      {soc2Data.overallScore}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {soc2Data.categories.map((category) => (
                      <Card key={category.name} className="border-2 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">{category.name}</h3>
                            <Badge 
                              className={
                                category.status === 'Compliant' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {category.status}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Score</span>
                              <span className="font-bold">{category.score}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Controls</span>
                              <span className="font-bold">{category.controls}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function ProboPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ProboPageContent />
    </Suspense>
  );
} 