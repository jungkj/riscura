'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { 
  BookOpen,
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Target,
  Zap,
  Eye,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Share,
  Download,
  Edit,
  Wand2,
  Sparkles,
  MessageSquare,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Users,
  Calendar,
  Clock,
  Star,
  Award,
  Flag,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Layers,
  Filter,
  Settings,
  RefreshCw,
  FileText,
  Image,
  Video,
  Mic,
  Camera
} from 'lucide-react';

// Story types and interfaces
interface DataStory {
  id: string;
  title: string;
  subtitle: string;
  narrative: StoryNarrative;
  chapters: StoryChapter[];
  insights: AIInsight[];
  visualizations: StoryVisualization[];
  metadata: StoryMetadata;
  settings: StorySettings;
}

interface StoryNarrative {
  introduction: string;
  keyFindings: string[];
  recommendations: string[];
  conclusion: string;
  executiveSummary: string;
}

interface StoryChapter {
  id: string;
  title: string;
  content: string;
  visualizations: string[];
  insights: string[];
  duration: number; // seconds for auto-play
  transitions: ChapterTransition;
  annotations: Annotation[];
}

interface ChapterTransition {
  type: 'fade' | 'slide' | 'zoom' | 'flip';
  duration: number;
  direction?: 'left' | 'right' | 'up' | 'down';
}

interface Annotation {
  id: string;
  type: 'callout' | 'highlight' | 'arrow' | 'circle';
  position: { x: number; y: number };
  content: string;
  style: {
    color: string;
    size: 'small' | 'medium' | 'large';
    animation?: 'pulse' | 'bounce' | 'fade';
  };
}

interface AIInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'correlation' | 'prediction' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  dataPoints: any[];
  visualization?: string;
  actionable: boolean;
  priority: number;
}

interface StoryVisualization {
  id: string;
  type: 'chart' | 'infographic' | 'animation' | 'interactive';
  title: string;
  data: any;
  config: {
    chartType?: 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap';
    theme: 'light' | 'dark' | 'corporate' | 'vibrant';
    animations: boolean;
    interactivity: boolean;
  };
  narrative: string;
}

interface StoryMetadata {
  author: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  audience: 'executive' | 'technical' | 'general' | 'stakeholder';
  duration: number; // total story duration in seconds
  complexity: 'simple' | 'moderate' | 'complex';
  dataSource: string;
  lastRefresh: Date;
}

interface StorySettings {
  autoPlay: boolean;
  narration: boolean;
  showInsights: boolean;
  interactiveMode: boolean;
  theme: 'professional' | 'creative' | 'minimal' | 'dynamic';
  pace: 'slow' | 'normal' | 'fast';
  language: string;
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    screenReader: boolean;
  };
}

// Sample story data
const SAMPLE_STORY: DataStory = {
  id: 'story-1',
  title: 'Q1 2024 Risk Landscape: A Story of Resilience and Growth',
  subtitle: 'How strategic risk management drove 23% improvement in organizational resilience',
  narrative: {
    introduction: 'In Q1 2024, our organization faced unprecedented challenges while achieving remarkable improvements in risk management maturity.',
    keyFindings: [
      'High-risk incidents decreased by 33% through proactive mitigation',
      'Compliance scores improved across all frameworks, reaching 94% overall',
      'Employee risk awareness increased by 45% following training initiatives',
      'Automated controls reduced manual oversight requirements by 60%'
    ],
    recommendations: [
      'Expand automated control implementation to remaining high-risk areas',
      'Increase investment in predictive risk analytics capabilities',
      'Establish cross-functional risk committees for better coordination',
      'Develop advanced threat intelligence integration'
    ],
    conclusion: 'The quarter demonstrates that strategic, data-driven risk management creates sustainable competitive advantage.',
    executiveSummary: 'Q1 2024 marked a turning point in our risk management journey, with significant improvements in all key metrics while maintaining operational excellence.'
  },
  chapters: [
    {
      id: 'chapter-1',
      title: 'The Challenge: Rising Complexity',
      content: 'As our organization expanded globally, we faced increasing regulatory complexity and emerging cyber threats. Traditional risk management approaches were no longer sufficient.',
      visualizations: ['risk-trend-chart', 'complexity-heatmap'],
      insights: ['insight-1', 'insight-2'],
      duration: 45,
      transitions: { type: 'fade', duration: 1000 },
      annotations: [
        {
          id: 'ann-1',
          type: 'callout',
          position: { x: 300, y: 150 },
          content: '67% increase in regulatory requirements',
          style: { color: '#ef4444', size: 'medium', animation: 'pulse' }
        }
      ]
    },
    {
      id: 'chapter-2',
      title: 'The Response: Strategic Innovation',
      content: 'We implemented AI-powered risk analytics, automated compliance monitoring, and enhanced employee training programs.',
      visualizations: ['implementation-timeline', 'investment-breakdown'],
      insights: ['insight-3', 'insight-4'],
      duration: 60,
      transitions: { type: 'slide', duration: 800, direction: 'left' },
      annotations: []
    },
    {
      id: 'chapter-3',
      title: 'The Results: Measurable Impact',
      content: 'Our strategic investments yielded significant improvements across all risk metrics, positioning us for sustainable growth.',
      visualizations: ['results-dashboard', 'roi-analysis'],
      insights: ['insight-5', 'insight-6'],
      duration: 50,
      transitions: { type: 'zoom', duration: 1200 },
      annotations: []
    }
  ],
  insights: [
    {
      id: 'insight-1',
      type: 'trend',
      title: 'Cybersecurity Incidents Trending Downward',
      description: 'Implementation of zero-trust architecture and enhanced monitoring reduced security incidents by 45%',
      confidence: 92,
      impact: 'high',
      dataPoints: [],
      actionable: true,
      priority: 1
    },
    {
      id: 'insight-2',
      type: 'correlation',
      title: 'Training Investment Correlates with Risk Reduction',
      description: 'Departments with higher training investment showed 38% better risk management outcomes',
      confidence: 87,
      impact: 'medium',
      dataPoints: [],
      actionable: true,
      priority: 2
    }
  ],
  visualizations: [
    {
      id: 'risk-trend-chart',
      type: 'chart',
      title: 'Risk Trend Analysis',
      data: {},
      config: {
        chartType: 'line',
        theme: 'corporate',
        animations: true,
        interactivity: true
      },
      narrative: 'This chart shows the dramatic improvement in our risk profile over the past quarter.'
    }
  ],
  metadata: {
    author: 'ARIA Risk Intelligence',
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-15'),
    tags: ['quarterly-review', 'risk-management', 'compliance', 'cybersecurity'],
    audience: 'executive',
    duration: 180,
    complexity: 'moderate',
    dataSource: 'Integrated Risk Platform',
    lastRefresh: new Date()
  },
  settings: {
    autoPlay: false,
    narration: true,
    showInsights: true,
    interactiveMode: true,
    theme: 'professional',
    pace: 'normal',
    language: 'en',
    accessibility: {
      highContrast: false,
      largeText: false,
      screenReader: false
    }
  }
};

// Main data storytelling component
interface DataStorytellingEngineProps {
  story?: DataStory;
  onGenerateStory?: (config: any) => void;
  onSaveStory?: (story: DataStory) => void;
  onShareStory?: (story: DataStory) => void;
  className?: string;
}

export const DataStorytellingEngine: React.FC<DataStorytellingEngineProps> = ({
  story = SAMPLE_STORY,
  onGenerateStory,
  onSaveStory,
  onShareStory,
  className = ''
}) => {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showInsights, setShowInsights] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [narrationEnabled, setNarrationEnabled] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [storyProgress, setStoryProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying) return;

    const currentChapterData = story.chapters[currentChapter];
    const duration = (currentChapterData.duration * 1000) / playbackSpeed;

    const timer = setTimeout(() => {
      if (currentChapter < story.chapters.length - 1) {
        setCurrentChapter(prev => prev + 1);
        setStoryProgress(((currentChapter + 1) / story.chapters.length) * 100);
      } else {
        setIsPlaying(false);
        setStoryProgress(100);
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [isPlaying, currentChapter, story.chapters, playbackSpeed]);

  // Generate new story
  const generateStory = async () => {
    setIsGenerating(true);
    // Simulate AI story generation
    setTimeout(() => {
      setIsGenerating(false);
      onGenerateStory?.({
        dataSource: 'current-quarter',
        audience: 'executive',
        focus: 'risk-trends'
      });
    }, 3000);
  };

  // Navigation functions
  const nextChapter = () => {
    if (currentChapter < story.chapters.length - 1) {
      setCurrentChapter(prev => prev + 1);
      setStoryProgress(((currentChapter + 1) / story.chapters.length) * 100);
    }
  };

  const previousChapter = () => {
    if (currentChapter > 0) {
      setCurrentChapter(prev => prev - 1);
      setStoryProgress(((currentChapter - 1) / story.chapters.length) * 100);
    }
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  // Get insight icon
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return TrendingUp;
      case 'anomaly': return AlertTriangle;
      case 'correlation': return Activity;
      case 'prediction': return Brain;
      case 'recommendation': return Lightbulb;
      default: return Star;
    }
  };

  // Get impact color
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Render current chapter
  const renderCurrentChapter = () => {
    const chapter = story.chapters[currentChapter];
    if (!chapter) return null;

    return (
      <div className="relative">
        {/* Chapter content */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{chapter.title}</h2>
            <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
              {chapter.content}
            </p>
          </div>

          {/* Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {chapter.visualizations.map(vizId => {
              const viz = story.visualizations.find(v => v.id === vizId);
              if (!viz) return null;

              return (
                <DaisyCard key={vizId} className="hover:shadow-lg transition-shadow" >
  <DaisyCardHeader />
</DaisyCard>
                    <DaisyCardTitle className="text-lg">{viz.title}</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
</DaisyCardContent>
                      <div className="text-center">
                        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                        <p className="text-sm text-gray-600">{viz.narrative}</p>
                      </div>
                    </div>
                  </DaisyCardContent>
                </DaisyCard>
              );
            })}
          </div>

          {/* Chapter insights */}
          {showInsights && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                Key Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chapter.insights.map(insightId => {
                  const insight = story.insights.find(i => i.id === insightId);
                  if (!insight) return null;

                  const Icon = getInsightIcon(insight.type);
                  return (
                    <DaisyCard key={insightId} className={`border-l-4 ${getImpactColor(insight.impact)}`}>
                      <DaisyCardContent className="pt-4" >
  <div className="flex items-start space-x-3">
</DaisyCard>
                          <Icon className="w-5 h-5 mt-1" />
                          <div>
                            <h4 className="font-medium text-gray-900">{insight.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <DaisyBadge variant="outline" className="text-xs" >
  {insight.confidence}% confidence
</DaisyBadge>
                              </DaisyBadge>
                              <DaisyBadge variant="outline" className="text-xs capitalize" >
  {insight.impact} impact
</DaisyBadge>
                              </DaisyBadge>
                              {insight.actionable && (
                                <DaisyBadge variant="default" className="text-xs" >
  Actionable
</DaisyBadge>
                                </DaisyBadge>
                              )}
                            </div>
                          </div>
                        </div>
                      </DaisyCardContent>
                    </DaisyCard>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Annotations */}
        {showAnnotations && chapter.annotations.map(annotation => (
          <div
            key={annotation.id}
            className={`absolute pointer-events-none ${
              annotation.style.animation === 'pulse' ? 'animate-pulse' : ''
            }`}
            style={{
              left: annotation.position.x,
              top: annotation.position.y
            }}
          >
            <div className={`bg-white border-2 border-current rounded-lg p-2 shadow-lg text-sm font-medium`}
                 style={{ color: annotation.style.color }}>
              {annotation.content}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''} ${className}`}>
      {/* Story Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">{story.title}</h1>
              <p className="text-blue-100 mt-1">{story.subtitle}</p>
            </div>
            <div className="flex items-center space-x-2">
              <DaisyBadge variant="secondary" className="text-xs" >
  {story.metadata.audience}
</DaisyBadge>
              </DaisyBadge>
              <DaisyBadge variant="secondary" className="text-xs" >
  {Math.floor(story.metadata.duration / 60)}m {story.metadata.duration % 60}s
</DaisyBadge>
              </DaisyBadge>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-blue-100">
              <span>Chapter {currentChapter + 1} of {story.chapters.length}</span>
              <span>{Math.round(storyProgress)}% complete</span>
            </div>
            <DaisyProgress value={storyProgress} className="h-2 bg-blue-500" />
          </div>
        </div>
      </div>

      {/* Story Controls */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <DaisyButton
              variant="outline"
              size="sm"
              onClick={previousChapter}
              disabled={currentChapter === 0} >
  <ChevronLeft className="w-4 h-4" />
</DaisyProgress>
            </DaisyButton>
            
            <DaisyButton
              variant="outline"
              size="sm"
              onClick={togglePlayback} >
  {isPlaying ? 
</DaisyButton><Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </DaisyButton>
            
            <DaisyButton
              variant="outline"
              size="sm"
              onClick={nextChapter}
              disabled={currentChapter === story.chapters.length - 1} >
  <ChevronRight className="w-4 h-4" />
</DaisyButton>
            </DaisyButton>

            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <DaisyButton
              variant="ghost"
              size="sm"
              onClick={() => setNarrationEnabled(!narrationEnabled)} />
              {narrationEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </DaisyButton>
            
            <DaisyButton
              variant="ghost"
              size="sm"
              onClick={() => setShowInsights(!showInsights)} />
              <Brain className="w-4 h-4" />
            </DaisyButton>
            
            <DaisyButton
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)} />
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </DaisyButton>

            <DaisyButton variant="outline" size="sm" onClick={() => onShareStory?.(story)} />
              <Share className="w-4 h-4 mr-2" />
              Share
            </DaisyButton>
            
            <DaisyButton variant="outline" size="sm" onClick={() => onSaveStory?.(story)} />
              <Download className="w-4 h-4 mr-2" />
              Export
            </DaisyButton>
          </div>
        </div>
      </div>

      {/* Story Content */}
      <div className="max-w-6xl mx-auto p-6">
        {renderCurrentChapter()}
      </div>

      {/* Story Generation Panel */}
      <DaisyCard className="max-w-6xl mx-auto m-6" >
  <DaisyCardHeader />
</DaisyCard>
          <DaisyCardTitle className="flex items-center" >
  <Wand2 className="w-5 h-5 mr-2" />
</DaisyCardTitle>
            AI Story Generation
          </DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <div className="flex items-center justify-between">
</DaisyCardContent>
            <div>
              <p className="text-gray-600">
                Generate new data stories automatically from your risk and compliance data
              </p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span>• AI-powered narrative generation</span>
                <span>• Automated insight discovery</span>
                <span>• Interactive visualizations</span>
                <span>• Multi-audience optimization</span>
              </div>
            </div>
            <DaisyButton onClick={generateStory} disabled={isGenerating} >
  {isGenerating ? (
</DaisyButton>
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Story
                </>
              )}
            </DaisyButton>
          </div>
          
          {isGenerating && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Analyzing data patterns...</span>
                <span>Step 2 of 5</span>
              </div>
              <DaisyProgress value={40} className="h-2" />
            </div>
          )}
        </DaisyProgress>
      </DaisyCard>

      {/* Story Summary */}
      <DaisyCard className="max-w-6xl mx-auto m-6" >
  <DaisyCardHeader />
</DaisyCard>
          <DaisyCardTitle className="flex items-center" >
  <BookOpen className="w-5 h-5 mr-2" />
</DaisyCardTitle>
            Story Summary
          </DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
</DaisyCardContent>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Key Findings</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                {story.narrative.keyFindings.map((finding, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                {story.narrative.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <Target className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Executive Summary</h4>
            <p className="text-sm text-blue-800">{story.narrative.executiveSummary}</p>
          </div>
        </DaisyCardContent>
      </DaisyCard>
    </div>
  );
};

export default DataStorytellingEngine; 