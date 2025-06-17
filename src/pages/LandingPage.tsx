"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
        <span className="text-[#191919] font-bold">
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
    router.push('/auth/register');
  };

  const handleRequestDemo = () => {
    router.push('/auth/register');
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
    <div className="min-h-screen font-inter" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Resizable Navigation */}
      <Navbar>
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <div className="flex items-center space-x-3 flex-shrink-0">
            <NavbarButton 
              variant="secondary"
              onClick={() => router.push('/auth/login')}
              className="px-3 py-2 text-sm whitespace-nowrap"
            >
              Login
            </NavbarButton>
            <NavbarButton 
              variant="gradient"
              onClick={handleGetStarted}
              className="px-3 py-2 text-sm whitespace-nowrap"
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
      <section className="pt-48 pb-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background via-card to-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
            {/* Left Column - Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center lg:text-left lg:pr-8"
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
              className="relative lg:pl-8"
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

      {/* Enhanced CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#F5F1E9] via-[#FAFAFA] to-[#F5F1E9] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #199BEC 2px, transparent 2px),
                             radial-gradient(circle at 75% 75%, #D8C3A5 2px, transparent 2px)`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        
        <div className="max-w-5xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-[#199BEC] text-white px-6 py-2 mb-8 text-sm font-inter rounded-full">
              Get Started Today
            </Badge>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#191919] mb-6 font-inter leading-tight">
              Ready to secure<br />your enterprise?
            </h2>
            <p className="text-xl text-[#A8A8A8] mb-12 max-w-3xl mx-auto font-inter leading-relaxed">
              Join thousands of organizations that trust Riscura to protect their business 
              and ensure compliance in an ever-changing risk landscape.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <ModernButton 
                onClick={handleGetStarted}
                variant="gradient"
                size="lg" 
                className="px-12 py-4 text-lg font-semibold font-inter min-w-[220px] rounded-xl"
              >
                Start free trial
                <ChevronRight className="ml-2 h-5 w-5" />
              </ModernButton>
              <ModernButton 
                onClick={handleRequestDemo}
                variant="outline" 
                size="lg"
                className="px-12 py-4 text-lg font-semibold font-inter min-w-[220px] rounded-xl"
              >
                Schedule demo
              </ModernButton>
            </div>

            {/* Trust Elements */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
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