'use client';

import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { EnhancedHeading } from '@/components/ui/enhanced-typography';
import { LoadingSpinner } from '@/components/ui/DaisyLoadingSpinner';
import { DaisyCard, DaisyCardBody } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { User, CheckCircle, Clock, FileText, Calendar, Target, TrendingUp } from 'lucide-react';

export default function SelfAssessmentPage() {
  // Mock data for self-assessments
  const selfAssessments = [
    {
      id: 1,
      title: 'Security Awareness Assessment',
      description: 'Evaluate your understanding of security policies and procedures',
      status: 'Completed',
      score: 85,
      completedDate: '2025-01-05',
      nextDue: '2025-04-05',
      questions: 25,
      timeRequired: '15 minutes',
    },
    {
      id: 2,
      title: 'Data Privacy Compliance Check',
      description: 'Assess your knowledge of data protection regulations',
      status: 'In Progress',
      score: 0,
      completedDate: null,
      nextDue: '2025-01-15',
      questions: 30,
      timeRequired: '20 minutes',
    },
    {
      id: 3,
      title: 'Risk Management Fundamentals',
      description: 'Test your understanding of risk identification and mitigation',
      status: 'Not Started',
      score: 0,
      completedDate: null,
      nextDue: '2025-01-20',
      questions: 20,
      timeRequired: '12 minutes',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Not Started':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'In Progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'Not Started':
        return <Clock className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
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
                Self-Assessments
              </EnhancedHeading>
              <p className="text-[#6B5B47] text-sm">
                Complete self-assessments to evaluate your knowledge and compliance with
                organizational policies.
              </p>
            </div>
            <DaisyButton className="bg-[#8B7355] hover:bg-[#6B5B47] text-white">
              <FileText className="w-4 h-4 mr-2" />
              View All Results
            </DaisyButton>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <DaisyCard className="bg-white/60 border-[#E5E1D8] backdrop-blur-sm">
            <DaisyCardBody className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-[#8B7355]" />
                <div>
                  <p className="text-sm text-[#6B5B47]">Total Assessments</p>
                  <p className="text-2xl font-semibold text-[#2C1810]">3</p>
                </div>
              </div>
            </DaisyCardBody>
          </DaisyCard>

          <DaisyCard className="bg-white/60 border-[#E5E1D8] backdrop-blur-sm">
            <DaisyCardBody className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-[#6B5B47]">Completed</p>
                  <p className="text-2xl font-semibold text-[#2C1810]">1</p>
                </div>
              </div>
            </DaisyCardBody>
          </DaisyCard>

          <DaisyCard className="bg-white/60 border-[#E5E1D8] backdrop-blur-sm">
            <DaisyCardBody className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-[#6B5B47]">In Progress</p>
                  <p className="text-2xl font-semibold text-[#2C1810]">1</p>
                </div>
              </div>
            </DaisyCardBody>
          </DaisyCard>

          <DaisyCard className="bg-white/60 border-[#E5E1D8] backdrop-blur-sm">
            <DaisyCardBody className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-[#6B5B47]">Average Score</p>
                  <p className="text-2xl font-semibold text-[#2C1810]">85%</p>
                </div>
              </div>
            </DaisyCardBody>
          </DaisyCard>
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
              Available Assessments
            </EnhancedHeading>
          </div>

          <div className="p-6 space-y-4">
            <Suspense fallback={<LoadingSpinner />}>
              {selfAssessments.map((assessment) => (
                <DaisyCard key={assessment.id} className="bg-white/40 border-[#E5E1D8]">
                  <DaisyCardBody className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <User className="w-5 h-5 text-[#8B7355]" />
                          <h3 className="text-lg font-semibold text-[#2C1810]">
                            {assessment.title}
                          </h3>
                          <DaisyBadge className={getStatusColor(assessment.status)}>
                            {getStatusIcon(assessment.status)}
                            <span className="ml-1">{assessment.status}</span>
                          </DaisyBadge>
                        </div>

                        <p className="text-[#6B5B47] text-sm mb-4">{assessment.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center space-x-2 text-sm text-[#6B5B47]">
                            <FileText className="w-4 h-4" />
                            <span>{assessment.questions} questions</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-[#6B5B47]">
                            <Clock className="w-4 h-4" />
                            <span>{assessment.timeRequired}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-[#6B5B47]">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {assessment.nextDue}</span>
                          </div>
                        </div>

                        {assessment.status === 'Completed' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-[#6B5B47]">Score</span>
                              <span className={`font-medium ${getScoreColor(assessment.score)}`}>
                                {assessment.score}%
                              </span>
                            </div>
                            <DaisyProgress value={assessment.score} className="h-2" />
                            <p className="text-xs text-[#6B5B47]">
                              Completed on {assessment.completedDate}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="ml-4">
                        <DaisyButton
                          className={`${
                            assessment.status === 'Completed'
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              : 'bg-[#8B7355] hover:bg-[#6B5B47] text-white'
                          }`}
                        >
                          {assessment.status === 'Completed'
                            ? 'Retake'
                            : assessment.status === 'In Progress'
                              ? 'Continue'
                              : 'Start'}
                        </DaisyButton>
                      </div>
                    </div>
                  </DaisyCardBody>
                </DaisyCard>
              ))}
            </Suspense>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
