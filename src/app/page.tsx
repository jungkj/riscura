"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { TimeSavingChart } from '@/components/charts/TimeSavingChart';
import { FloatingNav, StaticNav } from '@/components/ui/floating-navbar';
import { IntegrationsCarousel } from '@/components/landing/IntegrationsCarousel';
import { cn } from '@/lib/utils';

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
  AlertTriangle,
  Play,
  Pause,
  Star
} from 'lucide-react';

// Enhanced Animated Background Component (Palace.so inspired)
const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    updateCanvasSize();
    
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      color: string;
    }> = [];
    
    const colors = [
      'rgba(224, 242, 254, 0.8)', // light blue
      'rgba(252, 231, 243, 0.8)', // light pink
      'rgba(240, 249, 255, 0.8)', // very light blue
      'rgba(237, 233, 254, 0.8)', // light purple
      'rgba(236, 253, 245, 0.8)'  // light green
    ];
    
    // Create more particles for better visibility
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: Math.random() * 4 + 2,
        opacity: Math.random() * 0.7 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Bounce off edges
        if (particle.x <= 0 || particle.x >= canvas.width) particle.vx *= -1;
        if (particle.y <= 0 || particle.y >= canvas.height) particle.vy *= -1;
        
        // Keep particles within bounds
        particle.x = Math.max(0, Math.min(canvas.width, particle.x));
        particle.y = Math.max(0, Math.min(canvas.height, particle.y));
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity;
        ctx.fill();
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
    
    window.addEventListener('resize', updateCanvasSize);
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

// Hero headline component with premium styling
function PremiumHeadline() {
  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
        <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-light text-gray-900 leading-[0.9] tracking-tight">
          <span className="font-thin">Your enterprise's</span>
          <br />
          <span className="font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
            AI risk observer
          </span>
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-8 text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-light"
        >
          One platform for enterprise risk management. Monitor, assess, and mitigate
          <br />
          business risks with AI-powered intelligence.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-8 flex items-center justify-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-white/20 backdrop-blur border border-white/30">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-amber-500 fill-current" />
              ))}
            </div>
            <span className="text-sm text-gray-700">Trusted by Fortune 500</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// Premium Dashboard Showcase Component (Runway inspired)
const DashboardShowcase = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.8 }}
      className="mt-16 relative"
    >
      <div className="relative mx-auto max-w-6xl">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white/80 backdrop-blur border border-white/20">
          {/* Browser Chrome */}
          <div className="bg-gray-50/80 backdrop-blur px-6 py-3 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="text-sm text-gray-500 font-mono">riscura.com/dashboard</div>
            </div>
          </div>
          
          {/* Dashboard Content Area - Placeholder for screenshot */}
          <div className="h-96 bg-gradient-to-br from-blue-50 to-purple-50 p-8 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto">
                <BarChart3 className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900">Dashboard Preview</h3>
              <p className="text-gray-600 max-w-md">
                Replace this section with your actual dashboard screenshot to showcase your product
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Live Demo Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Runway.com Style Feature Showcase with Folding Cards
const RunwayFeatureShowcase = () => {
  const [activeStep, setActiveStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const steps = [
    {
      id: 'analyze',
      icon: Sparkles,
      title: "Analyze with AI",
      subtitle: "Beta",
      description: "Accelerate workflows, drill into variance, and deeply understand your business.",
      cta: "Get a personalized sneak peek",
      image: "/api/placeholder/600/400" // Replace with actual screenshot
    },
    {
      id: 'shape',
      icon: Target,
      title: "Shape data to your business logic",
      subtitle: "",
      description: "Create flexible, structured models built to scale. Define custom inputs, tie in dimensions, and reuse inputs across plans.",
      cta: "",
      image: "/api/placeholder/600/400" // Replace with actual screenshot
    },
    {
      id: 'plan',
      icon: TrendingUp,
      title: "Plan scenarios with confidence",
      subtitle: "",
      description: "Build multiple versions of the future. Compare scenarios side-by-side and understand the impact of your decisions.",
      cta: "",
      image: "/api/placeholder/600/400" // Replace with actual screenshot
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <section ref={containerRef} className="py-32 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left side - Sticky content */}
          <div className="lg:sticky lg:top-32 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 mb-8 leading-tight">
                Turn complexity into
                <br />
                <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  conviction
                </span>
              </h2>
              
              <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-2xl p-6 shadow-lg">
                <p className="text-lg text-gray-600 italic mb-4">
                  "Incredibly flexible and fun risk management copilot"
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-500 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">G2 Review</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right side - Feature cards */}
          <div className="space-y-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                {/* Feature Card */}
                <div 
                  className={`rounded-3xl overflow-hidden transition-all duration-700 ${
                    activeStep === index 
                      ? 'shadow-2xl scale-105 bg-white border border-gray-200' 
                      : 'shadow-lg scale-100 bg-gray-50/80 border border-gray-100'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-8 pb-4">
                    <div className="flex items-start gap-4 mb-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-300 ${
                        activeStep === index 
                          ? 'bg-gradient-to-br from-blue-100 to-purple-100' 
                          : 'bg-gray-100'
                      }`}>
                        <step.icon className={`w-6 h-6 transition-colors duration-300 ${
                          activeStep === index ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {step.title}
                          {step.subtitle && (
                            <span className="ml-2 inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">
                              {step.subtitle}
                            </span>
                          )}
                        </h3>
                        <p className="text-gray-600 mb-4">{step.description}</p>
                        {step.cta && (
                          <button className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
                            {step.cta}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Folding Image Section */}
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ 
                      height: activeStep === index ? 300 : 0,
                      opacity: activeStep === index ? 1 : 0
                    }}
                    transition={{ 
                      duration: 0.6, 
                      ease: "easeInOut",
                      opacity: { delay: activeStep === index ? 0.2 : 0 }
                    }}
                    className="overflow-hidden"
                  >
                    <div className="px-8 pb-8">
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl h-72 flex items-center justify-center border border-gray-200/50">
                        {/* Placeholder for screenshot */}
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center mx-auto">
                            <step.icon className="w-8 h-8 text-blue-600" />
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-900">Dashboard Screenshot</h4>
                            <p className="text-sm text-gray-600 max-w-sm">
                              Replace with actual {step.title.toLowerCase()} dashboard screenshot
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Active indicator */}
                  {activeStep === index && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 5, ease: "linear" }}
                      className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

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
    <div className="min-h-screen font-inter bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 relative overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <AnimatedBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/50 to-white/80" />
      </div>
      
      {/* Static Navbar */}
      <StaticNav />
      
      {/* Floating Navbar */}
      <FloatingNav navItems={navItems} />

      {/* Premium Hero Section */}
      <section className="relative z-10 pt-32 pb-16 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center justify-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center space-y-12">
            <PremiumHeadline />
            
            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="px-12 py-4 text-lg rounded-full font-medium bg-gray-900 hover:bg-gray-800 text-white border-0 min-w-[200px] shadow-lg"
              >
                Get started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                onClick={handleRequestDemo}
                variant="outline"
                size="lg"
                className="px-12 py-4 text-lg rounded-full font-medium min-w-[200px] bg-white/80 backdrop-blur border-gray-200 hover:bg-white/90"
              >
                Request demo
              </Button>
            </motion.div>

            {/* Premium Dashboard Showcase */}
            <DashboardShowcase />
          </div>
        </div>
      </section>

      {/* Runway.com Style Feature Showcase */}
      <RunwayFeatureShowcase />

      {/* Integrations Carousel */}
      <IntegrationsCarousel />

      {/* Time Savings Chart Section */}
      <TimeSavingChart />

      {/* Premium Features Section */}
      <section className="relative z-10 py-32 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <Badge className="bg-gray-100 text-gray-700 px-6 py-3 text-sm font-medium rounded-full">
                Enterprise Platform
              </Badge>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-tight tracking-tight">
                Built for modern<br />
                <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">enterprise security</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-light">
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
                <Card className="bg-white/80 backdrop-blur border border-gray-200/50 h-full hover:shadow-2xl hover:border-blue-200 transition-all duration-500 group rounded-3xl overflow-hidden">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-4 font-light">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-6">
                      {feature.description}
                    </p>
                    <ul className="space-y-3">
                      {feature.features.map((item, idx) => (
                        <li key={idx} className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-emerald-500 mr-3 flex-shrink-0" />
                          <span className="text-gray-700 font-medium">{item}</span>
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

      {/* Premium CTA Section */}
      <section className="relative z-10 py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/20 overflow-hidden">
          <div className="max-w-6xl mx-auto text-center relative">
            <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <Badge className="bg-gray-900 text-white px-6 py-3 text-sm font-medium rounded-full">
              Get Started Today
            </Badge>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-tight tracking-tight">
              Ready to secure<br />
              <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">your enterprise?</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-light">
              Join thousands of organizations that trust Riscura to protect their business 
              and ensure compliance in an ever-changing risk landscape.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="px-12 py-4 text-lg font-medium min-w-[220px] rounded-full bg-gray-900 hover:bg-gray-800 text-white shadow-lg"
              >
                Start free trial
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                onClick={handleRequestDemo}
                variant="outline"
                size="lg"
                className="px-12 py-4 text-lg font-medium min-w-[220px] rounded-full bg-white/80 backdrop-blur border-gray-200 hover:bg-white/90"
              >
                Schedule demo
              </Button>
            </div>

            {/* Trust Elements */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto mt-16">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-gray-900 font-semibold text-lg">Enterprise Security</p>
                <p className="text-gray-600 text-sm">SOC 2 & ISO 27001 Compliant</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-gray-900 font-semibold text-lg">24/7 Support</p>
                <p className="text-gray-600 text-sm">Dedicated success team</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-gray-900 font-semibold text-lg">Proven ROI</p>
                <p className="text-gray-600 text-sm">Measurable efficiency gains</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="relative z-10 bg-white border-t border-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-8">
              <Image
                src="/images/logo/riscura.png"
                alt="Riscura Logo"
                width={48}
                height={48}
                className="object-contain"
              />
              <span className="text-3xl font-light text-gray-900">Riscura</span>
            </div>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto font-light">
              Enterprise risk management platform powered by AI. Secure your business with intelligent automation.
            </p>
            <div className="flex items-center justify-center space-x-8 mb-12">
              <Badge variant="outline" className="border-gray-200 text-gray-600 bg-gray-50/50 px-4 py-2 rounded-full">
                SOC 2 Type II
              </Badge>
              <Badge variant="outline" className="border-gray-200 text-gray-600 bg-gray-50/50 px-4 py-2 rounded-full">
                ISO 27001
              </Badge>
              <Badge variant="outline" className="border-gray-200 text-gray-600 bg-gray-50/50 px-4 py-2 rounded-full">
                GDPR Ready
              </Badge>
            </div>
            <p className="text-gray-500 font-light">
              © 2024 Riscura Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}