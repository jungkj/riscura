"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MacbookScroll } from '@/components/ui/aceternity/macbook-scroll';
import { TypewriterEffectSmooth } from '@/components/ui/aceternity/typewriter-effect';
import { TimeSavingChart } from '@/components/landing/TimeSavingChart';

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

// Enhanced typewriter effect - only "intelligent" will animate
const typewriterWords = [
  {
    text: "Enterprise",
    className: "text-[#191919]",
  },
  {
    text: "risk",
    className: "text-[#191919]",
  },
  {
    text: "management",
    className: "text-[#191919]",
  },
  {
    text: "made",
    className: "text-[#191919]",
  },
  {
    text: "intelligent",
    className: "text-[#191919] font-bold",
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/register');
  };

  const handleRequestDemo = () => {
    router.push('/register');
  };

  return (
    <div className="min-h-screen bg-background font-inter">
      {/* Enhanced Navigation */}
      <nav className="sticky top-0 z-50 border-b-2 border-border bg-card/95 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                <div className="relative">
                  <Shield className="h-9 w-9 text-[#191919]" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#FAFAFA]"></div>
                </div>
                <span className="text-2xl font-bold text-foreground font-inter">Riscura</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-10">
              <Link href="#features" className="text-foreground hover:text-muted-foreground transition-colors font-semibold font-inter text-base">
                Platform
              </Link>
              <Link href="#enterprise" className="text-foreground hover:text-muted-foreground transition-colors font-semibold font-inter text-base">
                Enterprise
              </Link>
              <Link href="#customers" className="text-foreground hover:text-muted-foreground transition-colors font-semibold font-inter text-base">
                Customers
              </Link>
              <Link href="#pricing" className="text-foreground hover:text-muted-foreground transition-colors font-semibold font-inter text-base">
                Pricing
              </Link>
              <div className="flex items-center space-x-4 ml-6">
                <Button 
                  variant="ghost"
                  className="text-foreground hover:text-muted-foreground font-inter font-semibold"
                >
                  Sign in
                </Button>
                <Button 
                  onClick={handleRequestDemo} 
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-6 py-2 font-inter font-bold rounded-md shadow-sm"
                >
                  Request demo
                </Button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-[#191919] p-2"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <motion.div 
              className="lg:hidden border-t border-[#D8C3A5]/30 py-6 bg-[#FAFAFA]"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex flex-col space-y-6">
                <Link href="#features" className="text-[#191919] hover:text-[#A8A8A8] transition-colors font-medium font-inter text-lg">
                  Platform
                </Link>
                <Link href="#enterprise" className="text-[#A8A8A8] hover:text-[#191919] transition-colors font-medium font-inter text-lg">
                  Enterprise
                </Link>
                <Link href="#customers" className="text-[#A8A8A8] hover:text-[#191919] transition-colors font-medium font-inter text-lg">
                  Customers
                </Link>
                <Link href="#pricing" className="text-[#A8A8A8] hover:text-[#191919] transition-colors font-medium font-inter text-lg">
                  Pricing
                </Link>
                <div className="pt-4 border-t border-[#D8C3A5]/30 space-y-4">
                  <Button variant="ghost" className="w-full text-[#A8A8A8] hover:text-[#191919] font-inter justify-start">
                    Sign in
                  </Button>
                  <Button onClick={handleRequestDemo} className="w-full bg-[#D8C3A5] text-[#191919] hover:bg-[#D8C3A5]/90 font-inter font-semibold">
                    Request demo
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </nav>

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
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-[#A8A8A8] mb-8">
              <span className="font-medium font-inter">Trusted by 500+ enterprises</span>
              <div className="flex items-center gap-6">
                <Badge variant="outline" className="px-4 py-2 border-[#D8C3A5]/60 text-[#191919] bg-[#FAFAFA] font-inter shadow-sm">
                  SOC 2 Compliant
                </Badge>
                <Badge variant="outline" className="px-4 py-2 border-[#D8C3A5]/60 text-[#191919] bg-[#FAFAFA] font-inter shadow-sm">
                  ISO 27001
                </Badge>
                <Badge variant="outline" className="px-4 py-2 border-[#D8C3A5]/60 text-[#191919] bg-[#FAFAFA] font-inter shadow-sm">
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
              {/* Enhanced Headline with Typewriter */}
              <div className="mb-8">
                <TypewriterEffectSmooth 
                  words={typewriterWords} 
                  className="justify-center lg:justify-start text-5xl sm:text-6xl lg:text-7xl"
                  cursorClassName="bg-[#191919]"
                />
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
                <Button 
                  onClick={handleGetStarted}
                  size="lg" 
                  className="bg-[#191919] text-[#FAFAFA] px-10 py-5 text-xl rounded-xl font-semibold shadow-lg hover:bg-[#2a2a2a] hover:shadow-xl transition-all duration-300 font-inter min-w-[200px]"
                >
                  Start free trial
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
                <Button 
                  onClick={handleRequestDemo}
                  variant="outline" 
                  size="lg"
                  className="border-2 border-[#D8C3A5] bg-[#FAFAFA] text-[#191919] hover:bg-[#D8C3A5] px-10 py-5 text-xl rounded-xl font-semibold transition-all duration-300 font-inter min-w-[200px]"
                >
                  Book a demo
                </Button>
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

            {/* Right Column - Visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              <div className="relative">
                {/* Main Dashboard Preview */}
                <div className="bg-[#FAFAFA] rounded-2xl shadow-2xl border border-[#D8C3A5]/30 p-8 backdrop-blur-sm">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">Live Dashboard</Badge>
                    </div>
                    <div className="h-64 bg-gradient-to-br from-[#F5F1E9] to-[#D8C3A5]/20 rounded-lg border border-[#D8C3A5]/30 flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <Shield className="w-16 h-16 text-[#191919] mx-auto" />
                        <div className="space-y-2">
                          <div className="h-2 bg-[#191919] rounded-full w-32 mx-auto"></div>
                          <div className="h-2 bg-[#D8C3A5] rounded-full w-24 mx-auto"></div>
                          <div className="h-2 bg-[#A8A8A8] rounded-full w-28 mx-auto"></div>
                        </div>
                        <p className="text-sm text-[#A8A8A8] font-inter">AI Risk Analysis</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <motion.div
                  className="absolute -top-4 -right-4 bg-[#191919] text-[#FAFAFA] px-4 py-2 rounded-lg shadow-lg"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium font-inter">Live Monitoring</span>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute -bottom-4 -left-4 bg-[#FAFAFA] border border-[#D8C3A5] px-4 py-2 rounded-lg shadow-lg"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-[#191919] font-inter">Compliant</span>
                  </div>
                </motion.div>
              </div>
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
                      feature.color === 'blue' ? 'bg-blue-50' :
                      'bg-gray-50'
                    }`}>
                      <feature.icon className={`h-7 w-7 ${
                        feature.color === 'black' ? 'text-[#191919]' :
                        feature.color === 'black' ? 'text-[#191919]' :
                        feature.color === 'blue' ? 'text-blue-600' :
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

      {/* Customer Testimonials Section */}
      <section id="customers" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#F5F1E9]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Badge className="bg-[#D8C3A5] text-[#191919] px-4 py-2 mb-6 text-sm font-inter">
                Customer Success
              </Badge>
              <h2 className="text-4xl sm:text-5xl font-bold text-[#191919] mb-8 font-inter">
                Trusted by industry leaders
              </h2>
              <p className="text-xl text-[#A8A8A8] max-w-3xl mx-auto font-inter">
                See how enterprise customers have transformed their risk management with Riscura
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                quote: "Riscura transformed our risk management process. We went from quarterly assessments to real-time monitoring with AI insights that actually help us prevent issues before they happen.",
                author: "Sarah Chen",
                role: "CISO",
                company: "TechCorp Global",
                rating: 5,
                logo: "TC"
              },
              {
                quote: "The platform's automation capabilities saved us 80% of the time we used to spend on compliance reporting. The AI recommendations are surprisingly accurate and actionable.",
                author: "Michael Rodriguez",
                role: "Head of Compliance",
                company: "Financial Dynamics",
                rating: 5,
                logo: "FD"
              },
              {
                quote: "Implementation was seamless. Within a week, we had full visibility into our risk landscape. The dashboard gives our board exactly what they need to make informed decisions.",
                author: "Jennifer Park",
                role: "VP of Risk Management",
                company: "InnovateLabs",
                rating: 5,
                logo: "IL"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="bg-white border border-[#D8C3A5]/30 h-full hover:shadow-xl transition-all duration-300 rounded-2xl">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-6">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    
                    <Quote className="w-8 h-8 text-[#D8C3A5] mb-4" />
                    
                    <p className="text-[#191919] text-lg leading-relaxed mb-8 font-inter">
                      "{testimonial.quote}"
                    </p>
                    
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-[#D8C3A5] rounded-xl flex items-center justify-center mr-4">
                        <span className="text-[#191919] font-bold font-inter">{testimonial.logo}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-[#191919] font-inter">{testimonial.author}</p>
                        <p className="text-[#A8A8A8] text-sm font-inter">{testimonial.role}</p>
                        <p className="text-[#A8A8A8] text-sm font-inter">{testimonial.company}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Trust Indicators */}
          <motion.div
            className="mt-20 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <p className="text-[#A8A8A8] mb-8 font-inter">Join 500+ companies that trust Riscura</p>
            <div className="flex flex-wrap justify-center items-center gap-12">
              {['TechStars', 'Sequoia', 'Y Combinator', 'Andreessen', 'Kleiner Perkins'].map((investor, index) => (
                <Badge key={index} variant="outline" className="px-6 py-3 border-[#D8C3A5]/60 text-[#A8A8A8] bg-[#FAFAFA] font-inter text-base">
                  {investor}
                </Badge>
              ))}
            </div>
          </motion.div>
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
              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="bg-[#D8C3A5] text-[#191919] px-12 py-6 text-xl font-bold hover:bg-[#D8C3A5]/90 transition-all duration-300 font-inter min-w-[250px] rounded-xl shadow-2xl"
              >
                Start free trial
                <ChevronRight className="ml-3 h-6 w-6" />
              </Button>
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