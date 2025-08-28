"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Brain, 
  BarChart3, 
  FileText, 
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Shield
} from 'lucide-react';

interface ProcessStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  content: React.ReactNode;
}

const processSteps: ProcessStep[] = [
  {
    id: 'upload',
    title: 'Document Upload',
    subtitle: 'Import Your Risk Data',
    description: 'Upload RCSA spreadsheets, policy documents, and control matrices. Our AI instantly recognizes and categorizes your risk management content.',
    duration: '30 seconds',
    icon: Upload,
    color: 'text-[#199BEC]',
    bgColor: 'bg-[#199BEC]/10',
    content: (
      <div className="space-y-4">
        <div className="border-2 border-dashed border-[#199BEC]/30 rounded-xl p-8 bg-white/50">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <FileText className="w-8 h-8 text-[#199BEC]" />
              <div>
                <div className="text-zeroeval-body-sm text-gray-900 font-medium">RCSA_Q3_2024.xlsx</div>
                <div className="text-zeroeval-caption text-gray-500">2.4 MB • Uploaded</div>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <FileText className="w-8 h-8 text-[#199BEC]" />
              <div>
                <div className="text-zeroeval-body-sm text-gray-900 font-medium">Policy_Framework.pdf</div>
                <div className="text-zeroeval-caption text-gray-500">1.8 MB • Uploaded</div>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <FileText className="w-8 h-8 text-[#199BEC]" />
              <div>
                <div className="text-zeroeval-body-sm text-gray-900 font-medium">Controls_Matrix.csv</div>
                <div className="text-zeroeval-caption text-gray-500">950 KB • Uploaded</div>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-lg">
              <Upload className="w-6 h-6 text-gray-400" />
              <span className="ml-2 text-zeroeval-body-sm text-gray-500">Add more files</span>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'analyze',
    title: 'AI Risk Analysis',
    subtitle: 'Intelligent Processing',
    description: 'Advanced AI algorithms analyze your documents, extract risks, calculate severity scores, and map controls to create a comprehensive risk landscape.',
    duration: '2 minutes',
    icon: Brain,
    color: 'text-[#199BEC]',
    bgColor: 'bg-[#199BEC]/10',
    content: (
      <div className="space-y-4">
        <div className="bg-white/50 rounded-xl p-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-zeroeval-h6 text-gray-900">Risk Extraction</h4>
              <div className="space-y-2">
                {[
                  { name: 'Cyber Security Threats', progress: 100, status: 'complete' },
                  { name: 'Operational Risks', progress: 85, status: 'processing' },
                  { name: 'Compliance Gaps', progress: 60, status: 'processing' },
                  { name: 'Financial Risks', progress: 30, status: 'processing' }
                ].map((item) => (
                  <div key={item.name} className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-[#199BEC]" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-zeroeval-body-sm font-medium text-gray-900">{item.name}</span>
                        <span className="text-zeroeval-caption text-gray-500">{item.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-[#199BEC] h-1.5 rounded-full transition-all duration-300" 
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-zeroeval-h6 text-gray-900">Risk Scoring</h4>
              <div className="space-y-3">
                {[
                  { name: 'Data Breach Risk', level: 'Critical', score: '9.2/10', color: 'bg-red-500' },
                  { name: 'Process Failure', level: 'High', score: '7.8/10', color: 'bg-orange-500' },
                  { name: 'Vendor Risk', level: 'Medium', score: '5.4/10', color: 'bg-yellow-500' },
                  { name: 'Regulatory Change', level: 'Low', score: '3.1/10', color: 'bg-green-500' }
                ].map((risk) => (
                  <div key={risk.name} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${risk.color}`} />
                      <div>
                        <div className="text-zeroeval-body-sm font-medium text-gray-900">{risk.name}</div>
                        <div className="text-zeroeval-caption text-gray-500">{risk.level}</div>
                      </div>
                    </div>
                    <div className="text-zeroeval-body-sm font-bold text-gray-900">{risk.score}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'insights',
    title: 'Risk Dashboard',
    subtitle: 'Actionable Intelligence',
    description: 'Interactive dashboards provide real-time risk visibility, compliance tracking, and automated reporting to keep your organization secure.',
    duration: 'Real-time',
    icon: BarChart3,
    color: 'text-[#199BEC]',
    bgColor: 'bg-[#199BEC]/10',
    content: (
      <div className="space-y-4">
        <div className="bg-white/50 rounded-xl p-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <div className="text-zeroeval-2xl font-bold text-red-600">23</div>
              <div className="text-zeroeval-body-sm text-gray-600">Critical Risks</div>
              <Badge variant="destructive" className="mt-2 text-xs">Immediate Action</Badge>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#199BEC]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-8 h-8 text-[#199BEC]" />
              </div>
              <div className="text-zeroeval-2xl font-bold text-[#199BEC]">87%</div>
              <div className="text-zeroeval-body-sm text-gray-600">Risk Coverage</div>
              <Badge className="mt-2 text-xs bg-[#199BEC] text-white">Improving</Badge>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-zeroeval-2xl font-bold text-green-600">95%</div>
              <div className="text-zeroeval-body-sm text-gray-600">Compliance</div>
              <Badge className="mt-2 text-xs bg-green-100 text-green-800">On Track</Badge>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-zeroeval-h6 text-gray-900 mb-4">Recent Activity</h4>
            <div className="space-y-2">
              {[
                { action: 'New critical risk identified in IT infrastructure', time: '2 min ago', type: 'alert' },
                { action: 'Quarterly compliance report generated', time: '1 hour ago', type: 'success' },
                { action: '15 risks migrated and controls updated', time: '3 hours ago', type: 'info' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'alert' ? 'bg-red-500' :
                    activity.type === 'success' ? 'bg-green-500' : 'bg-[#199BEC]'
                  }`} />
                  <div className="flex-1">
                    <div className="text-zeroeval-body-sm text-gray-900">{activity.action}</div>
                    <div className="text-zeroeval-caption text-gray-500">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }
];

export function ScrollStepProcess() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Calculate step transitions based on scroll progress
  // Each step should occupy 1/3 of the scroll area
  const stepProgress = useTransform(scrollYProgress, [0, 1], [0, processSteps.length]);

  useEffect(() => {
    const unsubscribe = stepProgress.onChange((value) => {
      const newActiveStep = Math.min(Math.max(0, Math.floor(value)), processSteps.length - 1);
      if (newActiveStep !== activeStep) {
        setActiveStep(newActiveStep);
      }
    });

    return () => unsubscribe();
  }, [stepProgress, activeStep]);

  return (
    <div className="relative">
      {/* Header section */}
      <div className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="bg-[#199BEC] text-white px-4 py-2 text-zeroeval-caption mb-4">
            How It Works
          </Badge>
          <h2 className="text-zeroeval-4xl sm:text-zeroeval-5xl lg:text-zeroeval-6xl text-gray-900 mb-6">
            From data to insights<br />in minutes
          </h2>
          <p className="text-zeroeval-xl text-gray-600 max-w-3xl mx-auto">
            Our AI-powered platform transforms your existing risk documents into 
            comprehensive, actionable risk intelligence.
          </p>
        </div>
      </div>

      {/* Fixed scroll section - height determines scroll distance */}
      <div ref={containerRef} className="relative" style={{ height: `${processSteps.length * 100}vh` }}>
        <div className="sticky top-0 h-screen flex items-center">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                
                {/* Left side - Step content */}
                <div className="space-y-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeStep}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.6 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-2xl bg-[#199BEC] flex items-center justify-center">
                          {React.createElement(processSteps[activeStep].icon, { 
                            className: "w-8 h-8 text-white" 
                          })}
                        </div>
                        <div>
                          <Badge className="bg-[#199BEC]/10 text-[#199BEC] mb-2">
                            {processSteps[activeStep].duration}
                          </Badge>
                          <h3 className="text-zeroeval-4xl font-bold text-gray-900">
                            {processSteps[activeStep].title}
                          </h3>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="text-zeroeval-2xl text-gray-900 font-semibold">
                          {processSteps[activeStep].subtitle}
                        </h4>
                        <p className="text-zeroeval-xl text-gray-600 leading-relaxed">
                          {processSteps[activeStep].description}
                        </p>
                      </div>

                      {/* Step indicator */}
                      <div className="flex space-x-2">
                        {processSteps.map((_, index) => (
                          <div
                            key={index}
                            className={`h-1 rounded-full transition-all duration-300 ${
                              index === activeStep 
                                ? 'bg-[#199BEC] w-12' 
                                : 'bg-gray-300 w-4'
                            }`}
                          />
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Right side - Visual content */}
                <div className="relative">
                  <Card className="bg-white border border-gray-200 shadow-2xl overflow-hidden">
                    <CardContent className="p-0">
                      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          </div>
                          <div className="text-zeroeval-caption text-gray-500 font-mono">app.riscura.com</div>
                        </div>
                      </div>

                      <div className="min-h-[500px]">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={activeStep}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 0.5 }}
                            className={`p-6 ${processSteps[activeStep].bgColor}`}
                          >
                            <div className="mb-6">
                              <div className="flex items-center space-x-3 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center">
                                  {React.createElement(processSteps[activeStep].icon, { 
                                    className: `w-5 h-5 ${processSteps[activeStep].color}` 
                                  })}
                                </div>
                                <div>
                                  <h4 className="text-zeroeval-h6 text-gray-900">{processSteps[activeStep].title}</h4>
                                  <p className="text-zeroeval-body-sm text-gray-600">{processSteps[activeStep].subtitle}</p>
                                </div>
                              </div>
                            </div>
                            
                            {processSteps[activeStep].content}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}