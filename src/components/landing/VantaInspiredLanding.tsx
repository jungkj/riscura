'use client';

import { useState, useEffect } from 'react';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard'
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyCardTitle } from '@/components/ui/daisy-components';
import { Sparkles } from 'lucide-react';
// import { 
  Shield, 
  CheckCircle, 
  ArrowRight, 
  BarChart3, 
  Users, 
  Lock, 
  TrendingUp,
  Brain,
  Zap,
  FileText,
  Globe,
  Target,
  Eye,
  Settings,
  ChevronRight,
  Play,
  Star,
  Award,
  Sparkles
} from 'lucide-react'
import { useRouter } from 'next/navigation';

export default function VantaInspiredLanding() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: Shield,
      title: "Fast, accurate, automated risk assessments",
      description: "Leverage automation to reduce the time it takes to gather all the evidence you need and use AI to accelerate the risk assessment process.",
      stats: "62% faster risk evidence collection time",
      color: "text-[#199BEC]"
    },
    {
      icon: Target,
      title: "Risk management, tailored to your program",
      description: "Leverage out-of-the-box templates for evaluating risk, or customize inherent and residual risk scoring as your program matures.",
      stats: "54% increased productivity gains after adopting Riscura",
      color: "text-[#199BEC]"
    },
    {
      icon: Eye,
      title: "Automatic risk discovery for shadow processes",
      description: "Automatically identify risks and stay on top of potential blind spots, to make sure all processes meet your security and compliance standards.",
      stats: "90% improvement in risk visibility",
      color: "text-[#199BEC]"
    },
    {
      icon: BarChart3,
      title: "Integrated risk across your entire program",
      description: "No more juggling between fragmented views. With Riscura, risk becomes a clear, actionable part of your team's unified program.",
      stats: "Complete risk program integration",
      color: "text-[#199BEC]"
    }
  ];

  const capabilities = [
    {
      icon: Shield,
      title: "Trust demonstration",
      description: "Riscura offers capabilities for both risk managers and stakeholders to prove trust, automate security reviews, and share real-time security data."
    },
    {
      icon: Zap,
      title: "Automation",
      description: "Riscura has 375+ integrations with cloud providers, HRIS systems, task trackers, and much more to automatically collect evidence for compliance and continuously monitor security posture."
    },
    {
      icon: Settings,
      title: "Extensibility", 
      description: "Riscura supports the industry's only Connectors API which lets partners build custom integrations. Riscura also allows you to build an integration to any third-party application."
    },
    {
      icon: FileText,
      title: "Leading security and privacy frameworks",
      description: "Riscura offers support for over 35+ industry leading compliance frameworks plus the ability to customize your own."
    },
    {
      icon: Users,
      title: "Access Reviews",
      description: "Riscura's solution automates and accelerates the access review process, saving time and money and reducing the risk of misused credentials."
    },
    {
      icon: Globe,
      title: "Risk Management",
      description: "Riscura automates risk discovery, assessment, and remediation to streamline risk reviews and eliminate shadow processes."
    },
    {
      icon: Brain,
      title: "Riscura AI",
      description: "Riscura AI works across your security and compliance workflows, helping you instantly pull data from security reports, automate high-confidence answers to security questionnaires, and more."
    },
    {
      icon: Target,
      title: "Workspaces",
      description: "Riscura Workspaces lets you customize and manage compliance for multiple business units within a single Riscura account."
    }
  ];

  const aiFeatures = [
    {
      title: "Review security docs instantly",
      description: "Riscura AI automatically extracts findings from SOC 2 reports, custom security questionnaires, and other documents, helping you complete security reviews in record time.",
      action: "Learn more"
    },
    {
      title: "Complete questionnaires in minutes", 
      description: "Riscura AI instantly generates answers for your uploaded security questionnaires using insights from your library and past responses. Easily accept or reject these suggestions to respond to customers quickly.",
      action: "Learn more"
    },
    {
      title: "Maintain controls effortlessly",
      description: "Riscura AI provides smart suggestions to map existing tests and policies to relevant controls, making it easy to demonstrate compliance with new frameworks.",
      action: "Learn more"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#199BEC] rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Riscura</span>
              </div>
              
              <div className="hidden md:flex items-center space-x-6">
                <div className="relative group">
                  <button className="text-gray-700 hover:text-[#199BEC] font-medium flex items-center space-x-1">
                    <span>Product</span>
                    <ChevronRight className="w-4 h-4 transform group-hover:rotate-90 transition-transform" />
                  </button>
                </div>
                <div className="relative group">
                  <button className="text-gray-700 hover:text-[#199BEC] font-medium flex items-center space-x-1">
                    <span>Solutions</span>
                    <ChevronRight className="w-4 h-4 transform group-hover:rotate-90 transition-transform" />
                  </button>
                </div>
                <button className="text-gray-700 hover:text-[#199BEC] font-medium">Resources</button>
                <button className="text-gray-700 hover:text-[#199BEC] font-medium">Customers</button>
                <button className="text-gray-700 hover:text-[#199BEC] font-medium">Plans</button>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="text-gray-700 hover:text-[#199BEC] font-medium">Login</button>
              <DaisyButton 
                className="bg-[#199BEC] hover:bg-[#0f7dc7] text-white px-6"
                onClick={() =>
          router.push('/register')} />
                Request a demo
              
        </DaisyButton>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#199BEC]/5 via-white to-purple-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center">
            <DaisyBadge className="bg-[#199BEC] text-white px-6 py-2 mb-8 text-sm rounded-full" >
  <Sparkles className="w-4 h-4 mr-2" />
</DaisyBadge>
              Introducing Riscura AI: Powering the future of risk management
            </DaisyBadge>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Risk Management that turns
              <br />
              <span className="text-[#199BEC]">checkboxes into insights</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Riscura helps you identify risk with AI-powered assessments, continuous monitoring, 
              and proactive risk management. Go from tedious, point-in-time reviews to collaborative 
              workflows—and do more with less.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <DaisyButton 
                size="lg" 
                className="bg-[#199BEC] hover:bg-[#0f7dc7] text-white px-8 py-4 text-lg"
                onClick={() => router.push('/register')} />
                Request a demo
                <ArrowRight className="w-5 h-5 ml-2" />
              </DaisyButton>
              <DaisyButton 
                variant="outline" 
                size="lg" 
                className="border-gray-300 text-gray-700 hover:border-[#199BEC] hover:text-[#199BEC] px-8 py-4 text-lg" >
  <Play className="w-5 h-5 mr-2" />
</DaisyButton>
                Watch demo
              </DaisyButton>
            </div>
            
            <div className="mt-12 flex justify-center items-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span>Trusted by 8,000+ companies</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-[#199BEC]" />
                <span>SOC 2 Type II Certified</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Spend up to 50% less time on risk assessments
            </h2>
            <p className="text-lg text-gray-600">
              Pull findings from assessments, reports, questionnaires, and more, to help customers 
              cut risk assessment times in half.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-[#199BEC] mb-2">62%</div>
              <div className="text-gray-600">faster risk evidence collection time</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-[#199BEC] mb-2">54%</div>
              <div className="text-gray-600">increased productivity gains</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-[#199BEC] mb-2">90%</div>
              <div className="text-gray-600">improvement in risk visibility</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {features.map((feature, index) => (
            <div key={index} className={`flex flex-col lg:flex-row items-center gap-12 mb-20 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
              <div className="flex-1">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">{feature.description}</p>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="text-2xl font-bold text-[#199BEC]">{feature.stats}</div>
                </div>
                <DaisyButton className="bg-[#199BEC] hover:bg-[#0f7dc7] text-white">
          Request a demo

        </DaisyButton>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </DaisyButton>
              </div>
              <div className="flex-1">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 shadow-lg">
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <feature.icon className={`w-12 h-12 ${feature.color} mb-4`} />
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-[#199BEC]/20 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI Features Section */}
      <section className="py-20 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Leave the busy work to AI
            </h2>
            <p className="text-xl text-purple-100">
              From risk assessments and questionnaires to managing compliance controls,
              Riscura AI helps you work smarter.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {aiFeatures.map((feature, index) => (
              <DaisyCard key={index} className="bg-white/10 backdrop-blur-sm border-white/20 text-white" >
  <DaisyCardBody >
</DaisyCard>
                  <DaisyCardTitle className="text-xl">{feature.title}</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <p className="text-purple-100 mb-4">
</DaisyCardBody>{feature.description}</p>
                  <DaisyButton variant="outline" className="border-white/30 text-white hover:bg-white/10">
          {feature.action}

        </DaisyButton>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </DaisyButton>
                </DaisyCardBody>
              </DaisyCard>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Capabilities you can count on
            </h2>
            <p className="text-xl text-gray-600">
              Riscura's platform provides guidance for those starting out and flexibility 
              for more mature security and compliance teams.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {capabilities.map((capability, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-[#199BEC]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <capability.icon className="w-8 h-8 text-[#199BEC]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{capability.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{capability.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#199BEC]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-4">
            Get compliant and build trust—fast
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of companies that trust Riscura to manage their risk and compliance programs.
          </p>
          <DaisyButton 
            size="lg" 
            className="bg-white text-[#199BEC] hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
            onClick={() => router.push('/register')} />
            Request a demo
            <ArrowRight className="w-5 h-5 ml-2" />
          </DaisyButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-[#199BEC] rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Riscura</span>
              </div>
              <p className="text-gray-400 text-sm">
                AI-powered risk management platform for modern enterprises.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Risk Management</a></li>
                <li><a href="#" className="hover:text-white">Compliance</a></li>
                <li><a href="#" className="hover:text-white">AI Features</a></li>
                <li><a href="#" className="hover:text-white">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Solutions</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Enterprise</a></li>
                <li><a href="#" className="hover:text-white">Mid-market</a></li>
                <li><a href="#" className="hover:text-white">Startup</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© 2024 Riscura. All rights reserved.</p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 