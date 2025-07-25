import React, { useState } from 'react';
import { AgentType } from '@/types/ai.types';
import { AI_AGENTS, type AgentConfig } from '@/config/ai-agents';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { 
  Brain, 
  Shield, 
  FileCheck, 
  Bot,
  Target,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Lightbulb
} from 'lucide-react';

interface AgentSelectorProps {
  selectedAgent: AgentType;
  onAgentSelect: (agentType: AgentType) => void;
  onStartConversation?: (agentType: AgentType) => void;
}

const AgentSelector: React.FC<AgentSelectorProps> = ({
  selectedAgent,
  onAgentSelect,
  onStartConversation
}) => {
  const [expandedAgent, setExpandedAgent] = useState<AgentType | null>(null);

  const getAgentIcon = (agentType: AgentType) => {
    const icons = {
      risk_analyzer: Brain,
      control_advisor: Shield,
      compliance_expert: FileCheck,
      general_assistant: Bot
    };
    return icons[agentType];
  };

  const getAgentColor = (agentType: AgentType) => {
    const colors = {
      risk_analyzer: 'bg-blue-500',
      control_advisor: 'bg-green-500',
      compliance_expert: 'bg-purple-500',
      general_assistant: 'bg-orange-500'
    };
    return colors[agentType];
  };

  const renderAgentCard = (agentType: AgentType, config: AgentConfig) => {
    const Icon = getAgentIcon(agentType);
    const isSelected = selectedAgent === agentType;
    const isExpanded = expandedAgent === agentType;

    return (
      <DaisyCard 
        key={agentType}
        className={`cursor-pointer transition-all duration-200 ${
          isSelected 
            ? 'ring-2 ring-blue-500 border-blue-200' 
            : 'hover:border-gray-300'
        }`}
        onClick={() => {
          onAgentSelect(agentType);
          setExpandedAgent(isExpanded ? null : agentType);
        }}
      >
        <DaisyCardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${getAgentColor(agentType)} bg-opacity-10`}>
              <Icon className={`h-6 w-6 ${getAgentColor(agentType).replace('bg-', 'text-')}`} />
            </div>
            <div className="flex-1">
              <DaisyCardTitle className="text-lg">{config.name}</DaisyCardTitle>
              <DaisyCardDescription className="text-sm">{config.title}</p>
            </div>
            {isSelected && (
              <CheckCircle className="h-5 w-5 text-blue-500" />
            )}
          </div>
        

        {isExpanded && (
          <DaisyCardContent className="pt-0">
            <DaisyTabs defaultValue="overview" className="w-full">
              <DaisyTabsList className="grid w-full grid-cols-4">
                <DaisyTabsTrigger value="overview">Overview</DaisyTabsTrigger>
                <DaisyTabsTrigger value="capabilities">Capabilities</DaisyTabsTrigger>
                <DaisyTabsTrigger value="templates">Templates</DaisyTabsTrigger>
                <DaisyTabsTrigger value="examples">Examples</DaisyTabsTrigger>
              </DaisyTabsList>

              <DaisyTabsContent value="overview" className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Description
                  </h4>
                  <p className="text-sm text-gray-600">{config.description}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Expertise Areas
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {config.expertise.slice(0, 6).map((area, index) => (
                      <DaisyBadge key={index} variant="secondary" className="text-xs">
                        {area}
                      </DaisyBadge>
                    ))}
                    {config.expertise.length > 6 && (
                      <DaisyBadge variant="outline" className="text-xs">
                        +{config.expertise.length - 6} more
                      </DaisyBadge>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <DaisyButton 
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartConversation?.(agentType);
                    }}
                    className="w-full"
                    size="sm"
                  >
                    Start Conversation with {config.name}
                  </DaisyButton>
                </div>
              </DaisyTabsContent>

              <DaisyTabsContent value="capabilities" className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Capabilities
                  </h4>
                  <ul className="space-y-1">
                    {config.capabilities.map((capability, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        {capability}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2 text-orange-600">
                    <DaisyAlertTriangle className="h-4 w-4" />
                    Limitations
                  </h4>
                  <ul className="space-y-1">
                    {config.limitations.map((limitation, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <DaisyAlertTriangle className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                        {limitation}
                      </li>
                    ))}
                  </ul>
                </div>
              </DaisyTabsContent>

              <DaisyTabsContent value="templates" className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Available Prompt Templates
                  </h4>
                  <div className="space-y-3">
                    {Object.values(config.promptTemplates).map((template) => (
                      <div key={template.id} className="border rounded-lg p-3">
                        <h5 className="font-medium text-sm">{template.name}</h5>
                        <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <DaisyBadge variant="outline" className="text-xs">
                            {template.requiredContext.length} required fields
                          </DaisyBadge>
                          <DaisyBadge variant="outline" className="text-xs">
                            {template.optionalContext.length} optional fields
                          </DaisyBadge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </DaisyTabsContent>

              <DaisyTabsContent value="examples" className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Example Use Cases</h4>
                  <div className="space-y-3">
                    {agentType === 'risk_analyzer' && (
                      <>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <h5 className="font-medium text-sm">Comprehensive Risk Assessment</h5>
                          <p className="text-xs text-gray-600 mt-1">
                            "Analyze our cybersecurity risk including likelihood assessment, impact analysis, and treatment recommendations using NIST framework."
                          </p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <h5 className="font-medium text-sm">Scenario Analysis</h5>
                          <p className="text-xs text-gray-600 mt-1">
                            "Conduct best/worst case scenario analysis for supply chain disruption risk with quantitative impact modeling."
                          </p>
                        </div>
                      </>
                    )}

                    {agentType === 'control_advisor' && (
                      <>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <h5 className="font-medium text-sm">Control Design</h5>
                          <p className="text-xs text-gray-600 mt-1">
                            "Design comprehensive controls for data privacy compliance including preventive, detective, and corrective measures."
                          </p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <h5 className="font-medium text-sm">Control Optimization</h5>
                          <p className="text-xs text-gray-600 mt-1">
                            "Optimize our current control environment to reduce redundancy and improve automation opportunities."
                          </p>
                        </div>
                      </>
                    )}

                    {agentType === 'compliance_expert' && (
                      <>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <h5 className="font-medium text-sm">Compliance Gap Analysis</h5>
                          <p className="text-xs text-gray-600 mt-1">
                            "Assess our current compliance state against GDPR requirements and provide remediation roadmap."
                          </p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <h5 className="font-medium text-sm">Audit Preparation</h5>
                          <p className="text-xs text-gray-600 mt-1">
                            "Help prepare for upcoming SOX audit including documentation requirements and testing procedures."
                          </p>
                        </div>
                      </>
                    )}

                    {agentType === 'general_assistant' && (
                      <>
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <h5 className="font-medium text-sm">Enterprise Risk Strategy</h5>
                          <p className="text-xs text-gray-600 mt-1">
                            "Develop comprehensive enterprise risk management strategy aligned with business objectives."
                          </p>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <h5 className="font-medium text-sm">Crisis Management</h5>
                          <p className="text-xs text-gray-600 mt-1">
                            "Create crisis management plan for business continuity during operational disruptions."
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </DaisyTabsContent>
            </DaisyTabs>
          </DaisyCardBody>
        )}
      </DaisyCard>
    );
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Choose Your AI Risk Expert</h2>
        <p className="text-gray-600">
          Select a specialized agent based on your risk management needs
        </p>
      </div>

      <div className="grid gap-4">
        {Object.entries(AI_AGENTS).map(([agentType, config]) => 
          renderAgentCard(agentType as AgentType, config)
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">💡 Pro Tips</h3>
        <ul className="text-sm space-y-1 text-gray-600">
          <li>• Risk Analyzer: Best for comprehensive risk assessments and quantitative analysis</li>
          <li>• Control Advisor: Ideal for designing and optimizing control frameworks</li>
          <li>• Compliance Expert: Perfect for regulatory guidance and audit preparation</li>
          <li>• General Assistant (ARIA): Great for strategic guidance and cross-functional advice</li>
        </ul>
      </div>
    </div>
  );
};

export default AgentSelector; 