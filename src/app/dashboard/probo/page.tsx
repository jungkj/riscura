'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import {
  DaisyTabs,
  DaisyTabsContent,
  DaisyTabsList,
  DaisyTabsTrigger,
} from '@/components/ui/DaisyTabs';
import { DaisyInput } from '@/components/ui/DaisyInput';
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
  FileText,
  Zap,
  Brain,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';

const ProboPageContent = () => {
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

  const [vendorAssessmentData, setVendorAssessmentData] = useState([]);
  const [controlsData, setControlsData] = useState([]);
  const [stats, setStats] = useState({
    vendorAssessments: 0,
    securityControls: 0,
    complianceScore: 0,
    lastMonthChange: 0,
    lastQuarterChange: 0,
  });
  const [soc2Score, setSoc2Score] = useState({
    overallScore: 0,
    categories: [],
  });
  const [loading, setLoading] = useState(true);

  // Fetch real data
  useEffect(() => {
    const fetchProboData = async () => {
      try {
        // Fetch vendor assessments
        const vendorRes = await fetch('/api/assessments');
        if (vendorRes.ok) {
          const vendorData = await vendorRes.json();
          if (vendorData.success && vendorData.data) {
            setVendorAssessmentData(vendorData.data);
            setStats((prev) => ({ ...prev, vendorAssessments: vendorData.data.length }));
          }
        } else {
          console.error('Failed to fetch assessments:', vendorRes.status);
          setVendorAssessmentData([]);
        }

        // Fetch controls
        const controlsRes = await fetch('/api/controls');
        if (controlsRes.ok) {
          const controlsData = await controlsRes.json();
          if (controlsData.success && controlsData.data) {
            setControlsData(controlsData.data);
            setStats((prev) => ({ ...prev, securityControls: controlsData.data.length }));
          }
        } else {
          console.error('Failed to fetch controls:', controlsRes.status);
          setControlsData([]);
        }

        // Fetch compliance score
        const complianceRes = await fetch('/api/compliance/assessments');
        if (complianceRes.ok) {
          const complianceData = await complianceRes.json();
          if (complianceData.success && complianceData.data) {
            // Calculate average compliance score
            const scores = complianceData.data.map((a) => a.complianceScore || 0);
            const avgScore =
              scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
            setStats((prev) => ({ ...prev, complianceScore: avgScore }));

            // Set SOC2 data if available
            const soc2Assessment = complianceData.data.find((a) => a.framework === 'SOC2');
            if (soc2Assessment) {
              setSoc2Score({
                overallScore: soc2Assessment.complianceScore || 0,
                categories: soc2Assessment.categories || [],
              });
            }
          }
        } else {
          console.error('Failed to fetch compliance assessments:', complianceRes.status);
          setStats((prev) => ({ ...prev, complianceScore: 0 }));
        }
      } catch (error) {
        console.error('Failed to fetch Probo data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProboData();
  }, []);

  // Removed hard-coded data - now fetched above

  const filteredControls = controlsData.filter(
    (control) =>
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
              <DaisyButton
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </DaisyButton>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Risk Control Center</h1>
                <p className="text-gray-600">AI-Powered Vendor & Compliance Management</p>
              </div>
            </div>
            <DaisyBadge variant="secondary" className="bg-blue-100 text-blue-800 font-semibold">
              <Zap className="h-3 w-3 mr-1" />
              AI Enhanced
            </DaisyBadge>
          </div>

          {/* Tabs */}
          <DaisyTabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <DaisyTabsList className="grid w-full grid-cols-4">
              <DaisyTabsTrigger value="overview" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Overview
              </DaisyTabsTrigger>
              <DaisyTabsTrigger value="vendor-assessment" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Vendor Assessment
              </DaisyTabsTrigger>
              <DaisyTabsTrigger value="controls-library" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Controls Library
              </DaisyTabsTrigger>
              <DaisyTabsTrigger value="soc2-assessment" className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                SOC 2
              </DaisyTabsTrigger>
            </DaisyTabsList>

            {/* Overview Tab */}
            <DaisyTabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DaisyCard className="hover:shadow-md transition-shadow">
                  <DaisyCardBody className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <DaisyCardTitle className="text-sm font-medium">
                      Vendor Assessments
                    </DaisyCardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </DaisyCardBody>
                  <DaisyCardBody>
                    <div className="text-2xl font-bold">
                      {loading ? '...' : stats.vendorAssessments}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {loading
                        ? 'Loading...'
                        : stats.vendorAssessments === 0
                          ? 'No assessments yet'
                          : 'Total assessments'}
                    </p>
                  </DaisyCardBody>
                </DaisyCard>
                <DaisyCard className="hover:shadow-md transition-shadow">
                  <DaisyCardBody className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <DaisyCardTitle className="text-sm font-medium">
                      Security Controls
                    </DaisyCardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </DaisyCardBody>
                  <DaisyCardBody>
                    <div className="text-2xl font-bold">
                      {loading ? '...' : stats.securityControls}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {loading
                        ? 'Loading...'
                        : stats.securityControls === 0
                          ? 'No controls added'
                          : 'Active controls'}
                    </p>
                  </DaisyCardBody>
                </DaisyCard>
                <DaisyCard className="hover:shadow-md transition-shadow">
                  <DaisyCardBody className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <DaisyCardTitle className="text-sm font-medium">
                      Compliance Score
                    </DaisyCardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </DaisyCardBody>
                  <DaisyCardBody>
                    <div className="text-2xl font-bold">
                      {loading ? '...' : `${stats.complianceScore}%`}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {loading
                        ? 'Loading...'
                        : stats.complianceScore === 0
                          ? 'Not assessed'
                          : 'Average compliance'}
                    </p>
                  </DaisyCardBody>
                </DaisyCard>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DaisyCard>
                  <DaisyCardBody>
                    <DaisyCardTitle>Quick Start Actions</DaisyCardTitle>
                  </DaisyCardBody>
                  <DaisyCardBody className="space-y-3">
                    <DaisyButton
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => setActiveTab('vendor-assessment')}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Start Vendor Assessment
                    </DaisyButton>
                    <DaisyButton
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => setActiveTab('controls-library')}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Browse Controls Library
                    </DaisyButton>
                    <DaisyButton
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => setActiveTab('soc2-assessment')}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Setup SOC 2 Framework
                    </DaisyButton>
                  </DaisyCardBody>
                </DaisyCard>

                <DaisyCard>
                  <DaisyCardBody>
                    <DaisyCardTitle>Platform Features</DaisyCardTitle>
                  </DaisyCardBody>
                  <DaisyCardBody className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">AI-Powered Risk Analysis</p>
                        <p className="text-sm text-gray-600">
                          Intelligent threat detection & assessment
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Globe className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Enterprise Control Framework</p>
                        <p className="text-sm text-gray-600">Industry-standard security controls</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Lock className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">Automated Compliance</p>
                        <p className="text-sm text-gray-600">Real-time regulatory tracking</p>
                      </div>
                    </div>
                  </DaisyCardBody>
                </DaisyCard>
              </div>
            </DaisyTabsContent>

            {/* Vendor Assessment Tab */}
            <DaisyTabsContent value="vendor-assessment" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Vendor Security Assessment</h2>
                  <p className="text-gray-600">Analyze vendor security posture with AI</p>
                </div>
                <DaisyButton className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Assessment
                </DaisyButton>
              </div>

              {loading ? (
                <DaisyCard>
                  <DaisyCardBody className="p-12 text-center">
                    <p className="text-gray-500">Loading vendor assessments...</p>
                  </DaisyCardBody>
                </DaisyCard>
              ) : vendorAssessmentData.length === 0 ? (
                <DaisyCard>
                  <DaisyCardBody className="p-12 text-center">
                    <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No vendor assessments yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Start your first vendor security assessment to track third-party risks
                    </p>
                    <DaisyButton className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Start First Assessment
                    </DaisyButton>
                  </DaisyCardBody>
                </DaisyCard>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {vendorAssessmentData.map((vendor) => (
                    <DaisyCard key={vendor.id} className="hover:shadow-md transition-shadow">
                      <DaisyCardBody className="p-6">
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
                              <DaisyBadge
                                className={
                                  vendor.riskScore === 'Low'
                                    ? 'bg-green-100 text-green-800'
                                    : vendor.riskScore === 'Medium'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                }
                              >
                                {vendor.riskScore}
                              </DaisyBadge>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-600">Compliance</p>
                              <p className="font-bold text-lg">{vendor.compliance}%</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-600">Controls</p>
                              <p className="font-bold text-lg">{vendor.controls}</p>
                            </div>
                            <DaisyBadge
                              className={
                                vendor.status === 'Completed'
                                  ? 'bg-green-100 text-green-800'
                                  : vendor.status === 'In Progress'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                              }
                            >
                              {vendor.status}
                            </DaisyBadge>
                          </div>
                        </div>
                      </DaisyCardBody>
                    </DaisyCard>
                  ))}
                </div>
              )}
            </DaisyTabsContent>

            {/* Controls Library Tab */}
            <DaisyTabsContent value="controls-library" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Security Controls Library</h2>
                  <p className="text-gray-600">Build your security control library</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <DaisyInput
                      placeholder="Search controls..."
                      value={searchQuery}
                      onChange={(e) = />
setSearchQuery(e.target.value)}
                      className="pl-10 w-64" />
                  </div>
                  <DaisyButton className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Control
                  </DaisyButton>
                </div>
              </div>

              {loading ? (
                <DaisyCard>
                  <DaisyCardBody className="p-12 text-center">
                    <p className="text-gray-500">Loading controls library...</p>
                  </DaisyCardBody>
                </DaisyCard>
              ) : filteredControls.length === 0 && searchQuery === '' ? (
                <DaisyCard>
                  <DaisyCardBody className="p-12 text-center">
                    <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No security controls yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Add your first control to start building your security framework
                    </p>
                    <DaisyButton className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Control
                    </DaisyButton>
                  </DaisyCardBody>
                </DaisyCard>
              ) : filteredControls.length === 0 ? (
                <DaisyCard>
                  <DaisyCardBody className="p-12 text-center">
                    <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No controls found</h3>
                    <p className="text-gray-600">Try adjusting your search query</p>
                  </DaisyCardBody>
                </DaisyCard>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredControls.map((control) => (
                    <DaisyCard key={control.id} className="hover:shadow-md transition-shadow">
                      <DaisyCardBody className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <DaisyBadge variant="outline" className="font-mono text-xs">
                                {control.id}
                              </DaisyBadge>
                              <DaisyBadge
                                className={
                                  control.implementation === 'Implemented'
                                    ? 'bg-green-100 text-green-800'
                                    : control.implementation === 'In Progress'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800'
                                }
                              >
                                {control.implementation}
                              </DaisyBadge>
                              <DaisyBadge variant="outline" className="text-xs">
                                {control.framework}
                              </DaisyBadge>
                            </div>
                            <h3 className="font-semibold text-lg mb-2">{control.title}</h3>
                            <p className="text-gray-600 mb-3">{control.description}</p>
                            <div className="flex items-center gap-2">
                              <DaisyBadge variant="outline" className="text-xs">
                                {control.category}
                              </DaisyBadge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <DaisyButton variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </DaisyButton>
                            <DaisyButton size="sm">
          Implement
        </DaisyButton>
                          </div>
                        </div>
                      </DaisyCardBody>
                    </DaisyCard>
                  ))}
                </div>
              )}
            </DaisyTabsContent>

            {/* SOC 2 Assessment Tab */}
            <DaisyTabsContent value="soc2-assessment" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">SOC 2 Framework Assessment</h2>
                  <p className="text-gray-600">Track compliance across SOC 2 categories</p>
                </div>
                <DaisyButton className="bg-purple-600 hover:bg-purple-700">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate SOC 2 Report
                </DaisyButton>
              </div>

              {loading ? (
                <DaisyCard>
                  <DaisyCardBody className="p-12 text-center">
                    <p className="text-gray-500">Loading SOC 2 assessment data...</p>
                  </DaisyCardBody>
                </DaisyCard>
              ) : soc2Score.overallScore === 0 && soc2Score.categories.length === 0 ? (
                <DaisyCard>
                  <DaisyCardBody className="p-12 text-center">
                    <CheckCircle2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No SOC 2 assessment yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Start your SOC 2 compliance journey by setting up your framework
                    </p>
                    <DaisyButton className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Set Up SOC 2 Framework
                    </DaisyButton>
                  </DaisyCardBody>
                </DaisyCard>
              ) : (
                <DaisyCard>
                  <DaisyCardBody>
                    <DaisyCardTitle className="flex items-center justify-between">
                      <span>Overall SOC 2 Compliance</span>
                      <DaisyBadge className="bg-green-100 text-green-800 text-lg px-3 py-1">
                        {soc2Score.overallScore}%
                      </DaisyBadge>
                    </DaisyCardTitle>
                  </DaisyCardBody>
                  <DaisyCardBody>
                    {soc2Score.categories.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600">No category data available yet</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {soc2Score.categories.map((category) => (
                          <DaisyCard
                            key={category.name}
                            className="border-2 hover:shadow-md transition-shadow"
                          >
                            <DaisyCardBody className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold">{category.name}</h3>
                                <DaisyBadge
                                  className={
                                    category.status === 'Compliant'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }
                                >
                                  {category.status}
                                </DaisyBadge>
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
                            </DaisyCardBody>
                          </DaisyCard>
                        ))}
                      </div>
                    )}
                  </DaisyCardBody>
                </DaisyCard>
              )}
            </DaisyTabsContent>
          </DaisyTabs>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default function ProboPage() {
  return (
    <Suspense
      fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}
    >
      <ProboPageContent />
    </Suspense>
  );
}
