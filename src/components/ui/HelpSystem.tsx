// Comprehensive Help System with Tooltips and Guided Tours
'use client';

import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { 
  HelpCircle, 
  Info, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause,
  RotateCcw,
  BookOpen,
  Video,
  MessageCircle,
  ExternalLink,
  Search,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Input } from './input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from './dialog';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';
import { ScrollArea } from './scroll-area';
import { Separator } from './separator';

// Tooltip Component
interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
  className?: string;
  disabled?: boolean;
}

export const Tooltip: React.FC<DaisyTooltipProps> = ({
  content,
  children,
  side = 'top',
  delay = 300,
  className,
  disabled = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const tooltipRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const sideClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900'
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            'absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-md shadow-lg max-w-xs',
            'animate-in fade-in-50 zoom-in-95',
            sideClasses[side],
            className
          )}
          role="tooltip"
        >
          {content}
          <div
            className={cn(
              'absolute w-0 h-0 border-4',
              arrowClasses[side]
            )} />
        </div>
      )}
    </div>
  );
};

// Guided Tour Types
export interface TourStep {
  id: string;
  target: string; // CSS selector
  title: string;
  content: string | React.ReactNode;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  action?: {
    type: 'click' | 'input' | 'hover';
    element?: string;
    value?: string;
  };
  beforeStep?: () => void | Promise<void>;
  afterStep?: () => void | Promise<void>;
  optional?: boolean;
}

export interface Tour {
  id: string;
  title: string;
  description: string;
  steps: TourStep[];
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  prerequisites?: string[];
}

// Tour Context
interface TourContextType {
  currentTour: Tour | null;
  currentStepIndex: number;
  isActive: boolean;
  startTour: (tour: Tour) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipStep: () => void;
  endTour: () => void;
  pauseTour: () => void;
  resumeTour: () => void;
  isPaused: boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

// Tour Provider
export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTour, setCurrentTour] = useState<Tour | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const startTour = (tour: Tour) => {
    setCurrentTour(tour);
    setCurrentStepIndex(0);
    setIsActive(true);
    setIsPaused(false);
  };

  const nextStep = async () => {
    if (!currentTour) return;

    const currentStep = currentTour.steps[currentStepIndex];
    if (currentStep.afterStep) {
      await currentStep.afterStep();
    }

    if (currentStepIndex < currentTour.steps.length - 1) {
      const nextStepIndex = currentStepIndex + 1;
      const nextStep = currentTour.steps[nextStepIndex];
      
      if (nextStep.beforeStep) {
        await nextStep.beforeStep();
      }
      
      setCurrentStepIndex(nextStepIndex);
    } else {
      endTour();
    }
  };

  const previousStep = async () => {
    if (currentStepIndex > 0) {
      const prevStepIndex = currentStepIndex - 1;
      const prevStep = currentTour?.steps[prevStepIndex];
      
      if (prevStep?.beforeStep) {
        await prevStep.beforeStep();
      }
      
      setCurrentStepIndex(prevStepIndex);
    }
  };

  const skipStep = () => {
    if (!currentTour) return;
    
    if (currentStepIndex < currentTour.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      endTour();
    }
  };

  const endTour = () => {
    setCurrentTour(null);
    setCurrentStepIndex(0);
    setIsActive(false);
    setIsPaused(false);
  };

  const pauseTour = () => {
    setIsPaused(true);
  };

  const resumeTour = () => {
    setIsPaused(false);
  };

  return (
    <TourContext.Provider value={{
      currentTour,
      currentStepIndex,
      isActive,
      startTour,
      nextStep,
      previousStep,
      skipStep,
      endTour,
      pauseTour,
      resumeTour,
      isPaused
    }}>
      {children}
      <TourOverlay />
    </TourContext.Provider>
  );
};

// Tour Hook
export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

// Tour Overlay Component
const TourOverlay: React.FC = () => {
  const { currentTour, currentStepIndex, isActive, isPaused } = useTour();
  const [highlightElement, setHighlightElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !currentTour || isPaused) {
      setHighlightElement(null);
      return;
    }

    const currentStep = currentTour.steps[currentStepIndex];
    const element = document.querySelector(currentStep.target) as HTMLElement;
    
    if (element) {
      setHighlightElement(element);
      
      // Scroll element into view
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, [isActive, currentTour, currentStepIndex, isPaused]);

  if (!isActive || !currentTour || isPaused) {
    return null;
  }

  const currentStep = currentTour.steps[currentStepIndex];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
      {/* Highlight */}
      {highlightElement && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            top: highlightElement.offsetTop - 4,
            left: highlightElement.offsetLeft - 4,
            width: highlightElement.offsetWidth + 8,
            height: highlightElement.offsetHeight + 8,
            border: '2px solid #3b82f6',
            borderRadius: '6px',
            boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.2)'
          }} />
      )}
      
      <TourStepCard step={currentStep} />
    </>
  );
};

// Tour Step Card
interface TourStepCardProps {
  step: TourStep;
}

const TourStepCard: React.FC<TourStepCardProps> = ({ step }) => {
  const { 
    currentTour, 
    currentStepIndex, 
    nextStep, 
    previousStep, 
    skipStep, 
    endTour,
    pauseTour
  } = useTour();

  if (!currentTour) return null;

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === currentTour.steps.length - 1;
  const progress = ((currentStepIndex + 1) / currentTour.steps.length) * 100;

  return (
    <DaisyCard className="fixed z-50 max-w-sm w-full top-4 right-4 shadow-2xl" >
      <DaisyCardBody className="pb-3" >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DaisyBadge variant="secondary" >
              Step {currentStepIndex + 1} of {currentTour.steps.length}
            </DaisyBadge>
            <DaisyBadge variant="outline">{currentTour.category}</DaisyBadge>
          </div>
          <div className="flex items-center gap-1">
            <DaisyButton
              variant="ghost"
              size="sm"
              onClick={pauseTour}
              className="h-8 w-8 p-0" >
              <Pause className="w-4 h-4" />
            </DaisyButton>
            <DaisyButton
              variant="ghost"
              size="sm"
              onClick={endTour}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </DaisyButton>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }} />
        </div>
        
        <DaisyCardTitle className="text-lg">{step.title}</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {step.content}
          </div>
        
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <DaisyButton
              variant="outline"
              size="sm"
              onClick={previousStep}
              disabled={isFirstStep} >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </DaisyButton>
            
            {step.optional && (
              <DaisyButton
                variant="ghost"
                size="sm"
                onClick={skipStep}>
          Skip
              
        </DaisyButton>
            )}
          </div>
          
          <DaisyButton
            size="sm"
            onClick={nextStep}
          >
            {isLastStep ? 'Finish' : 'Next'}
            {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
          </DaisyButton>
        </div>
      </DaisyCardBody>
    </DaisyCard>
  );
};

// Help Documentation Component
interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  lastUpdated: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  readTime: number; // in minutes
}

interface HelpCenterProps {
  articles: HelpArticle[];
  tours: Tour[];
  onStartTour: (tour: Tour) => void;
}

export const HelpCenter: React.FC<HelpCenterProps> = ({
  articles,
  tours,
  onStartTour
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  const _categories = ['all', ...Array.from(new Set(articles.map(a => a.category)))];
  
  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const filteredTours = tours.filter(tour => {
    const matchesSearch = tour.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tour.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <DaisyDialog>
      <DaisyDialogTrigger asChild>
        <DaisyButton variant="ghost" size="sm" className="gap-2">
          <HelpCircle className="w-4 h-4" />
          Help
        </DaisyButton>
      </DaisyDialogTrigger>
      
      <DaisyDialogContent className="max-w-4xl max-h-[80vh]" >
  <DaisyDialogHeader >
          <DaisyDialogHeader>
          <DaisyDialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Help Center
          </DaisyDialogTitle>
          <DaisyDialogDescription>
            Find answers, tutorials, and guided tours to help you get the most out of Riscura
          </DaisyDialogDescription>
        </DaisyDialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <DaisyInput
              placeholder="Search help articles and tutorials..."
              value={searchTerm}
              onChange={(e) = />
setSearchTerm(e.target.value)}
              className="pl-10" />
          </div>
          
          <DaisyTabs defaultValue="articles" className="w-full">
            <DaisyTabsList className="grid w-full grid-cols-3">
              <DaisyTabsTrigger value="articles">Articles</DaisyTabsTrigger>
              <DaisyTabsTrigger value="tours">Guided Tours</DaisyTabsTrigger>
              <DaisyTabsTrigger value="support">Support</DaisyTabsTrigger>
            </DaisyTabsList>
            
            <DaisyTabsContent value="articles" className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {categories.map(category => (
                  <DaisyButton
                    key={category}
                    variant={selectedCategory === category ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() =>
          setSelectedCategory(category)}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  
        </DaisyButton>
                ))}
              </div>
              
              <DaisyScrollArea className="h-96">
                <div className="space-y-3">
                  {filteredArticles.map(article => (
                    <DaisyCard
                      key={article.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedArticle(article)}>
                      <DaisyCardBody className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium mb-1">{article.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {article.content.substring(0, 150)}...
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <DaisyBadge variant="outline" className="text-xs">
                                {article.category}
                              </DaisyBadge>
                              <span>{article.readTime} min read</span>
                              <span>•</span>
                              <span>{article.difficulty}</span>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </DaisyCardBody>
                    </DaisyCard>
                  ))}
                </div>
              </DaisyScrollArea>
            </DaisyTabsContent>
            
            <DaisyTabsContent value="tours" className="space-y-4">
              <DaisyScrollArea className="h-96">
                <div className="space-y-3">
                  {filteredTours.map(tour => (
                    <DaisyCard key={tour.id}>
                      <DaisyCardBody className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium mb-1">{tour.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {tour.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                              <DaisyBadge variant="outline" className="text-xs">
                                {tour.category}
                              </DaisyBadge>
                              <span>{tour.estimatedTime} min</span>
                              <span>•</span>
                              <span>{tour.difficulty}</span>
                              <span>•</span>
                              <span>{tour.steps.length} steps</span>
                            </div>
                          </div>
                        </div>
                        <DaisyButton
                          size="sm"
                          onClick={() => onStartTour(tour)}
                          className="w-full">
                          <Play className="w-4 h-4 mr-2" />
                          Start Tour
                        </DaisyButton>
                      </DaisyCardBody>
                    </DaisyCard>
                  ))}
                </div>
              </DaisyScrollArea>
            </DaisyTabsContent>
            
            <DaisyTabsContent value="support" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DaisyCard>
                  <DaisyCardBody>
                    <DaisyCardTitle className="text-base flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Contact Support
                    </DaisyCardTitle>
                    <p className="text-sm text-muted-foreground mb-3">
                      Get help from our support team
                    </p>
                    <DaisyButton variant="outline" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Support Ticket
                    </DaisyButton>
                  </DaisyCardBody>
                </DaisyCard>
                
                <DaisyCard>
                  <DaisyCardBody>
                    <DaisyCardTitle className="text-base flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Video Tutorials
                    </DaisyCardTitle>
                    <p className="text-sm text-muted-foreground mb-3">
                      Watch step-by-step video guides
                    </p>
                    <DaisyButton variant="outline" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Tutorials
                    </DaisyButton>
                  </DaisyCardBody>
                </DaisyCard>
              </div>
            </DaisyTabsContent>
          </DaisyTabs>
        </div>
        
        {/* Article Modal */}
        {selectedArticle && (
          <DaisyDialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
            <DaisyDialogContent className="max-w-2xl max-h-[80vh]">
              <DaisyDialogHeader>
                <DaisyDialogTitle>{selectedArticle.title}</DaisyDialogTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DaisyBadge variant="outline">{selectedArticle.category}</DaisyBadge>
                  <span>{selectedArticle.readTime} min read</span>
                  <span>•</span>
                  <span>Updated {selectedArticle.lastUpdated}</span>
                </div>
              </DaisyDialogHeader>
              
              <DaisyScrollArea className="max-h-96">
                <div className="prose prose-sm max-w-none">
                  {selectedArticle.content}
                </div>
              </DaisyScrollArea>
            </DaisyDialogContent>
          </DaisyDialog>
        )}
  );
};

// Quick Help Button
interface QuickHelpProps {
  tooltip?: string;
  helpText?: string;
  className?: string;
}

export const QuickHelp: React.FC<QuickHelpProps> = ({
  tooltip = "Get help",
  helpText,
  className
}) => {
  if (helpText) {
    return (
      <DaisyPopover >
          <DaisyPopoverTrigger asChild >
            <DaisyButton variant="ghost" size="sm" className={cn("h-6 w-6 p-0", className)} >
  <HelpCircle className="w-4 h-4" />
</DaisyPopover>
          </DaisyButton>
        </DaisyPopoverTrigger>
        <DaisyPopoverContent className="w-80" >
            <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-sm">Help</span>
            </div>
            <p className="text-sm text-muted-foreground">{helpText}</p>
          </div>
        </DaisyPopoverContent>
      </DaisyPopover>
    );
  };

  return (
    <DaisyTooltip content={tooltip}>
        <DaisyButton variant="ghost" size="sm" className={cn("h-6 w-6 p-0", className)} >
  <HelpCircle className="w-4 h-4" />
</DaisyTooltip>
      </DaisyButton>
    </DaisyTooltip>
  );
};

// All components are exported as named exports above 