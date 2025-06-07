'use client';

import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { EnhancedHeading } from '@/components/ui/enhanced-typography';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Calendar,
  FileText,
  Users,
  Shield
} from 'lucide-react';

export default function ThirdPartyAssessmentPage() {
  // Mock data for third-party assessments
  const thirdPartyAssessments = [
    {
      id: 1,
      vendorName: 'CloudTech Solutions',
      assessmentType: 'Security Assessment',
      status: 'Completed',
      riskLevel: 'Low',
      score: 92,
      completedDate: '2025-01-03',
      nextReview: '2025-07-03',
      assessor: 'External Auditor',
      criticalFindings: 0,
      totalFindings: 3
    },
    {
      id: 2,
      vendorName: 'DataFlow Inc.',
      assessmentType: 'Privacy Impact Assessment',
      status: 'In Progress',
      riskLevel: 'Medium',
      score: 0,
      completedDate: null,
      nextReview: '2025-02-15',
      assessor: 'Internal Team',
      criticalFindings: 2,
      totalFindings: 8
    },
    {
      id: 3,
      vendorName: 'SecureNet Corp',
      assessmentType: 'Compliance Review',
      status: 'Scheduled',
      riskLevel: 'High',
      score: 0,
      completedDate: null,
      nextReview: '2025-01-25',
      assessor: 'Third-party Auditor',
      criticalFindings: 0,
      totalFindings: 0
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Scheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'In Progress': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'Scheduled': return <Calendar className="w-4 h-4 text-yellow-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-[#F5F1E9] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/60 border border-[#E5E1D8] rounded-lg p-6 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <EnhancedHeading level="h1" className="text-[#2C1810] mb-2">
                Third-Party Assessments
              </EnhancedHeading>
              <p className="text-[#6B5B47] text-sm">
                Manage and track security assessments for your third-party vendors and partners.
              </p>
            </div>
            <Button className="bg-[#8B7355] hover:bg-[#6B5B47] text-white">
              <Building className="w-4 h-4 mr-2" />
              New Assessment
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <Card className="bg-white/60 border-[#E5E1D8] backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-[#8B7355]" />
                <div>
                  <p className="text-sm text-[#6B5B47]">Total Vendors</p>
                  <p className="text-2xl font-semibold text-[#2C1810]">3</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 border-[#E5E1D8] backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-[#6B5B47]">Completed</p>
                  <p className="text-2xl font-semibold text-[#2C1810]">1</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 border-[#E5E1D8] backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm text-[#6B5B47]">Critical Findings</p>
                  <p className="text-2xl font-semibold text-[#2C1810]">2</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 border-[#E5E1D8] backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-[#6B5B47]">Average Score</p>
                  <p className="text-2xl font-semibold text-[#2C1810]">92%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Assessments List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/60 border border-[#E5E1D8] rounded-lg backdrop-blur-sm"
        >
          <div className="p-6 border-b border-[#E5E1D8]">
            <EnhancedHeading level="h2" className="text-[#2C1810]">
              Vendor Assessments
            </EnhancedHeading>
          </div>
          
          <div className="p-6 space-y-4">
            <Suspense fallback={<LoadingSpinner />}>
              {thirdPartyAssessments.map((assessment) => (
                <Card key={assessment.id} className="bg-white/40 border-[#E5E1D8]">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <Building className="w-5 h-5 text-[#8B7355]" />
                          <h3 className="text-lg font-semibold text-[#2C1810]">
                            {assessment.vendorName}
                          </h3>
                          <Badge className={getStatusColor(assessment.status)}>
                            {getStatusIcon(assessment.status)}
                            <span className="ml-1">{assessment.status}</span>
                          </Badge>
                          <Badge className={getRiskColor(assessment.riskLevel)}>
                            {assessment.riskLevel} Risk
                          </Badge>
                        </div>
                        
                        <p className="text-[#6B5B47] text-sm mb-4">
                          {assessment.assessmentType}
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center space-x-2 text-sm text-[#6B5B47]">
                            <Users className="w-4 h-4" />
                            <span>{assessment.assessor}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-[#6B5B47]">
                            <Calendar className="w-4 h-4" />
                            <span>Next Review: {assessment.nextReview}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-[#6B5B47]">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{assessment.criticalFindings} critical / {assessment.totalFindings} total findings</span>
                          </div>
                        </div>
                        
                        {assessment.status === 'Completed' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-[#6B5B47]">Assessment Score</span>
                              <span className={`font-medium ${getScoreColor(assessment.score)}`}>
                                {assessment.score}%
                              </span>
                            </div>
                            <Progress value={assessment.score} className="h-2" />
                            <p className="text-xs text-[#6B5B47]">
                              Completed on {assessment.completedDate}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4 space-y-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-[#E5E1D8] text-[#6B5B47] hover:bg-[#F5F1E9] w-full"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          View Report
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-[#E5E1D8] text-[#6B5B47] hover:bg-[#F5F1E9] w-full"
                        >
                          Edit Assessment
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </Suspense>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 