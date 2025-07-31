import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  BarChart3,
  Download,
  Settings,
  Zap,
  Eye,
  Calendar,
  Users
} from 'lucide-react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { useAI } from '@/context/AIContext';
import { PRICING_TIERS } from '@/services/TokenManagementService';
import { AgentType } from '@/types/ai.types';
import { AI_AGENTS } from '@/config/ai-agents';

interface UsageCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

const UsageCard: React.FC<UsageCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendValue, 
  color = 'blue' 
}) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    orange: 'text-orange-600 bg-orange-50',
    red: 'text-red-600 bg-red-50',
    purple: 'text-purple-600 bg-purple-50'
  };

  const trendIcons = {
    up: <TrendingUp className="h-3 w-3 text-green-500" />,
    down: <TrendingDown className="h-3 w-3 text-red-500" />,
    stable: <div className="h-3 w-3 bg-gray-400 rounded-full" />
  };

  return (
    <DaisyCard>
      <DaisyCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <DaisyCardTitle className="text-sm font-medium">{title}</DaisyCardTitle>
        <div className={`rounded-full p-2 ${colorClasses[color]}`}>
          {icon}
        </div>
      
      <DaisyCardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center text-xs text-muted-foreground">
          <span>{subtitle}</span>
          {trend && trendValue && (
            <div className="flex items-center ml-2">
              {trendIcons[trend]}
              <span className="ml-1">{trendValue}</span>
            </div>
          )}
        </div>
      </DaisyCardContent>
    </DaisyCard>
  );
};

interface QuotaBarProps {
  label: string;
  used: number;
  limit: number;
  period: string;
  cost: number;
}

const QuotaBar: React.FC<QuotaBarProps> = ({ label, used, limit, period, cost }) => {
  const percentage = (used / limit) * 100;
  const isWarning = percentage >= 80;
  const isCritical = percentage >= 95;

  const getProgressColor = () => {
    if (isCritical) return 'bg-red-500';
    if (isWarning) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center space-x-2">
          <DaisyBadge variant={isCritical ? 'destructive' : isWarning ? 'secondary' : 'default'}>
            {used.toLocaleString()} / {limit.toLocaleString()}
          </DaisyBadge>
          <span className="text-xs text-muted-foreground">
            ${cost.toFixed(4)}
          </span>
        </div>
      </div>
      <div className="relative">
        <DaisyProgress value={Math.min(percentage, 100)} className="h-2" />
        <div 
          className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getProgressColor()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{percentage.toFixed(1)}% used</span>
        <span>{period}</span>
      </div>
    </div>
  );
};

export const TokenUsageAnalytics: React.FC = () => {
  const { 
    tokenUsageMetrics, 
    realTimeUsageStats, 
    usageAlerts, 
    acknowledgeAlert,
    generateUsageReport,
    exportUsageData,
    upgradeTier,
    conversationUsages
  } = useAI();
  
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedAgent, setSelectedAgent] = useState<AgentType | 'all'>('all');

  const handleExportData = (format: 'json' | 'csv') => {
    exportUsageData(format);
  };

  const handleUpgradeTier = (tierName: string) => {
    const success = upgradeTier(tierName);
    if (success) {
      // Show success message
      console.log(`Successfully upgraded to ${tierName}`);
    }
  };

  // Calculate agent usage statistics
  const agentUsageStats = Object.entries(AI_AGENTS).map(([agentType, config]) => {
    const agentConversations = conversationUsages.filter(conv => conv.agentType === agentType);
    const totalTokens = agentConversations.reduce((sum, conv) => sum + conv.tokens, 0);
    const totalCost = agentConversations.reduce((sum, conv) => sum + conv.cost, 0);
    const conversationCount = agentConversations.length;

    return {
      agentType: agentType as AgentType,
      name: config.name,
      tokens: totalTokens,
      cost: totalCost,
      conversations: conversationCount,
      percentage: totalTokens > 0 ? (totalTokens / realTimeUsageStats.todayTokens) * 100 : 0
    };
  }).sort((a, b) => b.tokens - a.tokens);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Token Usage Analytics</h2>
          <p className="text-muted-foreground">
            Monitor your AI usage, costs, and quotas in real-time
          </p>
        </div>
        <div className="flex space-x-2">
          <DaisyButton variant="outline" onClick={() => handleExportData('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </DaisyButton>
          <DaisyButton variant="outline" onClick={() => handleExportData('json')}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </DaisyButton>
        </div>
      </div>

      {/* Usage Alerts */}
      {usageAlerts.length > 0 && (
        <div className="space-y-2">
          {usageAlerts.map((alert) => (
            <DaisyAlert 
              key={alert.id} 
              variant={alert.severity === 'critical' ? 'destructive' : 'default'}
            >
              <DaisyAlertTriangle className="h-4 w-4" />
              <DaisyAlertTitle>{alert.type.replace('_', ' ').toUpperCase()}</DaisyCardTitle>
              <DaisyAlertDescription className="flex justify-between items-center">
                <span>{alert.message}</span>
                <DaisyButton 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => acknowledgeAlert(alert.id)}
                >
                  Dismiss
                </DaisyButton>
              
            </DaisyAlert>
          ))}
        </div>
      )}

      {/* Current Tier and Upgrade Options */}
      <DaisyCard>
        <DaisyCardHeader>
          <DaisyCardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Current Plan: {tokenUsageMetrics.currentTier}</span>
          </DaisyCardTitle>
          <DaisyCardDescription>
            Manage your subscription and view available upgrades
          </p>
        
        <DaisyCardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(PRICING_TIERS).map(([tierKey, tier]) => (
              <div 
                key={tierKey}
                className={`border rounded-lg p-4 ${
                  tier.name === tokenUsageMetrics.currentTier 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{tier.name}</h3>
                  <DaisyBadge variant={tier.name === tokenUsageMetrics.currentTier ? 'default' : 'outline'}>
                    ${tier.monthlyPrice}/mo
                  </DaisyBadge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{tier.description}</p>
                <div className="space-y-1 text-xs">
                  <div>{tier.quotas.dailyTokenLimit.toLocaleString()} daily tokens</div>
                  <div>${tier.quotas.dailyCostLimit} daily cost limit</div>
                  <div>{tier.quotas.conversationLimit} conversations</div>
                </div>
                {tier.name !== tokenUsageMetrics.currentTier && (
                  <DaisyButton 
                    size="sm" 
                    className="w-full mt-3"
                    onClick={() => handleUpgradeTier(tierKey)}
                  >
                    Upgrade
                  </DaisyButton>
                )}
              </div>
            ))}
          </div>
        </DaisyCardContent>
      </DaisyCard>

      <DaisyTabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as typeof selectedPeriod)}>
        <DaisyTabsList>
          <DaisyTabsTrigger value="daily">Today</DaisyTabsTrigger>
          <DaisyTabsTrigger value="weekly">This Week</DaisyTabsTrigger>
          <DaisyTabsTrigger value="monthly">This Month</DaisyTabsTrigger>
        </DaisyTabsList>

        <DaisyTabsContent value={selectedPeriod} className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <UsageCard
              title="Session Usage"
              value={realTimeUsageStats.sessionTokens.toLocaleString()}
              subtitle="tokens this session"
              icon={<Zap className="h-4 w-4" />}
              color="blue"
              trend="up"
              trendValue={`$${realTimeUsageStats.sessionCost.toFixed(4)}`}
            />
            <UsageCard
              title="Today's Usage"
              value={realTimeUsageStats.todayTokens.toLocaleString()}
              subtitle="tokens today"
              icon={<BarChart3 className="h-4 w-4" />}
              color="green"
              trend="up"
              trendValue={`${realTimeUsageStats.todayConversations} conversations`}
            />
            <UsageCard
              title="Session Duration"
              value={Math.round(realTimeUsageStats.sessionDuration / 60000)}
              subtitle="minutes active"
              icon={<Clock className="h-4 w-4" />}
              color="orange"
            />
            <UsageCard
              title="Cost Today"
              value={`$${realTimeUsageStats.todayCost.toFixed(4)}`}
              subtitle="spent today"
              icon={<DollarSign className="h-4 w-4" />}
              color="purple"
              trend="up"
              trendValue={`Est. $${realTimeUsageStats.costProjections.daily.toFixed(2)}/day`}
            />
          </div>

          {/* Quota Status */}
          <DaisyCard>
            <DaisyCardHeader>
              <DaisyCardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Quota Status</span>
              </DaisyCardTitle>
              <DaisyCardDescription>
                Track your usage against plan limits
              </p>
            
            <DaisyCardContent className="space-y-4">
              <QuotaBar
                label="Daily Quota"
                used={tokenUsageMetrics.dailyTokens}
                limit={tokenUsageMetrics.dailyLimit}
                period="Resets daily"
                cost={tokenUsageMetrics.dailyCost}
              />
              <QuotaBar
                label="Weekly Quota"
                used={tokenUsageMetrics.weeklyTokens}
                limit={tokenUsageMetrics.weeklyLimit}
                period="Resets weekly"
                cost={tokenUsageMetrics.weeklyCost}
              />
              <QuotaBar
                label="Monthly Quota"
                used={tokenUsageMetrics.monthlyTokens}
                limit={tokenUsageMetrics.monthlyLimit}
                period="Resets monthly"
                cost={tokenUsageMetrics.monthlyCost}
              />
            </DaisyCardContent>
          </DaisyCard>

          {/* Agent Usage Breakdown */}
          <DaisyCard>
            <DaisyCardHeader>
              <DaisyCardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Agent Usage Breakdown</span>
              </DaisyCardTitle>
              <DaisyCardDescription>
                See which AI agents you use most
              </p>
            
            <DaisyCardContent>
              <div className="space-y-4">
                {agentUsageStats.map((agent) => (
                  <div key={agent.agentType} className="flex items-center space-x-4">
                    <div className="w-24 text-sm font-medium">{agent.name}</div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{agent.tokens.toLocaleString()} tokens</span>
                        <span className="text-muted-foreground">
                          ${agent.cost.toFixed(4)} ({agent.conversations} conversations)
                        </span>
                      </div>
                      <DaisyProgress value={agent.percentage} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </DaisyCardContent>
          </DaisyCard>

          {/* Cost Projections */}
          <DaisyCard>
            <DaisyCardHeader>
              <DaisyCardTitle className="flex items-center space-x-2">
                <DaisyCalendar className="h-5 w-5" />
                <span>Cost Projections</span>
              </DaisyCardTitle>
              <DaisyCardDescription>
                Projected costs based on current usage patterns
              </p>
            
            <DaisyCardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    ${realTimeUsageStats.costProjections.daily.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Daily</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ${realTimeUsageStats.costProjections.weekly.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Weekly</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    ${realTimeUsageStats.costProjections.monthly.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Monthly</div>
                </div>
              </div>
            </DaisyCardContent>
          </DaisyCard>

          {/* Recent Conversations */}
          <DaisyCard>
            <DaisyCardHeader>
              <DaisyCardTitle>Recent High-Usage Conversations</DaisyCardTitle>
              <DaisyCardDescription>
                Conversations with the highest token usage
              </p>
            
            <DaisyCardContent>
              <div className="space-y-3">
                {conversationUsages.slice(0, 5).map((conversation) => (
                  <div key={conversation.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{conversation.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {conversation.agentType} • {conversation.messageCount} messages
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{conversation.tokens.toLocaleString()} tokens</div>
                      <div className="text-sm text-muted-foreground">${conversation.cost.toFixed(4)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </DaisyCardContent>
          </DaisyCard>
        </DaisyTabsContent>
      </DaisyTabs>
    </div>
  );
};

export default TokenUsageAnalytics; 