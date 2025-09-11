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
// Palace.so style navbar component
function PalaceNavbar() {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/auth/login');
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-8 pt-6">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex items-center justify-between rounded-full px-6 py-3 transition-colors bg-white/60 backdrop-blur border border-white/30">
          <a className="flex items-center gap-2 text-sm text-[#272727] font-light" href="/">
            <Image
              src="/images/logo/riscura.png"
              alt="Riscura logo"
              width={19}
              height={25}
              className="object-contain"
            />
            <span className="font-medium">Riscura</span>
          </a>
          
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => scrollToSection('about')}
              className="text-sm text-[#272727] hover:text-[#199BEC] transition-colors font-light"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="text-sm text-[#272727] hover:text-[#199BEC] transition-colors font-light"
            >
              Features
            </button>
            <a
              href="/blog"
              className="text-sm text-[#272727] hover:text-[#199BEC] transition-colors font-light"
            >
              Blog
            </a>
            <button
              onClick={handleLogin}
              className="rounded-full bg-[#282828] px-4 py-2 text-xs font-normal text-white shadow hover:bg-[#282828]/90 transition-all duration-200"
            >
              Login
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={handleLogin}
              className="rounded-full bg-[#282828] px-4 py-2 text-xs font-normal text-white shadow hover:bg-[#282828]/90 transition-all duration-200"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
import { IntegrationsCarousel } from '@/components/landing/IntegrationsCarousel';
import { ContainerTextFlip } from '@/components/ui/container-text-flip';
import { RunwayStyle3StepProcess } from '@/components/landing/RunwayStyle3StepProcess';
import { VantaBackground } from '@/components/ui/vanta-background';

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



export default function HomePage() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/auth/register');
  };

  const handleRequestDemo = () => {
    router.push('/auth/register');
  };

  return (
    <div className="min-h-screen font-inter" style={{ backgroundColor: '#FFFFFF' }}>
      
      {/* Palace.so Style Navbar */}
      <PalaceNavbar />

      {/* Palace.so Exact Hero Section */}
      <section className="relative w-full overflow-visible min-h-svh">
        <VantaBackground className="absolute inset-0" />

        {/* Content Container - Exact Palace.so Layout */}
        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pt-36 pb-12 text-center sm:pt-44 md:pt-48">
          {/* Headline - Exact Palace.so Style */}
          <h1 className="font-playfair text-4xl leading-tight text-[#272727] sm:text-5xl md:text-6xl">
            <span className="font-thin">Your organization's</span>{' '}
            <span className="font-semibold">AI risk observer</span>
          </h1>
          
          {/* Description - Exact Palace.so Style */}
          <p className="mt-4 max-w-3xl text-sm text-[#272727]/80 sm:text-base">
            One platform for enterprise risk management to monitor and report on organizational risks.
          </p>
          <p className="mt-1 max-w-3xl text-sm text-[#272727]/80 sm:text-base">
            Get complete risk visibility from the data you already collect.
          </p>
          
          {/* Badge - Palace.so Style */}
          <div className="mt-6 flex items-center justify-center">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-black bg-white/20">
              <span className="text-xs sm:text-sm">Powered by</span>
              <span className="text-xs sm:text-sm font-normal">AI Intelligence</span>
            </div>
          </div>
        </div>

        {/* Dashboard Screenshot - Exact Palace.so Layout */}
        <div className="relative z-10 mx-auto -mb-24 mt-6 flex max-w-7xl justify-center px-6 sm:mt-8 md:mt-10">
          <div className="relative w-full sm:translate-x-0 md:translate-x-6">
            <Image
              src="/images/dashboard-screenshot.svg"
              alt="Riscura dashboard"
              width={1200}
              height={720}
              className="rounded-xl"
              sizes="(min-width: 1280px) 1200px, 100vw"
              priority
            />
          </div>
        </div>
      </section>


      {/* Integrations Carousel - moved right under hero section */}
      <IntegrationsCarousel />

      {/* Runway-Style 3-Step Process */}
      <RunwayStyle3StepProcess />

      {/* Time Savings Chart Section */}
      <TimeSavingChart />

      {/* About Section */}
      <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, amount: 0.2 }}
              className="space-y-6 md:space-y-8"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <Badge className="bg-[#199BEC] text-white px-4 py-2 text-sm">
                  About Riscura
                </Badge>
              </motion.div>
              <motion.h2 
                className="text-4xl sm:text-5xl lg:text-6xl text-gray-900 font-light leading-tight"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                Transforming enterprise
                <br />
                <span className="font-normal">risk management</span>
              </motion.h2>
              <motion.p 
                className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                Founded by risk management experts who experienced the pain of manual processes firsthand, 
                Riscura was built to solve the inefficiencies that plague enterprise risk teams. We've automated 
                what used to take weeks into minutes, turning spreadsheet chaos into intelligent insights.
              </motion.p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, amount: 0.3 }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h3>
                <p className="text-gray-600 leading-relaxed">
                  To eliminate the manual burden of risk management and compliance, empowering organizations 
                  to make data-driven decisions with confidence. We believe risk management should be strategic, 
                  not administrative.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Why We Built Riscura</h3>
                <p className="text-gray-600 leading-relaxed">
                  After years of watching talented risk professionals spend 80% of their time on spreadsheets 
                  instead of strategy, we knew there had to be a better way. Riscura transforms manual processes 
                  into automated workflows, giving you back time to focus on what matters most.
                </p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, amount: 0.3 }}
              className="grid grid-cols-2 gap-8"
            >
              <div className="text-center">
                <div className="text-4xl font-bold text-[#199BEC] mb-2">500+</div>
                <div className="text-gray-600">Organizations Trust Us</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-[#199BEC] mb-2">85%</div>
                <div className="text-gray-600">Time Savings Achieved</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-[#199BEC] mb-2">24/7</div>
                <div className="text-gray-600">AI-Powered Monitoring</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-[#199BEC] mb-2">SOC2</div>
                <div className="text-gray-600">Enterprise Security</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#FAFAFA]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 md:mb-20">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true, amount: 0.2 }}
                className="space-y-6 md:space-y-8"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true, amount: 0.2 }}
                >
                  <Badge className="bg-gray-900 text-white px-4 py-2 text-zeroeval-caption">
                    Enterprise Platform
                  </Badge>
                </motion.div>
                <motion.h2 
                  className="text-zeroeval-4xl sm:text-zeroeval-5xl lg:text-zeroeval-6xl text-gray-900"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  viewport={{ once: true, amount: 0.2 }}
                >
                  Built for modern<br />enterprise security
                </motion.h2>
                <motion.p 
                  className="text-zeroeval-xl text-gray-600 max-w-3xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  viewport={{ once: true, amount: 0.2 }}
                >
                  Comprehensive risk management platform designed for Fortune 500 companies 
                  with enterprise-grade security, compliance, and AI-powered automation.
                </motion.p>
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
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.7, 
                  delay: index * 0.15,
                  type: "spring",
                  stiffness: 100,
                  damping: 15
                }}
                viewport={{ once: true, amount: 0.2 }}
                whileHover={{
                  y: -8,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
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
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute top-20 left-20 w-32 h-32 bg-[#199BEC]/5 rounded-full"
              animate={{
                x: [0, 30, 0],
                y: [0, -20, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute bottom-20 right-20 w-24 h-24 bg-[#199BEC]/10 rounded-full"
              animate={{
                x: [0, -25, 0],
                y: [0, 15, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
          
          <div className="max-w-5xl mx-auto text-center relative">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, amount: 0.3 }}
              className="space-y-6 md:space-y-8"
            >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <Badge className="bg-[#199BEC] text-white px-6 py-2 text-zeroeval-caption rounded-full">
                Get Started Today
              </Badge>
            </motion.div>
            
            <motion.h2 
              className="text-zeroeval-4xl sm:text-zeroeval-5xl lg:text-zeroeval-6xl text-gray-900"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              Ready to secure<br />your enterprise?
            </motion.h2>
            
            <motion.p 
              className="text-zeroeval-xl text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              Join thousands of organizations that trust Riscura to protect their business 
              and ensure compliance in an ever-changing risk landscape.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Button 
                  onClick={handleGetStarted}
                  size="lg" 
                  className="px-12 py-4 text-zeroeval-button min-w-[220px] rounded-xl bg-[#199BEC] hover:bg-[#199BEC]/80 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Start free trial
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Button 
                  onClick={handleRequestDemo}
                  variant="outline"
                  size="lg"
                  className="px-12 py-4 text-zeroeval-button min-w-[220px] rounded-xl border-2 hover:shadow-lg transition-all duration-300"
                >
                  Schedule demo
                </Button>
              </motion.div>
            </motion.div>

            {/* Trust Elements */}
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              {[
                { icon: Lock, title: "Enterprise Security", subtitle: "SOC 2 & ISO 27001" },
                { icon: Users, title: "24/7 Support", subtitle: "Dedicated success team" },
                { icon: TrendingUp, title: "Proven ROI", subtitle: "Significant efficiency gains" }
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  className="text-center"
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: 0.7 + (index * 0.1),
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }}
                  viewport={{ once: true, amount: 0.3 }}
                  whileHover={{ 
                    y: -5,
                    transition: { duration: 0.2 }
                  }}
                >
                  <motion.div 
                    className="w-12 h-12 bg-[#199BEC]/10 rounded-xl flex items-center justify-center mx-auto mb-3"
                    whileHover={{ 
                      scale: 1.1,
                      backgroundColor: "rgba(25, 155, 236, 0.2)"
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <item.icon className="w-6 h-6 text-[#199BEC]" />
                  </motion.div>
                  <p className="text-gray-900 text-zeroeval-body-sm font-medium">{item.title}</p>
                  <p className="text-gray-600 text-zeroeval-caption">{item.subtitle}</p>
                </motion.div>
              ))}
            </motion.div>
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
