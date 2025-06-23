'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Target,
  Lightbulb,
  CheckCircle,
  Info,
  HelpCircle,
  BookOpen,
  Video,
  MousePointer,
  Keyboard,
  Eye,
  Hand,
  Zap,
  Star,
  Award,
  Flag,
  MapPin,
  Navigation,
  Compass,
  Route,
  Home,
  Settings,
  Users,
  BarChart3,
  Shield,
  FileText,
  Brain,
  Search,
  Filter,
  Plus,
  Edit,
  Save,
  Download,
  Upload,
  Calendar,
  Bell,
  User,
  Menu,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Clock
} from 'lucide-react';

// Types
interface TourStep {
  id: string;
  title: string;
  description: string;
  content: string;
  targetSelector?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'hover' | 'type' | 'scroll' | 'wait';
  actionText?: string;
  highlightElement?: boolean;
  showArrow?: boolean;
  isOptional?: boolean;
  estimatedTime?: string;
  tips?: string[];
  nextStepDelay?: number;
  category: 'navigation' | 'features' | 'workflows' | 'settings' | 'advanced';
}

interface TourConfig {
  id: string;
  title: string;
  description: string;
  category: string;
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];
  steps: TourStep[];
}

interface GuidedTourProps {
  tourId?: string;
  autoStart?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
  showProgress?: boolean;
  allowSkip?: boolean;
  customSteps?: TourStep[];
}

export default function GuidedTour({
  tourId = 'platform-overview',
  autoStart = false,
  onComplete,
  onSkip,
  showProgress = true,
  allowSkip = true,
  customSteps
}: GuidedTourProps) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [tourPosition, setTourPosition] = useState({ x: 0, y: 0 });
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const tourRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Tour configurations
  const tourConfigs: Record<string, TourConfig> = {
    'platform-overview': {
      id: 'platform-overview',
      title: 'Platform Overview',
      description: 'Get familiar with the main features and navigation',
      category: 'Getting Started',
      estimatedTime: '5-7 minutes',
      difficulty: 'beginner',
      steps: [
        {
          id: 'welcome',
          title: 'Welcome to Riscura',
          description: 'Your AI-powered risk management platform',
          content: 'Welcome to Riscura! This guided tour will help you understand the key features and how to navigate the platform effectively. You can pause, skip, or restart this tour at any time.',
          position: 'center',
          category: 'navigation',
          estimatedTime: '30s',
          tips: [
            'You can access this tour anytime from the Help menu',
            'Use keyboard shortcuts: Space to pause/play, Arrow keys to navigate',
            'Click anywhere outside to pause the tour'
          ]
        },
        {
          id: 'main-navigation',
          title: 'Main Navigation',
          description: 'Learn about the sidebar navigation',
          content: 'The sidebar contains all main sections of the platform. Click on any section to explore different areas like Dashboard, Risk Management, Compliance, and more.',
          targetSelector: '[data-tour="sidebar"]',
          position: 'right',
          action: 'hover',
          actionText: 'Hover over the sidebar',
          highlightElement: true,
          showArrow: true,
          category: 'navigation',
          estimatedTime: '45s',
          tips: [
            'The sidebar can be collapsed for more screen space',
            'Active sections are highlighted in blue',
            'Use Ctrl+B to toggle sidebar visibility'
          ]
        },
        {
          id: 'dashboard-overview',
          title: 'Dashboard Overview',
          description: 'Your central command center',
          content: 'The dashboard provides a high-level view of your risk posture, compliance status, and key metrics. All widgets are interactive and provide drill-down capabilities.',
          targetSelector: '[data-tour="dashboard-content"]',
          position: 'top',
          highlightElement: true,
          category: 'features',
          estimatedTime: '1m',
          tips: [
            'Widgets can be customized and rearranged',
            'Click on any metric to see detailed reports',
            'Use the date picker to view historical data'
          ]
        },
        {
          id: 'quick-actions',
          title: 'Quick Actions Hub',
          description: 'Streamlined workflows for common tasks',
          content: 'The Quick Actions hub organizes common tasks into workflow-based categories. This helps you complete tasks more efficiently by following guided processes.',
          targetSelector: '[data-tour="quick-actions"]',
          position: 'bottom',
          action: 'click',
          actionText: 'Click to explore Quick Actions',
          highlightElement: true,
          showArrow: true,
          category: 'workflows',
          estimatedTime: '1m 30s',
          tips: [
            'Actions are organized by workflow type',
            'Each action shows estimated completion time',
            'Favorite frequently used actions for quick access'
          ]
        },
        {
          id: 'search-functionality',
          title: 'Global Search',
          description: 'Find anything quickly',
          content: 'Use the global search to quickly find risks, controls, policies, or any content across the platform. The search includes smart suggestions and filters.',
          targetSelector: '[data-tour="global-search"]',
          position: 'bottom',
          action: 'click',
          actionText: 'Try searching for something',
          highlightElement: true,
          category: 'features',
          estimatedTime: '1m',
          tips: [
            'Use Ctrl+K to open search from anywhere',
            'Search supports filters and advanced queries',
            'Recent searches are saved for quick access'
          ]
        },
        {
          id: 'aria-assistant',
          title: 'ARIA AI Assistant',
          description: 'Your intelligent risk advisor',
          content: 'ARIA is your AI-powered assistant that can help with risk analysis, provide recommendations, and answer questions about your risk management program.',
          targetSelector: '[data-tour="aria-assistant"]',
          position: 'left',
          highlightElement: true,
          showArrow: true,
          category: 'features',
          estimatedTime: '1m 30s',
          tips: [
            'Ask ARIA questions in natural language',
            'ARIA can generate reports and insights',
            'Use ARIA for risk prediction and scenario analysis'
          ]
        },
        {
          id: 'user-profile',
          title: 'User Profile & Settings',
          description: 'Customize your experience',
          content: 'Access your profile, notification settings, and platform preferences. You can also enable accessibility features and customize the interface.',
          targetSelector: '[data-tour="user-profile"]',
          position: 'bottom',
          highlightElement: true,
          category: 'settings',
          estimatedTime: '45s',
          tips: [
            'Enable high contrast mode for better visibility',
            'Set up notification preferences',
            'Customize dashboard widgets and layout'
          ]
        },
        {
          id: 'help-resources',
          title: 'Help & Resources',
          description: 'Get support when you need it',
          content: 'Access comprehensive help documentation, video tutorials, and support resources. You can also restart this tour or explore specific feature guides.',
          targetSelector: '[data-tour="help-menu"]',
          position: 'bottom',
          highlightElement: true,
          category: 'navigation',
          estimatedTime: '30s',
          tips: [
            'Help is contextual - different sections show relevant guides',
            'Video tutorials are available for complex workflows',
            'Contact support directly from the help menu'
          ]
        },
        {
          id: 'completion',
          title: 'Tour Complete!',
          description: 'You\'re ready to get started',
          content: 'Congratulations! You\'ve completed the platform overview. You\'re now ready to start managing risks effectively. Remember, you can always access help and restart tours from the Help menu.',
          position: 'center',
          category: 'navigation',
          estimatedTime: '30s',
          tips: [
            'Start with the Quick Actions hub for guided workflows',
            'Explore the Dashboard to understand your current risk posture',
            'Use ARIA for intelligent insights and recommendations'
          ]
        }
      ]
    },
    'risk-assessment-workflow': {
      id: 'risk-assessment-workflow',
      title: 'Risk Assessment Workflow',
      description: 'Learn how to conduct comprehensive risk assessments',
      category: 'Workflows',
      estimatedTime: '8-10 minutes',
      difficulty: 'intermediate',
      prerequisites: ['platform-overview'],
      steps: [
        {
          id: 'workflow-intro',
          title: 'Risk Assessment Workflow',
          description: 'Systematic approach to risk management',
          content: 'This workflow guides you through the complete risk assessment process, from identification to monitoring. Each step builds on the previous one to ensure comprehensive risk management.',
          position: 'center',
          category: 'workflows',
          estimatedTime: '45s'
        },
        {
          id: 'risk-identification',
          title: 'Risk Identification',
          description: 'Discover potential risks',
          content: 'Start by identifying potential risks across different categories. Use brainstorming techniques, historical data, and industry benchmarks to ensure comprehensive coverage.',
          targetSelector: '[data-tour="risk-identification"]',
          position: 'right',
          highlightElement: true,
          category: 'workflows',
          estimatedTime: '2m'
        },
        {
          id: 'risk-analysis',
          title: 'Risk Analysis',
          description: 'Evaluate probability and impact',
          content: 'Analyze each identified risk by assessing its likelihood and potential impact. Use quantitative methods where possible and document your reasoning.',
          targetSelector: '[data-tour="risk-analysis"]',
          position: 'right',
          highlightElement: true,
          category: 'workflows',
          estimatedTime: '2m 30s'
        },
        {
          id: 'risk-evaluation',
          title: 'Risk Evaluation',
          description: 'Prioritize and categorize risks',
          content: 'Compare risks against your organization\'s risk appetite and tolerance levels. Prioritize risks based on their scores and strategic importance.',
          targetSelector: '[data-tour="risk-evaluation"]',
          position: 'right',
          highlightElement: true,
          category: 'workflows',
          estimatedTime: '2m'
        },
        {
          id: 'risk-treatment',
          title: 'Risk Treatment',
          description: 'Develop mitigation strategies',
          content: 'Create specific action plans to address high-priority risks. Choose appropriate treatment strategies: mitigate, transfer, avoid, or accept.',
          targetSelector: '[data-tour="risk-treatment"]',
          position: 'right',
          highlightElement: true,
          category: 'workflows',
          estimatedTime: '2m 30s'
        },
        {
          id: 'monitoring-setup',
          title: 'Monitoring & Review',
          description: 'Establish ongoing oversight',
          content: 'Set up continuous monitoring processes and schedule regular reviews to ensure your risk management remains effective over time.',
          targetSelector: '[data-tour="risk-monitoring"]',
          position: 'right',
          highlightElement: true,
          category: 'workflows',
          estimatedTime: '1m 30s'
        }
      ]
    }
  };

  // Get current tour configuration
  const currentTour = useMemo(() => customSteps ? 
    { id: 'custom', title: 'Custom Tour', description: '', category: '', estimatedTime: '', difficulty: 'beginner' as const, steps: customSteps } :
    tourConfigs[tourId], [customSteps, tourId]);

  const steps = currentTour?.steps || [];
  const currentStepData = useMemo(() => steps[currentStep], [steps, currentStep]);

  // Auto-start tour
  useEffect(() => {
    if (autoStart && !isActive) {
      startTour();
    }
  }, [autoStart]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isActive) return;

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowRight':
          event.preventDefault();
          nextStep();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          previousStep();
          break;
        case 'Escape':
          event.preventDefault();
          if (allowSkip) {
            skipTour();
          }
          break;
      }
    };

    if (isActive) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [isActive, currentStep, isPlaying]);

  // Position tour tooltip with dynamic responsive positioning
  const positionTour = useCallback(() => {
    if (!currentStepData) return;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Dynamic width based on screen size
    let tourWidth = 400; // Default width
    if (viewportWidth <= 640) {
      tourWidth = viewportWidth - 32; // Mobile: full width with margins
    } else if (viewportWidth <= 768) {
      tourWidth = Math.min(380, viewportWidth - 48); // Tablet: smaller width
    } else if (viewportWidth <= 1024) {
      tourWidth = 420; // Desktop: standard width
    } else {
      tourWidth = 450; // Large desktop: wider
    }

    const tourHeight = 450; // Approximate height with padding
    const minMargin = 16;

    // For center position or no target, always center in viewport
    if (!currentStepData.targetSelector || currentStepData.position === 'center') {
      setTourPosition({ 
        x: Math.max(minMargin, (viewportWidth - tourWidth) / 2), 
        y: Math.max(minMargin, (viewportHeight - tourHeight) / 2) 
      });
      return;
    }

    const targetElement = document.querySelector(currentStepData.targetSelector);
    if (!targetElement) {
      // Fallback to center if target not found
      setTourPosition({ 
        x: Math.max(minMargin, (viewportWidth - tourWidth) / 2), 
        y: Math.max(minMargin, (viewportHeight - tourHeight) / 2) 
      });
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    const padding = 20;
    let x = 0;
    let y = 0;
    let preferredPosition = currentStepData.position;

    // Calculate initial position based on preference
    switch (preferredPosition) {
      case 'top':
        x = rect.left + rect.width / 2 - tourWidth / 2;
        y = rect.top - tourHeight - padding;
        break;
      case 'bottom':
        x = rect.left + rect.width / 2 - tourWidth / 2;
        y = rect.bottom + padding;
        break;
      case 'left':
        x = rect.left - tourWidth - padding;
        y = rect.top + rect.height / 2 - tourHeight / 2;
        break;
      case 'right':
        x = rect.right + padding;
        y = rect.top + rect.height / 2 - tourHeight / 2;
        break;
      default:
        x = (viewportWidth - tourWidth) / 2;
        y = (viewportHeight - tourHeight) / 2;
        break;
    }

    // Check if the preferred position fits in viewport
    const wouldFitInViewport = (testX: number, testY: number) => {
      return testX >= minMargin && 
             testY >= minMargin && 
             testX + tourWidth <= viewportWidth - minMargin && 
             testY + tourHeight <= viewportHeight - minMargin;
    };

    // If preferred position doesn't fit, try alternative positions
    if (!wouldFitInViewport(x, y)) {
      const alternatives = [
        // Try opposite positions first
        ...(preferredPosition === 'top' ? ['bottom'] : []),
        ...(preferredPosition === 'bottom' ? ['top'] : []),
        ...(preferredPosition === 'left' ? ['right'] : []),
        ...(preferredPosition === 'right' ? ['left'] : []),
        // Then try adjacent positions
        'top', 'bottom', 'left', 'right'
      ].filter((pos, index, arr) => arr.indexOf(pos) === index && pos !== preferredPosition);

      let foundGoodPosition = false;
      
      for (const altPosition of alternatives) {
        let altX = 0, altY = 0;
        
        switch (altPosition) {
          case 'top':
            altX = rect.left + rect.width / 2 - tourWidth / 2;
            altY = rect.top - tourHeight - padding;
            break;
          case 'bottom':
            altX = rect.left + rect.width / 2 - tourWidth / 2;
            altY = rect.bottom + padding;
            break;
          case 'left':
            altX = rect.left - tourWidth - padding;
            altY = rect.top + rect.height / 2 - tourHeight / 2;
            break;
          case 'right':
            altX = rect.right + padding;
            altY = rect.top + rect.height / 2 - tourHeight / 2;
            break;
        }

        if (wouldFitInViewport(altX, altY)) {
          x = altX;
          y = altY;
          foundGoodPosition = true;
          break;
        }
      }

      // If no position works well, center it and ensure it fits
      if (!foundGoodPosition) {
        x = (viewportWidth - tourWidth) / 2;
        y = (viewportHeight - tourHeight) / 2;
      }
    }

    // Final boundary check and adjustment
    x = Math.max(minMargin, Math.min(x, viewportWidth - tourWidth - minMargin));
    y = Math.max(minMargin, Math.min(y, viewportHeight - tourHeight - minMargin));

    setTourPosition({ x, y });

    // Highlight target element
    if (currentStepData.highlightElement && targetElement) {
      setHighlightedElement(targetElement);
    } else {
      setHighlightedElement(null);
    }
  }, [currentStepData?.targetSelector, currentStepData?.position, currentStepData?.highlightElement]);

  // Update tour position when step changes
  useEffect(() => {
    if (isActive && currentStepData) {
      positionTour();
      
      // Scroll target element into view
      if (currentStepData.targetSelector) {
        const targetElement = document.querySelector(currentStepData.targetSelector);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [currentStep, isActive, positionTour]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (isActive) {
        positionTour();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isActive, positionTour]);

  // Tour control functions
  const completeTour = useCallback(() => {
    setCompletedSteps(prev => [...prev, currentStepData?.id || '']);
    stopTour();
    onComplete?.();
    
    toast({
      title: 'Tour Completed!',
      description: 'Great job! You\'ve completed the guided tour.',
    });
  }, [currentStepData?.id, onComplete, stopTour]);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(prev => [...prev, currentStepData?.id || '']);
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  }, [currentStep, steps.length, currentStepData?.id, completeTour]);

  // Auto-play functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && isPlaying && currentStepData) {
      const delay = currentStepData.nextStepDelay || 5000; // Default 5 seconds
      interval = setTimeout(() => {
        nextStep();
      }, delay);
    }

    return () => {
      if (interval) {
        clearTimeout(interval);
      }
    };
  }, [isActive, isPlaying, currentStepData?.nextStepDelay, nextStep]);

  // Additional tour control functions
  const startTour = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
    setIsPlaying(false);
    setCompletedSteps([]);
    
    toast({
      title: 'Tour Started',
      description: `Starting ${currentTour?.title || 'guided tour'}`,
    });
  }, [currentTour?.title]);

  const stopTour = useCallback(() => {
    setIsActive(false);
    setIsPlaying(false);
    setHighlightedElement(null);
    setShowTooltip(false);
  }, []);

  const skipTour = useCallback(() => {
    stopTour();
    onSkip?.();
    
    toast({
      title: 'Tour Skipped',
      description: 'You can restart the tour anytime from the Help menu',
    });
  }, [onSkip, stopTour]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
    }
  }, [steps.length]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Calculate progress
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  if (!isActive || !currentStepData) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => setIsPlaying(false)}
      />

      {/* Highlight overlay for target element */}
      {highlightedElement && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: highlightedElement.getBoundingClientRect().left - 4,
            top: highlightedElement.getBoundingClientRect().top - 4,
            width: highlightedElement.getBoundingClientRect().width + 8,
            height: highlightedElement.getBoundingClientRect().height + 8,
            border: '3px solid #199BEC',
            borderRadius: '8px',
            boxShadow: '0 0 0 4px rgba(25, 155, 236, 0.2)',
            animation: 'pulse 2s infinite'
          }}
        />
      )}

      {/* Tour Card */}
      <motion.div
        ref={tourRef}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed z-50"
        style={{
          left: tourPosition.x,
          top: tourPosition.y,
          width: (() => {
            const viewportWidth = window.innerWidth;
            if (viewportWidth <= 640) return viewportWidth - 32;
            if (viewportWidth <= 768) return Math.min(380, viewportWidth - 48);
            if (viewportWidth <= 1024) return 420;
            return 450;
          })(),
          maxWidth: '95vw',
          maxHeight: '90vh'
        }}
      >
        <Card className="bg-white border-2 border-blue-200 shadow-2xl rounded-xl overflow-hidden backdrop-blur-sm h-fit max-h-[90vh] flex flex-col">
          <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                  <Compass className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900 font-inter">
                    {currentStepData.title}
                  </CardTitle>
                  <p className="text-sm text-blue-600 font-medium">
                    Step {currentStep + 1} of {steps.length}
                  </p>
                </div>
              </div>
              
              {allowSkip && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipTour}
                  className="w-8 h-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Progress Bar */}
            {showProgress && (
              <div className="mt-4">
                <Progress value={progressPercentage} className="h-2" />
              </div>
            )}
          </CardHeader>

          <CardContent className="pb-6 px-6 flex-1 overflow-y-auto">
            {/* Step Content */}
            <div className="mb-6">
              <p className="text-gray-700 font-inter leading-relaxed mb-4 text-base">
                {currentStepData.content}
              </p>

              {/* Action Instruction */}
              {currentStepData.action && currentStepData.actionText && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg mb-4">
                  <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                    {currentStepData.action === 'click' && <MousePointer className="w-3 h-3 text-blue-600" />}
                    {currentStepData.action === 'type' && <Keyboard className="w-3 h-3 text-blue-600" />}
                    {currentStepData.action === 'hover' && <Hand className="w-3 h-3 text-blue-600" />}
                    {currentStepData.action === 'scroll' && <ArrowDown className="w-3 h-3 text-blue-600" />}
                    {currentStepData.action === 'wait' && <Clock className="w-3 h-3 text-blue-600" />}
                  </div>
                  <span className="text-sm font-medium text-blue-700">
                    {currentStepData.actionText}
                  </span>
                </div>
              )}

              {/* Tips */}
              {currentStepData.tips && currentStepData.tips.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Tips</span>
                  </div>
                  <ul className="space-y-1">
                    {currentStepData.tips.map((tip, index) => (
                      <li key={index} className="text-sm text-green-700 flex items-start gap-2">
                        <span className="w-1 h-1 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={previousStep}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2 disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlayPause}
                  className="flex items-center gap-2"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Auto
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {currentStepData.estimatedTime && (
                  <Badge variant="secondary" className="text-xs">
                    {currentStepData.estimatedTime}
                  </Badge>
                )}
                
                <Button
                  variant="primary"
                  size="sm"
                  onClick={nextStep}
                  className="flex items-center gap-2"
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Complete
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToStep(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep
                      ? 'bg-blue-600'
                      : index < currentStep
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Arrow indicator */}
        {currentStepData.showArrow && currentStepData.targetSelector && (
          <div
            className="absolute w-0 h-0 pointer-events-none"
            style={{
              ...(currentStepData.position === 'top' && {
                bottom: -10,
                left: '50%',
                transform: 'translateX(-50%)',
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderTop: '10px solid white'
              }),
              ...(currentStepData.position === 'bottom' && {
                top: -10,
                left: '50%',
                transform: 'translateX(-50%)',
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderBottom: '10px solid white'
              }),
              ...(currentStepData.position === 'left' && {
                right: -10,
                top: '50%',
                transform: 'translateY(-50%)',
                borderTop: '10px solid transparent',
                borderBottom: '10px solid transparent',
                borderLeft: '10px solid white'
              }),
              ...(currentStepData.position === 'right' && {
                left: -10,
                top: '50%',
                transform: 'translateY(-50%)',
                borderTop: '10px solid transparent',
                borderBottom: '10px solid transparent',
                borderRight: '10px solid white'
              })
            }}
          />
        )}
      </motion.div>

      {/* Keyboard shortcuts help */}
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="bg-white border border-gray-200 shadow-lg">
          <CardContent className="p-3">
            <div className="text-xs text-contrast-low space-y-1">
              <div className="flex items-center gap-2">
                <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Space</kbd>
                <span>Play/Pause</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">←→</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Esc</kbd>
                <span>Exit</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </>
  );
}

// Tour launcher component
export function TourLauncher({ 
  tours = ['platform-overview', 'risk-assessment-workflow'],
  className = ''
}: { 
  tours?: string[];
  className?: string;
}) {
  const [selectedTour, setSelectedTour] = useState<string>('');
  const [showTour, setShowTour] = useState(false);

  const tourConfigs: Record<string, TourConfig> = {
    'platform-overview': {
      id: 'platform-overview',
      title: 'Platform Overview',
      description: 'Get familiar with the main features and navigation',
      category: 'Getting Started',
      estimatedTime: '5-7 minutes',
      difficulty: 'beginner',
      steps: []
    },
    'risk-assessment-workflow': {
      id: 'risk-assessment-workflow',
      title: 'Risk Assessment Workflow',
      description: 'Learn how to conduct comprehensive risk assessments',
      category: 'Workflows',
      estimatedTime: '8-10 minutes',
      difficulty: 'intermediate',
      steps: []
    }
  };

  const startTour = (tourId: string) => {
    setSelectedTour(tourId);
    setShowTour(true);
  };

  return (
    <div className={className}>
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-contrast-medium font-inter flex items-center gap-2">
            <Play className="w-5 h-5 text-blue-600" />
            Guided Tours
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {tours.map(tourId => {
              const tour = tourConfigs[tourId];
              if (!tour) return null;

              return (
                <div key={tourId} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-contrast-medium font-inter">
                        {tour.title}
                      </h4>
                      <p className="text-sm text-contrast-low">
                        {tour.description}
                      </p>
                    </div>
                    <Badge className={`text-xs ${
                      tour.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                      tour.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {tour.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-contrast-low">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {tour.estimatedTime}
                      </div>
                      <div className="flex items-center gap-1">
                        <Flag className="w-4 h-4" />
                        {tour.category}
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => startTour(tourId)}
                      className="flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Start Tour
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Render active tour */}
      {showTour && selectedTour && (
        <GuidedTour
          tourId={selectedTour}
          autoStart={true}
          onComplete={() => setShowTour(false)}
          onSkip={() => setShowTour(false)}
        />
      )}
    </div>
  );
} 