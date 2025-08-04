'use client';

import React, { useState, useEffect } from 'react';
import { DaisyButton } from '@/components/ui/DaisyButton';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard'
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyCheckbox } from '@/components/ui/DaisyCheckbox';
import { DaisyCardTitle } from '@/components/ui/daisy-components';
import { Sparkles } from 'lucide-react';
// import { 
  Download,
  FileText,
  Shield,
  Users,
  Building,
  Zap,
  CheckCircle,
  AlertTriangle,
  Clock,
  Target,
  Database,
  Sparkles
} from 'lucide-react'

// Sample data templates
interface DataTemplate {
  id: string
  name: string;
  description: string;
  category: 'risks' | 'controls' | 'policies' | 'frameworks' | 'users';
  icon: React.ComponentType<any>;
  size: string;
  items: number;
  industry?: string[];
  preview: any[];
  data: any[];
}

const SAMPLE_TEMPLATES: DataTemplate[] = [
  {
    id: 'financial-risks',
    name: 'Financial Services Risks',
    description: 'Common risks in banking and financial institutions',
    category: 'risks',
    icon: Shield,
    size: '2.3 KB',
    items: 15,
    industry: ['Financial Services'],
    preview: [
      { title: 'Credit Risk', impact: 'High', likelihood: 'Medium' },
      { title: 'Market Risk', impact: 'High', likelihood: 'High' },
      { title: 'Operational Risk', impact: 'Medium', likelihood: 'Medium' }
    ],
    data: [
      {
        id: 'fin-001',
        title: 'Credit Risk',
        description: 'Risk of financial loss due to borrower default',
        category: 'Financial',
        impact: 4,
        likelihood: 3,
        riskScore: 12,
        owner: 'Credit Risk Manager',
        status: 'Active',
        controls: ['Credit Assessment', 'Collateral Requirements', 'Regular Monitoring']
      },
      {
        id: 'fin-002',
        title: 'Market Risk',
        description: 'Risk of losses due to market price movements',
        category: 'Financial',
        impact: 4,
        likelihood: 4,
        riskScore: 16,
        owner: 'Market Risk Manager',
        status: 'Active',
        controls: ['Value at Risk Models', 'Stress Testing', 'Position Limits']
      },
      {
        id: 'fin-003',
        title: 'Liquidity Risk',
        description: 'Risk of inability to meet short-term obligations',
        category: 'Financial',
        impact: 5,
        likelihood: 2,
        riskScore: 10,
        owner: 'Treasury Manager',
        status: 'Active',
        controls: ['Liquidity Buffers', 'Funding Diversification', 'Cash Flow Forecasting']
      }
    ]
  },
  {
    id: 'cyber-security-risks',
    name: 'Cybersecurity Risks',
    description: 'Technology and information security risks',
    category: 'risks',
    icon: Shield,
    size: '3.1 KB',
    items: 20,
    industry: ['Technology', 'Healthcare', 'Financial Services'],
    preview: [
      { title: 'Data Breach', impact: 'Very High', likelihood: 'Medium' },
      { title: 'Ransomware Attack', impact: 'High', likelihood: 'Medium' },
      { title: 'Phishing Attacks', impact: 'Medium', likelihood: 'High' }
    ],
    data: [
      {
        id: 'cyber-001',
        title: 'Data Breach',
        description: 'Unauthorized access to sensitive customer data',
        category: 'Cybersecurity',
        impact: 5,
        likelihood: 3,
        riskScore: 15,
        owner: 'CISO',
        status: 'Active',
        controls: ['Encryption', 'Access Controls', 'Data Loss Prevention']
      },
      {
        id: 'cyber-002',
        title: 'Ransomware Attack',
        description: 'Malicious software encrypting critical systems',
        category: 'Cybersecurity',
        impact: 4,
        likelihood: 3,
        riskScore: 12,
        owner: 'IT Security Manager',
        status: 'Active',
        controls: ['Backup Systems', 'Endpoint Protection', 'User Training']
      }
    ]
  },
  {
    id: 'operational-controls',
    name: 'Operational Controls',
    description: 'Standard operational risk controls',
    category: 'controls',
    icon: CheckCircle,
    size: '1.8 KB',
    items: 12,
    preview: [
      { name: 'Segregation of Duties', type: 'Preventive', effectiveness: '85%' },
      { name: 'Management Review', type: 'Detective', effectiveness: '78%' },
      { name: 'System Access Controls', type: 'Preventive', effectiveness: '92%' }
    ],
    data: [
      {
        id: 'ctrl-001',
        name: 'Segregation of Duties',
        description: 'Separation of critical functions to prevent fraud',
        type: 'Preventive',
        category: 'Operational',
        effectiveness: 85,
        frequency: 'Continuous',
        owner: 'Operations Manager',
        lastTested: '2024-02-15',
        status: 'Effective'
      },
      {
        id: 'ctrl-002',
        name: 'Management Review',
        description: 'Regular management oversight of key processes',
        type: 'Detective',
        category: 'Operational',
        effectiveness: 78,
        frequency: 'Monthly',
        owner: 'Department Manager',
        lastTested: '2024-02-20',
        status: 'Effective'
      }
    ]
  },
  {
    id: 'compliance-policies',
    name: 'Compliance Policies',
    description: 'Standard compliance and governance policies',
    category: 'policies',
    icon: FileText,
    size: '4.2 KB',
    items: 8,
    preview: [
      { name: 'Code of Conduct', version: '2.1', status: 'Active' },
      { name: 'Data Privacy Policy', version: '1.3', status: 'Active' },
      { name: 'Risk Management Policy', version: '3.0', status: 'Active' }
    ],
    data: [
      {
        id: 'pol-001',
        name: 'Code of Conduct',
        description: 'Ethical guidelines for all employees',
        version: '2.1',
        category: 'Ethics',
        owner: 'Chief Compliance Officer',
        approvedBy: 'Board of Directors',
        effectiveDate: '2024-01-01',
        reviewDate: '2024-12-31',
        status: 'Active'
      },
      {
        id: 'pol-002',
        name: 'Data Privacy Policy',
        description: 'Guidelines for handling personal data',
        version: '1.3',
        category: 'Privacy',
        owner: 'Data Protection Officer',
        approvedBy: 'Executive Committee',
        effectiveDate: '2024-01-15',
        reviewDate: '2024-07-15',
        status: 'Active'
      }
    ]
  },
  {
    id: 'sample-users',
    name: 'Sample Users',
    description: 'Example user accounts with different roles',
    category: 'users',
    icon: Users,
    size: '1.1 KB',
    items: 6,
    preview: [
      { name: 'John Smith', role: 'Risk Analyst', department: 'Risk Management' },
      { name: 'Sarah Johnson', role: 'Compliance Officer', department: 'Compliance' },
      { name: 'Mike Chen', role: 'Auditor', department: 'Internal Audit' }
    ],
    data: [
      {
        id: 'user-001',
        name: 'John Smith',
        email: 'john.smith@company.com',
        role: 'Risk Analyst',
        department: 'Risk Management',
        permissions: ['view_risks', 'create_risks', 'edit_risks'],
        status: 'Active',
        lastLogin: '2024-03-01'
      },
      {
        id: 'user-002',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@company.com',
        role: 'Compliance Officer',
        department: 'Compliance',
        permissions: ['view_compliance', 'manage_policies', 'generate_reports'],
        status: 'Active',
        lastLogin: '2024-02-28'
      }
    ]
  }
];

// Sample data loader component
interface SampleDataLoaderProps {
  onDataLoaded?: (_data: any) => void
  userRole?: string;
  industry?: string;
  className?: string;
}

export const SampleDataLoader: React.FC<SampleDataLoaderProps> = ({
  onDataLoaded,
  userRole,
  industry,
  className = ''
}) => {
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showPreview, setShowPreview] = useState<string | null>(null);

  // Filter templates based on user role and industry
  const filteredTemplates = SAMPLE_TEMPLATES.filter(template => {
    if (industry && template.industry && !template.industry.includes(industry)) {
      return false
    }
    return true;
  });

  // Auto-select recommended templates based on role
  useEffect(() => {
    const recommended: string[] = []
    
    if (userRole === 'analyst') {
      recommended.push('financial-risks', 'cyber-security-risks', 'operational-controls');
    } else if (userRole === 'auditor') {
      recommended.push('compliance-policies', 'operational-controls');
    } else if (userRole === 'admin') {
      recommended.push('sample-users', 'compliance-policies');
    }

    setSelectedTemplates(recommended);
  }, [userRole]);

  const handleTemplateToggle = (templateId: string) => {
    setSelectedTemplates(prev => 
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  }

  const loadSampleData = async () => {
    setIsLoading(true);
    setLoadingProgress(0);

    const selectedData = filteredTemplates
      .filter(template => selectedTemplates.includes(template.id))
      .reduce((acc, template) => {
        acc[template.category] = [...(acc[template.category] || []), ...template.data];
        return acc;
      }, {} as any);

    // Simulate loading progress
    for (let i = 0; i <= 100; i += 10) {
      setLoadingProgress(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsLoading(false);
    onDataLoaded?.(selectedData);
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'risks': return Shield;
      case 'controls': return CheckCircle;
      case 'policies': return FileText;
      case 'users': return Users;
      case 'frameworks': return Target;
      default: return Database;
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'risks': return 'bg-red-100 text-red-700';
      case 'controls': return 'bg-green-100 text-green-700';
      case 'policies': return 'bg-blue-100 text-blue-700';
      case 'users': return 'bg-purple-100 text-purple-700';
      case 'frameworks': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  if (isLoading) {
    return (
      <DaisyCard className={className} >
  <DaisyCardBody className="p-8 text-center" >
  </DaisyCard>
</DaisyCardBody>
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Loading Sample Data</h3>
          <p className="text-gray-600 mb-6">
            Setting up your workspace with realistic examples...
          </p>
          <DaisyProgress value={loadingProgress} className="h-3 mb-2" />
<p className="text-sm text-gray-500">{loadingProgress}% complete</p>
        </DaisyProgress>
      </DaisyCard>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <DaisyCard >
  <DaisyCardBody >
</DaisyCard>
          <DaisyCardTitle className="flex items-center space-x-2" >
  <Database className="w-5 h-5" />
</DaisyCardTitle>
            <span>Sample Data & Templates</span>
          </DaisyCardTitle>
          <p className="text-gray-600">
            Get started quickly with realistic sample data tailored to your role and industry.
          </p>
        

        <DaisyCardBody >
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
</DaisyCardBody>
            {filteredTemplates.map((template) => {
              const Icon = template.icon;
              const CategoryIcon = getCategoryIcon(template.category);
              const isSelected = selectedTemplates.includes(template.id);

              return (
                <DaisyCard
                  key={template.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => handleTemplateToggle(template.id)}
                >
                  <DaisyCardBody className="p-4" >
  <div className="flex items-start justify-between mb-3">
</DaisyCard>
                      <div className="flex items-center space-x-2">
                        <div className={`p-2 rounded-lg ${getCategoryColor(template.category)}`}>
                          <CategoryIcon className="w-4 h-4" />
                        </div>
                        <DaisyCheckbox checked={isSelected} />
</div>
                      <DaisyBadge variant="secondary" className="text-xs" >
  {template.items} items
</DaisyCheckbox>
                      </DaisyBadge>
                    </div>

                    <h4 className="font-medium text-gray-900 mb-2">{template.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Size: {template.size}</span>
                        <DaisyButton
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-blue-600 hover:text-blue-700"
                          onClick={(e) =>
          {
                            e.stopPropagation();
                            setShowPreview(showPreview === template.id ? null : template.id);
                          }}
                        >
                          Preview
                        
        </DaisyButton>
                      </div>

                      {showPreview === template.id && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <h5 className="text-xs font-medium text-gray-700 mb-2">Sample Items:</h5>
                          <div className="space-y-1">
                            {template.preview.map((item, index) => (
                              <div key={index} className="text-xs text-gray-600">
                                {typeof item === 'object' ? (
                                  <div className="flex justify-between">
                                    <span>{item.title || item.name}</span>
                                    <span className="text-gray-500">
                                      {item.impact || item.type || item.role}
                                    </span>
                                  </div>
                                ) : (
                                  <span>{item}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </DaisyCardBody>
                </DaisyCard>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              {selectedTemplates.length} template{selectedTemplates.length !== 1 ? 's' : ''} selected
            </div>
            <DaisyButton
              onClick={loadSampleData}
              disabled={selectedTemplates.length === 0}
              className="flex items-center space-x-2" >
  <Download className="w-4 h-4" />
</DaisyButton>
              <span>Load Sample Data</span>
            </DaisyButton>
          </div>
        </DaisyCardBody>
      </DaisyCard>

      {/* Benefits section */}
      <DaisyCard >
  <DaisyCardBody className="p-6" >
  </DaisyCard>
</DaisyCardBody>
          <h4 className="font-medium text-gray-900 mb-4">Why Use Sample Data?</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Zap className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h5 className="font-medium text-sm">Quick Start</h5>
                <p className="text-xs text-gray-600">
                  Begin exploring features immediately with realistic data
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h5 className="font-medium text-sm">Best Practices</h5>
                <p className="text-xs text-gray-600">
                  Learn from industry-standard examples and templates
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h5 className="font-medium text-sm">Save Time</h5>
                <p className="text-xs text-gray-600">
                  Avoid starting from scratch with pre-built content
                </p>
              </div>
            </div>
          </div>
        </DaisyCardBody>
      </DaisyCard>
    </div>
  );
}

export default SampleDataLoader;
