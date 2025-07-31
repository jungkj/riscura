"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyCard, DaisyCardBody } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import Image from 'next/image';
import { TimeSavingChart } from '@/components/charts/TimeSavingChart';
import { IntegrationPartners } from '@/components/landing/IntegrationPartners';
import { TextFlipContainer } from '@/components/ui/TextFlipContainer';
import { FloatingNav } from '@/components/ui/FloatingNav';

// Icons
import {
  Shield,
  Brain,
  Target,
  Zap,
  ChevronRight,
  CheckCircle,
  Users,
  TrendingUp,
  Lock,
  Globe,
  ArrowRight,
  Upload,
  FileText,
  BarChart3,
  Sparkles,
  AlertTriangle,
  Home,
  Briefcase,
  DollarSign,
  PlayCircle
} from 'lucide-react';

// New single-word typewriter effect
const cyclingWords = ["effortless", "intelligent", "automated", "proactive", "streamlined"];

// Single Word Typewriter Component
function SingleWordTypewriter() {

  return (
    <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-center lg:text-left font-inter">
      <span className="text-gray-900">
        Risk management made{' '}
      </span>
      <TextFlipContainer 
        words={cyclingWords}
        className="text-[#191919] font-bold min-w-[280px] sm:min-w-[320px] lg:min-w-[400px]"
        cursorClassName="bg-[#199BEC]"
      />
    </div>
  );
}

// HeroProcessCard Component
function HeroProcessCard() {
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
      <DaisyCard className="bg-white/80 backdrop-blur-xl border border-gray-200/60 shadow-2xl overflow-hidden w-full">
        <DaisyCardBody className="p-0">
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
        </DaisyCardBody>
      </DaisyCard>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/auth/register');
  };

  const handleRequestDemo = () => {
    router.push('/auth/register');
  };

  // Navigation items for FloatingNav
  const navItems = [
    {
      name: "Platform",
      link: "#platform",
      icon: <Shield className="h-4 w-4" />,
    },
    {
      name: "Enterprise",
      link: "#enterprise",
      icon: <Briefcase className="h-4 w-4" />,
    },
    {
      name: "Pricing",
      link: "#pricing",
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      name: "Demo",
      link: "#demo",
      icon: <PlayCircle className="h-4 w-4" />,
    },
  ];

  return (
    <div className="min-h-screen font-inter" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Floating Navigation */}
      <FloatingNav 
        navItems={navItems} 
        onLogin={() => router.push('/auth/login')}
        onGetStarted={handleGetStarted}
      />
      

      {/* Enhanced Hero Section */}
      <section className="pt-20 pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background via-card to-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Content */}
            <div className="text-center lg:text-left space-y-6 md:space-y-8">
              {/* Enhanced Headline with Single Word Typewriter */}
              <div>
                <SingleWordTypewriter />
              </div>

              {/* Strong Value Proposition */}
              <p className="text-xl sm:text-2xl text-[#A8A8A8] max-w-2xl mx-auto lg:mx-0 leading-relaxed font-inter">
                Identify, assess, and mitigate enterprise risks with AI-powered intelligence. 
                <span className="text-[#191919] font-semibold"> Deploy in minutes, not months.</span>
              </p>

              {/* Primary CTA */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                <DaisyButton 
                  onClick={handleGetStarted}
                  size="lg" 
                  className="px-10 py-5 text-xl rounded-xl font-semibold font-inter min-w-[200px] bg-[#199BEC] hover:bg-[#199BEC]/80" >
  Start free trial
</DaisyButton>
                  <ArrowRight className="ml-3 h-6 w-6" />
                </DaisyButton>
                <DaisyButton 
                  onClick={handleRequestDemo}
                  variant="outline"
                  size="lg"
                  className="px-10 py-5 text-xl rounded-xl font-semibold font-inter min-w-[200px]" >
  Book a demo
</DaisyButton>
                </div>

              {/* Social Proof Stats */}
              <div className="grid grid-cols-3 gap-6 md:gap-8 max-w-md mx-auto lg:mx-0">
                <div className="text-center lg:text-left">
                  <p className="text-3xl font-bold text-[#191919] font-inter">Enterprise</p>
                  <p className="text-sm text-[#A8A8A8] font-inter">Grade Security</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-3xl font-bold text-[#191919] font-inter">Quick</p>
                  <p className="text-sm text-[#A8A8A8] font-inter">Setup</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-3xl font-bold text-[#191919] font-inter">Expert</p>
                  <p className="text-sm text-[#A8A8A8] font-inter">Support</p>
                </div>
              </div>
            </div>

            {/* Right Column - Advanced Process Showcase */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              <HeroProcessCard />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Integration Partners Section */}
      <IntegrationPartners />

      {/* Time Savings Chart Section */}
      <TimeSavingChart />

      {/* Enhanced Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#FAFAFA]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 md:mb-20">
              <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-6 md:space-y-8"
            >
              <DaisyBadge className="bg-[#191919] text-[#FAFAFA] px-4 py-2 text-sm font-inter" >
  Enterprise Platform
</DaisyBadge>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#191919] font-inter leading-tight">
                Built for modern<br />enterprise security
              </h2>
              <p className="text-xl text-[#A8A8A8] max-w-3xl mx-auto font-inter leading-relaxed">
                Comprehensive risk management platform designed for Fortune 500 companies 
                with enterprise-grade security, compliance, and AI-powered automation.
              </p>
            </motion.div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: Shield,
                title: "Advanced Risk Assessment",
                description: "AI-powered threat detection with real-time monitoring and automated compliance tracking across all enterprise systems.",
                features: ["Real-time monitoring", "Automated compliance", "Threat intelligence", "Risk scoring"],
              },
              {
                icon: Brain,
                title: "AI-Driven Intelligence",
                description: "Machine learning algorithms analyze patterns, predict risks, and provide actionable insights for proactive security management.",
                features: ["Predictive analytics", "Pattern recognition", "Smart recommendations", "Behavioral analysis"],
              },
              {
                icon: Target,
                title: "Control Management",
                description: "Design, implement, and monitor security controls with precision tracking of effectiveness and automated testing.",
                features: ["Control design", "Effectiveness tracking", "Automated testing", "Compliance mapping"],
              },
              {
                icon: Zap,
                title: "Rapid Deployment",
                description: "Enterprise-ready platform that deploys in minutes with seamless integrations and zero-downtime migrations.",
                features: ["5-minute setup", "API integrations", "SSO support", "Enterprise security"],
              },
              {
                icon: Users,
                title: "Team Collaboration",
                description: "Built-in workflows for security teams with role-based access, audit trails, and real-time collaboration tools.",
                features: ["Role-based access", "Audit trails", "Team workflows", "Real-time updates"],
              },
              {
                icon: Globe,
                title: "Global Compliance",
                description: "Support for international standards including SOC 2, ISO 27001, GDPR, and custom regulatory frameworks.",
                features: ["Multi-framework", "Global standards", "Custom policies", "Audit readiness"],
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <DaisyCard className="bg-white border border-[#D8C3A5]/30 h-full hover:shadow-xl hover:border-[#D8C3A5]/60 transition-all duration-300 group rounded-2xl" >
  <DaisyCardBody className="p-8" >
  </DaisyCard>
                    <div className="w-14 h-14 rounded-2xl bg-[#199BEC]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="h-7 w-7 text-[#199BEC]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#191919] mb-4 font-inter">
                      {feature.title}
                    </h3>
                    <p className="text-[#A8A8A8] leading-relaxed mb-6 font-inter">
                      {feature.description}
                    </p>
                    <ul className="space-y-3">
                      {feature.features.map((item, idx) => (
                        <li key={idx} className="flex items-center text-sm font-inter">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-3 flex-shrink-0" />
                          <span className="text-[#191919] font-medium">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </DaisyCardBody>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#F5F1E9] via-[#FAFAFA] to-[#F5F1E9] relative overflow-hidden">
          <div className="max-w-5xl mx-auto text-center relative">
            <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-6 md:space-y-8"
          >
            <DaisyBadge className="bg-[#199BEC] text-white px-6 py-2 text-sm font-inter rounded-full" >
  Get Started Today
</DaisyBadge>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#191919] font-inter leading-tight">
              Ready to secure<br />your enterprise?
            </h2>
            <p className="text-xl text-[#A8A8A8] max-w-3xl mx-auto font-inter leading-relaxed">
              Join thousands of organizations that trust Riscura to protect their business 
              and ensure compliance in an ever-changing risk landscape.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <DaisyButton 
                onClick={handleGetStarted}
                size="lg" 
                className="px-12 py-4 text-lg font-semibold font-inter min-w-[220px] rounded-xl bg-[#199BEC] hover:bg-[#199BEC]/80" >
  Start free trial
</DaisyButton>
                <ChevronRight className="ml-2 h-5 w-5" />
              </DaisyButton>
              <DaisyButton 
                onClick={handleRequestDemo}
                variant="outline"
                size="lg"
                className="px-12 py-4 text-lg font-semibold font-inter min-w-[220px] rounded-xl" >
  Schedule demo
</DaisyButton>
            </div>

            {/* Trust Elements */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#199BEC]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6 text-[#199BEC]" />
                </div>
                <p className="text-[#191919] font-semibold font-inter">Enterprise Security</p>
                <p className="text-[#A8A8A8] text-sm font-inter">SOC 2 & ISO 27001</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#199BEC]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-[#199BEC]" />
                </div>
                <p className="text-[#191919] font-semibold font-inter">24/7 Support</p>
                <p className="text-[#A8A8A8] text-sm font-inter">Dedicated success team</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#199BEC]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-[#199BEC]" />
                </div>
                <p className="text-[#191919] font-semibold font-inter">Proven ROI</p>
                <p className="text-[#A8A8A8] text-sm font-inter">Significant efficiency gains</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-[#FAFAFA] border-t border-[#D8C3A5]/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Image
                src="/images/logo/riscura.png"
                alt="Riscura Logo"
                width={40}
                height={40}
                className="object-contain"
              />
              <span className="text-2xl font-bold text-[#191919] font-inter">Riscura</span>
            </div>
            <p className="text-[#A8A8A8] text-lg font-inter mb-6 max-w-md mx-auto">
              Enterprise risk management platform powered by AI. Secure your business with intelligent automation.
            </p>
            <div className="flex items-center justify-center space-x-6 mb-8">
              <DaisyBadge variant="outline" className="border-[#D8C3A5]/60 text-[#A8A8A8] bg-[#F5F1E9]" >
  SOC 2 Type II
</DaisyBadge>
              <DaisyBadge variant="outline" className="border-[#D8C3A5]/60 text-[#A8A8A8] bg-[#F5F1E9]" >
  ISO 27001
</DaisyBadge>
              <DaisyBadge variant="outline" className="border-[#D8C3A5]/60 text-[#A8A8A8] bg-[#F5F1E9]" >
  GDPR Ready
</DaisyBadge>
            </div>
            <p className="text-[#A8A8A8] font-inter">
              © 2024 Riscura Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
