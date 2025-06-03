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
  X
} from 'lucide-react';

const typewriterWords = [
  {
    text: "World's",
  },
  {
    text: "first",
  },
  {
    text: "AI-powered",
    className: "text-[#191919] font-bold",
  },
  {
    text: "risk",
    className: "text-[#191919] font-bold",
  },
  {
    text: "management",
    className: "text-[#191919] font-bold",
  },
  {
    text: "platform",
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
    <div className="min-h-screen bg-[#F5F1E9] font-inter">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-[#D8C3A5] bg-[#F5F1E9]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-[#191919]" />
                <span className="text-xl font-bold text-[#191919] font-inter">Riscura</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-[#191919] hover:text-[#A8A8A8] transition-colors font-medium font-inter">
                Home
              </Link>
              <Link href="#" className="text-[#A8A8A8] hover:text-[#191919] transition-colors font-medium font-inter">
                Enterprise
              </Link>
              <Link href="#" className="text-[#A8A8A8] hover:text-[#191919] transition-colors font-medium font-inter">
                About Us
              </Link>
              <Button 
                onClick={handleRequestDemo} 
                variant="outline" 
                className="ml-4 border-[#D8C3A5] bg-[#FAFAFA] text-[#191919] hover:bg-[#D8C3A5] hover:text-[#191919] font-inter"
              >
                Request a demo
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-[#191919]"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <motion.div 
              className="md:hidden border-t border-[#D8C3A5] py-4 bg-[#F5F1E9]"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex flex-col space-y-4">
                <Link href="/" className="text-[#191919] hover:text-[#A8A8A8] transition-colors font-medium font-inter">
                  Home
                </Link>
                <Link href="#" className="text-[#A8A8A8] hover:text-[#191919] transition-colors font-medium font-inter">
                  Enterprise
                </Link>
                <Link href="#" className="text-[#A8A8A8] hover:text-[#191919] transition-colors font-medium font-inter">
                  About Us
                </Link>
                <Button onClick={handleRequestDemo} variant="outline" className="w-full border-[#D8C3A5] bg-[#FAFAFA] text-[#191919] hover:bg-[#D8C3A5] font-inter">
                  Request a demo
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-[#F5F1E9]">
        <div className="max-w-7xl mx-auto text-center">
          {/* Backed by section */}
          <motion.div 
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-[#A8A8A8] mb-8">
              <span className="font-medium font-inter">Backed by</span>
              <div className="flex items-center gap-4 sm:gap-6">
                <Badge variant="outline" className="px-4 py-2 border-[#D8C3A5] text-[#191919] bg-[#FAFAFA] font-inter">
                  TechStars
                </Badge>
                <Badge variant="outline" className="px-4 py-2 border-[#D8C3A5] text-[#191919] bg-[#FAFAFA] font-inter">
                  Y Combinator
                </Badge>
                <Badge variant="outline" className="px-4 py-2 border-[#D8C3A5] text-[#191919] bg-[#FAFAFA] font-inter">
                  Sequoia
                </Badge>
              </div>
            </div>
          </motion.div>

          {/* Typewriter Effect Headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <TypewriterEffectSmooth 
              words={typewriterWords} 
              className="justify-center"
              cursorClassName="bg-[#191919]"
            />
          </motion.div>

          {/* Subheading */}
          <motion.p 
            className="text-xl sm:text-2xl text-[#A8A8A8] mb-12 max-w-4xl mx-auto leading-relaxed font-inter"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Identify, assess, and mitigate enterprise risks with deep organizational context.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Button 
              onClick={handleGetStarted}
              size="lg" 
              className="bg-[#191919] text-[#FAFAFA] px-8 py-4 text-lg rounded-md font-semibold shadow-sm hover:bg-[#2a2a2a] hover:shadow-md transition-all duration-200 font-inter"
            >
              Get started
            </Button>
            <Button 
              onClick={handleRequestDemo}
              variant="outline" 
              size="lg"
              className="border-[#D8C3A5] bg-[#FAFAFA] text-[#191919] hover:bg-[#D8C3A5] px-8 py-4 text-lg rounded-md font-semibold transition-all duration-200 font-inter"
            >
              Request a demo
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Time Saving Chart Section */}
      <TimeSavingChart />

      {/* Main Features Section - Smaller cards, moved down */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#D8C3A5]/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#191919] mb-6 font-inter">
              Enterprise-grade risk management
            </h2>
            <p className="text-lg text-[#A8A8A8] max-w-3xl mx-auto font-inter">
              Comprehensive platform designed for modern enterprises to identify, assess, and mitigate risks with AI-powered intelligence.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 - Smaller cards */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="bg-[#FAFAFA] border border-[#D8C3A5] h-full hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-[#D8C3A5]/30 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-[#191919]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#191919] mb-3 font-inter">
                    Risk Assessment
                  </h3>
                  <p className="text-[#A8A8A8] text-sm leading-relaxed mb-4 font-inter">
                    Comprehensive risk identification with AI-powered insights and real-time monitoring.
                  </p>
                  <ul className="space-y-2 text-[#A8A8A8] text-sm">
                    <li className="flex items-center font-inter">
                      <div className="w-1.5 h-1.5 bg-[#191919] rounded-full mr-2"></div>
                      Real-time monitoring
                    </li>
                    <li className="flex items-center font-inter">
                      <div className="w-1.5 h-1.5 bg-[#191919] rounded-full mr-2"></div>
                      Automated compliance
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="bg-[#FAFAFA] border border-[#D8C3A5] h-full hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-[#D8C3A5]/30 rounded-lg flex items-center justify-center mb-4">
                    <Brain className="h-6 w-6 text-[#191919]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#191919] mb-3 font-inter">
                    AI Intelligence
                  </h3>
                  <p className="text-[#A8A8A8] text-sm leading-relaxed mb-4 font-inter">
                    Advanced ML algorithms for pattern analysis and predictive insights.
                  </p>
                  <ul className="space-y-2 text-[#A8A8A8] text-sm">
                    <li className="flex items-center font-inter">
                      <div className="w-1.5 h-1.5 bg-[#191919] rounded-full mr-2"></div>
                      Threat detection
                    </li>
                    <li className="flex items-center font-inter">
                      <div className="w-1.5 h-1.5 bg-[#191919] rounded-full mr-2"></div>
                      Smart recommendations
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="bg-[#FAFAFA] border border-[#D8C3A5] h-full hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-[#D8C3A5]/30 rounded-lg flex items-center justify-center mb-4">
                    <Target className="h-6 w-6 text-[#191919]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#191919] mb-3 font-inter">
                    Control Management
                  </h3>
                  <p className="text-[#A8A8A8] text-sm leading-relaxed mb-4 font-inter">
                    Design and monitor controls with precision effectiveness tracking.
                  </p>
                  <ul className="space-y-2 text-[#A8A8A8] text-sm">
                    <li className="flex items-center font-inter">
                      <div className="w-1.5 h-1.5 bg-[#191919] rounded-full mr-2"></div>
                      Effectiveness tracking
                    </li>
                    <li className="flex items-center font-inter">
                      <div className="w-1.5 h-1.5 bg-[#191919] rounded-full mr-2"></div>
                      Automated testing
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 4 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Card className="bg-[#FAFAFA] border border-[#D8C3A5] h-full hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-[#D8C3A5]/30 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-[#191919]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#191919] mb-3 font-inter">
                    Fast Deployment
                  </h3>
                  <p className="text-[#A8A8A8] text-sm leading-relaxed mb-4 font-inter">
                    Get up and running in minutes with seamless integrations.
                  </p>
                  <ul className="space-y-2 text-[#A8A8A8] text-sm">
                    <li className="flex items-center font-inter">
                      <div className="w-1.5 h-1.5 bg-[#191919] rounded-full mr-2"></div>
                      5-minute setup
                    </li>
                    <li className="flex items-center font-inter">
                      <div className="w-1.5 h-1.5 bg-[#191919] rounded-full mr-2"></div>
                      Enterprise security
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-24 bg-[#F5F1E9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-[#191919] mb-6 font-inter">
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
            <div className="relative">
              <MacbookScroll
                title="Risk Management Dashboard"
                badge="AI-Powered Analytics"
                src="/api/placeholder/800/600"
                showGradient={false}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#D8C3A5]/20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-[#191919] mb-6 font-inter">
              Ready to revolutionize your risk management?
            </h2>
            <p className="text-xl text-[#A8A8A8] mb-12 max-w-2xl mx-auto font-inter">
              Join thousands of organizations that trust Riscura to protect their business 
              and ensure compliance in an ever-changing risk landscape.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="bg-[#191919] text-[#FAFAFA] px-8 py-4 text-lg font-semibold hover:bg-[#2a2a2a] transition-colors font-inter"
              >
                Start free trial
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                onClick={handleRequestDemo}
                variant="outline" 
                size="lg"
                className="border-[#D8C3A5] bg-[#FAFAFA] text-[#191919] hover:bg-[#D8C3A5] px-8 py-4 text-lg font-semibold transition-colors font-inter"
              >
                Schedule demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#F5F1E9] border-t border-[#D8C3A5] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-8 w-8 text-[#191919]" />
                <span className="text-xl font-bold text-[#191919] font-inter">Riscura</span>
              </div>
              <p className="text-[#A8A8A8] text-sm font-inter">
                AI-powered risk management platform for modern enterprises.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-[#191919] mb-4 font-inter">Product</h3>
              <ul className="space-y-2 text-sm text-[#A8A8A8]">
                <li><Link href="#" className="hover:text-[#191919] transition-colors font-inter">Features</Link></li>
                <li><Link href="#" className="hover:text-[#191919] transition-colors font-inter">Pricing</Link></li>
                <li><Link href="#" className="hover:text-[#191919] transition-colors font-inter">API</Link></li>
                <li><Link href="#" className="hover:text-[#191919] transition-colors font-inter">Integrations</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-[#191919] mb-4 font-inter">Company</h3>
              <ul className="space-y-2 text-sm text-[#A8A8A8]">
                <li><Link href="#" className="hover:text-[#191919] transition-colors font-inter">About</Link></li>
                <li><Link href="#" className="hover:text-[#191919] transition-colors font-inter">Blog</Link></li>
                <li><Link href="#" className="hover:text-[#191919] transition-colors font-inter">Careers</Link></li>
                <li><Link href="#" className="hover:text-[#191919] transition-colors font-inter">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-[#191919] mb-4 font-inter">Support</h3>
              <ul className="space-y-2 text-sm text-[#A8A8A8]">
                <li><Link href="#" className="hover:text-[#191919] transition-colors font-inter">Help Center</Link></li>
                <li><Link href="#" className="hover:text-[#191919] transition-colors font-inter">Documentation</Link></li>
                <li><Link href="#" className="hover:text-[#191919] transition-colors font-inter">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-[#191919] transition-colors font-inter">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-[#D8C3A5] mt-12 pt-8 text-center">
            <p className="text-sm text-[#A8A8A8] font-inter">
              © 2024 Riscura. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 