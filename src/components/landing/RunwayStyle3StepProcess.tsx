"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  Brain, 
  BarChart3, 
  ArrowRight,
  CheckCircle,
  Sparkles,
  FileText,
  Shield,
  Target
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const RunwayStyle3StepProcess = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const steps = [
    {
      id: 'upload',
      number: '01',
      title: 'Upload & Connect',
      subtitle: 'Seamless data integration',
      description: 'Connect your existing systems or upload documents. Our platform integrates with your current workflow in minutes.',
      icon: Upload,
      color: 'from-[#199BEC] to-[#0f7dc7]',
      bgColor: 'bg-[#199BEC]/5',
      features: ['Drag & drop interface', 'API integrations', 'Bulk document processing']
    },
    {
      id: 'analyze',
      number: '02', 
      title: 'AI Analysis',
      subtitle: 'Intelligent risk detection',
      description: 'Advanced AI algorithms analyze your data to identify risks, compliance gaps, and control effectiveness automatically.',
      icon: Brain,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/5',
      features: ['Pattern recognition', 'Compliance mapping', 'Risk scoring']
    },
    {
      id: 'insights',
      number: '03',
      title: 'Actionable Insights',
      subtitle: 'Strategic recommendations',
      description: 'Receive comprehensive reports with prioritized recommendations and automated workflows for risk mitigation.',
      icon: BarChart3,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-500/5',
      features: ['Executive dashboards', 'Automated reports', 'Risk prioritization']
    }
  ];

  useEffect(() => {
    setIsVisible(true);
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [steps.length]);

  const handleGetStarted = () => {
    router.push('/auth/register');
  };

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-gray-50/30 to-white overflow-hidden">
      {/* Subtle background decoration - Runway style */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-40 h-40 bg-[#199BEC]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-60 h-60 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header - Runway minimalist style */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.2 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <Badge className="bg-gray-900 text-white px-6 py-2 text-sm mb-8 rounded-full">
              How it works
            </Badge>
          </motion.div>
          
          <motion.h2 
            className="text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true, amount: 0.2 }}
          >
            Risk management
            <br />
            <span className="font-normal">made simple</span>
          </motion.h2>
          
          <motion.p 
            className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true, amount: 0.2 }}
          >
            Transform your organization's approach to risk with our streamlined, 
            AI-powered platform that delivers results in three simple steps.
          </motion.p>
        </motion.div>

        {/* Steps Grid - Runway clean layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 mb-20">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === index;
            
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.7, 
                  delay: index * 0.2,
                  type: "spring",
                  stiffness: 100,
                  damping: 15
                }}
                viewport={{ once: true, amount: 0.2 }}
                className="relative group"
              >
                <Card className={`
                  h-full transition-all duration-700 border-0 shadow-sm hover:shadow-xl
                  ${isActive ? `${step.bgColor} shadow-lg scale-105` : 'bg-white hover:bg-gray-50/50'}
                `}>
                  <CardContent className="p-8 text-left">
                    {/* Step number - Runway style */}
                    <div className="flex items-start justify-between mb-6">
                      <span className="text-3xl font-light text-gray-300 group-hover:text-gray-400 transition-colors">
                        {step.number}
                      </span>
                      <div className={`
                        w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500
                        ${isActive ? `bg-gradient-to-r ${step.color}` : 'bg-gray-100 group-hover:bg-gray-200'}
                      `}>
                        <Icon className={`w-7 h-7 transition-colors ${isActive ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xl font-normal text-gray-900 mb-2">
                          {step.title}
                        </h3>
                        <p className="text-sm text-gray-500 uppercase tracking-wide mb-4">
                          {step.subtitle}
                        </p>
                      </div>
                      
                      <p className="text-gray-600 leading-relaxed mb-6">
                        {step.description}
                      </p>
                      
                      {/* Features list */}
                      <ul className="space-y-2">
                        {step.features.map((feature, idx) => (
                          <motion.li 
                            key={idx} 
                            className="flex items-center text-sm text-gray-600"
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.2 + idx * 0.1 }}
                            viewport={{ once: true }}
                          >
                            <CheckCircle className="w-4 h-4 text-emerald-500 mr-3 flex-shrink-0" />
                            {feature}
                          </motion.li>
                        ))}
                      </ul>
                    </div>

                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute top-6 right-6"
                      >
                        <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
                      </motion.div>
                    )}
                  </CardContent>
                </Card>

                {/* Connection line - only show on larger screens */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-6 h-6 text-gray-300" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Progress indicators */}
        <div className="flex justify-center mb-12 space-x-3">
          {steps.map((_, index) => (
            <motion.div
              key={index}
              className={`
                w-2 h-2 rounded-full transition-all duration-500
                ${currentStep === index ? 'bg-[#199BEC] scale-150' : 'bg-gray-300'}
              `}
              whileHover={{ scale: 1.2 }}
            />
          ))}
        </div>

        {/* CTA Section - Runway minimalist style */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center"
        >
          <motion.h3 
            className="text-3xl font-light text-gray-900 mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Ready to get started?
          </motion.h3>
          
          <motion.p 
            className="text-gray-600 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            Join hundreds of organizations that trust Riscura to streamline 
            their risk management and ensure compliance.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              onClick={handleGetStarted}
              size="lg" 
              className="px-12 py-4 text-base bg-gray-900 hover:bg-gray-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Start your free trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export { RunwayStyle3StepProcess };
