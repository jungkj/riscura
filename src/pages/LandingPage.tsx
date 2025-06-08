"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MacbookScroll } from '@/components/ui/aceternity/macbook-scroll';
import { TypewriterEffectSmooth } from '@/components/ui/aceternity/typewriter-effect';
import { 
  Navbar, 
  NavBody, 
  NavItems, 
  MobileNav, 
  MobileNavHeader, 
  MobileNavMenu,
  MobileNavToggle,
  NavbarLogo, 
  NavbarButton 
} from '@/components/ui/resizable-navbar';
import { TimeSavingChart } from '@/components/landing/TimeSavingChart';

import HeroProcessCard from '@/components/landing/HeroProcessCard';
import { ModernButton } from '@/components/ui/modern-button';

// Icons
import {
  Shield,
  Brain,
  Target,
  Zap,
  ChevronRight,
  Menu,
  X,
  Star,
  Quote,
  CheckCircle,
  Users,
  Building2,
  TrendingUp,
  Lock,
  Globe,
  ArrowRight
} from 'lucide-react';

// New single-word typewriter effect
const cyclingWords = ["effortless", "intelligent", "automated", "proactive", "streamlined"];

// Single Word Typewriter Component
function SingleWordTypewriter() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    const currentWord = cyclingWords[currentWordIndex];
    
    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        setDisplayText(currentWord.substring(0, displayText.length + 1));
        setTypingSpeed(100);
        
        if (displayText === currentWord) {
          // Start deleting after a pause
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        // Deleting
        setDisplayText(currentWord.substring(0, displayText.length - 1));
        setTypingSpeed(50);
        
        if (displayText === '') {
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % cyclingWords.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentWordIndex, typingSpeed]);

  return (
    <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-center lg:text-left font-inter">
      <span className="text-gray-900">
        Risk management made{' '}
      </span>
      <span className="relative">
        <span className="text-gray-900">
          {displayText}
        </span>
        <motion.span
          className="absolute -right-1 top-0 w-1 h-full bg-gray-400 rounded-sm"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </span>
    </div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/register');
  };

  const handleRequestDemo = () => {
    router.push('/register');
  };

  // Navigation items
  const navItems = [
    {
      name: "Platform",
      link: "#features",
    },
    {
      name: "Enterprise", 
      link: "#enterprise",
    },
    {
      name: "Pricing",
      link: "#pricing",
    },
    {
      name: "Demo",
      link: "#demo",
    },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background font-inter">
      {/* Resizable Navigation */}
      <Navbar>
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <div className="flex items-center space-x-2">
            <NavbarButton 
              variant="secondary"
              onClick={() => router.push('/auth/login')}
            >
              Login
            </NavbarButton>
            <NavbarButton 
              variant="gradient"
              onClick={handleGetStarted}
            >
              Get Started
            </NavbarButton>
          </div>
        </NavBody>
        
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle 
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>
          
          <MobileNavMenu 
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <a
                key={idx}
                href={item.link}
                className="block px-4 py-3 text-gray-700 hover:text-[#199BEC] font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </a>
            ))}
            <div className="flex flex-col space-y-3 pt-4 border-t border-gray-200">
              <NavbarButton 
                variant="secondary"
                onClick={() => {
                  router.push('/auth/login');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full justify-center"
              >
                Login
              </NavbarButton>
              <NavbarButton 
                variant="gradient"
                onClick={() => {
                  handleGetStarted();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full justify-center"
              >
                Get Started
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      {/* Enhanced Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background via-card to-background">
        <div className="max-w-7xl mx-auto">
          {/* Trust Indicators */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm text-[#A8A8A8] mb-8">
              <span className="font-medium font-inter">Trusted by 500+ enterprises</span>
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
                <Badge variant="outline" className="px-3 py-2 sm:px-4 border-[#D8C3A5]/60 text-[#191919] bg-[#FAFAFA] font-inter shadow-sm text-xs sm:text-sm">
                  SOC 2 Compliant
                </Badge>
                <Badge variant="outline" className="px-3 py-2 sm:px-4 border-[#D8C3A5]/60 text-[#191919] bg-[#FAFAFA] font-inter shadow-sm text-xs sm:text-sm">
                  ISO 27001
                </Badge>
                <Badge variant="outline" className="px-3 py-2 sm:px-4 border-[#D8C3A5]/60 text-[#191919] bg-[#FAFAFA] font-inter shadow-sm text-xs sm:text-sm">
                  Enterprise Ready
                </Badge>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center lg:text-left"
            >
              {/* Enhanced Headline with Single Word Typewriter */}
              <div className="mb-8">
                <SingleWordTypewriter />
              </div>

              {/* Strong Value Proposition */}
              <motion.p 
                className="text-xl sm:text-2xl text-[#A8A8A8] mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-inter"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                Identify, assess, and mitigate enterprise risks with AI-powered intelligence. 
                <span className="text-[#191919] font-semibold"> Deploy in minutes, not months.</span>
              </motion.p>

              {/* Primary CTA */}
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
              >
                <ModernButton 
                  onClick={handleGetStarted}
                  variant="gradient"
                  size="lg" 
                  className="px-10 py-5 text-xl rounded-xl font-semibold font-inter min-w-[200px]"
                >
                  Start free trial
                  <ArrowRight className="ml-3 h-6 w-6" />
                </ModernButton>
                <ModernButton 
                  onClick={handleRequestDemo}
                  variant="outline" 
                  size="lg"
                  className="px-10 py-5 text-xl rounded-xl font-semibold font-inter min-w-[200px]"
                >
                  Book a demo
                </ModernButton>
              </motion.div>

              {/* Social Proof Stats */}
              <motion.div 
                className="grid grid-cols-3 gap-8 max-w-md mx-auto lg:mx-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
              >
                <div className="text-center lg:text-left">
                  <p className="text-3xl font-bold text-[#191919] font-inter">99.9%</p>
                  <p className="text-sm text-[#A8A8A8] font-inter">Uptime SLA</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-3xl font-bold text-[#191919] font-inter">5min</p>
                  <p className="text-sm text-[#A8A8A8] font-inter">Setup time</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-3xl font-bold text-[#191919] font-inter">24/7</p>
                  <p className="text-sm text-[#A8A8A8] font-inter">Support</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column - Process Showcase */}
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



      {/* Time Saving Chart Section - Keep as requested */}
      <TimeSavingChart />

      {/* Enhanced Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Badge className="bg-[#191919] text-[#FAFAFA] px-4 py-2 mb-6 text-sm font-inter">
                Enterprise Platform
              </Badge>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#191919] mb-8 font-inter leading-tight">
                Built for modern<br />enterprise security
              </h2>
              <p className="text-xl text-[#A8A8A8] max-w-3xl mx-auto font-inter leading-relaxed">
                Comprehensive risk management platform designed for Fortune 500 companies 
                with enterprise-grade security, compliance, and AI-powered automation.
              </p>
            </motion.div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Enhanced Feature Cards */}
            {[
              {
                icon: Shield,
                title: "Advanced Risk Assessment",
                description: "AI-powered threat detection with real-time monitoring and automated compliance tracking across all enterprise systems.",
                features: ["Real-time monitoring", "Automated compliance", "Threat intelligence", "Risk scoring"],
                color: "black"
              },
              {
                icon: Brain,
                title: "AI-Driven Intelligence",
                description: "Machine learning algorithms analyze patterns, predict risks, and provide actionable insights for proactive security management.",
                features: ["Predictive analytics", "Pattern recognition", "Smart recommendations", "Behavioral analysis"],
                color: "black"
              },
              {
                icon: Target,
                title: "Control Management",
                description: "Design, implement, and monitor security controls with precision tracking of effectiveness and automated testing.",
                features: ["Control design", "Effectiveness tracking", "Automated testing", "Compliance mapping"],
                color: "black"
              },
              {
                icon: Zap,
                title: "Rapid Deployment",
                description: "Enterprise-ready platform that deploys in minutes with seamless integrations and zero-downtime migrations.",
                features: ["5-minute setup", "API integrations", "SSO support", "Enterprise security"],
                color: "black"
              },
              {
                icon: Users,
                title: "Team Collaboration",
                description: "Built-in workflows for security teams with role-based access, audit trails, and real-time collaboration tools.",
                features: ["Role-based access", "Audit trails", "Team workflows", "Real-time updates"],
                color: "black"
              },
              {
                icon: Globe,
                title: "Global Compliance",
                description: "Support for international standards including SOC 2, ISO 27001, GDPR, and custom regulatory frameworks.",
                features: ["Multi-framework", "Global standards", "Custom policies", "Audit readiness"],
                color: "black"
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
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ${
                      feature.color === 'black' ? 'bg-secondary/20' :
                      feature.color === 'black' ? 'bg-secondary/20' :
                      feature.color === 'blue' ? 'bg-[#e6f4fd]' :
                      'bg-gray-50'
                    }`}>
                      <feature.icon className={`h-7 w-7 ${
                        feature.color === 'black' ? 'text-[#191919]' :
                        feature.color === 'black' ? 'text-[#191919]' :
                        feature.color === 'blue' ? 'text-[#199BEC]' :
                        'text-gray-600'
                      }`} />
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
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section with MacbookScroll */}
      <section className="py-24 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            {/* Excel Hook */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <p className="text-2xl sm:text-3xl lg:text-4xl text-[#191919] font-inter leading-relaxed">
                Still using <span className="font-bold text-green-600">Excel</span> to track your RCSA?{" "}
                <span className="text-[#A8A8A8]">
                  It's time to upgrade to AI-powered automation that actually works.
                </span>
              </p>
            </motion.div>

            <Badge className="bg-[#191919] text-[#FAFAFA] px-4 py-2 mb-6 text-sm font-inter">
              Platform Demo
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-[#191919] mb-8 font-inter">
              See Riscura in action
            </h2>
            <p className="text-xl text-[#A8A8A8] max-w-3xl mx-auto font-inter">
              Experience the power of AI-driven risk management. Schedule a personalized demo 
              and discover how Riscura can transform your organization's approach to risk.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative"
          >
            <MacbookScroll
              title="Risk Management Dashboard"
              badge="AI-Powered Analytics"
              src="/api/placeholder/800/600"
              showGradient={false}
            />
          </motion.div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#191919] via-[#2a2a2a] to-[#191919] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #D8C3A5 2px, transparent 2px),
                             radial-gradient(circle at 75% 75%, #D8C3A5 2px, transparent 2px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        <div className="max-w-5xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[#FAFAFA] mb-8 font-inter leading-tight">
              Ready to secure<br />your enterprise?
            </h2>
            <p className="text-xl sm:text-2xl text-[#D8C3A5] mb-16 max-w-3xl mx-auto font-inter leading-relaxed">
              Join thousands of organizations that trust Riscura to protect their business 
              and ensure compliance in an ever-changing risk landscape.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
              <ModernButton 
                onClick={handleGetStarted}
                variant="gradient"
                size="lg" 
                className="px-12 py-6 text-xl font-bold font-inter min-w-[250px] rounded-xl shadow-2xl"
              >
                Start free trial
                <ChevronRight className="ml-3 h-6 w-6" />
              </ModernButton>
              <Button 
                onClick={handleRequestDemo}
                variant="outline" 
                size="lg"
                className="border-2 border-[#D8C3A5] bg-transparent text-[#D8C3A5] hover:bg-[#D8C3A5] hover:text-[#191919] px-12 py-6 text-xl font-bold transition-all duration-300 font-inter min-w-[250px] rounded-xl"
              >
                Schedule demo
              </Button>
            </div>

            {/* Additional Trust Elements */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <Lock className="w-8 h-8 text-[#D8C3A5] mx-auto mb-3" />
                <p className="text-[#FAFAFA] font-semibold font-inter">Enterprise Security</p>
                <p className="text-[#A8A8A8] text-sm font-inter">SOC 2 & ISO 27001</p>
              </div>
              <div className="text-center">
                <Users className="w-8 h-8 text-[#D8C3A5] mx-auto mb-3" />
                <p className="text-[#FAFAFA] font-semibold font-inter">24/7 Support</p>
                <p className="text-[#A8A8A8] text-sm font-inter">Dedicated success team</p>
              </div>
              <div className="text-center">
                <TrendingUp className="w-8 h-8 text-[#D8C3A5] mx-auto mb-3" />
                <p className="text-[#FAFAFA] font-semibold font-inter">Proven ROI</p>
                <p className="text-[#A8A8A8] text-sm font-inter">90% time savings</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-[#FAFAFA] border-t border-[#D8C3A5]/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <Shield className="h-10 w-10 text-[#191919]" />
                <span className="text-2xl font-bold text-[#191919] font-inter">Riscura</span>
              </div>
              <p className="text-[#A8A8A8] text-lg font-inter mb-6 max-w-md">
                Enterprise risk management platform powered by AI. Secure your business with intelligent automation.
              </p>
              <div className="flex space-x-4">
                <Button variant="outline" size="sm" className="border-[#D8C3A5]/60 text-[#A8A8A8] hover:text-[#191919] hover:bg-[#F5F1E9]">
                  LinkedIn
                </Button>
                <Button variant="outline" size="sm" className="border-[#D8C3A5]/60 text-[#A8A8A8] hover:text-[#191919] hover:bg-[#F5F1E9]">
                  Twitter
                </Button>
                <Button variant="outline" size="sm" className="border-[#D8C3A5]/60 text-[#A8A8A8] hover:text-[#191919] hover:bg-[#F5F1E9]">
                  GitHub
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-[#191919] mb-6 font-inter text-lg">Product</h3>
              <ul className="space-y-4 text-[#A8A8A8]">
                <li><Link href="#" className="hover:text-[#191919] transition-colors font-inter">Features</Link></li>
                <li><Link href="#" className="hover:text-[#191919] transition-colors font-inter">Pricing</Link></li>
                <li><Link href="#" className="hover:text-[#191919] transition-colors font-inter">API Docs</Link></li>
                <li><Link href="#" className="hover:text-[#191919] transition-colors font-inter">Integrations</Link></li>
                <li><Link href="#" className="hover:text-[#191919] transition-colors font-inter">Security</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-[#191919] mb-6 font-inter text-lg">Company</h3>
              <ul className="space-y-4 text-[#A8A8A8]">
                <li><Link href="#" className="hover:text-[#191919] transition-colors font-inter">About Us</Link></li>
                <li><Link href="#" className="hover:text-[#191919] transition-colors font-inter">Careers</Link></li>
                <li><Link href="#" className="hover:text-[#191919] transition-colors font-inter">Blog</Link></li>
                <li><Link href="#" className="hover:text-[#191919] transition-colors font-inter">Press</Link></li>
                <li><Link href="#" className="hover:text-[#191919] transition-colors font-inter">Investors</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-[#191919] mb-6 font-inter text-lg">Support</h3>
              <ul className="space-y-4 text-[#A8A8A8]">
                <li><Link href="#" className="hover:text-[#191919] transition-colors font-inter">Help Center</Link></li>
                <li><Link href="#" className="hover:text-[#191919] transition-colors font-inter">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-[#191919] transition-colors font-inter">Status Page</Link></li>
                <li><Link href="#" className="hover:text-[#191919] transition-colors font-inter">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-[#191919] transition-colors font-inter">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-[#D8C3A5]/30 mt-16 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <p className="text-[#A8A8A8] font-inter">
                © 2024 Riscura Inc. All rights reserved.
              </p>
              <div className="flex items-center space-x-6 mt-4 sm:mt-0">
                <Badge variant="outline" className="border-[#D8C3A5]/60 text-[#A8A8A8] bg-[#F5F1E9]">
                  SOC 2 Type II
                </Badge>
                <Badge variant="outline" className="border-[#D8C3A5]/60 text-[#A8A8A8] bg-[#F5F1E9]">
                  ISO 27001
                </Badge>
                <Badge variant="outline" className="border-[#D8C3A5]/60 text-[#A8A8A8] bg-[#F5F1E9]">
                  GDPR Ready
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 