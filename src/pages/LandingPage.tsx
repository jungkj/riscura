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
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <span className="text-xl font-bold text-gray-900 dark:text-white">Riscura</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors font-medium">
                Home
              </Link>
              <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
                Enterprise
              </Link>
              <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
                About Us
              </Link>
              <Button 
                onClick={handleRequestDemo} 
                variant="outline" 
                className="ml-4 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
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
                className="text-gray-900 dark:text-white"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <motion.div 
              className="md:hidden border-t border-gray-100 dark:border-gray-800 py-4 bg-white dark:bg-gray-950"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex flex-col space-y-4">
                <Link href="/" className="text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors font-medium">
                  Home
                </Link>
                <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
                  Enterprise
                </Link>
                <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
                  About Us
                </Link>
                <Button onClick={handleRequestDemo} variant="outline" className="w-full">
                  Request a demo
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
        <div className="max-w-7xl mx-auto text-center">
          {/* Backed by section */}
          <motion.div 
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-gray-500 dark:text-gray-400 mb-8">
              <span className="font-medium">Backed by</span>
              <div className="flex items-center gap-4 sm:gap-6">
                <Badge variant="outline" className="px-4 py-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                  TechStars
                </Badge>
                <Badge variant="outline" className="px-4 py-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                  Y Combinator
                </Badge>
                <Badge variant="outline" className="px-4 py-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
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
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-8 leading-tight tracking-tight">
              World's first AI-powered{' '}
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                risk management platform
              </span>
            </h1>
          </motion.div>

          {/* Subheading */}
          <motion.p 
            className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
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
              className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 px-8 py-4 text-lg rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Get started
            </Button>
            <Button 
              onClick={handleRequestDemo}
              variant="outline" 
              size="lg"
              className="px-8 py-4 text-lg rounded-full font-semibold border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
            >
              Request a demo
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Main Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="border-0 shadow-xl h-full bg-white dark:bg-gray-800 hover:shadow-2xl transition-shadow duration-300">
                <CardContent className="p-8 lg:p-10">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6">
                      <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                      An expert on your risks
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                    Starts with deep knowledge of your organization. Like a risk manager who's been on your team for years, 
                    Riscura understands your business processes, compliance requirements, and risk history.
                  </p>
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
              <Card className="border-0 shadow-xl h-full bg-white dark:bg-gray-800 hover:shadow-2xl transition-shadow duration-300">
                <CardContent className="p-8 lg:p-10">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6">
                      <Brain className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                      Context-aware assessment
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                    Researches regulations, frameworks, and best practices, then curates the most relevant risk controls 
                    with clear implementation guidance.
                  </p>
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
              <Card className="border-0 shadow-xl h-full bg-white dark:bg-gray-800 hover:shadow-2xl transition-shadow duration-300">
                <CardContent className="p-8 lg:p-10">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-6">
                      <Target className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                      Strategic risk advisor
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                    Proposes risk mitigation strategies that align with your industry, your constraints, 
                    and how your business actually operates.
                  </p>
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
              <Card className="border-0 shadow-xl h-full bg-white dark:bg-gray-800 hover:shadow-2xl transition-shadow duration-300">
                <CardContent className="p-8 lg:p-10">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mb-6">
                      <Zap className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                      Faster compliance
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                    Evaluates regulatory changes and compliance gaps. Then seamlessly generates action plans 
                    grounded in your actual risk profile, not generic templates.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* MacBook Demo Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              See Riscura in action
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Watch how our AI-powered platform transforms risk management workflows
            </p>
          </motion.div>

          <MacbookScroll
            title={
              <span>
                Experience the future of <br />
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  risk management
                </span>
              </span>
            }
            badge={
              <Badge variant="outline" className="bg-white/10 border-white/20 text-white">
                Live Demo
              </Badge>
            }
            showGradient={false}
          />
        </div>
      </section>

      {/* Why Riscura Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight tracking-tight">
              Your AI risk manager,{' '}
              <span className="italic bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                fluent in _your_ organization.
              </span>
            </h2>
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto">
              Trusted by leading enterprise teams to identify, assess, and mitigate risks faster, with confidence.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Benefit 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Deeply embedded
              </h4>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                Builds risk-level reasoning from your live systems using a layered approach, 
                like an experienced risk manager on the team.
              </p>
            </motion.div>

            {/* Benefit 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Build resilience, not just compliance
              </h4>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                Risk management without organizational thinking breaks down later. 
                Riscura helps teams catch critical vulnerabilities early, avoiding incidents.
              </p>
            </motion.div>

            {/* Benefit 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Improve risk throughput
              </h4>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                Adds organizational context to your risk processes via integrations and APIs, 
                for faster, higher-quality risk management.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Loved by risk leaders
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Hear from real users.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <Card className="border-0 shadow-xl bg-white dark:bg-gray-800">
              <CardContent className="p-12 lg:p-16 text-center">
                <blockquote className="text-2xl sm:text-3xl lg:text-4xl text-gray-900 dark:text-white font-medium leading-relaxed mb-8">
                  "Riscura proposed a risk scenario I hadn't even considered. It felt like consulting with a 
                  Chief Risk Officer who had been working at our company for years."
                </blockquote>
                <div className="text-gray-600 dark:text-gray-300">
                  <p className="font-semibold text-lg">Sarah Chen</p>
                  <p className="text-base">Chief Risk Officer, TechCorp</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-8">
              Ready to transform your risk management?
            </h2>
            <Button 
              onClick={handleGetStarted}
              size="lg" 
              className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 px-8 py-4 text-lg rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Get started
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 lg:gap-8">
              <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
                Home
              </Link>
              <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
                Enterprise
              </Link>
              <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
                About us
              </Link>
              <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
                Legal
              </Link>
              <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
                Terms of Service
              </Link>
              <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
                Privacy Policy
              </Link>
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-center md:text-right">
              © 2025 Riscura. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 