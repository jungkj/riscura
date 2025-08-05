"use client";

import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { useRouter, usePathname } from 'next/navigation';
import { useRCSA } from '@/context/RCSAContext';
import { cn } from '@/lib/utils';
import { DaisyTabs, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/daisy-components';
// import { 
  Shield, 
  BarChart3, 
  FileText, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  Users,
  Settings
} from 'lucide-react';

interface TabDefinition {
  value: string;
  label: string;
  href: string;
  badge?: number | string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  disabled?: boolean;
}

interface RCSANavigationTabsProps {
  entityType: 'risk' | 'control' | 'assessment';
  entityId: string;
  activeTab?: string;
  className?: string;
  showDescriptions?: boolean;
  variant?: 'default' | 'compact' | 'pills';
  children?: React.ReactNode;
}

export function RCSANavigationTabs({ 
  entityType, 
  entityId, 
  activeTab,
  className,
  showDescriptions = false,
  variant = 'default',
  children 
}: RCSANavigationTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { 
    getRelatedControls, 
    getRelatedRisks, 
    currentRisk,
    currentControl,
    controlRiskMappings,
    evidence
  } = useRCSA();
  
  const getTabsForEntityType = (): TabDefinition[] => {
    switch (entityType) {
      case 'risk':
        const relatedControls = getRelatedControls(entityId);
        const riskEvidence = evidence.filter(e => 
          relatedControls.some(c => c.id === e.controlId)
        );
        const overdueControls = relatedControls.filter(c => 
          c.nextTestDate && new Date(c.nextTestDate) < new Date()
        );
        
        return [
          { 
            value: 'overview', 
            label: 'Overview', 
            href: `/risks/${entityId}`,
            icon: BarChart3,
            description: 'Risk details, scoring, and status'
          },
          { 
            value: 'controls', 
            label: 'Controls', 
            href: `/risks/${entityId}/controls`,
            badge: relatedControls.length,
            icon: Shield,
            description: 'Controls that mitigate this risk'
          },
          { 
            value: 'assessments', 
            label: 'Assessments', 
            href: `/risks/${entityId}/assessments`,
            icon: CheckCircle,
            description: 'Risk assessment history and results'
          },
          { 
            value: 'evidence', 
            label: 'Evidence', 
            href: `/risks/${entityId}/evidence`,
            badge: riskEvidence.length,
            icon: FileText,
            description: 'Supporting documentation and evidence'
          },
          { 
            value: 'testing', 
            label: 'Testing', 
            href: `/risks/${entityId}/testing`,
            badge: overdueControls.length > 0 ? overdueControls.length : undefined,
            icon: Activity,
            description: 'Control testing status and results'
          },
          { 
            value: 'analytics', 
            label: 'Analytics', 
            href: `/risks/${entityId}/analytics`,
            icon: TrendingUp,
            description: 'Risk trends and effectiveness metrics'
          }
        ];
        
      case 'control':
        const relatedRisks = getRelatedRisks(entityId);
        const controlEvidence = evidence.filter(e => e.controlId === entityId);
        const controlMappings = controlRiskMappings.filter(m => m.controlId === entityId);
        const averageEffectiveness = controlMappings.length > 0 
          ? controlMappings.reduce((sum, m) => sum + m.effectiveness, 0) / controlMappings.length
          : 0;
        
        return [
          { 
            value: 'overview', 
            label: 'Overview', 
            href: `/controls/${entityId}`,
            icon: Shield,
            description: 'Control details and configuration'
          },
          { 
            value: 'risks', 
            label: 'Related Risks', 
            href: `/controls/${entityId}/risks`,
            badge: relatedRisks.length,
            icon: AlertTriangle,
            description: 'Risks mitigated by this control'
          },
          { 
            value: 'testing', 
            label: 'Testing', 
            href: `/controls/${entityId}/testing`,
            badge: currentControl?.nextTestDate ? 'Due' : undefined,
            icon: Activity,
            description: 'Testing procedures and schedules'
          },
          { 
            value: 'evidence', 
            label: 'Evidence', 
            href: `/controls/${entityId}/evidence`,
            badge: controlEvidence.length,
            icon: FileText,
            description: 'Control evidence and documentation'
          },
          { 
            value: 'effectiveness', 
            label: 'Effectiveness', 
            href: `/controls/${entityId}/effectiveness`,
            badge: `${Math.round(averageEffectiveness * 100)}%`,
            icon: Target,
            description: 'Control effectiveness measurements'
          },
          { 
            value: 'assignments', 
            label: 'Assignments', 
            href: `/controls/${entityId}/assignments`,
            icon: Users,
            description: 'Control ownership and responsibilities'
          }
        ];
        
      case 'assessment':
        return [
          { 
            value: 'overview', 
            label: 'Overview', 
            href: `/assessments/${entityId}`,
            icon: CheckCircle,
            description: 'Assessment summary and status'
          },
          { 
            value: 'scope', 
            label: 'Scope', 
            href: `/assessments/${entityId}/scope`,
            icon: Target,
            description: 'Assessment scope and objectives'
          },
          { 
            value: 'execution', 
            label: 'Execution', 
            href: `/assessments/${entityId}/execution`,
            icon: Activity,
            description: 'Assessment execution and progress'
          },
          { 
            value: 'findings', 
            label: 'Findings', 
            href: `/assessments/${entityId}/findings`,
            icon: AlertTriangle,
            description: 'Assessment findings and issues'
          },
          { 
            value: 'results', 
            label: 'Results', 
            href: `/assessments/${entityId}/results`,
            icon: TrendingUp,
            description: 'Assessment results and conclusions'
          }
        ];
        
      default:
        return [];
    }
  }

  const tabs = getTabsForEntityType();
  
  // Determine current tab from pathname if not explicitly provided
  const currentTab = activeTab || tabs.find(tab => pathname === tab.href)?.value || 'overview'

  const handleTabChange = (_value: string) => {
    const tab = tabs.find(t => t.value === value);
    if (tab && !tab.disabled) {
      router.push(tab.href);
    }
  }

  const getBadgeVariant = (badge: number | string | undefined) => {
    if (typeof badge === 'number') {
      if (badge === 0) return 'secondary';
      if (badge > 5) return 'destructive';
      return 'default';
    }
    if (typeof badge === 'string') {
      if (badge.includes('%')) {
        const percentage = parseInt(badge);
        if (percentage >= 80) return 'success';
        if (percentage >= 60) return 'secondary';
        return 'destructive';
      }
      if (badge === 'Due') return 'destructive';
    }
    return 'default';
  }

  const getTabContent = (tab: TabDefinition) => (
    <div className="flex items-center gap-2">
      {tab.icon && variant !== 'compact' && (
        <tab.icon className="h-4 w-4" />
      )}
      <span>{tab.label}</span>
      {tab.badge !== undefined && (
        <DaisyBadge 
          variant={getBadgeVariant(tab.badge)}
          className="ml-1 text-xs" >
  {tab.badge}
</DaisyBadge>
        </DaisyBadge>
      )}
    </div>
  );

  if (variant === 'pills') {

  return (
    <div className={cn("flex flex-wrap gap-2 mb-6", className)}>
        {tabs.map((tab) => (
                     <DaisyButton
             key={tab.value}
             variant={currentTab === tab.value ? 'primary' : 'outline'}
             size="sm"
             onClick={() =>
          handleTabChange(tab.value)}
             disabled={tab.disabled}
             className="h-auto py-2 px-3" />
            {getTabContent(tab)}
          
        </DaisyButton>
        ))}
        {children}
      </div>
    );
  }

  return (
    <div className={cn("border-b border-border mb-6", className)}>
      <DaisyTabs value={currentTab} onValueChange={handleTabChange} >
          <DaisyTabsList className={cn(
          "h-auto p-0 bg-transparent w-full justify-start",
          variant === 'compact' && "space-x-1"
        )} >
            {tabs.map((tab) => (
            <DaisyTabsTrigger
              key={tab.value}
              value={tab.value}
              disabled={tab.disabled}
              className={cn(
                "data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none",
                variant === 'compact' ? "px-3 py-2" : "px-4 py-3",
                tab.disabled && "opacity-50 cursor-not-allowed"
              )}
              title={showDescriptions ? tab.description : undefined} >
                {getTabContent(tab)}
            </DaisyTabs>
          ))}
        </DaisyTabsList>
      </DaisyTabs>
      
      {/* Description tooltip for current tab */}
      {Boolean(showDescriptions) && (
        <div className="mt-2 mb-4">
          {tabs.find(tab => tab.value === currentTab)?.description && (
            <p className="text-sm text-muted-foreground">
              {tabs.find(tab => tab.value === currentTab)?.description}
            </p>
          )}
        </div>
      )}
      
      {children}
    </div>
  );
}

// Quick navigation component for switching between related entities
export function RCSAQuickNavigation({ 
  currentEntityType, 
  currentEntityId,
  className 
}: { 
  currentEntityType: 'risk' | 'control'
  currentEntityId: string;
  className?: string;
}) {
  const { 
    getRelatedControls, 
    getRelatedRisks, 
    navigateToRisk, 
    navigateToControl,
    navigationContext 
  } = useRCSA();

  const getRelatedEntities = () => {
    if (currentEntityType === 'risk') {
      return {
        type: 'controls' as const,
        entities: getRelatedControls(currentEntityId),
        navigateTo: navigateToControl
      }
    } else {
      return {
        type: 'risks' as const,
        entities: getRelatedRisks(currentEntityId),
        navigateTo: navigateToRisk
      }
    }
  }

  const { type, entities, navigateTo } = getRelatedEntities();

  if (entities.length === 0) return null;

  return (
    <div className={cn("mb-6", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">
          Related {type === 'risks' ? 'Risks' : 'Controls'}
        </h3>
        <DaisyBadge variant="secondary" className="text-xs" >
  {entities.length}
</DaisyBadge>
        </DaisyBadge>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {entities.slice(0, 5).map((entity) => (
          <DaisyButton
            key={entity.id}
            variant="outline"
            size="sm"
            onClick={() => navigateTo(entity.id, {
              fromEntity: currentEntityType,
              fromId: currentEntityId,
              maintainContext: true
            })}
            className="h-auto py-1 px-2 text-xs truncate max-w-40"
            title={entity.title}
          >
            <div className="flex items-center gap-1">
              {type === 'risks' ? (
                <DaisyAlertTriangle className="h-3 w-3" >
  ) : (
</DaisyButton>
                <Shield className="h-3 w-3" />
              )}
              <span className="truncate">{entity.title}</span>
            </div>
          </DaisyButton>
        ))}
        
        {entities.length > 5 && (
          <DaisyButton
            variant="ghost"
            size="sm"
            className="h-auto py-1 px-2 text-xs text-muted-foreground">
          +{entities.length - 5} more

        </DaisyButton>
          </DaisyButton>
        )}
      </div>
    </div>
  );
}

// Tab content wrapper that provides consistent styling
export function RCSATabContent({ 
  children, 
  title, 
  description,
  actions,
  className 
}: {
  children: React.ReactNode
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {

  return (
    <div className={cn("space-y-6", className)}>
      {(title || description || actions) && (
        <div className="flex items-start justify-between">
          <div>
            {Boolean(title) && (
              <h2 className="text-lg font-semibold text-foreground mb-1">
                {title}
              </h2>
            )}
            {Boolean(description) && (
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {Boolean(actions) && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export default RCSANavigationTabs; 