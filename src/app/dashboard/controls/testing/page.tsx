'use client';

import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { EnhancedHeading } from '@/components/ui/enhanced-typography';
import { LoadingSpinner } from '@/components/ui/DaisyLoadingSpinner';
import { DaisyCard, DaisyCardBody } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Clock,
  Play,
  Calendar,
  User
} from 'lucide-react';

export default function ControlsTestingPage() {
  // Mock data for control tests
  const controlTests = [
    {
      id: 1,
      controlName: 'Access Control Validation',
      testType: 'Automated',
      status: 'Passed',
      lastRun: '2025-01-06',
      nextRun: '2025-01-13',
      effectiveness: 95,
      tester: 'Security Team'
    },
    {
      id: 2,
      controlName: 'Data Encryption Check',
      testType: 'Manual',
      status: 'Failed',
      lastRun: '2025-01-05',
      nextRun: '2025-01-12',
      effectiveness: 78,
      tester: 'IT Team'
    },
    {
      id: 3,
      controlName: 'Backup Recovery Test',
      testType: 'Automated',
      status: 'In Progress',
      lastRun: '2025-01-07',
      nextRun: '2025-01-14',
      effectiveness: 88,
      tester: 'Operations Team'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Passed': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Failed': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'In Progress': return <Clock className="w-5 h-5 text-blue-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Passed': return 'bg-green-100 text-green-800 border-green-200';
      case 'Failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
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
                Controls Testing
              </EnhancedHeading>
              <p className="text-[#6B5B47] text-sm">
                Monitor and validate the effectiveness of your security controls through automated and manual testing.
              </p>
            </div>
            <DaisyButton className="bg-[#8B7355] hover:bg-[#6B5B47] text-white">
              <Play className="w-4 h-4 mr-2" />
              Run Test Suite
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
            <DaisyCardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TestTube className="w-5 h-5 text-[#8B7355]" />
                <div>
                  <p className="text-sm text-[#6B5B47]">Total Tests</p>
                  <p className="text-2xl font-semibold text-[#2C1810]">3</p>
                </div>
              </div>
            </DaisyCardContent>
          </DaisyCard>

          <DaisyCard className="bg-white/60 border-[#E5E1D8] backdrop-blur-sm">
            <DaisyCardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-[#6B5B47]">Passed</p>
                  <p className="text-2xl font-semibold text-[#2C1810]">1</p>
                </div>
              </div>
            </DaisyCardContent>
          </DaisyCard>

          <DaisyCard className="bg-white/60 border-[#E5E1D8] backdrop-blur-sm">
            <DaisyCardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm text-[#6B5B47]">Failed</p>
                  <p className="text-2xl font-semibold text-[#2C1810]">1</p>
                </div>
              </div>
            </DaisyCardContent>
          </DaisyCard>

          <DaisyCard className="bg-white/60 border-[#E5E1D8] backdrop-blur-sm">
            <DaisyCardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-[#6B5B47]">In Progress</p>
                  <p className="text-2xl font-semibold text-[#2C1810]">1</p>
                </div>
              </div>
            </DaisyCardContent>
          </DaisyCard>
        </motion.div>

        {/* Test Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/60 border border-[#E5E1D8] rounded-lg backdrop-blur-sm"
        >
          <div className="p-6 border-b border-[#E5E1D8]">
            <EnhancedHeading level="h2" className="text-[#2C1810]">
              Test Results
            </EnhancedHeading>
          </div>
          
          <div className="p-6 space-y-4">
            <Suspense fallback={<LoadingSpinner />}>
              {controlTests.map((test) => (
                <DaisyCard key={test.id} className="bg-white/40 border-[#E5E1D8]">
                  <DaisyCardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          {getStatusIcon(test.status)}
                          <h3 className="text-lg font-semibold text-[#2C1810]">
                            {test.controlName}
                          </h3>
                          <DaisyBadge className={getStatusColor(test.status)}>
                            {test.status}
                          </DaisyBadge>
                          <DaisyBadge variant="outline" className="border-[#E5E1D8] text-[#6B5B47]">
                            {test.testType}
                          </DaisyBadge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center space-x-2 text-sm text-[#6B5B47]">
                            <DaisyCalendar className="w-4 h-4" />
                            <span>Last Run: {test.lastRun}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-[#6B5B47]">
                            <Clock className="w-4 h-4" />
                            <span>Next Run: {test.nextRun}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-[#6B5B47]">
                            <User className="w-4 h-4" />
                            <span>{test.tester}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#6B5B47]">Effectiveness</span>
                            <span className="text-[#2C1810] font-medium">{test.effectiveness}%</span>
                          </div>
                          <DaisyProgress value={test.effectiveness} className="h-2" />
                        </div>
                      </div>
                      
                      <div className="ml-4 space-y-2">
                        <DaisyButton 
                          variant="outline" 
                          size="sm"
                          className="border-[#E5E1D8] text-[#6B5B47] hover:bg-[#F5F1E9] w-full"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Run Test
                        </DaisyButton>
                        <DaisyButton 
                          variant="outline" 
                          size="sm"
                          className="border-[#E5E1D8] text-[#6B5B47] hover:bg-[#F5F1E9] w-full"
                        >
                          View Details
                        </DaisyButton>
                      </div>
                    </div>
                  </DaisyCardContent>
                </DaisyCard>
              ))}
            </Suspense>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 