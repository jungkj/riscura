"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Brain, 
  BarChart3, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Shield,
  Zap,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const WorkflowAnimation = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [animationCycle, setAnimationCycle] = useState(0);

  const steps = [
    {
      id: 'upload',
      title: 'Drag & Drop Documents',
      description: 'Upload RCSA files, policies, or risk documents',
      icon: Upload,
              color: 'from-[#199BEC] to-[#0f7dc7]',
      bgColor: 'bg-[#e6f4fd]',
      borderColor: 'border-[#199BEC]/30'
    },
    {
      id: 'analysis',
      title: 'AI Automatic Analysis',
      description: 'AI extracts risks, controls, and compliance gaps',
      icon: Brain,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 'results',
      title: 'Risk Assessment Results',
      description: 'Get structured risk register and recommendations',
      icon: BarChart3,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        const next = (prev + 1) % steps.length;
        if (next === 0) {
          setAnimationCycle(cycle => cycle + 1);
        }
        return next;
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [steps.length]);

  const DocumentIcon = ({ type, delay = 0 }: { type: string; delay?: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay, duration: 0.5 }}
      className="w-8 h-10 bg-white border border-gray-200 rounded-sm shadow-sm flex items-center justify-center"
    >
      <FileText className="w-4 h-4 text-gray-600" />
    </motion.div>
  );

  const AnalysisParticle = ({ delay = 0 }: { delay?: number }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: [0, 1, 0], 
        scale: [0, 1, 1.2],
        y: [0, -10, -20]
      }}
      transition={{ 
        delay, 
        duration: 2, 
        repeat: Infinity,
        repeatDelay: 1
      }}
      className="absolute w-2 h-2 bg-purple-400 rounded-full"
    />
  );

  const ResultCard = ({ title, risk, delay = 0 }: { title: string; risk: 'high' | 'medium' | 'low'; delay?: number }) => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm min-w-[200px]"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900">{title}</span>
        <Badge 
          variant={risk === 'high' ? 'destructive' : risk === 'medium' ? 'secondary' : 'default'}
          className="text-xs"
        >
          {risk} risk
        </Badge>
      </div>
      <div className="flex items-center text-xs text-gray-600">
        <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
        Analyzed by AI
      </div>
    </motion.div>
  );

  return (
    <div className="relative bg-gradient-to-br from-gray-50 to-white py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            Transform Risk Management in 3 Steps
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            From document upload to comprehensive risk assessment—all automated by AI
          </motion.p>
        </div>

        {/* Workflow Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === index;
            
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative"
              >
                <Card className={`
                  transition-all duration-500 transform
                  ${isActive ? `${step.bgColor} ${step.borderColor} scale-105 shadow-lg` : 'bg-white border-gray-200 hover:shadow-md'}
                `}>
                  <CardContent className="p-6 text-center">
                    <div className={`
                      w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center
                      ${isActive ? `bg-gradient-to-r ${step.color}` : 'bg-gray-100'}
                      transition-all duration-500
                    `}>
                      <Icon className={`w-8 h-8 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                      {isActive && (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 border-2 border-white/30 rounded-full"
                        />
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {step.description}
                    </p>
                    
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-4"
                      >
                        <Sparkles className="w-5 h-5 text-yellow-500 mx-auto animate-pulse" />
                      </motion.div>
                    )}
                  </CardContent>
                </Card>

                {/* Arrow connector */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Interactive Demo Area */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            
            {/* Step 1: Upload Zone */}
            <div className="text-center">
              <h4 className="font-semibold text-gray-900 mb-4">1. Upload Documents</h4>
              <div className={`
                border-2 border-dashed rounded-lg p-6 transition-all duration-500
                ${currentStep === 0 ? 'border-[#199BEC] bg-[#e6f4fd]' : 'border-gray-300 bg-gray-50'}
              `}>
                <AnimatePresence mode="wait">
                  {currentStep === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3"
                    >
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Upload className="w-8 h-8 text-[#199BEC] mx-auto mb-2" />
                      </motion.div>
                      <div className="flex justify-center space-x-2">
                        <DocumentIcon type="rcsa" delay={0.1} />
                        <DocumentIcon type="policy" delay={0.3} />
                        <DocumentIcon type="risk" delay={0.5} />
                      </div>
                      <p className="text-sm text-gray-600">RCSA, Policies, Risk Docs</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Step 2: AI Processing */}
            <div className="text-center">
              <h4 className="font-semibold text-gray-900 mb-4">2. AI Analysis</h4>
              <div className={`
                border-2 rounded-lg p-6 relative overflow-hidden transition-all duration-500
                ${currentStep === 1 ? 'border-purple-400 bg-purple-50' : 'border-gray-300 bg-gray-50'}
              `}>
                <AnimatePresence mode="wait">
                  {currentStep === 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative"
                    >
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      >
                        <Brain className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                      </motion.div>
                      
                      {/* Floating particles */}
                      <AnalysisParticle delay={0} />
                      <AnalysisParticle delay={0.5} />
                      <AnalysisParticle delay={1} />
                      
                      <p className="text-sm text-gray-600 mt-4">
                        Extracting risks & controls...
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Step 3: Results */}
            <div className="text-center">
              <h4 className="font-semibold text-gray-900 mb-4">3. Risk Results</h4>
              <div className={`
                border-2 rounded-lg p-6 transition-all duration-500
                ${currentStep === 2 ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50'}
              `}>
                <AnimatePresence mode="wait">
                  {currentStep === 2 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3"
                    >
                      <BarChart3 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <div className="space-y-2">
                        <ResultCard title="Data Breach Risk" risk="high" delay={0.1} />
                        <ResultCard title="Compliance Gap" risk="medium" delay={0.3} />
                        <ResultCard title="Process Risk" risk="low" delay={0.5} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex justify-center mt-8 space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`
                  w-3 h-3 rounded-full transition-all duration-500
                  ${currentStep === index ? 'bg-[#199BEC] scale-125' : 'bg-gray-300'}
                `}
              />
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to transform your risk management?
            </h3>
            <p className="text-gray-600 mb-8 max-w-xl mx-auto">
              Join 500+ enterprises using AI-powered risk assessment to save time and improve accuracy.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Start Free Trial
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowAnimation; 