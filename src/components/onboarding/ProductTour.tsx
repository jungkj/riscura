'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  RotateCcw,
  CheckCircle,
  Lightbulb,
  Target,
  Zap,
  Shield,
  Brain,
  Users,
  FileText,
  Settings,
  Star
} from 'lucide-react';
import { designTokens } from '@/lib/design-system/tokens';

// Tour step interface
interface TourStep {
  id: string;
  element: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon?: React.ComponentType<any>;
  action?: {
    type: 'click' | 'hover' | 'scroll' | 'wait';
    duration?: number;
    callback?: () => void;
  };
  conditions?: {
    role?: string[];
    feature?: string[];
    skipIf?: () => boolean;
  };
  highlight?: {
    type: 'pulse' | 'glow' | 'border' | 'spotlight';
    color?: string;
  };
}

// Tour configuration
interface TourConfig {
  id: string;
  title: string;
  description: string;
  steps: TourStep[];
  autoStart?: boolean;
  showProgress?: boolean;
  allowSkip?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
}

// User context for role-based tours
interface UserContext {
  role: 'admin' | 'analyst' | 'auditor' | 'manager';
  experience: 'beginner' | 'intermediate' | 'advanced';
  features: string[];
  preferences: {
    autoPlay: boolean;
    speed: 'slow' | 'normal' | 'fast';
    showHints: boolean;
  };
}

// Predefined tour configurations
const TOUR_CONFIGS: Record<string, TourConfig> = {
  welcome: {
    id: 'welcome',
    title: 'Welcome to Riscura',
    description: 'Let\'s get you started with a quick tour of the key features',
    autoStart: true,
    showProgress: true,
    allowSkip: true,
    steps: [
      {
        id: 'dashboard-overview',
        element: '#dashboard',
        title: 'Your Risk Dashboard',
        content: 'This is your command center. Get a complete overview of your organization\'s risk posture at a glance.',
        position: 'center',
        icon: Shield,
        highlight: { type: 'glow', color: '#3b82f6' }
      },
      {
        id: 'metrics-cards',
        element: '[data-tour="metrics-cards"]',
        title: 'Key Risk Metrics',
        content: 'Monitor critical risk indicators including total risks, compliance score, and pending actions.',
        position: 'bottom',
        icon: Target,
        highlight: { type: 'border', color: '#10b981' }
      },
      {
        id: 'quick-actions',
        element: '[data-tour="quick-actions"]',
        title: 'Quick Actions',
        content: 'Start common tasks quickly - add new risks, import data, or generate reports with just one click.',
        position: 'left',
        icon: Zap,
        highlight: { type: 'pulse', color: '#f59e0b' }
      },
      {
        id: 'ai-assistant',
        element: '[data-tour="ai-assistant"]',
        title: 'AI-Powered Insights',
        content: 'Meet ARIA, your AI assistant. Get intelligent recommendations and insights to improve your risk management.',
        position: 'right',
        icon: Brain,
        highlight: { type: 'spotlight', color: '#8b5cf6' }
      },
      {
        id: 'activity-feed',
        element: '[data-tour="activity-feed"]',
        title: 'Recent Activity',
        content: 'Stay updated with the latest changes, assessments, and team activities across your organization.',
        position: 'left',
        icon: Users,
        highlight: { type: 'glow', color: '#06b6d4' }
      }
    ]
  },
  
  riskManagement: {
    id: 'risk-management',
    title: 'Risk Management Essentials',
    description: 'Learn how to effectively manage risks in Riscura',
    showProgress: true,
    allowSkip: true,
    steps: [
      {
        id: 'risk-identification',
        element: '[data-tour="add-risk"]',
        title: 'Identify New Risks',
        content: 'Start by documenting new risks. Our guided wizard makes it easy to capture all necessary details.',
        position: 'bottom',
        icon: Shield,
        action: { type: 'click', callback: () => console.log('Risk identification demo') }
      },
      {
        id: 'risk-assessment',
        element: '[data-tour="risk-matrix"]',
        title: 'Assess Risk Impact',
        content: 'Use our interactive risk matrix to evaluate probability and impact. Visual tools make assessment intuitive.',
        position: 'top',
        icon: Target
      },
      {
        id: 'control-mapping',
        element: '[data-tour="controls"]',
        title: 'Map Controls',
        content: 'Link existing controls to risks or create new ones. Track control effectiveness over time.',
        position: 'right',
        icon: CheckCircle
      }
    ]
  },

  aiFeatures: {
    id: 'ai-features',
    title: 'AI-Powered Features',
    description: 'Discover how AI can accelerate your risk management',
    showProgress: true,
    allowSkip: true,
    steps: [
      {
        id: 'aria-chat',
        element: '[data-tour="aria-chat"]',
        title: 'Chat with ARIA',
        content: 'Ask questions in natural language. ARIA understands risk management context and provides relevant insights.',
        position: 'left',
        icon: Brain
      },
      {
        id: 'smart-insights',
        element: '[data-tour="smart-insights"]',
        title: 'Smart Insights',
        content: 'Get AI-generated recommendations based on your risk data patterns and industry best practices.',
        position: 'bottom',
        icon: Lightbulb
      },
      {
        id: 'natural-queries',
        element: '[data-tour="natural-query"]',
        title: 'Natural Language Queries',
        content: 'Search and filter data using plain English. No need to learn complex query syntax.',
        position: 'top',
        icon: FileText
      }
    ]
  }
};

// Main ProductTour component
interface ProductTourProps {
  tourId?: string;
  userContext?: UserContext;
  onComplete?: () => void;
  onSkip?: () => void;
  className?: string;
}

export const ProductTour: React.FC<ProductTourProps> = ({
  tourId = 'welcome',
  userContext,
  onComplete,
  onSkip,
  className = ''
}) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Get tour configuration
  const tourConfig = TOUR_CONFIGS[tourId];
  const filteredSteps = tourConfig?.steps.filter(step => {
    if (!step.conditions) return true;
    if (step.conditions.role && userContext?.role && !step.conditions.role.includes(userContext.role)) {
      return false;
    }
    if (step.conditions.skipIf && step.conditions.skipIf()) {
      return false;
    }
    return true;
  }) || [];

  const currentStepData = filteredSteps[currentStep];
  const progress = ((currentStep + 1) / filteredSteps.length) * 100;

  // Start tour
  const startTour = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
    if (tourConfig?.autoStart) {
      setIsPlaying(true);
    }
  }, [tourConfig]);

  // Stop tour
  const stopTour = useCallback(() => {
    setIsActive(false);
    setIsPlaying(false);
    setHighlightedElement(null);
    if (autoPlayRef.current) {
      clearTimeout(autoPlayRef.current);
    }
    document.body.style.overflow = '';
  }, []);

  // Navigate to step
  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= filteredSteps.length) return;
    setCurrentStep(stepIndex);
  }, [filteredSteps.length]);

  // Next step
  const nextStep = useCallback(() => {
    if (currentStep < filteredSteps.length - 1) {
      goToStep(currentStep + 1);
    } else {
      // Tour completed
      stopTour();
      onComplete?.();
    }
  }, [currentStep, filteredSteps.length, goToStep, stopTour, onComplete]);

  // Previous step
  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  // Skip tour
  const skipTour = useCallback(() => {
    stopTour();
    onSkip?.();
  }, [stopTour, onSkip]);

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && isActive && currentStepData) {
      const duration = userContext?.preferences.speed === 'fast' ? 3000 : 
                     userContext?.preferences.speed === 'slow' ? 7000 : 5000;
      
      autoPlayRef.current = setTimeout(() => {
        nextStep();
      }, duration);
    }

    return () => {
      if (autoPlayRef.current) {
        clearTimeout(autoPlayRef.current);
      }
    };
  }, [isPlaying, isActive, currentStepData, nextStep, userContext]);

  // Highlight element and position tooltip
  useEffect(() => {
    if (!isActive || !currentStepData) return;

    const element = document.querySelector(currentStepData.element) as HTMLElement;
    if (!element) return;

    setHighlightedElement(element);

    // Calculate tooltip position
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltipRef.current?.getBoundingClientRect();
    
    let x = rect.left + rect.width / 2;
    let y = rect.top;

    if (currentStepData.position === 'bottom') {
      y = rect.bottom + 20;
    } else if (currentStepData.position === 'top') {
      y = rect.top - (tooltipRect?.height || 0) - 20;
    } else if (currentStepData.position === 'left') {
      x = rect.left - (tooltipRect?.width || 0) - 20;
      y = rect.top + rect.height / 2;
    } else if (currentStepData.position === 'right') {
      x = rect.right + 20;
      y = rect.top + rect.height / 2;
    } else if (currentStepData.position === 'center') {
      x = window.innerWidth / 2;
      y = window.innerHeight / 2;
    }

    setTooltipPosition({ x, y });

    // Add highlight styles
    element.style.position = 'relative';
    element.style.zIndex = '1001';
    
    if (currentStepData.highlight) {
      const { type, color = '#3b82f6' } = currentStepData.highlight;
      
      switch (type) {
        case 'pulse':
          element.style.animation = 'pulse 2s infinite';
          break;
        case 'glow':
          element.style.boxShadow = `0 0 20px ${color}`;
          break;
        case 'border':
          element.style.border = `3px solid ${color}`;
          element.style.borderRadius = '8px';
          break;
        case 'spotlight':
          element.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          element.style.backdropFilter = 'blur(1px)';
          break;
      }
    }

    // Scroll element into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      // Cleanup styles
      element.style.position = '';
      element.style.zIndex = '';
      element.style.animation = '';
      element.style.boxShadow = '';
      element.style.border = '';
      element.style.borderRadius = '';
      element.style.backgroundColor = '';
      element.style.backdropFilter = '';
    };
  }, [isActive, currentStepData]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive) return;

      switch (e.key) {
        case 'Escape':
          skipTour();
          break;
        case 'ArrowRight':
        case 'Space':
          e.preventDefault();
          nextStep();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          previousStep();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, isPlaying, nextStep, previousStep, skipTour]);

  if (!isActive || !currentStepData) {
    return (
      <Button
        onClick={startTour}
        className={`fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white shadow-lg ${className}`}
        size="lg"
      >
        <Play className="w-4 h-4 mr-2" />
        Start Tour
      </Button>
    );
  }

  const StepIcon = currentStepData.icon || Lightbulb;

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black bg-opacity-50 z-1000"
        style={{ zIndex: 1000 }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-1002 max-w-sm"
        style={{
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform: currentStepData.position === 'center' ? 'translate(-50%, -50%)' : 
                    currentStepData.position === 'right' ? 'translateY(-50%)' :
                    currentStepData.position === 'left' ? 'translate(-100%, -50%)' :
                    currentStepData.position === 'top' ? 'translate(-50%, 0)' :
                    'translate(-50%, 0)',
          zIndex: 1002
        }}
      >
        <Card className="bg-white shadow-xl border-0">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <StepIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{currentStepData.title}</h3>
                  <Badge variant="secondary" className="text-xs">
                    Step {currentStep + 1} of {filteredSteps.length}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={skipTour}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <p className="text-gray-600 mb-6 leading-relaxed">
              {currentStepData.content}
            </p>

            {/* Progress */}
            {tourConfig.showProgress && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={previousStep}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="text-gray-600"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => goToStep(0)}
                  className="text-gray-600"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                {tourConfig.allowSkip && (
                  <Button variant="ghost" size="sm" onClick={skipTour}>
                    Skip Tour
                  </Button>
                )}
                
                <Button onClick={nextStep} size="sm">
                  {currentStep === filteredSteps.length - 1 ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Keyboard shortcuts hint */}
            {userContext?.preferences.showHints && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">←→</kbd> Navigate • 
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs ml-1">Space</kbd> Next • 
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs ml-1">P</kbd> Play/Pause • 
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs ml-1">Esc</kbd> Exit
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

// Tour manager for handling multiple tours
export class TourManager {
  private static instance: TourManager;
  private activeTour: string | null = null;
  private completedTours: Set<string> = new Set();
  private userContext: UserContext | null = null;

  static getInstance(): TourManager {
    if (!TourManager.instance) {
      TourManager.instance = new TourManager();
    }
    return TourManager.instance;
  }

  setUserContext(context: UserContext) {
    this.userContext = context;
  }

  startTour(tourId: string, force = false) {
    if (!force && this.completedTours.has(tourId)) {
      return false;
    }
    this.activeTour = tourId;
    return true;
  }

  completeTour(tourId: string) {
    this.completedTours.add(tourId);
    this.activeTour = null;
    
    // Save to localStorage
    localStorage.setItem('riscura_completed_tours', JSON.stringify([...this.completedTours]));
  }

  isCompleted(tourId: string): boolean {
    return this.completedTours.has(tourId);
  }

  getRecommendedTour(): string | null {
    if (!this.userContext) return 'welcome';

    // Role-based tour recommendations
    if (!this.isCompleted('welcome')) return 'welcome';
    
    if (this.userContext.role === 'analyst' && !this.isCompleted('riskManagement')) {
      return 'riskManagement';
    }
    
    if (this.userContext.experience === 'beginner' && !this.isCompleted('aiFeatures')) {
      return 'aiFeatures';
    }

    return null;
  }

  loadCompletedTours() {
    try {
      const saved = localStorage.getItem('riscura_completed_tours');
      if (saved) {
        this.completedTours = new Set(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load completed tours:', error);
    }
  }
}

// Hook for using tours
export const useTour = () => {
  const manager = TourManager.getInstance();
  
  useEffect(() => {
    manager.loadCompletedTours();
  }, [manager]);

  return {
    startTour: (tourId: string, force = false) => manager.startTour(tourId, force),
    completeTour: (tourId: string) => manager.completeTour(tourId),
    isCompleted: (tourId: string) => manager.isCompleted(tourId),
    getRecommendedTour: () => manager.getRecommendedTour(),
    setUserContext: (context: UserContext) => manager.setUserContext(context)
  };
};

export default ProductTour; 