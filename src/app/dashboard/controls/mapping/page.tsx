'use client';

import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { EnhancedHeading } from '@/components/ui/enhanced-typography';
import { LoadingSpinner } from '@/components/ui/DaisyLoadingSpinner';
import { DaisyCard, DaisyCardBody } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { Network, Shield, Link, Target, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ControlsMappingPage() {
  // Mock data for control mappings
  const controlMappings = [
    {
      id: 1,
      controlName: 'Access Control Management',
      frameworks: ['ISO 27001', 'NIST CSF', 'SOC 2'],
      risksCovered: 5,
      status: 'Mapped',
      coverage: 95,
      lastUpdated: '2025-01-06',
    },
    {
      id: 2,
      controlName: 'Data Encryption',
      frameworks: ['ISO 27001', 'PCI DSS'],
      risksCovered: 3,
      status: 'Partial',
      coverage: 78,
      lastUpdated: '2025-01-05',
    },
    {
      id: 3,
      controlName: 'Incident Response',
      frameworks: ['NIST CSF', 'ISO 27001', 'SOC 2'],
      risksCovered: 8,
      status: 'Mapped',
      coverage: 92,
      lastUpdated: '2025-01-04',
    },
    {
      id: 4,
      controlName: 'Vulnerability Management',
      frameworks: ['NIST CSF'],
      risksCovered: 2,
      status: 'Unmapped',
      coverage: 45,
      lastUpdated: '2025-01-03',
    },
  ];

  const frameworkStats = [
    { name: 'ISO 27001', controls: 12, coverage: 89 },
    { name: 'NIST CSF', controls: 15, coverage: 82 },
    { name: 'SOC 2', controls: 8, coverage: 95 },
    { name: 'PCI DSS', controls: 5, coverage: 76 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Mapped':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Unmapped':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Mapped':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Partial':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'Unmapped':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
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
                Controls Mapping
              </EnhancedHeading>
              <p className="text-[#6B5B47] text-sm">
                Map your security controls to compliance frameworks and risk mitigation strategies.
              </p>
            </div>
            <DaisyButton className="bg-[#8B7355] hover:bg-[#6B5B47] text-white">
              <Link className="w-4 h-4 mr-2" />
              Create Mapping
            </DaisyButton>
          </div>
        </motion.div>

        {/* Framework Coverage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {frameworkStats.map((framework, index) => (
            <DaisyCard key={index} className="bg-white/60 border-[#E5E1D8] backdrop-blur-sm">
              <DaisyCardBody className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-[#8B7355]" />
                    <span className="font-medium text-[#2C1810]">{framework.name}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B5B47]">Controls</span>
                    <span className="text-[#2C1810] font-medium">{framework.controls}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B5B47]">Coverage</span>
                    <span className="text-[#2C1810] font-medium">{framework.coverage}%</span>
                  </div>
                </div>
              </DaisyCardBody>
            </DaisyCard>
          ))}
        </motion.div>

        {/* Controls Mapping Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/60 border border-[#E5E1D8] rounded-lg backdrop-blur-sm"
        >
          <div className="p-6 border-b border-[#E5E1D8]">
            <EnhancedHeading level="h2" className="text-[#2C1810]">
              Control Mappings
            </EnhancedHeading>
          </div>

          <div className="p-6 space-y-4">
            <Suspense fallback={<LoadingSpinner />}>
              {controlMappings.map((mapping) => (
                <DaisyCard key={mapping.id} className="bg-white/40 border-[#E5E1D8]">
                  <DaisyCardBody className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <Network className="w-5 h-5 text-[#8B7355]" />
                          <h3 className="text-lg font-semibold text-[#2C1810]">
                            {mapping.controlName}
                          </h3>
                          <DaisyBadge className={getStatusColor(mapping.status)}>
                            {getStatusIcon(mapping.status)}
                            <span className="ml-1">{mapping.status}</span>
                          </DaisyBadge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-[#6B5B47] mb-1">Frameworks</p>
                            <div className="flex flex-wrap gap-1">
                              {mapping.frameworks.map((framework, index) => (
                                <DaisyBadge
                                  key={index}
                                  variant="outline"
                                  className="border-[#E5E1D8] text-[#6B5B47] text-xs"
                                >
                                  {framework}
                                </DaisyBadge>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-[#6B5B47]">
                            <Target className="w-4 h-4" />
                            <span>{mapping.risksCovered} risks covered</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-[#6B5B47]">
                            <FileText className="w-4 h-4" />
                            <span>Updated: {mapping.lastUpdated}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#6B5B47]">Coverage</span>
                            <span className="text-[#2C1810] font-medium">{mapping.coverage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-[#8B7355] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${mapping.coverage}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 space-y-2">
                        <DaisyButton
                          variant="outline"
                          size="sm"
                          className="border-[#E5E1D8] text-[#6B5B47] hover:bg-[#F5F1E9] w-full"
                        >
                          <Link className="w-4 h-4 mr-2" />
                          Edit Mapping
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
