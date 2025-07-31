"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DaisyCard, DaisyCardBody } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { 
  Upload, 
  Brain, 
  Shield, 
  FileText, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  AlertTriangle,
  BarChart3
} from 'lucide-react';

const HeroProcessCard = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      id: 'upload',
      title: 'Upload Documents',
      subtitle: 'RCSA, Policies, Controls',
      icon: Upload,
      color: 'text-[#199BEC]',
      bgColor: 'bg-[#e6f4fd]',
      files: ['RCSA_Template.xlsx', 'Policy_Framework.pdf', 'Controls_Matrix.csv']
    },
    {
      id: 'analyze',
      title: 'AI Analysis',
      subtitle: 'Risk Extraction & Scoring',
      icon: Brain,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      processing: ['Extracting risks...', 'Calculating scores...', 'Mapping controls...']
    },
    {
      id: 'results',
      title: 'Risk Dashboard',
      subtitle: 'Actionable Insights',
      icon: BarChart3,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      results: [
        { name: 'Cyber Risk', level: 'high', score: 18 },
        { name: 'Compliance', level: 'medium', score: 12 },
        { name: 'Operational', level: 'low', score: 6 }
      ]
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [steps.length]);

  const currentStepData = steps[currentStep];

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Main Process Card */}
      <DaisyCard className="bg-white/80 backdrop-blur-xl border border-gray-200/60 shadow-2xl overflow-hidden w-full" >
  <DaisyCardContent className="p-0" >
  </DaisyCard>
</DaisyCardContent>
          {/* Header with Browser Chrome */}
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="text-sm text-gray-500 font-mono">riscura.com/dashboard</div>
            </div>
          </div>

          {/* Dynamic Content Area */}
          <div className="h-80 relative overflow-hidden w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className={`absolute inset-0 ${currentStepData.bgColor} p-6`}
              >
                {/* Step Indicator */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg ${currentStepData.bgColor} border border-gray-200 flex items-center justify-center`}>
                      <currentStepData.icon className={`w-5 h-5 ${currentStepData.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{currentStepData.title}</h3>
                      <p className="text-xs text-gray-600">{currentStepData.subtitle}</p>
                    </div>
                  </div>
                  
                </div>

                {/* Step-Specific Content */}
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-[#199BEC]/50 rounded-lg p-6 bg-white/50 text-center">
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Upload className="w-8 h-8 text-[#199BEC] mx-auto mb-3" />
                      </motion.div>
                      <p className="text-sm text-gray-700 mb-3">Drag & drop your files</p>
                      <div className="grid grid-cols-3 gap-2">
                        {currentStepData.files?.map((file, index) => (
                          <motion.div
                            key={file}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.3 }}
                            className="bg-white border border-gray-200 rounded p-2 flex items-center space-x-2 text-xs"
                          >
                            <FileText className="w-4 h-4 text-[#199BEC] flex-shrink-0" />
                            <span className="text-gray-900 truncate">{file}</span>
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="bg-white/50 rounded-lg p-6 text-center">
                      <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="mb-4"
                      >
                        <Brain className="w-10 h-10 text-purple-600 mx-auto" />
                      </motion.div>
                      <div className="grid grid-cols-3 gap-4">
                        {currentStepData.processing?.map((process, index) => (
                          <motion.div
                            key={`${process}-${currentStep}`}
                            initial={{ opacity: 0.3 }}
                            animate={{ 
                              opacity: [0.3, 1, 0.3],
                            }}
                            transition={{ 
                              duration: 2.4,
                              delay: index * 0.8,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="flex items-center justify-center space-x-2 text-sm"
                          >
                            <motion.div 
                              className="w-2 h-2 bg-purple-500 rounded-full"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{
                                duration: 1.2,
                                delay: index * 0.8,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            />
                            <span className="text-gray-700">{process}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="bg-white/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900 text-sm">Risk Assessment Results</h4>
                        <DaisyBadge className="bg-green-100 text-green-800 text-xs">Complete</DaisyBadge>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {currentStepData.results?.map((result, index) => (
                          <motion.div
                            key={result.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.2 }}
                            className="bg-white border border-gray-200 rounded p-3 text-center"
                          >
                            <div className="flex items-center justify-center mb-2">
                              <div className={`w-4 h-4 rounded-full shadow-sm ${
                                result.level === 'high' ? 'bg-red-500' :
                                result.level === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                              }`}></div>
                            </div>
                            <div className="text-xs text-gray-900 font-medium mb-2">{result.name}</div>
                            <DaisyBadge 
                              variant={result.level === 'high' ? 'destructive' : result.level === 'medium' ? 'secondary' : 'default'}
                              className="text-xs mb-1" >
  {result.level}
</DaisyBadge>
                            </DaisyBadge>
                            <div className="text-xs font-mono text-gray-600 mt-1">{result.score}</div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-center">
              <div className="flex space-x-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      currentStep === index ? 'bg-[#199BEC] scale-125' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </DaisyCardContent>
      </DaisyCard>
    </div>
  );
};

export default HeroProcessCard; 