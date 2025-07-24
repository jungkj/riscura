'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { 
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Star,
  Lightbulb,
  Zap,
  Target,
  ChevronRight,
  CheckCircle,
  Clock,
  TrendingUp,
  Settings,
  Sparkles
} from 'lucide-react';

// Feature definition
interface Feature {
  id: string;
  name: string;
  description: string;
  category: 'basic' | 'intermediate' | 'advanced' | 'expert';
  icon: React.ComponentType<any>;
  unlockCriteria: {
    type: 'time' | 'actions' | 'achievements' | 'manual';
    requirement: number | string[];
    description: string;
  };
  isUnlocked: boolean;
  isVisible: boolean;
  priority: number;
  benefits: string[];
  relatedFeatures?: string[];
}

// User experience level
interface UserExperience {
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  daysActive: number;
  actionsCompleted: number;
  achievementsUnlocked: string[];
  featuresUsed: string[];
  confidenceScore: number; // 0-100
}

// Feature definitions
const FEATURES: Feature[] = [
  // Basic features (always visible)
  {
    id: 'dashboard',
    name: 'Dashboard Overview',
    description: 'Your main risk management hub',
    category: 'basic',
    icon: Target,
    unlockCriteria: { type: 'manual', requirement: [], description: 'Available immediately' },
    isUnlocked: true,
    isVisible: true,
    priority: 1,
    benefits: ['Real-time risk metrics', 'Quick access to key functions', 'Visual risk overview']
  },
  {
    id: 'risk-creation',
    name: 'Risk Creation',
    description: 'Add and manage risks',
    category: 'basic',
    icon: Zap,
    unlockCriteria: { type: 'manual', requirement: [], description: 'Available immediately' },
    isUnlocked: true,
    isVisible: true,
    priority: 2,
    benefits: ['Document new risks', 'Structured risk assessment', 'Risk categorization']
  },

  // Intermediate features
  {
    id: 'bulk-operations',
    name: 'Bulk Operations',
    description: 'Manage multiple items at once',
    category: 'intermediate',
    icon: CheckCircle,
    unlockCriteria: { 
      type: 'actions', 
      requirement: 10, 
      description: 'Create 10 risks or controls' 
    },
    isUnlocked: false,
    isVisible: false,
    priority: 3,
    benefits: ['Save time with batch operations', 'Consistent data updates', 'Efficient workflow management'],
    relatedFeatures: ['risk-creation', 'control-management']
  },
  {
    id: 'custom-fields',
    name: 'Custom Fields',
    description: 'Customize data collection',
    category: 'intermediate',
    icon: Settings,
    unlockCriteria: { 
      type: 'time', 
      requirement: 7, 
      description: 'Active for 7 days' 
    },
    isUnlocked: false,
    isVisible: false,
    priority: 4,
    benefits: ['Tailor forms to your needs', 'Capture specific data points', 'Flexible data structure']
  },
  {
    id: 'advanced-reporting',
    name: 'Advanced Reporting',
    description: 'Create detailed custom reports',
    category: 'intermediate',
    icon: TrendingUp,
    unlockCriteria: { 
      type: 'achievements', 
      requirement: ['report-generator'], 
      description: 'Unlock the Report Generator achievement' 
    },
    isUnlocked: false,
    isVisible: false,
    priority: 5,
    benefits: ['Custom report templates', 'Advanced filtering', 'Scheduled reports']
  },

  // Advanced features
  {
    id: 'workflow-automation',
    name: 'Workflow Automation',
    description: 'Automate repetitive tasks',
    category: 'advanced',
    icon: Zap,
    unlockCriteria: { 
      type: 'actions', 
      requirement: 50, 
      description: 'Complete 50 risk management actions' 
    },
    isUnlocked: false,
    isVisible: false,
    priority: 6,
    benefits: ['Automated notifications', 'Task assignment rules', 'Process standardization']
  },
  {
    id: 'api-integrations',
    name: 'API Integrations',
    description: 'Connect with external systems',
    category: 'advanced',
    icon: Settings,
    unlockCriteria: { 
      type: 'achievements', 
      requirement: ['feature-explorer', 'dashboard-master'], 
      description: 'Unlock Feature Explorer and Dashboard Master achievements' 
    },
    isUnlocked: false,
    isVisible: false,
    priority: 7,
    benefits: ['Data synchronization', 'External tool integration', 'Automated data import']
  },

  // Expert features
  {
    id: 'advanced-analytics',
    name: 'Advanced Analytics',
    description: 'Deep insights and predictive modeling',
    category: 'expert',
    icon: TrendingUp,
    unlockCriteria: { 
      type: 'time', 
      requirement: 30, 
      description: 'Active for 30 days with consistent usage' 
    },
    isUnlocked: false,
    isVisible: false,
    priority: 8,
    benefits: ['Predictive risk modeling', 'Trend analysis', 'Statistical insights']
  },
  {
    id: 'custom-frameworks',
    name: 'Custom Risk Frameworks',
    description: 'Build your own risk assessment frameworks',
    category: 'expert',
    icon: Target,
    unlockCriteria: { 
      type: 'achievements', 
      requirement: ['risk-assessor', 'control-architect'], 
      description: 'Master risk assessment and control management' 
    },
    isUnlocked: false,
    isVisible: false,
    priority: 9,
    benefits: ['Tailored assessment criteria', 'Industry-specific frameworks', 'Custom scoring models']
  }
];

// Progressive disclosure component
interface ProgressiveDisclosureProps {
  userExperience: UserExperience;
  onFeatureUnlock?: (featureId: string) => void;
  onFeatureHide?: (featureId: string) => void;
  className?: string;
}

export const ProgressiveDisclosure: React.FC<DaisyProgressiveDisclosureProps> = ({
  userExperience,
  onFeatureUnlock,
  onFeatureHide,
  className = ''
}) => {
  const [features, setFeatures] = useState<Feature[]>(FEATURES);
  const [showHidden, setShowHidden] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Check unlock criteria
  const checkUnlockCriteria = useCallback((feature: Feature): boolean => {
    const { type, requirement } = feature.unlockCriteria;

    switch (type) {
      case 'time':
        return userExperience.daysActive >= (requirement as number);
      
      case 'actions':
        return userExperience.actionsCompleted >= (requirement as number);
      
      case 'achievements':
        const requiredAchievements = requirement as string[];
        return requiredAchievements.every(achievement => 
          userExperience.achievementsUnlocked.includes(achievement)
        );
      
      case 'manual':
        return true;
      
      default:
        return false;
    }
  }, [userExperience]);

  // Update feature visibility and unlock status
  useEffect(() => {
    setFeatures(prevFeatures => 
      prevFeatures.map(feature => {
        const shouldUnlock = checkUnlockCriteria(feature);
        const shouldShow = shouldUnlock || feature.category === 'basic';

        // Notify when feature is newly unlocked
        if (shouldUnlock && !feature.isUnlocked) {
          onFeatureUnlock?.(feature.id);
        }

        return {
          ...feature,
          isUnlocked: shouldUnlock,
          isVisible: shouldShow
        };
      })
    );
  }, [userExperience, checkUnlockCriteria, onFeatureUnlock]);

  // Filter features
  const filteredFeatures = features.filter(feature => {
    if (!showHidden && !feature.isVisible) return false;
    if (selectedCategory !== 'all' && feature.category !== selectedCategory) return false;
    return true;
  });

  // Group features by category
  const featuresByCategory = filteredFeatures.reduce((acc, feature) => {
    if (!acc[feature.category]) acc[feature.category] = [];
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, Feature[]>);

  // Calculate progress
  const totalFeatures = features.length;
  const unlockedFeatures = features.filter(f => f.isUnlocked).length;
  const progressPercentage = (unlockedFeatures / totalFeatures) * 100;

  const categories = [
    { id: 'all', name: 'All Features', color: 'bg-gray-100' },
    { id: 'basic', name: 'Basic', color: 'bg-green-100' },
    { id: 'intermediate', name: 'Intermediate', color: 'bg-blue-100' },
    { id: 'advanced', name: 'Advanced', color: 'bg-orange-100' },
    { id: 'expert', name: 'Expert', color: 'bg-purple-100' }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'basic': return 'bg-green-50 border-green-200 text-green-700';
      case 'intermediate': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'advanced': return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'expert': return 'bg-purple-50 border-purple-200 text-purple-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getUnlockProgress = (feature: Feature): number => {
    const { type, requirement } = feature.unlockCriteria;

    switch (type) {
      case 'time':
        return Math.min((userExperience.daysActive / (requirement as number)) * 100, 100);
      
      case 'actions':
        return Math.min((userExperience.actionsCompleted / (requirement as number)) * 100, 100);
      
      case 'achievements':
        const requiredAchievements = requirement as string[];
        const unlockedCount = requiredAchievements.filter(achievement => 
          userExperience.achievementsUnlocked.includes(achievement)
        ).length;
        return (unlockedCount / requiredAchievements.length) * 100;
      
      default:
        return 100;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Progress overview */}
      <DaisyCard>
        <DaisyCardHeader>
          <DaisyCardTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5" />
            <span>Feature Discovery Progress</span>
          </DaisyCardTitle>
          <p className="text-gray-600">
            Unlock new features as you become more experienced with Riscura
          </p>
        
        <DaisyCardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-gray-600">
                {unlockedFeatures} of {totalFeatures} features unlocked
              </span>
            </div>
            <DaisyProgress value={progressPercentage} className="h-3" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {categories.slice(1).map(category => {
                const categoryFeatures = features.filter(f => f.category === category.id);
                const unlockedInCategory = categoryFeatures.filter(f => f.isUnlocked).length;
                
                return (
                  <div key={category.id} className="text-center">
                    <div className={`w-12 h-12 rounded-full ${category.color} flex items-center justify-center mx-auto mb-2`}>
                      <span className="font-semibold text-sm">
                        {unlockedInCategory}/{categoryFeatures.length}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{category.name}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </DaisyCardBody>
      </DaisyCard>

      {/* Feature filters */}
      <DaisyCard>
        <DaisyCardContent className="p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map(category => (
              <DaisyButton
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </DaisyButton>
            ))}
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showHidden}
                onChange={(e) => setShowHidden(e.target.checked)}
              />
              <span>Show locked features</span>
            </label>
          </div>
        </DaisyCardBody>
      </DaisyCard>

      {/* Features grid */}
      <div className="space-y-6">
        {Object.entries(featuresByCategory).map(([category, categoryFeatures]) => (
          <div key={category}>
            {selectedCategory === 'all' && (
              <h3 className="text-lg font-semibold mb-4 capitalize flex items-center space-x-2">
                <span>{category} Features</span>
                <DaisyBadge variant="secondary" className="text-xs">
                  {categoryFeatures.filter(f => f.isUnlocked).length} / {categoryFeatures.length}
                </DaisyBadge>
              </h3>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryFeatures
                .sort((a, b) => a.priority - b.priority)
                .map(feature => {
                  const Icon = feature.icon;
                  const unlockProgress = getUnlockProgress(feature);
                  
                  return (
                    <DaisyCard
                      key={feature.id}
                      className={`transition-all duration-200 ${
                        feature.isUnlocked 
                          ? `${getCategoryColor(feature.category)} shadow-md` 
                          : 'opacity-75 hover:shadow-md'
                      }`}
                    >
                      <DaisyCardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${
                            feature.isUnlocked 
                              ? 'bg-white' 
                              : 'bg-gray-100'
                          }`}>
                            {feature.isUnlocked ? (
                              <Icon className="w-5 h-5" />
                            ) : (
                              <Lock className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className={`font-medium ${
                                feature.isUnlocked 
                                  ? 'text-gray-900' 
                                  : 'text-gray-500'
                              }`}>
                                {feature.name}
                              </h4>
                              {feature.isUnlocked && (
                                <Unlock className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                            
                            <p className={`text-sm mb-3 ${
                              feature.isUnlocked 
                                ? 'text-gray-700' 
                                : 'text-gray-500'
                            }`}>
                              {feature.description}
                            </p>
                            
                            {!feature.isUnlocked && (
                              <div className="space-y-2 mb-3">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-500">Unlock Progress</span>
                                  <span className="text-gray-500">{Math.round(unlockProgress)}%</span>
                                </div>
                                <DaisyProgress value={unlockProgress} className="h-1" />
                                <p className="text-xs text-gray-500">
                                  {feature.unlockCriteria.description}
                                </p>
                              </div>
                            )}
                            
                            {feature.isUnlocked && (
                              <div className="space-y-2">
                                <h5 className="text-xs font-medium text-gray-700">Benefits:</h5>
                                <ul className="text-xs text-gray-600 space-y-1">
                                  {feature.benefits.slice(0, 2).map((benefit, index) => (
                                    <li key={index} className="flex items-start space-x-1">
                                      <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                      <span>{benefit}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between mt-3">
                              <DaisyBadge variant="outline" className="text-xs capitalize">
                                {feature.category}
                              </DaisyBadge>
                              
                              {feature.isUnlocked && (
                                <DaisyButton
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700 h-auto p-0"
                                >
                                  Explore <ChevronRight className="w-3 h-3 ml-1" />
                                </DaisyButton>
                              )}
                            </div>
                          </div>
                        </div>
                      </DaisyCardBody>
                    </DaisyCard>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {/* Next unlock preview */}
      {(() => {
        const nextFeature = features
          .filter(f => !f.isUnlocked)
          .sort((a, b) => getUnlockProgress(b) - getUnlockProgress(a))[0];
        
        if (!nextFeature) return null;
        
        const Icon = nextFeature.icon;
        const progress = getUnlockProgress(nextFeature);
        
        return (
          <DaisyCard className="border-2 border-dashed border-blue-200 bg-blue-50">
            <DaisyCardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 mb-1">
                    Next Feature: {nextFeature.name}
                  </h4>
                  <p className="text-sm text-blue-700 mb-2">
                    {nextFeature.unlockCriteria.description}
                  </p>
                  <div className="flex items-center space-x-2">
                    <DaisyProgress value={progress} className="h-2 flex-1" />
                    <span className="text-xs text-blue-600 font-medium">
                      {Math.round(progress)}%
                    </span>
                  </div>
                </div>
              </div>
            </DaisyCardBody>
          </DaisyCard>
        );
      })()}
    </div>
  );
};

export default ProgressiveDisclosure; 