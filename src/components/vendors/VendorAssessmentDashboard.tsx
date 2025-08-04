'use client';

import React, { useState, useEffect } from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import {
  DaisyTabs,
  DaisyTabsContent,
  DaisyTabsList,
  DaisyTabsTrigger,
} from '@/components/ui/DaisyTabs';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
import {
  Search,
  Globe,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  ExternalLink,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  BarChart3,
  FileText,
  UserCheck,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VendorInfo {
  name: string;
  description: string;
  category: string;
  websiteUrl?: string;
  email?: string;
  phone?: string;
  address?: string;
  certifications: string[];
  privacyPolicyURL?: string;
  securityPageURL?: string;
}

interface VendorFinding {
  id: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  remediation?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
}

interface VendorAssessment {
  id: string;
  vendorInfo: VendorInfo;
  riskScore: number;
  complianceStatus: string;
  securityScore?: number;
  privacyScore?: number;
  complianceScore?: number;
  findings: VendorFinding[];
  assessmentDate: Date;
}

interface RiskCategory {
  name: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

export function VendorAssessmentDashboard() {
  const [vendorUrl, setVendorUrl] = useState('');
  const [assessment, setAssessment] = useState<VendorAssessment | null>(null);
  const [assessments, setAssessments] = useState<VendorAssessment[]>([]);
  const [isAssessing, setIsAssessing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('assess');

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    setLoading(true);
    try {
      const organizationId = 'current-org-id'; // Get from context
      const response = await fetch(`/api/probo/vendor-assessment?organizationId=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setAssessments(data);
      }
    } catch (error) {
      console.error('Failed to load assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssessVendor = async () => {
    if (!vendorUrl.trim()) return;

    setIsAssessing(true);
    try {
      const organizationId = 'current-org-id'; // Get from context
      const response = await fetch('/api/probo/vendor-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteUrl: vendorUrl,
          organizationId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setAssessment(result);
        setActiveTab('results');
        await loadAssessments(); // Refresh the list
      } else {
        console.error('Assessment failed');
      }
    } catch (error) {
      console.error('Assessment error:', error);
    } finally {
      setIsAssessing(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score <= 25) return 'text-green-600';
    if (score <= 50) return 'text-yellow-600';
    if (score <= 75) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRiskBadgeColor = (score: number) => {
    if (score <= 25) return 'bg-green-100 text-green-700';
    if (score <= 50) return 'bg-yellow-100 text-yellow-700';
    if (score <= 75) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW':
        return 'bg-blue-100 text-blue-700';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700';
      case 'HIGH':
        return 'bg-orange-100 text-orange-700';
      case 'CRITICAL':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
        return 'bg-green-100 text-green-700';
      case 'MODERATE_RISK':
        return 'bg-yellow-100 text-yellow-700';
      case 'HIGH_RISK':
        return 'bg-orange-100 text-orange-700';
      case 'CRITICAL_RISK':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const riskCategories: RiskCategory[] = assessment
    ? [
        {
          name: 'Security',
          score: assessment.securityScore || 100 - assessment.riskScore,
          trend: 'stable',
          color: 'text-blue-600',
        },
        {
          name: 'Privacy',
          score: assessment.privacyScore || 75,
          trend: 'up',
          color: 'text-purple-600',
        },
        {
          name: 'Compliance',
          score: assessment.complianceScore || 65,
          trend: 'down',
          color: 'text-green-600',
        },
        {
          name: 'Financial',
          score: 70,
          trend: 'stable',
          color: 'text-yellow-600',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#191919]">Vendor Risk Assessment</h1>
          <p className="text-[#A8A8A8]">AI-powered vendor security assessments</p>
        </div>
        <DaisyBadge className="bg-[#199BEC] text-white">Powered by Probo AI</DaisyBadge>
      </div>

      <DaisyTabs value={activeTab} onValueChange={setActiveTab}>
        <DaisyTabsList className="grid w-full grid-cols-4">
          <DaisyTabsTrigger value="assess">New Assessment</DaisyTabsTrigger>
          <DaisyTabsTrigger value="results">Results</DaisyTabsTrigger>
          <DaisyTabsTrigger value="history">History</DaisyTabsTrigger>
          <DaisyTabsTrigger value="dashboard">Dashboard</DaisyTabsTrigger>
        </DaisyTabsList>

        <DaisyTabsContent value="assess" className="space-y-4">
          <DaisyCard className="bg-[#FAFAFA] border-[#D8C3A5]">
            <DaisyCardBody>
              <DaisyCardTitle className="text-[#191919] font-inter flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Assess New Vendor
              </DaisyCardTitle>
              <DaisyCardDescription>
                Enter a vendor's website URL to perform an AI-powered security assessment
              </DaisyCardDescription>
            </DaisyCardBody>

            <DaisyCardBody>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3 top-1/2 h-4 w-4 transform -translate-y-1/2 text-[#A8A8A8]" />
                    <DaisyInput
                      placeholder="https://example.com"
                      value={vendorUrl}
                      onChange={(e) = />
setVendorUrl(e.target.value)}
                      className="pl-10 border-[#D8C3A5] focus:border-[#199BEC]"
                      onKeyPress={(e) => e.key === 'Enter' && handleAssessVendor()} />
                  </div>
                  <DaisyButton
                    onClick={handleAssessVendor}
                    disabled={isAssessing || !vendorUrl.trim()}
                    className="bg-[#199BEC] hover:bg-[#199BEC]/90 min-w-[120px]"
                  >
                    {isAssessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Assessing...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Assess
                      </>
                    )}
                  </DaisyButton>
                </div>

                <DaisyAlert>
                  <Shield className="h-4 w-4" />
                  <DaisyAlertDescription>
                    Our AI agent will analyze the vendor's website, security posture, compliance
                    documentation, and publicly available information to generate a comprehensive
                    risk assessment.
                  </DaisyAlertDescription>
                </DaisyAlert>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <div className="text-center">
                    <Shield className="h-8 w-8 mx-auto mb-2 text-[#199BEC]" />
                    <h3 className="font-medium text-[#191919]">Security Analysis</h3>
                    <p className="text-sm text-[#A8A8A8]">SSL, certificates, security headers</p>
                  </div>
                  <div className="text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-[#199BEC]" />
                    <h3 className="font-medium text-[#191919]">Compliance Check</h3>
                    <p className="text-sm text-[#A8A8A8]">Privacy policies, certifications</p>
                  </div>
                  <div className="text-center">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 text-[#199BEC]" />
                    <h3 className="font-medium text-[#191919]">Risk Scoring</h3>
                    <p className="text-sm text-[#A8A8A8]">AI-powered risk calculation</p>
                  </div>
                </div>
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>

        <DaisyTabsContent value="results" className="space-y-4">
          {assessment ? (
            <div className="space-y-6">
              {/* Vendor Overview */}
              <DaisyCard className="bg-[#FAFAFA] border-[#D8C3A5]">
                <DaisyCardBody>
                  <div className="flex items-start justify-between">
                    <div>
                      <DaisyCardTitle className="text-[#191919] font-inter flex items-center">
                        <Building className="h-5 w-5 mr-2" />
                        {assessment.vendorInfo.name}
                      </DaisyCardTitle>
                      <DaisyCardDescription className="mt-1">
                        {assessment.vendorInfo.description}
                      </DaisyCardDescription>
                    </div>
                    <DaisyBadge className={cn('text-sm', getRiskBadgeColor(assessment.riskScore))}>
                      Risk Score: {assessment.riskScore}
                    </DaisyBadge>
                  </div>
                </DaisyCardBody>
                <DaisyCardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <Globe className="h-4 w-4 mr-2 text-[#A8A8A8]" />
                        <span className="text-[#A8A8A8]">Category:</span>
                        <span className="ml-2 text-[#191919]">
                          {assessment.vendorInfo.category}
                        </span>
                      </div>
                      {assessment.vendorInfo.email && (
                        <div className="flex items-center text-sm">
                          <Mail className="h-4 w-4 mr-2 text-[#A8A8A8]" />
                          <span className="text-[#A8A8A8]">Email:</span>
                          <span className="ml-2 text-[#191919]">{assessment.vendorInfo.email}</span>
                        </div>
                      )}
                      {assessment.vendorInfo.address && (
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-[#A8A8A8]" />
                          <span className="text-[#A8A8A8]">Address:</span>
                          <span className="ml-2 text-[#191919] truncate">
                            {assessment.vendorInfo.address}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <DaisyCalendar className="h-4 w-4 mr-2 text-[#A8A8A8]" />
<span className="text-[#A8A8A8]">Assessed:</span>
                        <span className="ml-2 text-[#191919]">
                          {new Date(assessment.assessmentDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Shield className="h-4 w-4 mr-2 text-[#A8A8A8]" />
                        <span className="text-[#A8A8A8]">Compliance:</span>
                        <DaisyBadge
                          className={cn(
                            'ml-2 text-xs',
                            getComplianceStatusColor(assessment.complianceStatus)
                          )}
                        >
                          {assessment.complianceStatus.replace('_', ' ')}
                        </DaisyBadge>
                      </div>
                      <div className="flex items-center text-sm">
                        <UserCheck className="h-4 w-4 mr-2 text-[#A8A8A8]" />
                        <span className="text-[#A8A8A8]">Certifications:</span>
                        <span className="ml-2 text-[#191919]">
                          {assessment.vendorInfo.certifications.length || 'None'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {assessment.vendorInfo.certifications.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-[#A8A8A8] mb-2">Security Certifications:</p>
                      <div className="flex flex-wrap gap-2">
                        {assessment.vendorInfo.certifications.map((cert, idx) => (
                          <DaisyBadge key={idx} variant="outline" className="text-xs">
                            {cert}
                          </DaisyBadge>
                        ))}
                      </div>
                    </div>
                  )}
                </DaisyCardBody>
              </DaisyCard>

              {/* Risk Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {riskCategories.map((category) => (
                  <DaisyCard key={category.name} className="bg-[#FAFAFA] border-[#D8C3A5]">
                    <DaisyCardBody className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[#191919]">{category.name}</span>
                        {category.trend === 'up' && (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        )}
                        {category.trend === 'down' && (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        {category.trend === 'stable' && <div className="h-4 w-4" />}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={cn('text-2xl font-bold', category.color)}>
                          {category.score}
                        </span>
                        <span className="text-xs text-[#A8A8A8]">/ 100</span>
                      </div>
                      <DaisyProgress value={category.score} className="h-2 mt-2" />
</DaisyCardBody>
                  </DaisyCard>
                ))}
              </div>

              {/* Findings */}
              <DaisyCard className="bg-[#FAFAFA] border-[#D8C3A5]">
                <DaisyCardBody>
                  <DaisyCardTitle className="text-[#191919] font-inter flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Security Findings
                    <DaisyBadge variant="outline" className="ml-2">
                      {assessment.findings.length} findings
                    </DaisyBadge>
                  </DaisyCardTitle>
                </DaisyCardBody>
                <DaisyCardBody>
                  {assessment.findings.length > 0 ? (
                    <div className="space-y-4">
                      {assessment.findings.map((finding) => (
                        <div key={finding.id} className="border border-[#D8C3A5] rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-[#191919]">{finding.title}</h4>
                              <p className="text-sm text-[#A8A8A8] mt-1">{finding.description}</p>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              <DaisyBadge
                                className={cn('text-xs', getSeverityColor(finding.severity))}
                              >
                                {finding.severity}
                              </DaisyBadge>
                              <DaisyBadge variant="outline" className="text-xs">
                                {finding.category}
                              </DaisyBadge>
                            </div>
                          </div>
                          {finding.remediation && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-md">
                              <p className="text-sm text-blue-800">
                                <strong>Recommendation:</strong> {finding.remediation}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-[#191919] font-medium">No security issues found</p>
                      <p className="text-[#A8A8A8] text-sm">
                        This vendor appears to have good security practices
                      </p>
                    </div>
                  )}
                </DaisyCardBody>
              </DaisyCard>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2">
                <DaisyButton variant="outline" className="border-[#D8C3A5]">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </DaisyButton>
                <DaisyButton className="bg-[#199BEC] hover:bg-[#199BEC]/90">
          Schedule Review
                
        </DaisyButton>
              </div>
            </div>
          ) : (
            <DaisyCard className="bg-[#FAFAFA] border-[#D8C3A5]">
              <DaisyCardBody className="p-8 text-center">
                <Search className="h-12 w-12 text-[#A8A8A8] mx-auto mb-4" />
                <p className="text-[#191919] font-medium">No assessment results</p>
                <p className="text-[#A8A8A8] text-sm">
                  Run a vendor assessment to see results here
                </p>
              </DaisyCardBody>
            </DaisyCard>
          )}
        </DaisyTabsContent>

        <DaisyTabsContent value="history" className="space-y-4">
          <DaisyCard className="bg-[#FAFAFA] border-[#D8C3A5]">
            <DaisyCardBody>
              <DaisyCardTitle className="text-[#191919] font-inter">
                Assessment History
              </DaisyCardTitle>
              <DaisyCardDescription>View all previous vendor risk assessments</DaisyCardDescription>
            </DaisyCardBody>

            <DaisyCardBody>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#199BEC]"></div>
                </div>
              ) : assessments.length > 0 ? (
                <div className="space-y-4">
                  {assessments.map((assessment) => (
                    <div key={assessment.id} className="border border-[#D8C3A5] rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-[#191919]">
                            {assessment.vendorInfo.name}
                          </h4>
                          <p className="text-sm text-[#A8A8A8]">{assessment.vendorInfo.category}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <DaisyBadge
                            className={cn('text-sm', getRiskBadgeColor(assessment.riskScore))}
                          >
                            Risk: {assessment.riskScore}
                          </DaisyBadge>
                          <span className="text-sm text-[#A8A8A8]">
                            {new Date(assessment.assessmentDate).toLocaleDateString()}
                          </span>
                          <DaisyButton size="sm" variant="outline">
          View
                          
        </DaisyButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-[#A8A8A8] mx-auto mb-4" />
                  <p className="text-[#191919] font-medium">No assessments yet</p>
                  <p className="text-[#A8A8A8] text-sm">Start by assessing your first vendor</p>
                </div>
              )}
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>

        <DaisyTabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DaisyCard className="bg-[#FAFAFA] border-[#D8C3A5]">
              <DaisyCardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#A8A8A8]">Total Vendors</p>
                    <p className="text-2xl font-bold text-[#191919]">{assessments.length}</p>
                  </div>
                  <Building className="h-8 w-8 text-[#199BEC]" />
                </div>
              </DaisyCardBody>
            </DaisyCard>

            <DaisyCard className="bg-[#FAFAFA] border-[#D8C3A5]">
              <DaisyCardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#A8A8A8]">High Risk</p>
                    <p className="text-2xl font-bold text-red-600">
                      {assessments.filter((a) => a.riskScore > 70).length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </DaisyCardBody>
            </DaisyCard>

            <DaisyCard className="bg-[#FAFAFA] border-[#D8C3A5]">
              <DaisyCardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#A8A8A8]">Compliant</p>
                    <p className="text-2xl font-bold text-green-600">
                      {assessments.filter((a) => a.complianceStatus === 'COMPLIANT').length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </DaisyCardBody>
            </DaisyCard>
          </div>
        </DaisyTabsContent>
      </DaisyTabs>
    </div>
  );
}
