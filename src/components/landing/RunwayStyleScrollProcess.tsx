"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
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
                <div className="text-sm text-gray-900 font-medium">RCSA_Q3_2024.xlsx</div>
                <div className="text-xs text-gray-500">2.4 MB • Uploaded</div>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <FileText className="w-8 h-8 text-[#199BEC]" />
              <div>
                <div className="text-sm text-gray-900 font-medium">Policy_Framework.pdf</div>
                <div className="text-xs text-gray-500">1.8 MB • Uploaded</div>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
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
              <h4 className="text-lg text-gray-900">Risk Extraction</h4>
              <div className="space-y-2">
                {[
                  { name: 'Cyber Security Threats', progress: 100, status: 'complete' },
                  { name: 'Operational Risks', progress: 85, status: 'processing' },
                  { name: 'Compliance Gaps', progress: 60, status: 'processing' },
                ].map((item) => (
                  <div key={item.name} className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-[#199BEC]" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{item.name}</span>
                        <span className="text-xs text-gray-500">{item.progress}%</span>
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
              <div className="text-2xl font-bold text-red-600">23</div>
              <div className="text-sm text-gray-600">Critical Risks</div>
              <Badge variant="destructive" className="mt-2 text-xs">Immediate Action</Badge>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#199BEC]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-8 h-8 text-[#199BEC]" />
              </div>
              <div className="text-2xl font-bold text-[#199BEC]">87%</div>
              <div className="text-sm text-gray-600">Risk Coverage</div>
              <Badge className="mt-2 text-xs bg-[#199BEC] text-white">Improving</Badge>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">95%</div>
              <div className="text-sm text-gray-600">Compliance</div>
              <Badge className="mt-2 text-xs bg-green-100 text-green-800">On Track</Badge>
            </div>
          </div>
        </div>
      </div>
    )
  }
];

export function RunwayStyleScrollProcess() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isScrollHijacked, setIsScrollHijacked] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  const nextStep = useCallback(() => {
    if (activeStep < processSteps.length - 1) {
      setActiveStep(activeStep + 1);
      return true;
    }
    return false;
  }, [activeStep]);

  const prevStep = useCallback(() => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
      return true;
    }
    return false;
  }, [activeStep]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Disable scroll hijacking on mobile for better UX
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setIsScrollHijacked(false);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsScrollHijacked(true);
            document.body.style.overflow = 'hidden';
          } else if (!entry.isIntersecting && isScrollHijacked) {
            // Only re-enable scrolling if we've completed all steps or scrolling away
            if (activeStep >= processSteps.length - 1) {
              setIsScrollHijacked(false);
              document.body.style.overflow = 'auto';
            }
          }
        });
      },
      { 
        threshold: 0.7, // Lower threshold for better mobile compatibility
        rootMargin: '-15% 0px -15% 0px'
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      document.body.style.overflow = 'auto';
    };
  }, [isScrollHijacked, activeStep]);

  useEffect(() => {
    if (!isScrollHijacked) return;

    let wheelTimeout: NodeJS.Timeout;
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      clearTimeout(wheelTimeout);
      wheelTimeout = setTimeout(() => {
        if (e.deltaY > 0) {
          // Scrolling down
          const advanced = nextStep();
          if (!advanced && activeStep >= processSteps.length - 1) {
            // Reached the end, allow normal scrolling
            setIsScrollHijacked(false);
            document.body.style.overflow = 'auto';
            // Manually scroll to continue
            window.scrollBy({ top: 100, behavior: 'smooth' });
          }
        } else {
          // Scrolling up
          const moved = prevStep();
          if (!moved && activeStep === 0) {
            // At the beginning, allow scrolling up to leave
            setIsScrollHijacked(false);
            document.body.style.overflow = 'auto';
            window.scrollBy({ top: -100, behavior: 'smooth' });
          }
        }
      }, 50);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        nextStep();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        prevStep();
      } else if (e.key === 'Escape') {
        setIsScrollHijacked(false);
        document.body.style.overflow = 'auto';
      }
    };

    if (isScrollHijacked) {
      window.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      clearTimeout(wheelTimeout);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isScrollHijacked, nextStep, prevStep, activeStep]);

  return (
    <div className="relative">
      {/* Header section */}
      <div className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="bg-[#199BEC] text-white px-4 py-2 text-sm mb-4">
            How It Works
          </Badge>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl text-gray-900 mb-6">
            From data to insights<br />in minutes
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our AI-powered platform transforms your existing risk documents into 
            comprehensive, actionable risk intelligence.
          </p>
        </div>
      </div>

      {/* Scroll-hijacked section */}
      <div 
        ref={containerRef} 
        className="relative min-h-screen bg-gray-50"
        style={{ scrollSnapAlign: 'start' }}
      >
        <div className="sticky top-0 h-screen flex items-center">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                
                {/* Left side - Step content with card flip animation */}
                <div className="space-y-8">
                  <div className="perspective-1000">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeStep}
                        initial={{ 
                          opacity: 0,
                          rotateY: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : -90,
                          z: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : -100
                        }}
                        animate={{ 
                          opacity: 1,
                          rotateY: 0,
                          z: 0
                        }}
                        exit={{ 
                          opacity: 0,
                          rotateY: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 90,
                          z: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : -100
                        }}
                        transition={{ 
                          duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.3 : 0.8,
                          ease: "easeInOut",
                          type: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? "tween" : "spring",
                          stiffness: 100,
                          damping: 15
                        }}
                        className="space-y-6 transform-gpu"
                      >
                        <div className="flex items-center space-x-4">
                          <motion.div 
                            className="w-16 h-16 rounded-2xl bg-[#199BEC] flex items-center justify-center"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                          >
                            {React.createElement(processSteps[activeStep].icon, { 
                              className: "w-8 h-8 text-white" 
                            })}
                          </motion.div>
                          <div>
                            <Badge className="bg-[#199BEC]/10 text-[#199BEC] mb-2">
                              Step {activeStep + 1} • {processSteps[activeStep].duration}
                            </Badge>
                            <h3 className="text-4xl font-bold text-gray-900">
                              {processSteps[activeStep].title}
                            </h3>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h4 className="text-2xl text-gray-900 font-semibold">
                            {processSteps[activeStep].subtitle}
                          </h4>
                          <p className="text-xl text-gray-600 leading-relaxed">
                            {processSteps[activeStep].description}
                          </p>
                        </div>

                        {/* Enhanced step indicator */}
                        <div className="flex space-x-3 items-center">
                          {processSteps.map((_, index) => (
                            <motion.div
                              key={index}
                              className={`h-2 rounded-full transition-all duration-500 ${
                                index === activeStep 
                                  ? 'bg-[#199BEC] w-16' 
                                  : index < activeStep
                                  ? 'bg-[#199BEC]/60 w-8'
                                  : 'bg-gray-300 w-8'
                              }`}
                              initial={{ scale: 0.8, opacity: 0.5 }}
                              animate={{ 
                                scale: index === activeStep ? 1.2 : 1, 
                                opacity: 1 
                              }}
                              transition={{ duration: 0.3 }}
                            />
                          ))}
                          <span className="text-sm text-gray-500 ml-4">
                            {activeStep + 1} of {processSteps.length}
                          </span>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                {/* Right side - Visual content with 3D flip */}
                <div className="relative">
                  <div className="perspective-1000">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeStep}
                        initial={{ 
                          opacity: 0, 
                          rotateY: 90,
                          z: -50
                        }}
                        animate={{ 
                          opacity: 1, 
                          rotateY: 0,
                          z: 0
                        }}
                        exit={{ 
                          opacity: 0, 
                          rotateY: -90,
                          z: -50
                        }}
                        transition={{ 
                          duration: 0.8,
                          ease: "easeInOut",
                          type: "spring",
                          stiffness: 100,
                          damping: 15
                        }}
                        className="transform-gpu"
                      >
                        <Card className="bg-white border border-gray-200 shadow-2xl overflow-hidden">
                          <CardContent className="p-0">
                            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                </div>
                                <div className="text-xs text-gray-500 font-mono">app.riscura.com</div>
                              </div>
                            </div>

                            <div className="min-h-[500px]">
                              <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4, duration: 0.6 }}
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
                                      <h4 className="text-lg text-gray-900">{processSteps[activeStep].title}</h4>
                                      <p className="text-sm text-gray-600">{processSteps[activeStep].subtitle}</p>
                                    </div>
                                  </div>
                                </div>
                                
                                {processSteps[activeStep].content}
                              </motion.div>
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

        {/* Scroll hint indicator */}
        {isScrollHijacked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-200">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Scroll to navigate</span>
                <div className="w-1 h-4 bg-[#199BEC] rounded-full animate-pulse"></div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Exit indicator */}
      <div className="h-32 bg-white flex items-center justify-center">
        <p className="text-gray-500 text-sm">Continue scrolling to explore more</p>
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-gpu {
          transform-style: preserve-3d;
        }
      `}</style>
    </div>
  );
}