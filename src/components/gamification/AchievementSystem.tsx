'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { 
  Trophy,
  Star,
  Target,
  Zap,
  Shield,
  Brain,
  Users,
  FileText,
  CheckCircle,
  Award,
  Sparkles,
  TrendingUp,
  Clock,
  Calendar,
  BarChart3,
  Lock,
  Unlock,
  Gift,
  Flame
} from 'lucide-react';

// Achievement definitions
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'onboarding' | 'exploration' | 'mastery' | 'collaboration' | 'milestone';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
  requirements: {
    type: 'action_count' | 'feature_usage' | 'time_based' | 'completion' | 'streak';
    target: number;
    actions?: string[];
    features?: string[];
    timeframe?: number; // days
  };
  unlocked: boolean;
  progress: number;
  unlockedAt?: Date;
  hidden?: boolean; // Secret achievements
}

// User progress tracking
interface UserProgress {
  totalPoints: number;
  level: number;
  achievements: Achievement[];
  streaks: {
    daily: number;
    weekly: number;
  };
  stats: {
    risksCreated: number;
    controlsAdded: number;
    reportsGenerated: number;
    aiQueriesAsked: number;
    featuresExplored: string[];
    daysActive: number;
    collaborations: number;
  };
}

// Achievement definitions
const ACHIEVEMENTS: Achievement[] = [
  // Onboarding achievements
  {
    id: 'first-steps',
    title: 'First Steps',
    description: 'Complete your profile setup',
    icon: Target,
    category: 'onboarding',
    tier: 'bronze',
    points: 10,
    requirements: { type: 'completion', target: 1 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'tour-guide',
    title: 'Tour Guide',
    description: 'Complete the product tour',
    icon: Sparkles,
    category: 'onboarding',
    tier: 'bronze',
    points: 15,
    requirements: { type: 'completion', target: 1 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'sample-explorer',
    title: 'Sample Explorer',
    description: 'Load sample data to get started',
    icon: FileText,
    category: 'onboarding',
    tier: 'bronze',
    points: 20,
    requirements: { type: 'completion', target: 1 },
    unlocked: false,
    progress: 0
  },

  // Exploration achievements
  {
    id: 'feature-explorer',
    title: 'Feature Explorer',
    description: 'Explore 5 different features',
    icon: Zap,
    category: 'exploration',
    tier: 'silver',
    points: 25,
    requirements: { 
      type: 'feature_usage', 
      target: 5,
      features: ['dashboard', 'risks', 'controls', 'reports', 'ai-assistant']
    },
    unlocked: false,
    progress: 0
  },
  {
    id: 'ai-curious',
    title: 'AI Curious',
    description: 'Ask 10 questions to ARIA',
    icon: Brain,
    category: 'exploration',
    tier: 'silver',
    points: 30,
    requirements: { type: 'action_count', target: 10, actions: ['ai_query'] },
    unlocked: false,
    progress: 0
  },
  {
    id: 'dashboard-master',
    title: 'Dashboard Master',
    description: 'Customize your dashboard layout',
    icon: BarChart3,
    category: 'exploration',
    tier: 'silver',
    points: 35,
    requirements: { type: 'completion', target: 1 },
    unlocked: false,
    progress: 0
  },

  // Mastery achievements
  {
    id: 'risk-assessor',
    title: 'Risk Assessor',
    description: 'Create 10 risk assessments',
    icon: Shield,
    category: 'mastery',
    tier: 'gold',
    points: 50,
    requirements: { type: 'action_count', target: 10, actions: ['create_risk'] },
    unlocked: false,
    progress: 0
  },
  {
    id: 'control-architect',
    title: 'Control Architect',
    description: 'Add 15 controls to your framework',
    icon: CheckCircle,
    category: 'mastery',
    tier: 'gold',
    points: 60,
    requirements: { type: 'action_count', target: 15, actions: ['add_control'] },
    unlocked: false,
    progress: 0
  },
  {
    id: 'report-generator',
    title: 'Report Generator',
    description: 'Generate 5 comprehensive reports',
    icon: FileText,
    category: 'mastery',
    tier: 'gold',
    points: 45,
    requirements: { type: 'action_count', target: 5, actions: ['generate_report'] },
    unlocked: false,
    progress: 0
  },

  // Collaboration achievements
  {
    id: 'team-player',
    title: 'Team Player',
    description: 'Collaborate on 3 risk assessments',
    icon: Users,
    category: 'collaboration',
    tier: 'silver',
    points: 40,
    requirements: { type: 'action_count', target: 3, actions: ['collaborate'] },
    unlocked: false,
    progress: 0
  },
  {
    id: 'knowledge-sharer',
    title: 'Knowledge Sharer',
    description: 'Share insights with team members 5 times',
    icon: Sparkles,
    category: 'collaboration',
    tier: 'gold',
    points: 55,
    requirements: { type: 'action_count', target: 5, actions: ['share_insight'] },
    unlocked: false,
    progress: 0
  },

  // Milestone achievements
  {
    id: 'week-warrior',
    title: 'Week Warrior',
    description: 'Stay active for 7 consecutive days',
    icon: Flame,
    category: 'milestone',
    tier: 'silver',
    points: 75,
    requirements: { type: 'streak', target: 7 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'month-master',
    title: 'Month Master',
    description: 'Stay active for 30 consecutive days',
    icon: Calendar,
    category: 'milestone',
    tier: 'gold',
    points: 150,
    requirements: { type: 'streak', target: 30 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'point-collector',
    title: 'Point Collector',
    description: 'Earn 500 achievement points',
    icon: Star,
    category: 'milestone',
    tier: 'platinum',
    points: 100,
    requirements: { type: 'action_count', target: 500, actions: ['points_earned'] },
    unlocked: false,
    progress: 0
  },

  // Hidden achievements
  {
    id: 'early-bird',
    title: 'Early Bird',
    description: 'Log in before 7 AM',
    icon: Clock,
    category: 'milestone',
    tier: 'bronze',
    points: 25,
    requirements: { type: 'completion', target: 1 },
    unlocked: false,
    progress: 0,
    hidden: true
  },
  {
    id: 'night-owl',
    title: 'Night Owl',
    description: 'Work past 10 PM',
    icon: Clock,
    category: 'milestone',
    tier: 'bronze',
    points: 25,
    requirements: { type: 'completion', target: 1 },
    unlocked: false,
    progress: 0,
    hidden: true
  }
];

// Achievement notification component
interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
}

const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  onClose
}) => {
  const Icon = achievement.icon;
  const tierColors = {
    bronze: 'bg-amber-100 text-amber-700 border-amber-200',
    silver: 'bg-gray-100 text-gray-700 border-gray-200',
    gold: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    platinum: 'bg-purple-100 text-purple-700 border-purple-200'
  };

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <DaisyCard className={`border-2 ${tierColors[achievement.tier]} shadow-lg max-w-sm`}>
        <DaisyCardContent className="p-4" >
  <div className="flex items-start space-x-3">
</DaisyCard>
            <div className="p-2 bg-white rounded-lg">
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <Trophy className="w-4 h-4" />
                <span className="font-semibold text-sm">Achievement Unlocked!</span>
              </div>
              <h4 className="font-medium text-gray-900">{achievement.title}</h4>
              <p className="text-sm text-gray-600">{achievement.description}</p>
              <div className="flex items-center space-x-2 mt-2">
                <DaisyBadge variant="secondary" className="text-xs" >
  +{achievement.points} points
</DaisyBadge>
                </DaisyBadge>
                <DaisyBadge variant="outline" className="text-xs capitalize" >
  {achievement.tier}
</DaisyBadge>
                </DaisyBadge>
              </div>
            </div>
            <DaisyButton
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600" >
  ×
</DaisyButton>
            </DaisyButton>
          </div>
        </DaisyCardContent>
      </DaisyCard>
    </div>
  );
};

// Main achievement system component
interface AchievementSystemProps {
  userProgress: UserProgress;
  onProgressUpdate: (progress: UserProgress) => void;
  className?: string;
}

export const AchievementSystem: React.FC<AchievementSystemProps> = ({
  userProgress,
  onProgressUpdate,
  className = ''
}) => {
  const [showNotification, setShowNotification] = useState<Achievement | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState(true);

  // Calculate user level based on points
  const calculateLevel = (points: number): number => {
    return Math.floor(points / 100) + 1;
  };

  // Calculate points needed for next level
  const pointsToNextLevel = (currentPoints: number): number => {
    const currentLevel = calculateLevel(currentPoints);
    const nextLevelPoints = currentLevel * 100;
    return nextLevelPoints - currentPoints;
  };

  // Track user action
  const trackAction = useCallback((action: string, metadata?: any) => {
    const updatedAchievements = userProgress.achievements.map(achievement => {
      if (achievement.unlocked) return achievement;

      let newProgress = achievement.progress;
      let unlocked = false;

      // Check if this action contributes to the achievement
      if (achievement.requirements.actions?.includes(action)) {
        newProgress = Math.min(newProgress + 1, achievement.requirements.target);
        unlocked = newProgress >= achievement.requirements.target;
      }

      // Feature usage tracking
      if (achievement.requirements.type === 'feature_usage' && 
          achievement.requirements.features?.includes(action)) {
        const exploredFeatures = userProgress.stats.featuresExplored;
        if (!exploredFeatures.includes(action)) {
          exploredFeatures.push(action);
          newProgress = exploredFeatures.length;
          unlocked = newProgress >= achievement.requirements.target;
        }
      }

      // Show notification for newly unlocked achievements
      if (unlocked && !achievement.unlocked) {
        setShowNotification({ ...achievement, unlocked: true, progress: newProgress });
      }

      return {
        ...achievement,
        progress: newProgress,
        unlocked,
        unlockedAt: unlocked && !achievement.unlocked ? new Date() : achievement.unlockedAt
      };
    });

    // Update user stats
    const updatedStats = { ...userProgress.stats };
    switch (action) {
      case 'create_risk':
        updatedStats.risksCreated++;
        break;
      case 'add_control':
        updatedStats.controlsAdded++;
        break;
      case 'generate_report':
        updatedStats.reportsGenerated++;
        break;
      case 'ai_query':
        updatedStats.aiQueriesAsked++;
        break;
      case 'collaborate':
        updatedStats.collaborations++;
        break;
    }

    // Calculate new total points
    const totalPoints = updatedAchievements
      .filter(a => a.unlocked)
      .reduce((sum, a) => sum + a.points, 0);

    const updatedProgress: UserProgress = {
      ...userProgress,
      achievements: updatedAchievements,
      stats: updatedStats,
      totalPoints,
      level: calculateLevel(totalPoints)
    };

    onProgressUpdate(updatedProgress);
  }, [userProgress, onProgressUpdate]);

  // Filter achievements
  const filteredAchievements = userProgress.achievements.filter(achievement => {
    if (!showCompleted && achievement.unlocked) return false;
    if (selectedCategory !== 'all' && achievement.category !== selectedCategory) return false;
    if (achievement.hidden && !achievement.unlocked) return false;
    return true;
  });

  // Group achievements by category
  const achievementsByCategory = filteredAchievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) acc[achievement.category] = [];
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const categories = [
    { id: 'all', name: 'All', icon: Star },
    { id: 'onboarding', name: 'Getting Started', icon: Target },
    { id: 'exploration', name: 'Exploration', icon: Zap },
    { id: 'mastery', name: 'Mastery', icon: Trophy },
    { id: 'collaboration', name: 'Collaboration', icon: Users },
    { id: 'milestone', name: 'Milestones', icon: Award }
  ];

  const tierColors = {
    bronze: 'bg-amber-50 border-amber-200 text-amber-700',
    silver: 'bg-gray-50 border-gray-200 text-gray-700',
    gold: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    platinum: 'bg-purple-50 border-purple-200 text-purple-700'
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Achievement notification */}
      {showNotification && (
        <AchievementNotification
          achievement={showNotification}
          onClose={() => setShowNotification(null)}
        />
      )}

      {/* Progress overview */}
      <DaisyCard >
  <DaisyCardHeader />
</DaisyCard>
          <DaisyCardTitle className="flex items-center space-x-2" >
  <Trophy className="w-5 h-5" />
</DaisyCardTitle>
            <span>Your Progress</span>
          </DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
</DaisyCardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                Level {userProgress.level}
              </div>
              <p className="text-sm text-gray-600">Current Level</p>
              <div className="mt-2">
                <DaisyProgress 
                  value={(userProgress.totalPoints % 100)} 
                  className="h-2" 
                />
                <p className="text-xs text-gray-500 mt-1">
                  {pointsToNextLevel(userProgress.totalPoints)} points to next level
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {userProgress.totalPoints}
              </div>
              <p className="text-sm text-gray-600">Total Points</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {userProgress.achievements.filter(a => a.unlocked).length}
              </div>
              <p className="text-sm text-gray-600">
                of {userProgress.achievements.length} Achievements
              </p>
            </div>
          </div>
        </DaisyProgress>
      </DaisyCard>

      {/* Achievement filters */}
      <DaisyCard >
  <DaisyCardContent className="p-4" >
  </DaisyCard>
</DaisyCardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <DaisyButton
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center space-x-1" />
                  <Icon className="w-4 h-4" />
                  <span>{category.name}</span>
                </DaisyButton>
              );
            })}
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
              />
              <span>Show completed</span>
            </label>
          </div>
        </DaisyCardContent>
      </DaisyCard>

      {/* Achievements grid */}
      <div className="space-y-6">
        {Object.entries(achievementsByCategory).map(([category, achievements]) => (
          <div key={category}>
            {selectedCategory === 'all' && (
              <h3 className="text-lg font-semibold mb-4 capitalize">
                {category.replace('-', ' ')}
              </h3>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map(achievement => {
                const Icon = achievement.icon;
                const progressPercentage = (achievement.progress / achievement.requirements.target) * 100;
                
                return (
                  <DaisyCard
                    key={achievement.id}
                    className={`transition-all duration-200 ${
                      achievement.unlocked 
                        ? `${tierColors[achievement.tier]} shadow-md` 
                        : 'hover:shadow-md'
                    }`}
                  >
                    <DaisyCardContent className="p-4" >
  <div className="flex items-start space-x-3">
</DaisyCard>
                        <div className={`p-2 rounded-lg ${
                          achievement.unlocked 
                            ? 'bg-white' 
                            : 'bg-gray-100'
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            achievement.unlocked 
                              ? '' 
                              : 'text-gray-400'
                          }`} />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className={`font-medium ${
                              achievement.unlocked 
                                ? 'text-gray-900' 
                                : 'text-gray-500'
                            }`}>
                              {achievement.title}
                            </h4>
                            {achievement.unlocked && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                          
                          <p className={`text-sm mb-3 ${
                            achievement.unlocked 
                              ? 'text-gray-700' 
                              : 'text-gray-500'
                          }`}>
                            {achievement.description}
                          </p>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">
                                {achievement.progress} / {achievement.requirements.target}
                              </span>
                              <DaisyBadge variant="outline" className="text-xs capitalize" >
  {achievement.tier}
</DaisyBadge>
                              </DaisyBadge>
                            </div>
                            
                            <DaisyProgress value={progressPercentage} className="h-1" />
                            
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {achievement.points} points
                              </span>
                              {achievement.unlockedAt && (
                                <span className="text-xs text-gray-500">
                                  Unlocked {achievement.unlockedAt.toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </DaisyProgress>
                  </DaisyCard>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions for testing */}
      <DaisyCard >
  <DaisyCardHeader />
</DaisyCard>
          <DaisyCardTitle>Quick Actions (Demo)</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <div className="flex flex-wrap gap-2">
</DaisyCardContent>
            <DaisyButton size="sm" onClick={() => trackAction('create_risk')} />
              Create Risk
            </DaisyButton>
            <DaisyButton size="sm" onClick={() => trackAction('add_control')} />
              Add Control
            </DaisyButton>
            <DaisyButton size="sm" onClick={() => trackAction('generate_report')} />
              Generate Report
            </DaisyButton>
            <DaisyButton size="sm" onClick={() => trackAction('ai_query')} />
              Ask AI
            </DaisyButton>
            <DaisyButton size="sm" onClick={() => trackAction('dashboard')} />
              Explore Dashboard
            </DaisyButton>
          </div>
        </DaisyCardContent>
      </DaisyCard>
    </div>
  );
};

// Hook for using achievements
export const useAchievements = () => {
  const [userProgress, setUserProgress] = useState<UserProgress>({
    totalPoints: 0,
    level: 1,
    achievements: ACHIEVEMENTS,
    streaks: { daily: 0, weekly: 0 },
    stats: {
      risksCreated: 0,
      controlsAdded: 0,
      reportsGenerated: 0,
      aiQueriesAsked: 0,
      featuresExplored: [],
      daysActive: 0,
      collaborations: 0
    }
  });

  const trackAction = useCallback((action: string, metadata?: any) => {
    // This would integrate with the AchievementSystem component
    console.log('Action tracked:', action, metadata);
  }, []);

  return {
    userProgress,
    setUserProgress,
    trackAction
  };
};

export default AchievementSystem;
