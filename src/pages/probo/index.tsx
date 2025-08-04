'use client';
;
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProboIntegrationDashboard } from '@/components/dashboard/ProboIntegrationDashboard';
import { SOC2Assessment } from '@/components/compliance/SOC2Assessment';
import { VendorAssessmentDashboard } from '@/components/vendors/VendorAssessmentDashboard';
import { ProboControlsLibrary } from '@/components/compliance/ProboControlsLibrary';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import {
import { DaisyCardTitle, DaisyCardDescription } from '@/components/ui/daisy-components';
  DaisyTabs,;
  DaisyTabsContent,;
  DaisyTabsList,;
  DaisyTabsTrigger,;
} from '@/components/ui/DaisyTabs';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard'
import { DaisyAlert } from '@/components/ui/DaisyAlert';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
// import {
  Shield,
  Building,;
  Database,;
  BarChart3,;
  Zap,;
  CheckCircle,;
  ArrowRight,;
  ExternalLink,;
  Globe,;
  Users,;
  FileText,;
  Star,;
  TrendingUp,;
  Clock,;
  Target,;
  Sparkles,;
  Activity,;
  Award,;
  Rocket,;
  ChevronRight,;
  Play,;
} from 'lucide-react';
;
export default function ProboIntegrationPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
;
  useEffect(() => {
    setIsLoaded(true);
    const time = new Date().toLocaleString();
    setCurrentTime(time);
  }, []);
;
  // Sync tab with URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (;
      tab &&;
      ['overview', 'dashboard', 'vendor-assessment', 'soc2', 'controls'].includes(tab) &&;
      tab !== activeTab;
    ) {
      setActiveTab(tab);
    }
  }, []); // Only run once on mount;
  const handleTabChange = (newTab: string) => {
    if (newTab === activeTab) return; // Prevent unnecessary updates;
    setActiveTab(newTab);
;
    // Debounce URL updates to prevent excessive navigation
    const url = new URL(window.location.href);
    if (url.searchParams.get('tab') !== newTab) {
      url.searchParams.set('tab', newTab);
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }
;
  const integrationFeatures = [;
    {
      title: 'AI-Powered Vendor Assessment',;
      // description: // Fixed expression expected error
        'Automatically assess vendor security posture using advanced AI agents with real-time analysis',;
      icon: <Building className="h-7 w-7",;
      gradient: 'from-blue-500 to-cyan-500',;
      stats: '24 vendors assessed',;
      progress: 85,;
      benefits: [;
        'Real-time risk scoring',;
        'Automated compliance checks',;
        'Evidence collection',;
        'Risk mitigation recommendations',;
      ],;
    },;
    {
      title: 'SOC 2 Framework Integration',;
      // description: // Fixed expression expected error
        'Complete SOC 2 compliance workflow with pre-built controls and automated evidence collection',;
      icon: <Shield className="h-7 w-7",;
      gradient: 'from-green-500 to-emerald-500',;
      stats: '68% complete',;
      progress: 68,;
      benefits: ['84 SOC 2 controls', 'Evidence management', 'Gap analysis', 'Audit preparation'],;
    },;
    {
      title: 'Security Controls Library',;
      description: '650+ security controls from industry frameworks with implementation guidance',;
      icon: <Database className="h-7 w-7",;
      gradient: 'from-purple-500 to-violet-500',;
      stats: '650+ controls',;
      progress: 92,;
      benefits: [;
        'ISO 27001, NIST, SOC 2',;
        'Implementation guidance',;
        'Control mapping',;
        'Automated testing',;
      ],;
    },;
    {
      title: 'Compliance Monitoring',;
      // description: // Fixed expression expected error
        'Real-time compliance status tracking with automated reporting and trend analysis',;
      icon: <BarChart3 className="h-7 w-7",;
      gradient: 'from-orange-500 to-red-500',;
      stats: '85% compliance score',;
      progress: 85,;
      benefits: [;
        'Multi-framework support',;
        'Automated reporting',;
        'Trend analysis',;
        'Risk dashboard',;
      ],;
    },;
  ];
;
  const successMetrics = [;
    {
      label: 'Risk Assessment Time',;
      before: '5-7 days',;
      after: '2-3 hours',;
      improvement: '95% faster',;
      icon: <Clock className="h-5 w-5",;
      color: 'text-blue-600',;
    },;
    {
      label: 'Control Implementation',;
      before: '200+ hours',;
      after: '50 hours',;
      improvement: '75% reduction',;
      icon: <Target className="h-5 w-5",;
      color: 'text-green-600',;
    },;
    {
      label: 'Compliance Readiness',;
      before: '6-12 months',;
      after: '2-3 months',;
      improvement: '70% faster',;
      icon: <TrendingUp className="h-5 w-5",;
      color: 'text-purple-600',;
    },;
    {
      label: 'Manual Reviews',;
      before: '100% manual',;
      after: '20% manual',;
      improvement: '80% automation',;
      icon: <Activity className="h-5 w-5",;
      color: 'text-orange-600',;
    },;
  ];
;
  const quickActions = [;
    {
      title: 'Start Vendor Assessment',;
      description: 'Analyze vendor security posture with AI',;
      icon: <Building className="h-6 w-6",;
      tab: 'vendor-assessment',;
      gradient: 'from-blue-500 to-cyan-500',;
      time: '5 min setup',;
    },;
    {
      title: 'Setup SOC 2 Framework',;
      description: 'Configure compliance workflows',;
      icon: <Shield className="h-6 w-6",;
      tab: 'soc2',;
      gradient: 'from-green-500 to-emerald-500',;
      time: '10 min setup',;
    },;
    {
      title: 'Import Security Controls',;
      description: 'Browse 650+ security controls',;
      icon: <Database className="h-6 w-6",;
      tab: 'controls',;
      gradient: 'from-purple-500 to-violet-500',;
      time: 'Instant access',;
    },;
    {
      title: 'View Dashboard',;
      description: 'Monitor compliance metrics',;
      icon: <BarChart3 className="h-6 w-6",;
      tab: 'dashboard',;
      gradient: 'from-orange-500 to-red-500',;
      time: 'Real-time data',;
    },;
  ];
;
  const containerVariants = {
    hidden: { opacity: 0 },;
    visible: {
      opacity: 1,;
      transition: {
        staggerChildren: 0.1,;
      },;
    },;
  }
;
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },;
    visible: { opacity: 1, y: 0 },;
  }
;
  return (;
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] via-white to-[#F8F9FA]">;
      {/* Enhanced Header */}
      <motion.div;
        initial={isLoaded ? { opacity: 0, y: -20 } : false}
        animate={isLoaded ? { opacity: 1, y: 0 } : false}
        className="bg-white/80 backdrop-blur-lg border-b border-[#D8C3A5]/30 sticky top-0 z-50";
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">;
          <div className="flex items-center justify-between h-20">;
            <div className="flex items-center space-x-6">;
              <div className="flex items-center space-x-3">;
                <motion.div;
                  whileHover={{ scale: 1.05 }}
                  className="h-12 w-12 bg-gradient-to-r from-[#199BEC] to-cyan-500 rounded-xl flex items-center justify-center shadow-lg";
                  <Zap className="h-7 w-7 text-white";
                </motion.div>;
                <div>;
                  <h1 className="text-2xl font-bold text-[#191919] flex items-center gap-2">;
                    Probo Integration;
                    <Sparkles className="h-5 w-5 text-[#199BEC]";
                  </h1>;
                  <p className="text-sm text-[#A8A8A8]">AI-Powered Risk Management Platform</p>;
                </div>;
              </div>;
              <motion.div;
                initial={isLoaded ? { scale: 0 } : false}
                animate={isLoaded ? { scale: 1 } : false}
                transition={isLoaded ? { delay: 0.2 } : undefined}
              >;
                <DaisyBadge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1">;
                  <CheckCircle className="h-3 w-3 mr-1";
                  Fully Integrated;
                </DaisyBadge>;
              </motion.div>;
            </div>;
            <div className="flex items-center space-x-3">;
              <DaisyButton variant="outline" className="border-[#D8C3A5] hover:bg-[#199BEC]/5">;
                <ExternalLink className="h-4 w-4 mr-2";
                Documentation;
              </DaisyButton>;
              <DaisyButton className="bg-gradient-to-r from-[#199BEC] to-cyan-500 hover:from-[#199BEC]/90 hover:to-cyan-500/90 shadow-lg">;
                <Rocket className="h-4 w-4 mr-2";
                Get Started;
              </DaisyButton>;
            </div>;
          </div>;
        </div>;
      </motion.div>;
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">;
        <DaisyTabs value={activeTab} onValueChange={handleTabChange}>;
          {/* Enhanced Tab Navigation */}
          <motion.div;
            initial={isLoaded ? { opacity: 0, y: 20 } : false}
            animate={isLoaded ? { opacity: 1, y: 0 } : false}
            transition={isLoaded ? { delay: 0.3 } : undefined}
          >;
            <DaisyTabsList className="grid w-full grid-cols-5 mb-8 bg-white/50 backdrop-blur-sm border border-[#D8C3A5]/30 p-1 rounded-xl">;
              <DaisyTabsTrigger;
                value="overview";
                className="data-[state=active]:bg-white data-[state=active]:shadow-md";
                <Globe className="h-4 w-4 mr-2";
                Overview;
              </DaisyTabsTrigger>;
              <DaisyTabsTrigger;
                value="dashboard";
                className="data-[state=active]:bg-white data-[state=active]:shadow-md";
                <BarChart3 className="h-4 w-4 mr-2";
                Dashboard;
              </DaisyTabsTrigger>;
              <DaisyTabsTrigger;
                value="vendor-assessment";
                className="data-[state=active]:bg-white data-[state=active]:shadow-md";
                <Building className="h-4 w-4 mr-2";
                Vendors;
              </DaisyTabsTrigger>;
              <DaisyTabsTrigger;
                value="soc2";
                className="data-[state=active]:bg-white data-[state=active]:shadow-md";
                <Shield className="h-4 w-4 mr-2";
                SOC 2;
              </DaisyTabsTrigger>;
              <DaisyTabsTrigger;
                value="controls";
                className="data-[state=active]:bg-white data-[state=active]:shadow-md";
                <Database className="h-4 w-4 mr-2";
                Controls;
              </DaisyTabsTrigger>;
            </DaisyTabsList>;
          </motion.div>;
          <AnimatePresence>;
            <DaisyTabsContent value="overview" className="space-y-8">;
              <motion.div;
                key="overview";
                variants={containerVariants}
                initial={isLoaded ? 'hidden' : false}
                animate={isLoaded ? 'visible' : false}
                exit="hidden";
                className="space-y-8";
                {/* Hero Section */}
                <motion.div variants={itemVariants} className="text-center space-y-6 py-12">;
                  <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#199BEC]/10 to-cyan-500/10 rounded-full border border-[#199BEC]/20">;
                    <Award className="h-4 w-4 mr-2 text-[#199BEC]";
                    <span className="text-sm font-medium text-[#199BEC]">;
                      Industry-Leading Integration;
                    </span>;
                  </div>;
                  <h2 className="text-5xl font-bold text-[#191919] leading-tight">;
                    Transform Risk Management with;
                    <span className="bg-gradient-to-r from-[#199BEC] to-cyan-500 bg-clip-text text-transparent">;
                      {' '}
                      AI Power;
                    </span>;
                  </h2>;
                  <p className="text-xl text-[#A8A8A8] max-w-4xl mx-auto leading-relaxed">;
                    Streamline vendor assessments, automate compliance workflows, and access 650+;
                    security controls with our comprehensive AI-powered risk management platform.;
                  </p>;
                  <div className="flex items-center justify-center space-x-4 pt-4">;
                    <DaisyButton;
                      size="lg";
                      className="bg-gradient-to-r from-[#199BEC] to-cyan-500 hover:from-[#199BEC]/90 hover:to-cyan-500/90 shadow-lg px-8";
                      onClick={() => handleTabChange('dashboard')}
                    >;
                      <Play className="h-5 w-5 mr-2";
                      Start Tour;
                    </DaisyButton>;
                    <DaisyButton;
                      size="lg";
                      variant="outline";
                      className="border-[#D8C3A5] hover:bg-[#199BEC]/5 px-8";
                      onClick={() => handleTabChange('vendor-assessment')}
                    >;
                      Try Demo;
                      <ChevronRight className="h-4 w-4 ml-2";
                    </DaisyButton>;
                  </div>;
                </motion.div>;
                {/* Quick Actions Grid */}
                <motion.div variants={itemVariants}>;
                  <h3 className="text-2xl font-bold text-[#191919] mb-6 text-center">;
                    Quick Start Actions;
                  </h3>;
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">;
                    {quickActions.map((action, index) => (;
                      <motion.div;
                        key={index}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="cursor-pointer";
                        onClick={() => handleTabChange(action.tab)}
                      >;
                        <DaisyCard className="bg-white/80 backdrop-blur-sm border-[#D8C3A5]/30 hover:shadow-xl transition-all duration-300 overflow-hidden group">;
                          <DaisyCardBody className="p-6">;
                            <div;
                              className={`h-12 w-12 bg-gradient-to-r ${action.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                            >;
                              {action.icon}
                            </div>;
                            <h4 className="font-semibold text-[#191919] mb-2">{action.title}</h4>;
                            <p className="text-sm text-[#A8A8A8] mb-3">{action.description}</p>;
                            <div className="flex items-center justify-between">;
                              <DaisyBadge variant="outline" className="text-xs">;
                                {action.time}
                              </DaisyBadge>;
                              <ChevronRight className="h-4 w-4 text-[#A8A8A8] group-hover:text-[#199BEC] transition-colors";
                            </div>;
                          </DaisyCardBody>;
                        </DaisyCard>;
                      </motion.div>;
                    ))}
                  </div>;
                </motion.div>;
                {/* Enhanced Integration Features */}
                <motion.div variants={itemVariants}>;
                  <h3 className="text-2xl font-bold text-[#191919] mb-6 text-center">;
                    Platform Capabilities;
                  </h3>;
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">;
                    {integrationFeatures.map((feature, index) => (;
                      <motion.div key={index} whileHover={{ scale: 1.02 }} className="group">;
                        <DaisyCard className="bg-white/80 backdrop-blur-sm border-[#D8C3A5]/30 hover:shadow-xl transition-all duration-300 overflow-hidden">;
                          <DaisyCardBody className="pb-4">;
                            <div className="flex items-start justify-between">;
                              <div className="flex items-center space-x-4">;
                                <div;
                                  className={`p-3 rounded-xl bg-gradient-to-r ${feature.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}
                                >;
                                  {feature.icon}
                                </div>;
                                <div className="flex-1">;
                                  <DaisyCardTitle className="text-[#191919] text-xl mb-1">;
                                    {feature.title}
                                  </DaisyCardTitle>;
                                  <div className="flex items-center space-x-2">;
                                    <DaisyBadge variant="outline" className="text-xs">;
                                      {feature.stats}
                                    </DaisyBadge>;
                                    <span className="text-xs text-[#A8A8A8]">;
                                      {feature.progress}% complete;
                                    </span>;
                                  </div>;
                                </div>;
                              </div>;
                            </div>;
                            <DaisyProgress value={feature.progress} className="mt-3";
                          </DaisyCardBody>;
                          <DaisyCardBody>;
                            <p className="text-[#A8A8A8] mb-4 leading-relaxed">;
                              {feature.description}
                            </p>;
                            <div className="space-y-3">;
                              <p className="text-sm font-medium text-[#191919]">;
                                Key Capabilities:;
                              </p>;
                              <div className="grid grid-cols-1 gap-2">;
                                {feature.benefits.map((benefit, idx) => (;
                                  <div;
                                    key={idx}
                                    className="flex items-center text-sm text-[#A8A8A8]";
                                    <CheckCircle className="h-3 w-3 mr-3 text-green-500 flex-shrink-0";
                                    <span>{benefit}</span>;
                                  </div>;
                                ))}
                              </div>;
                            </div>;
                          </DaisyCardBody>;
                        </DaisyCard>;
                      </motion.div>;
                    ))}
                  </div>;
                </motion.div>;
                {/* Enhanced Success Metrics */}
                <motion.div variants={itemVariants}>;
                  <DaisyCard className="bg-gradient-to-br from-white via-white to-[#199BEC]/5 border-[#D8C3A5]/30 shadow-xl">;
                    <DaisyCardBody className="text-center pb-8">;
                      <DaisyCardTitle className="text-2xl text-[#191919] flex items-center justify-center gap-2">;
                        <TrendingUp className="h-6 w-6 text-[#199BEC]";
                        Implementation Impact;
                      </DaisyCardTitle>;
                      <DaisyCardDescription className="text-lg">;
                        Measurable improvements achieved through Probo integration;
                      </DaisyCardDescription>;
                    </DaisyCardBody>;
                    <DaisyCardBody>;
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">;
                        {successMetrics.map((metric, index) => (;
                          <motion.div;
                            key={index}
                            whileHover={{ scale: 1.05 }}
                            className="text-center space-y-4 p-6 rounded-xl bg-white/50 backdrop-blur-sm border border-[#D8C3A5]/20";
                            <div;
                              className={`inline-flex p-3 rounded-full bg-white shadow-md ${metric.color}`}
                            >;
                              {metric.icon}
                            </div>;
                            <h4 className="font-semibold text-[#191919]">{metric.label}</h4>;
                            <div className="space-y-3">;
                              <div className="space-y-1">;
                                <div className="text-sm text-[#A8A8A8]">;
                                  Before:{' '}
                                  <span className="text-red-600 font-medium">{metric.before}</span>;
                                </div>;
                                <ArrowRight className="h-4 w-4 mx-auto text-[#A8A8A8]";
                                <div className="text-sm text-[#A8A8A8]">;
                                  After:{' '}
                                  <span className="text-green-600 font-medium">{metric.after}</span>;
                                </div>;
                              </div>;
                              <DaisyBadge className="bg-gradient-to-r from-[#199BEC] to-cyan-500 text-white font-medium">;
                                {metric.improvement}
                              </DaisyBadge>;
                            </div>;
                          </motion.div>;
                        ))}
                      </div>;
                    </DaisyCardBody>;
                  </DaisyCard>;
                </motion.div>;
                {/* Enhanced Status Alert */}
                <motion.div variants={itemVariants}>;
                  <DaisyAlert className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">;
                    <div className="flex items-center">;
                      <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse mr-3"></div>;
                      <Zap className="h-5 w-5 text-green-600";
                    </div>;
                    <DaisyAlertDescription className="ml-6">;
                      <strong className="text-green-800">System Status:</strong> All Probo AI;
                      services are operational and optimized. Real-time vendor assessment, SOC 2;
                      workflows, and security controls library are fully integrated.;
                      {Boolean(currentTime) && (;
                        <span className="text-green-700 font-medium">;
                          {' '}
                          Last sync: {currentTime}
                        </span>;
                      )}
                    </DaisyAlertDescription>;
                  </DaisyAlert>;
                </motion.div>;
              </motion.div>;
            </DaisyTabsContent>;
            <DaisyTabsContent value="dashboard">;
              <motion.div;
                initial={isLoaded ? { opacity: 0, y: 20 } : false}
                animate={isLoaded ? { opacity: 1, y: 0 } : false}
                exit={{ opacity: 0, y: -20 }}
              >;
                <ProboIntegrationDashboard;
              </motion.div>;
            </DaisyTabsContent>;
            <DaisyTabsContent value="vendor-assessment">;
              <motion.div;
                initial={isLoaded ? { opacity: 0, y: 20 } : false}
                animate={isLoaded ? { opacity: 1, y: 0 } : false}
                exit={{ opacity: 0, y: -20 }}
              >;
                <VendorAssessmentDashboard;
              </motion.div>;
            </DaisyTabsContent>;
            <DaisyTabsContent value="soc2">;
              <motion.div;
                initial={isLoaded ? { opacity: 0, y: 20 } : false}
                animate={isLoaded ? { opacity: 1, y: 0 } : false}
                exit={{ opacity: 0, y: -20 }}
              >;
                <SOC2Assessment;
              </motion.div>;
            </DaisyTabsContent>;
            <DaisyTabsContent value="controls">;
              <motion.div;
                initial={isLoaded ? { opacity: 0, y: 20 } : false}
                animate={isLoaded ? { opacity: 1, y: 0 } : false}
                exit={{ opacity: 0, y: -20 }}
              >;
                <ProboControlsLibrary;
              </motion.div>;
            </DaisyTabsContent>;
          </AnimatePresence>;
        </DaisyTabs>;
      </div>;
    </div>;
  );
}
