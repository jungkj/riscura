'use client';

import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { EnhancedHeading } from '@/components/ui/enhanced-typography';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileCheck, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Users,
  Target
} from 'lucide-react';

export default function RiskAssessmentPage() {
  // Mock data for assessments
  const assessments = [
    {
      id: 1,
      title: 'Annual Security Assessment',
      status: 'In Progress',
      progress: 65,
      dueDate: '2025-02-15',
      assignee: 'Security Team',
      priority: 'High',
      riskCount: 12
    },
    {
      id: 2,
      title: 'Compliance Risk Review',
      status: 'Completed',
      progress: 100,
      dueDate: '2025-01-30',
      assignee: 'Compliance Team',
      priority: 'Medium',
      riskCount: 8
    },
    {
      id: 3,
      title: 'Third-Party Vendor Assessment',
      status: 'Pending',
      progress: 0,
      dueDate: '2025-03-01',
      assignee: 'Risk Team',
      priority: 'High',
      riskCount: 15
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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
                Risk Assessments
              </EnhancedHeading>
              <p className="text-[#6B5B47] text-sm">
                Manage and track your organization's risk assessment processes and outcomes.
              </p>
            </div>
            <Button className="bg-[#8B7355] hover:bg-[#6B5B47] text-white">
              <FileCheck className="w-4 h-4 mr-2" />
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
                <Target className="w-5 h-5 text-[#8B7355]" />
                <div>
                  <p className="text-sm text-[#6B5B47]">Total Assessments</p>
                  <p className="text-2xl font-semibold text-[#2C1810]">3</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 border-[#E5E1D8] backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-[#6B5B47]">In Progress</p>
                  <p className="text-2xl font-semibold text-[#2C1810]">1</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 border-[#E5E1D8] backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-[#6B5B47]">Pending</p>
                  <p className="text-2xl font-semibold text-[#2C1810]">1</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 border-[#E5E1D8] backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-[#6B5B47]">Completed</p>
                  <p className="text-2xl font-semibold text-[#2C1810]">1</p>
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
              Assessment Overview
            </EnhancedHeading>
          </div>
          
          <div className="p-6 space-y-4">
            <Suspense fallback={<LoadingSpinner />}>
              {assessments.map((assessment) => (
                <Card key={assessment.id} className="bg-white/40 border-[#E5E1D8]">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-semibold text-[#2C1810]">
                            {assessment.title}
                          </h3>
                          <Badge className={getStatusColor(assessment.status)}>
                            {assessment.status}
                          </Badge>
                          <Badge className={getPriorityColor(assessment.priority)}>
                            {assessment.priority}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center space-x-2 text-sm text-[#6B5B47]">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {assessment.dueDate}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-[#6B5B47]">
                            <Users className="w-4 h-4" />
                            <span>{assessment.assignee}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-[#6B5B47]">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{assessment.riskCount} risks identified</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#6B5B47]">Progress</span>
                            <span className="text-[#2C1810] font-medium">{assessment.progress}%</span>
                          </div>
                          <Progress value={assessment.progress} className="h-2" />
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-[#E5E1D8] text-[#6B5B47] hover:bg-[#F5F1E9]"
                        >
                          View Details
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