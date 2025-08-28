"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { TimeSavingChart } from '@/components/charts/TimeSavingChart';
import { FloatingNav, StaticNav } from '@/components/ui/floating-navbar';
import { IntegrationsCarousel } from '@/components/landing/IntegrationsCarousel';
import { ContainerTextFlip } from '@/components/ui/container-text-flip';
import { ScrollStepProcess } from '@/components/landing/ScrollStepProcess';

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
  AlertTriangle
} from 'lucide-react';

// Hero headline component with text flip animation
function StaticHeadline() {
  const words = [
    "effortless",
    "intelligent", 
    "automated",
    "simple",
    "powerful"
  ];

  return (
    <div className="text-zeroeval-4xl sm:text-zeroeval-5xl lg:text-zeroeval-6xl text-center lg:text-left">
      <span className="text-gray-900">
        Risk management made{' '}
      </span>
      <div className="inline-block">
        <ContainerTextFlip 
          words={words}
          interval={2500}
          className=""
          textClassName="text-zeroeval-4xl sm:text-zeroeval-5xl lg:text-zeroeval-6xl text-[#199BEC]"
          animationDuration={0.5}
        />
      </div>
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

  const navItems = [
    { name: "Platform", link: "#platform" },
    { name: "Enterprise", link: "#enterprise" },
    { name: "Pricing", link: "#pricing" },
    { name: "Demo", link: "#demo" },
  ];

  return (
    <div className="min-h-screen font-inter" style={{ backgroundColor: '#FFFFFF' }}>
      
      {/* Static Navbar */}
      <StaticNav />
      
      {/* Floating Navbar */}
      <FloatingNav navItems={navItems} />

      {/* Palace.so Inspired Hero Section with Moving Sky Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Sky Background */}
        <div className="absolute inset-0">
          {/* Base gradient sky */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-100 via-blue-50 to-white" />
          
          {/* Animated clouds */}
          <div className="absolute inset-0">
            {/* Cloud layer 1 - slow moving */}
            <motion.div
              className="absolute top-1/4 left-0 w-96 h-32 opacity-20"
              animate={{
                x: [-100, typeof window !== 'undefined' ? window.innerWidth + 100 : 1400],
              }}
              transition={{
                duration: 60,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <div className="w-full h-full bg-white/40 rounded-full blur-xl" />
            </motion.div>
            
            {/* Cloud layer 2 - medium speed */}
            <motion.div
              className="absolute top-1/3 right-0 w-64 h-24 opacity-30"
              animate={{
                x: [typeof window !== 'undefined' ? window.innerWidth + 100 : 1400, -200],
              }}
              transition={{
                duration: 45,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <div className="w-full h-full bg-white/50 rounded-full blur-lg" />
            </motion.div>
            
            {/* Cloud layer 3 - fast moving */}
            <motion.div
              className="absolute top-1/5 left-1/3 w-48 h-20 opacity-25"
              animate={{
                x: [-150, typeof window !== 'undefined' ? window.innerWidth + 150 : 1500],
              }}
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <div className="w-full h-full bg-white/60 rounded-full blur-md" />
            </motion.div>
          </div>

          {/* Subtle animated particles */}
          <div className="absolute inset-0">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/30 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${20 + Math.random() * 40}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 pt-32 pb-24">
          <div className="max-w-6xl mx-auto text-center">
            {/* Main Hero Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8 mb-16"
            >
              {/* Enhanced Headline */}
              <div>
                <StaticHeadline />
              </div>

              {/* Strong Value Proposition */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-zeroeval-xl sm:text-zeroeval-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed"
              >
                Identify, assess, and mitigate enterprise risks with AI-powered intelligence. 
                <span className="text-gray-900 font-medium"> Deploy in minutes, not months.</span>
              </motion.p>

              {/* Primary CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <Button 
                  onClick={handleGetStarted}
                  size="lg" 
                  className="px-12 py-6 text-zeroeval-button rounded-xl min-w-[220px] bg-[#199BEC] hover:bg-[#199BEC]/80 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Start free trial
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
                <Button 
                  onClick={handleRequestDemo}
                  variant="outline"
                  size="lg"
                  className="px-12 py-6 text-zeroeval-button rounded-xl min-w-[220px] bg-white/80 backdrop-blur-sm border-gray-300 hover:bg-white/90"
                >
                  Book a demo
                </Button>
              </motion.div>
            </motion.div>

            {/* Dashboard Screenshot with Enhanced Palace.so Style */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="relative max-w-6xl mx-auto"
            >
              {/* Glow effect behind dashboard */}
              <div className="absolute inset-0 bg-[#199BEC]/20 blur-3xl rounded-3xl scale-110" />
              
              <div className="relative bg-white/95 backdrop-blur-xl border border-gray-200/60 shadow-2xl rounded-3xl overflow-hidden">
                {/* Browser chrome */}
                <div className="bg-gray-50/90 px-6 py-4 border-b border-gray-200/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="bg-gray-100 rounded-lg px-4 py-1">
                        <div className="text-sm text-gray-500 font-mono">app.riscura.com</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Dashboard content area */}
                <div className="aspect-video bg-gradient-to-br from-gray-50 to-white flex items-center justify-center relative">
                  {/* Floating dashboard placeholder */}
                  <motion.div
                    animate={{ 
                      y: [0, -10, 0],
                    }}
                    transition={{ 
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="text-center space-y-6"
                  >
                    <div className="w-24 h-24 bg-gradient-to-br from-[#199BEC]/20 to-[#199BEC]/5 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
                      <BarChart3 className="w-12 h-12 text-[#199BEC]" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-zeroeval-h3 text-gray-900 font-semibold">Dashboard Screenshot Placeholder</h3>
                      <p className="text-zeroeval-body-lg text-gray-500 max-w-md">
                        Replace this with your dashboard screenshot to showcase your risk intelligence platform
                      </p>
                    </div>
                  </motion.div>

                  {/* Subtle grid pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="w-full h-full" style={{
                      backgroundImage: 'linear-gradient(#199BEC 1px, transparent 1px), linear-gradient(90deg, #199BEC 1px, transparent 1px)',
                      backgroundSize: '20px 20px'
                    }} />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Scroll-Based Step Process */}
      <ScrollStepProcess />

      {/* Integrations Carousel */}
      <IntegrationsCarousel />

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
              <Badge className="bg-gray-900 text-white px-4 py-2 text-zeroeval-caption">
                Enterprise Platform
              </Badge>
              <h2 className="text-zeroeval-4xl sm:text-zeroeval-5xl lg:text-zeroeval-6xl text-gray-900">
                Built for modern<br />enterprise security
              </h2>
              <p className="text-zeroeval-xl text-gray-600 max-w-3xl mx-auto">
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
                <Card className="bg-white border border-[#D8C3A5]/30 h-full hover:shadow-xl hover:border-[#D8C3A5]/60 transition-all duration-300 group rounded-2xl">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 rounded-2xl bg-[#199BEC]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="h-7 w-7 text-[#199BEC]" />
                    </div>
                    <h3 className="text-zeroeval-h5 text-gray-900 mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-zeroeval-body text-gray-600 mb-6">
                      {feature.description}
                    </p>
                    <ul className="space-y-3">
                      {feature.features.map((item, idx) => (
                        <li key={idx} className="flex items-center text-zeroeval-body-sm">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-3 flex-shrink-0" />
                          <span className="text-gray-900">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
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
            <Badge className="bg-[#199BEC] text-white px-6 py-2 text-zeroeval-caption rounded-full">
              Get Started Today
            </Badge>
            <h2 className="text-zeroeval-4xl sm:text-zeroeval-5xl lg:text-zeroeval-6xl text-gray-900">
              Ready to secure<br />your enterprise?
            </h2>
            <p className="text-zeroeval-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of organizations that trust Riscura to protect their business 
              and ensure compliance in an ever-changing risk landscape.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="px-12 py-4 text-zeroeval-button min-w-[220px] rounded-xl bg-[#199BEC] hover:bg-[#199BEC]/80"
              >
                Start free trial
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                onClick={handleRequestDemo}
                variant="outline"
                size="lg"
                className="px-12 py-4 text-zeroeval-button min-w-[220px] rounded-xl"
              >
                Schedule demo
              </Button>
            </div>

            {/* Trust Elements */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#199BEC]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6 text-[#199BEC]" />
                </div>
                <p className="text-gray-900 text-zeroeval-body-sm font-medium">Enterprise Security</p>
                <p className="text-gray-600 text-zeroeval-caption">SOC 2 & ISO 27001</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#199BEC]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-[#199BEC]" />
                </div>
                <p className="text-gray-900 text-zeroeval-body-sm font-medium">24/7 Support</p>
                <p className="text-gray-600 text-zeroeval-caption">Dedicated success team</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#199BEC]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-[#199BEC]" />
                </div>
                <p className="text-gray-900 text-zeroeval-body-sm font-medium">Proven ROI</p>
                <p className="text-gray-600 text-zeroeval-caption">Significant efficiency gains</p>
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
              <span className="text-zeroeval-h4 text-gray-900">Riscura</span>
            </div>
            <p className="text-zeroeval-body text-gray-600 mb-6 max-w-md mx-auto">
              Enterprise risk management platform powered by AI. Secure your business with intelligent automation.
            </p>
            <div className="flex items-center justify-center space-x-6 mb-8">
              <Badge variant="outline" className="border-gray-300 text-gray-600 bg-gray-50">
                SOC 2 Type II
              </Badge>
              <Badge variant="outline" className="border-gray-300 text-gray-600 bg-gray-50">
                ISO 27001
              </Badge>
              <Badge variant="outline" className="border-gray-300 text-gray-600 bg-gray-50">
                GDPR Ready
              </Badge>
            </div>
            <p className="text-zeroeval-body-sm text-gray-600">
              © 2024 Riscura Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
