'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Brain, 
  Target, 
  Sparkles,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  BarChart3
} from 'lucide-react';

const steps = [
  {
    id: 'analyze',
    icon: Sparkles,
    title: "Analyze with AI",
    subtitle: "Beta",
    description: "Accelerate risk assessment workflows, drill into variance analysis, and deeply understand your security posture with AI-powered insights.",
    features: [
      "Real-time threat detection",
      "Automated vulnerability scoring", 
      "Pattern recognition analysis",
      "Predictive risk modeling"
    ],
    cta: "Get AI insights demo",
    bgColor: "from-blue-50 to-indigo-50",
    iconColor: "text-blue-600",
    accentColor: "bg-blue-100"
  },
  {
    id: 'shape',
    icon: Target,
    title: "Shape data to your business logic",
    subtitle: "",
    description: "Create flexible, structured risk models built to scale. Define custom control frameworks, tie in compliance dimensions, and reuse assessments across departments.",
    features: [
      "Custom control frameworks",
      "Scalable risk taxonomies",
      "Multi-dimensional analysis",
      "Reusable assessment templates"
    ],
    cta: "Explore frameworks",
    bgColor: "from-green-50 to-emerald-50",
    iconColor: "text-green-600",
    accentColor: "bg-green-100"
  },
  {
    id: 'plan',
    icon: TrendingUp,
    title: "Plan scenarios with confidence",
    subtitle: "",
    description: "Build multiple risk scenarios and response strategies. Compare mitigation approaches side-by-side and understand the impact of your security decisions on business operations.",
    features: [
      "Scenario modeling",
      "Impact comparison tools",
      "Risk-based prioritization",
      "ROI-driven decisions"
    ],
    cta: "View scenario builder",
    bgColor: "from-purple-50 to-violet-50",
    iconColor: "text-purple-600", 
    accentColor: "bg-purple-100"
  }
];

export const RunwayScrollAnimation = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isInView, setIsInView] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  // Transform scroll progress to step index
  const stepProgress = useTransform(scrollYProgress, [0, 1], [0, steps.length - 1]);

  useMotionValueEvent(stepProgress, "change", (latest) => {
    const newStep = Math.round(latest);
    if (newStep !== activeStep && newStep >= 0 && newStep < steps.length) {
      setActiveStep(newStep);
    }
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={containerRef} 
      className="relative bg-white py-24 sm:py-32"
      style={{ height: '300vh' }} // Extended height for scroll effect
    >
      <div className="sticky top-0 h-screen flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left side - Sticky headline */}
            <motion.div 
              className="space-y-8"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: isInView ? 1 : 0, x: isInView ? 0 : -50 }}
              transition={{ duration: 0.8 }}
            >
              <div className="space-y-6">
                <Badge className="bg-gray-100 text-gray-700 px-4 py-2 text-sm font-medium rounded-full">
                  AI-Powered Platform
                </Badge>
                
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-hero tracking-hero">
                  Turn complexity into
                  <br />
                  <span className="font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    conviction
                  </span>
                </h2>
                
                <p className="text-xl text-gray-600 leading-subtitle font-light max-w-xl">
                  Comprehensive risk management platform designed for modern enterprises 
                  with AI-powered automation and intelligent insights.
                </p>
              </div>

              {/* Testimonial */}
              <motion.div 
                className="bg-white/80 backdrop-blur border border-gray-200 rounded-2xl p-6 shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <p className="text-lg text-gray-600 italic mb-4">
                  "Incredibly flexible and intelligent risk management copilot"
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <CheckCircle key={i} className="w-4 h-4 text-emerald-500" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">Enterprise Review</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </motion.div>
            </motion.div>

            {/* Right side - Animated cards */}
            <div className="relative h-[600px] flex items-center justify-center">
              {steps.map((step, index) => {
                const isActive = activeStep === index;
                const offset = (index - activeStep) * 20;
                const scale = isActive ? 1 : 0.9;
                const opacity = isActive ? 1 : 0.6;
                
                return (
                  <motion.div
                    key={step.id}
                    className="absolute w-full max-w-lg"
                    animate={{
                      y: offset,
                      scale,
                      opacity,
                      rotateX: isActive ? 0 : 10,
                      rotateY: isActive ? 0 : 5,
                    }}
                    transition={{
                      duration: 0.6,
                      ease: "easeInOut"
                    }}
                    style={{ zIndex: steps.length - Math.abs(index - activeStep) }}
                  >
                    <Card className={`bg-gradient-to-br ${step.bgColor} border border-gray-200/50 shadow-xl overflow-hidden`}>
                      <CardContent className="p-8">
                        {/* Header */}
                        <div className="flex items-start gap-4 mb-6">
                          <div className={`w-12 h-12 rounded-2xl ${step.accentColor} flex items-center justify-center`}>
                            <step.icon className={`w-6 h-6 ${step.iconColor}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {step.title}
                              {step.subtitle && (
                                <span className="ml-2 inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">
                                  {step.subtitle}
                                </span>
                              )}
                            </h3>
                            <p className="text-gray-600 leading-relaxed">{step.description}</p>
                          </div>
                        </div>

                        {/* Features */}
                        <ul className="space-y-3 mb-6">
                          {step.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center text-sm">
                              <CheckCircle className="w-4 h-4 text-emerald-500 mr-3 flex-shrink-0" />
                              <span className="text-gray-700">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Screenshot placeholder */}
                        <div className={`bg-gradient-to-br ${step.bgColor} rounded-xl h-48 flex items-center justify-center border border-gray-200/30`}>
                          <div className="text-center space-y-3">
                            <div className={`w-12 h-12 ${step.accentColor} rounded-xl flex items-center justify-center mx-auto`}>
                              <BarChart3 className={`w-6 h-6 ${step.iconColor}`} />
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-medium text-gray-900">Dashboard Preview</h4>
                              <p className="text-sm text-gray-600">
                                {step.title} interface mockup
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* CTA */}
                        {step.cta && (
                          <div className="mt-6">
                            <button className={`text-sm font-medium ${step.iconColor} hover:underline`}>
                              {step.cta}
                            </button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};