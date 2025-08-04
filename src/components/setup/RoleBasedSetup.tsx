'use client';

import React, { useState, useEffect } from 'react';
import { DaisyButton } from '@/components/ui/DaisyButton';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard'
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisyCardTitle } from '@/components/ui/daisy-components';
// import { 
  ChevronRight, 
  ChevronLeft,
  CheckCircle,
  Users,
  Shield,
  FileText,
  Settings,
  Building,
  Target,
  Zap,
  Brain,
  Star,
  Clock,
  Globe,
  Lock
} from 'lucide-react'

// User role definitions
interface UserRole {
  id: string
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  features: string[];
  responsibilities: string[];
  setupSteps: string[];
}

const USER_ROLES: UserRole[] = [
  {
    id: 'admin',
    title: 'Risk Administrator',
    description: 'Manage system settings, user permissions, and organizational risk policies',
    icon: Settings,
    color: 'bg-purple-100 text-purple-700',
    features: ['User Management', 'System Configuration', 'Policy Management', 'Reporting'],
    responsibilities: ['Configure risk frameworks', 'Manage user access', 'Set up integrations'],
    setupSteps: ['organization', 'users', 'policies', 'integrations']
  },
  {
    id: 'analyst',
    title: 'Risk Analyst',
    description: 'Identify, assess, and monitor risks across the organization',
    icon: Shield,
    color: 'bg-blue-100 text-blue-700',
    features: ['Risk Assessment', 'Control Mapping', 'Analytics', 'AI Insights'],
    responsibilities: ['Conduct risk assessments', 'Monitor risk metrics', 'Generate insights'],
    setupSteps: ['preferences', 'frameworks', 'notifications', 'dashboard']
  },
  {
    id: 'auditor',
    title: 'Auditor',
    description: 'Review compliance status and validate risk management processes',
    icon: FileText,
    color: 'bg-green-100 text-green-700',
    features: ['Compliance Tracking', 'Audit Trails', 'Evidence Collection', 'Reporting'],
    responsibilities: ['Review compliance', 'Validate controls', 'Document findings'],
    setupSteps: ['compliance', 'evidence', 'reporting', 'workflows']
  },
  {
    id: 'manager',
    title: 'Risk Manager',
    description: 'Oversee risk management strategy and coordinate team activities',
    icon: Users,
    color: 'bg-orange-100 text-orange-700',
    features: ['Team Management', 'Strategic Planning', 'Executive Reporting', 'Oversight'],
    responsibilities: ['Strategic oversight', 'Team coordination', 'Executive reporting'],
    setupSteps: ['strategy', 'team', 'reporting', 'governance']
  }
];

// Setup step definitions
interface SetupStep {
  id: string
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
  required: boolean;
}

// Organization setup component
const OrganizationSetup: React.FC<{ onUpdate: (_data: any) => void }> = ({ onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    size: '',
    riskFramework: '',
    complianceStandards: []
  })

  const industries = [
    'Financial Services', 'Healthcare', 'Technology', 'Manufacturing', 
    'Retail', 'Energy', 'Government', 'Education', 'Other'
  ];

  const sizes = ['1-50', '51-200', '201-1000', '1000+'];
  const frameworks = ['ISO 31000', 'COSO ERM', 'NIST', 'Custom'];

  useEffect(() => {
    onUpdate(formData);
  }, [formData, onUpdate]);

  return (
    <div className="space-y-6">
      <div>
        <DaisyLabel htmlFor="orgName">Organization Name</DaisyLabel>
        <DaisyInput
          id="orgName"
          value={formData.name}
          onChange={(e) = />
setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter your organization name" />
      </div>

      <div>
        <DaisyLabel htmlFor="industry">Industry</DaisyInput>
        <select
          id="industry"
          className="w-full p-2 border border-gray-300 rounded-md"
          value={formData.industry}
          onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
        >
          <option value="">Select industry</option>
          {industries.map(industry => (
            <option key={industry} value={industry}>{industry}</option>
          ))}
        </select>
      </div>

      <div>
        <DaisyLabel htmlFor="size">Organization Size</DaisyLabel>
        <select
          id="size"
          className="w-full p-2 border border-gray-300 rounded-md"
          value={formData.size}
          onChange={(e) => setFormData({ ...formData, size: e.target.value })}
        >
          <option value="">Select size</option>
          {sizes.map(size => (
            <option key={size} value={size}>{size} employees</option>
          ))}
        </select>
      </div>

      <div>
        <DaisyLabel htmlFor="framework">Risk Management Framework</DaisyLabel>
        <select
          id="framework"
          className="w-full p-2 border border-gray-300 rounded-md"
          value={formData.riskFramework}
          onChange={(e) => setFormData({ ...formData, riskFramework: e.target.value })}
        >
          <option value="">Select framework</option>
          {frameworks.map(framework => (
            <option key={framework} value={framework}>{framework}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// Preferences setup component
const PreferencesSetup: React.FC<{ onUpdate: (_data: any) => void }> = ({ onUpdate }) => {
  const [preferences, setPreferences] = useState({
    notifications: {
      email: true,
      inApp: true,
      frequency: 'daily'
    },
    dashboard: {
      defaultView: 'overview',
      autoRefresh: true,
      showTutorials: true
    },
    ai: {
      enableInsights: true,
      autoSuggestions: true,
      confidenceThreshold: 'medium'
    }
  })

  useEffect(() => {
    onUpdate(preferences);
  }, [preferences, onUpdate]);

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium mb-3">Notification Preferences</h4>
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={preferences.notifications.email}
              onChange={(e) => setPreferences({
                ...preferences,
                notifications: { ...preferences.notifications, email: e.target.checked }
              })} />
            <span>Email notifications</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={preferences.notifications.inApp}
              onChange={(e) => setPreferences({
                ...preferences,
                notifications: { ...preferences.notifications, inApp: e.target.checked }
              })} />
            <span>In-app notifications</span>
          </label>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-3">Dashboard Settings</h4>
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={preferences.dashboard.autoRefresh}
              onChange={(e) => setPreferences({
                ...preferences,
                dashboard: { ...preferences.dashboard, autoRefresh: e.target.checked }
              })} />
            <span>Auto-refresh data</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={preferences.dashboard.showTutorials}
              onChange={(e) => setPreferences({
                ...preferences,
                dashboard: { ...preferences.dashboard, showTutorials: e.target.checked }
              })} />
            <span>Show helpful tutorials</span>
          </label>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-3">AI Assistant Settings</h4>
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={preferences.ai.enableInsights}
              onChange={(e) => setPreferences({
                ...preferences,
                ai: { ...preferences.ai, enableInsights: e.target.checked }
              })} />
            <span>Enable AI insights</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={preferences.ai.autoSuggestions}
              onChange={(e) => setPreferences({
                ...preferences,
                ai: { ...preferences.ai, autoSuggestions: e.target.checked }
              })} />
            <span>Auto-suggestions</span>
          </label>
        </div>
      </div>
    </div>
  );
}

// Main setup wizard component
interface RoleBasedSetupProps {
  onComplete: (setupData: any) => void
  onSkip?: () => void;
}

export const RoleBasedSetup: React.FC<RoleBasedSetupProps> = ({
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [setupData, setSetupData] = useState<any>({});
  const [isCompleting, setIsCompleting] = useState(false);

  const steps = [
    'Role Selection',
    ...(selectedRole?.setupSteps || [])
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setSetupData({ ...setupData, role: role.id });
  }

  const handleStepData = (stepId: string, data: any) => {
    setSetupData({ ...setupData, [stepId]: data });
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeSetup();
    }
  }

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }

  const completeSetup = async () => {
    setIsCompleting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    onComplete({
      ...setupData,
      completedAt: new Date().toISOString(),
      version: '1.0'
    });
  }

  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Role</h2>
            <p className="text-gray-600">
              Select your primary role to customize your Riscura experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {USER_ROLES.map((role) => {
              const Icon = role.icon;
              return (
                <DaisyCard
                  key={role.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedRole?.id === role.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => handleRoleSelect(role)}
                >
                  <DaisyCardBody className="p-6" >
  <div className="flex items-start space-x-4">
</DaisyCard>
                      <div className={`p-3 rounded-lg ${role.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">{role.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs font-medium text-gray-500">Key Features:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {role.features.slice(0, 3).map((feature) => (
                                <DaisyBadge key={feature} variant="secondary" className="text-xs" >
  {feature}
</DaisyBadge>
                                </DaisyBadge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DaisyCardBody>
                </DaisyCard>
              );
            })}
          </div>
        </div>
      );
    }

    const stepId = selectedRole?.setupSteps[currentStep - 1];
    
    if (stepId === 'organization') {
      return (
        <div>
          <h3 className="text-xl font-semibold mb-4">Organization Information</h3>
          <OrganizationSetup onUpdate={(data) => handleStepData('organization', data)} />
        </div>
      );
    }

    if (stepId === 'preferences') {
      return (
        <div>
          <h3 className="text-xl font-semibold mb-4">Your Preferences</h3>
          <PreferencesSetup onUpdate={(data) => handleStepData('preferences', data)} />
        </div>
      );
    }

    // Default step content
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Step: {stepId}</h3>
        <p className="text-gray-600">This step is being configured...</p>
      </div>
    )
  }

  if (isCompleting) {
    return (
      <div className="max-w-md mx-auto">
        <DaisyCard >
  <DaisyCardBody className="p-8 text-center" >
  </DaisyCard>
</DaisyCardBody>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Setting up your workspace...</h3>
            <p className="text-gray-600 mb-4">
              We're customizing Riscura based on your preferences.
            </p>
            <DaisyProgress value={100} className="h-2" / / /> </DaisyCard>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <DaisyCard >
  <DaisyCardBody >
</DaisyCard>
          <div className="flex items-center justify-between">
            <div>
              <DaisyCardTitle>Welcome to Riscura</DaisyCardTitle>
              <p className="text-gray-600 mt-1">
                Let's set up your personalized risk management workspace
              </p>
            </div>
            {Boolean(onSkip) && (
              <DaisyButton variant="ghost" onClick={onSkip}>
          Skip Setup

        </DaisyButton>
              </DaisyButton>
            )}
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <DaisyProgress value={progress} className="h-2" />
</div>
        

        <DaisyCardBody className="p-6" >
  {renderStepContent()}
</DaisyProgress>

          <div className="flex justify-between mt-8">
            <DaisyButton
              variant="outline"
              onClick={previousStep}
              disabled={currentStep === 0} >
  <ChevronLeft className="w-4 h-4 mr-2" />
</DaisyButton>
              Previous
            </DaisyButton>

            <DaisyButton
              onClick={nextStep}
              disabled={currentStep === 0 && !selectedRole}>
          {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}

        </DaisyButton>
              <ChevronRight className="w-4 h-4 ml-2" />
            </DaisyButton>
          </div>
        </DaisyCardBody>
      </DaisyCard>
    </div>
  );
}

export default RoleBasedSetup; 