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
      {/* Unicorn Studio Script */}
      <Script 
        src="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (window.UnicornStudio && !window.UnicornStudio.isInitialized) {
            window.UnicornStudio.init();
            window.UnicornStudio.isInitialized = true;
          }
        }}
      />
      
      {/* Static Navbar */}
      <StaticNav />
      
      {/* Floating Navbar */}
      <FloatingNav navItems={navItems} />

      {/* Enhanced Hero Section */}
      <section className="pt-36 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Unicorn Studio Interactive Background */}
        <div 
          data-us-project="IRWbk402q4OXq2TWpE10" 
          className="absolute inset-0 z-0"
          style={{
            width: '100%',
            height: '100%',
            minHeight: '900px'
          }}
        />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Content */}
            <div className="text-center lg:text-left space-y-6 md:space-y-8">
              {/* Enhanced Headline */}
              <div>
                <StaticHeadline />
              </div>

              {/* Strong Value Proposition */}
              <p className="text-zeroeval-xl sm:text-zeroeval-2xl text-gray-600 max-w-2xl mx-auto lg:mx-0">
                Identify, assess, and mitigate enterprise risks with AI-powered intelligence. 
                <span className="text-gray-900 font-medium"> Deploy in minutes, not months.</span>
              </p>

              {/* Primary CTA */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                <Button 
                  onClick={handleGetStarted}
                  size="lg" 
                  className="px-10 py-5 text-zeroeval-button rounded-xl min-w-[200px] bg-[#199BEC] hover:bg-[#199BEC]/80"
                >
                  Start free trial
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
                <Button 
                  onClick={handleRequestDemo}
                  variant="outline"
                  size="lg"
                  className="px-10 py-5 text-zeroeval-button rounded-xl min-w-[200px]"
                >
                  Book a demo
                </Button>
                </div>

            </div>

            {/* Right Column - Hero Visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              {/* Placeholder for hero visual - could be a dashboard mockup */}
              <div className="relative w-full max-w-2xl mx-auto">
                <div className="bg-white/90 backdrop-blur-xl border border-gray-200/60 shadow-2xl rounded-2xl overflow-hidden">
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
                  <div className="p-8">
                    <div className="text-center space-y-6">
                      <div className="w-16 h-16 bg-[#199BEC]/10 rounded-2xl flex items-center justify-center mx-auto">
                        <BarChart3 className="w-8 h-8 text-[#199BEC]" />
                      </div>
                      <div>
                        <h3 className="text-zeroeval-h4 text-gray-900 mb-2">Risk Intelligence Dashboard</h3>
                        <p className="text-zeroeval-body-sm text-gray-600">Transform your data into actionable insights</p>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-red-50 rounded-xl">
                          <div className="text-2xl font-bold text-red-600">23</div>
                          <div className="text-xs text-red-600">Critical</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-xl">
                          <div className="text-2xl font-bold text-orange-600">45</div>
                          <div className="text-xs text-orange-600">Medium</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-xl">
                          <div className="text-2xl font-bold text-green-600">67</div>
                          <div className="text-xs text-green-600">Low</div>
                        </div>
                      </div>
                    </div>
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
