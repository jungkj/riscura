"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MacbookScroll } from '@/components/ui/aceternity/macbook-scroll';

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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-foreground" />
                <span className="text-xl font-bold text-foreground">Riscura</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-foreground hover:text-muted-foreground transition-colors font-medium">
                Home
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Enterprise
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                About Us
              </Link>
              <Button 
                onClick={handleRequestDemo} 
                variant="outline" 
                className="ml-4 notion-button-outline"
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
                className="text-foreground notion-button-ghost"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <motion.div 
              className="md:hidden border-t border-border py-4 bg-background"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex flex-col space-y-4">
                <Link href="/" className="text-foreground hover:text-muted-foreground transition-colors font-medium">
                  Home
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                  Enterprise
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                  About Us
                </Link>
                <Button onClick={handleRequestDemo} variant="outline" className="w-full notion-button-outline">
                  Request a demo
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto text-center">
          {/* Backed by section */}
          <motion.div 
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-muted-foreground mb-8">
              <span className="font-medium">Backed by</span>
              <div className="flex items-center gap-4 sm:gap-6">
                <Badge variant="outline" className="px-4 py-2 border-border text-foreground">
                  TechStars
                </Badge>
                <Badge variant="outline" className="px-4 py-2 border-border text-foreground">
                  Y Combinator
                </Badge>
                <Badge variant="outline" className="px-4 py-2 border-border text-foreground">
                  Sequoia
                </Badge>
              </div>
            </div>
          </motion.div>

          {/* Main headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-8 leading-tight tracking-tight">
              World's first AI-powered{' '}
              <span className="block bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                risk management platform
              </span>
            </h1>
          </motion.div>

          {/* Subheading */}
          <motion.p 
            className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed"
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
              className="notion-button-primary px-8 py-4 text-lg rounded-md font-semibold shadow-sm hover:shadow-md transition-all duration-200"
            >
              Get started
            </Button>
            <Button 
              onClick={handleRequestDemo}
              variant="outline" 
              size="lg"
              className="notion-button-outline px-8 py-4 text-lg rounded-md font-semibold transition-all duration-200"
            >
              Request a demo
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Main Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="notion-card h-full hover:shadow-notion-lg transition-shadow duration-300">
                <CardContent className="p-8 lg:p-10">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-secondary rounded-xl flex items-center justify-center mb-6">
                      <Shield className="h-8 w-8 text-foreground" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">
                      Enterprise Risk Assessment
                    </h3>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      Comprehensive risk identification and assessment with AI-powered insights 
                      that understand your unique business context and industry requirements.
                    </p>
                  </div>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-foreground rounded-full mr-3"></div>
                      Real-time risk monitoring
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-foreground rounded-full mr-3"></div>
                      Automated compliance tracking
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-foreground rounded-full mr-3"></div>
                      Predictive risk analytics
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="notion-card h-full hover:shadow-notion-lg transition-shadow duration-300">
                <CardContent className="p-8 lg:p-10">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-secondary rounded-xl flex items-center justify-center mb-6">
                      <Brain className="h-8 w-8 text-foreground" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">
                      AI-Powered Intelligence
                    </h3>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      Advanced machine learning algorithms analyze patterns, predict threats, 
                      and provide actionable recommendations for proactive risk management.
                    </p>
                  </div>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-foreground rounded-full mr-3"></div>
                      Intelligent threat detection
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-foreground rounded-full mr-3"></div>
                      Automated risk scoring
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-foreground rounded-full mr-3"></div>
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
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <Card className="notion-card h-full hover:shadow-notion-lg transition-shadow duration-300">
                <CardContent className="p-8 lg:p-10">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-secondary rounded-xl flex items-center justify-center mb-6">
                      <Target className="h-8 w-8 text-foreground" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">
                      Precision Control Management
                    </h3>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      Design, implement, and monitor controls with precision. Track effectiveness 
                      and ensure optimal risk mitigation across your organization.
                    </p>
                  </div>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-foreground rounded-full mr-3"></div>
                      Control effectiveness tracking
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-foreground rounded-full mr-3"></div>
                      Automated testing workflows
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-foreground rounded-full mr-3"></div>
                      Performance optimization
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 4 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="notion-card h-full hover:shadow-notion-lg transition-shadow duration-300">
                <CardContent className="p-8 lg:p-10">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-secondary rounded-xl flex items-center justify-center mb-6">
                      <Zap className="h-8 w-8 text-foreground" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">
                      Lightning-Fast Deployment
                    </h3>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      Get up and running in minutes, not months. Our intuitive platform 
                      integrates seamlessly with your existing systems and workflows.
                    </p>
                  </div>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-foreground rounded-full mr-3"></div>
                      5-minute setup process
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-foreground rounded-full mr-3"></div>
                      Seamless integrations
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-foreground rounded-full mr-3"></div>
                      Enterprise-ready security
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              See Riscura in action
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
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

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Ready to revolutionize your risk management?
            </h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Join thousands of organizations that trust Riscura to protect their business 
              and ensure compliance in an ever-changing risk landscape.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="notion-button-primary px-8 py-4 text-lg font-semibold"
              >
                Start free trial
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                onClick={handleRequestDemo}
                variant="outline" 
                size="lg"
                className="notion-button-outline px-8 py-4 text-lg font-semibold"
              >
                Schedule demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-8 w-8 text-foreground" />
                <span className="text-xl font-bold text-foreground">Riscura</span>
              </div>
              <p className="text-muted-foreground text-sm">
                AI-powered risk management platform for modern enterprises.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">API</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Integrations</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-12 pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © 2024 Riscura. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 