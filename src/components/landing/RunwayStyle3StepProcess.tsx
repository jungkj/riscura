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
  Shield,
  Zap,
  Target,
  Users
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
  features: string[];
  stats: { label: string; value: string; }[];
}

const processSteps: ProcessStep[] = [
  {
    id: 'analyze',
    title: 'Analyze with AI',
    subtitle: 'Accelerate workflows, drill into variance, and deeply understand your business.',
    description: 'Our AI instantly processes your risk documents, extracting key insights and identifying potential vulnerabilities across your entire organization.',
    duration: 'Instant',
    icon: Brain,
    color: 'text-[#199BEC]',
    bgColor: 'bg-[#199BEC]/5',
    features: [
      'Automated risk extraction from documents',
      'Intelligent severity scoring',
      'Cross-reference compliance frameworks',
      'Real-time threat intelligence integration'
    ],
    stats: [
      { label: 'Processing Speed', value: '10x faster' },
      { label: 'Accuracy Rate', value: '99.7%' },
      { label: 'Documents Analyzed', value: '50K+' }
    ]
  },
  {
    id: 'pressure-test',
    title: 'Pressure test every plan',
    subtitle: 'Create dimension-rich plans, drag and drop to explore outcomes, and make instant decisions.',
    description: 'Test your risk mitigation strategies against various scenarios and see the impact in real-time without duplicating models.',
    duration: 'Real-time',
    icon: Target,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    features: [
      'Scenario modeling and simulation',
      'Impact analysis across departments',
      'Risk appetite optimization',
      'Stress testing capabilities'
    ],
    stats: [
      { label: 'Scenarios Tested', value: '1000+' },
      { label: 'Success Rate', value: '94%' },
      { label: 'Time Saved', value: '80%' }
    ]
  },
  {
    id: 'shared-intuition',
    title: 'Act on shared intuition',
    subtitle: 'Drive aligned, data-informed decisions with unified inputs from other teams.',
    description: 'Collaborate seamlessly across departments with integrated workflows that ensure everyone is working from the same risk intelligence.',
    duration: 'Ongoing',
    icon: Users,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    features: [
      'Cross-functional collaboration tools',
      'Unified risk dashboard',
      'Automated reporting and alerts',
      'Integration with existing systems'
    ],
    stats: [
      { label: 'Team Alignment', value: '95%' },
      { label: 'Response Time', value: '3x faster' },
      { label: 'Decision Quality', value: '87% improved' }
    ]
  }
];

export function RunwayStyle3StepProcess() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Calculate step transitions based on scroll progress
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
    <div className="relative bg-white">
      {/* Header section */}
      <div className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-[#199BEC]/10 text-[#199BEC] px-4 py-2 text-sm mb-6">
              Turn complexity into conviction
            </Badge>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Incredibly flexible and fun<br />
              <span className="text-[#199BEC]">risk management copilot</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Shape data to your business logic, pressure test every plan, and answer every "what-if?" 
              with our AI-powered risk intelligence platform.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Runway-style fixed scroll section */}
      <div ref={containerRef} className="relative" style={{ height: `${processSteps.length * 100}vh` }}>
        <div className="sticky top-0 h-screen flex items-center bg-white">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                
                {/* Left side - Content that flips */}
                <div className="space-y-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeStep}
                      initial={{ opacity: 0, x: -50, rotateY: -15 }}
                      animate={{ opacity: 1, x: 0, rotateY: 0 }}
                      exit={{ opacity: 0, x: 50, rotateY: 15 }}
                      transition={{ 
                        duration: 0.8,
                        type: "spring",
                        stiffness: 100,
                        damping: 20
                      }}
                      className="space-y-6"
                    >
                      <div className="flex items-start space-x-4">
                        <motion.div 
                          className={`w-16 h-16 rounded-2xl ${processSteps[activeStep].bgColor} flex items-center justify-center`}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          {React.createElement(processSteps[activeStep].icon, { 
                            className: `w-8 h-8 ${processSteps[activeStep].color}` 
                          })}
                        </motion.div>
                        <div className="flex-1">
                          <Badge className={`${processSteps[activeStep].bgColor} ${processSteps[activeStep].color} border-0 mb-3`}>
                            {processSteps[activeStep].duration}
                          </Badge>
                          <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                            {processSteps[activeStep].title}
                          </h3>
                          <p className="text-lg text-gray-600 leading-relaxed">
                            {processSteps[activeStep].subtitle}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 text-lg leading-relaxed">
                        {processSteps[activeStep].description}
                      </p>

                      {/* Features List */}
                      <div className="space-y-3">
                        {processSteps[activeStep].features.map((feature, index) => (
                          <motion.div
                            key={feature}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                            className="flex items-center space-x-3"
                          >
                            <CheckCircle className={`w-5 h-5 ${processSteps[activeStep].color}`} />
                            <span className="text-gray-700">{feature}</span>
                          </motion.div>
                        ))}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 pt-6">
                        {processSteps[activeStep].stats.map((stat, index) => (
                          <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                            className="text-center"
                          >
                            <div className={`text-2xl font-bold ${processSteps[activeStep].color}`}>
                              {stat.value}
                            </div>
                            <div className="text-sm text-gray-600">{stat.label}</div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Step indicator */}
                      <div className="flex space-x-2 pt-4">
                        {processSteps.map((_, index) => (
                          <motion.div
                            key={index}
                            className={`h-1 rounded-full transition-all duration-500 ${
                              index === activeStep 
                                ? `${processSteps[activeStep].bgColor.replace('/5', '')} w-12` 
                                : 'bg-gray-300 w-4'
                            }`}
                            layoutId={`indicator-${index}`}
                          />
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Right side - Visual content that flips */}
                <div className="relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeStep}
                      initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
                      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                      exit={{ opacity: 0, scale: 1.1, rotateY: -15 }}
                      transition={{ 
                        duration: 0.8,
                        type: "spring",
                        stiffness: 100,
                        damping: 20
                      }}
                    >
                      <Card className="bg-white border border-gray-200 shadow-2xl overflow-hidden transform perspective-1000">
                        <CardContent className="p-0">
                          {/* Browser chrome */}
                          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              </div>
                              <div className="text-sm text-gray-500 font-mono">app.riscura.com</div>
                            </div>
                          </div>

                          <div className={`min-h-[500px] p-6 ${processSteps[activeStep].bgColor}`}>
                            <div className="mb-6">
                              <div className="flex items-center space-x-3 mb-4">
                                <div className={`w-10 h-10 rounded-lg ${processSteps[activeStep].bgColor.replace('/5', '/20')} border flex items-center justify-center`}>
                                  {React.createElement(processSteps[activeStep].icon, { 
                                    className: `w-6 h-6 ${processSteps[activeStep].color}` 
                                  })}
                                </div>
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900">{processSteps[activeStep].title}</h4>
                                  <p className="text-sm text-gray-600">Interactive Demo</p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Dynamic content based on step */}
                            {activeStep === 0 && (
                              <div className="space-y-4">
                                <div className="bg-white/80 rounded-lg p-4">
                                  <h5 className="font-semibold text-gray-900 mb-3">AI Analysis Results</h5>
                                  <div className="space-y-2">
                                    {[
                                      { name: 'Critical Vulnerabilities', count: 23, color: 'bg-red-500' },
                                      { name: 'High Priority Items', count: 45, color: 'bg-orange-500' },
                                      { name: 'Medium Risks', count: 78, color: 'bg-yellow-500' },
                                      { name: 'Low Impact', count: 124, color: 'bg-green-500' }
                                    ].map((item, index) => (
                                      <motion.div
                                        key={item.name}
                                        initial={{ width: 0 }}
                                        animate={{ width: '100%' }}
                                        transition={{ delay: index * 0.1, duration: 0.8 }}
                                        className="flex items-center justify-between p-2 bg-white rounded border"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <div className={`w-3 h-3 rounded-full ${item.color}`} />
                                          <span className="text-sm font-medium">{item.name}</span>
                                        </div>
                                        <span className="text-sm font-bold">{item.count}</span>
                                      </motion.div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {activeStep === 1 && (
                              <div className="space-y-4">
                                <div className="bg-white/80 rounded-lg p-4">
                                  <h5 className="font-semibold text-gray-900 mb-3">Scenario Testing</h5>
                                  <div className="grid grid-cols-2 gap-4">
                                    {[
                                      { scenario: 'Cyber Attack', impact: 'High', probability: '23%' },
                                      { scenario: 'Supply Chain', impact: 'Medium', probability: '45%' },
                                      { scenario: 'Regulatory Change', impact: 'Low', probability: '67%' },
                                      { scenario: 'Market Volatility', impact: 'High', probability: '12%' }
                                    ].map((scenario, index) => (
                                      <motion.div
                                        key={scenario.scenario}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="p-3 bg-white rounded border text-center"
                                      >
                                        <div className="text-sm font-medium">{scenario.scenario}</div>
                                        <div className="text-xs text-gray-600 mt-1">
                                          {scenario.impact} Impact • {scenario.probability}
                                        </div>
                                      </motion.div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {activeStep === 2 && (
                              <div className="space-y-4">
                                <div className="bg-white/80 rounded-lg p-4">
                                  <h5 className="font-semibold text-gray-900 mb-3">Team Collaboration</h5>
                                  <div className="space-y-3">
                                    {[
                                      { team: 'Security Team', status: 'Active', members: 8 },
                                      { team: 'Compliance', status: 'Review', members: 5 },
                                      { team: 'Operations', status: 'Planning', members: 12 },
                                      { team: 'Executive', status: 'Approved', members: 4 }
                                    ].map((team, index) => (
                                      <motion.div
                                        key={team.team}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center justify-between p-2 bg-white rounded border"
                                      >
                                        <div>
                                          <div className="text-sm font-medium">{team.team}</div>
                                          <div className="text-xs text-gray-600">{team.members} members</div>
                                        </div>
                                        <Badge className="text-xs">{team.status}</Badge>
                                      </motion.div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}