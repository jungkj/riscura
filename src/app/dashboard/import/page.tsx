'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

// Components
import DragDropImport from '@/components/DragDropImport'
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard'
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyAlert } from '@/components/ui/DaisyAlert';

// Icons
import {
  FileSpreadsheet,
  FileText,
  Upload,
  Brain,
  Zap,
  CheckCircle,
  AlertCircle,
  Info,
  Download,
  ArrowRight,
  Shield,
  Target,
} from 'lucide-react';

// Mock user data - in real app this would come from auth context
const mockUser = {
  id: 'user_demo_123',
  organizationId: 'org_demo_456',
}

const FEATURE_HIGHLIGHTS = [
  {
    icon: FileSpreadsheet,
    title: 'Excel RCSA Templates',
    description:
      'Automatically parse Excel files to extract risks, controls, and mappings with intelligent column detection.',
    features: [
      'Auto-detect sheet types',
      'Smart column mapping',
      'Risk scoring calculation',
      'AI-enhanced categorization',
    ],
  },
  {
    icon: Brain,
    title: 'AI-Powered Document Analysis',
    description:
      'Extract risks and controls from policy documents using Claude Sonnet 4 for intelligent content analysis.',
    features: [
      'PDF/DOCX/TXT support',
      'Risk identification',
      'Control extraction',
      'Confidence scoring',
    ],
  },
  {
    icon: Upload,
    title: 'Bulk Document Upload',
    description: 'Upload multiple documents at once for efficient organization and categorization.',
    features: [
      'Multi-file support',
      'Automatic categorization',
      'Metadata extraction',
      'Version control',
    ],
  },
];

const SAMPLE_TEMPLATES = [
  {
    name: 'RCSA Template - Financial Services',
    description: 'Comprehensive risk assessment template for financial institutions',
    type: 'Excel',
    size: '2.3 MB',
    icon: FileSpreadsheet,
  },
  {
    name: 'Cybersecurity Policy Document',
    description: 'Sample cybersecurity policy with embedded risks and controls',
    type: 'PDF',
    size: '1.8 MB',
    icon: FileText,
  },
  {
    name: 'Operational Risk Framework',
    description: 'Enterprise operational risk management framework',
    type: 'Word',
    size: '3.1 MB',
    icon: FileText,
  },
];

export default function ImportPage() {
  const [importResults, setImportResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleImportComplete = (_results: any[]) => {
    setImportResults(results);
    setShowResults(true);
  }

  const downloadSampleTemplate = (templateName: string) => {
    // In a real app, this would download actual templates
    // console.log(`Downloading template: ${templateName}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-blue-600 rounded-xl">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Smart Import Center</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform your Excel RCSA templates and policy documents into structured risk and
            control data with AI-powered analysis and intelligent automation.
          </p>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Powerful Import Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURE_HIGHLIGHTS.map((feature, idx) => {
              const IconComponent = feature.icon;
              return (
                <DaisyCard key={idx} className="hover:shadow-lg transition-shadow duration-200">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <IconComponent className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold">{feature.title}</h3>
                    </div>
                    <p className="text-gray-600 mb-4">{feature.description}</p>
                    <div className="space-y-2">
                      {feature.features.map((feat, featIdx) => (
                        <div key={featIdx} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-gray-700">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </DaisyCard>
              );
            })}
          </div>
        </motion.div>

        {/* Sample Templates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <DaisyCard>
            <div className="p-6 border-b">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Sample Templates</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SAMPLE_TEMPLATES.map((template, idx) => {
                  const IconComponent = template.icon;
                  return (
                    <div
                      key={idx}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-start gap-3">
                        <IconComponent className="h-8 w-8 text-blue-600 mt-1" />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{template.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <DaisyBadge variant="secondary" className="text-xs">
                              {template.type}
                            </DaisyBadge>
                            <span className="text-xs text-gray-500">{template.size}</span>
                          </div>
                          <DaisyButton
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={() => downloadSampleTemplate(template.name)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DaisyButton>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </DaisyCard>
        </motion.div>

        {/* Import Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <DaisyCard>
            <div className="p-6 border-b">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Import Your Files</h3>
              </div>
            </div>
            <div className="p-6">
              <DragDropImport
                organizationId={mockUser.organizationId}
                userId={mockUser.id}
                onComplete={handleImportComplete}
              />
            </div>
          </DaisyCard>
        </motion.div>

        {/* Import Results */}
        {Boolean(showResults) && importResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold text-gray-900">Import Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {importResults.map((result, idx) => (
                <DaisyCard key={idx}>
                  <div className="p-6 border-b">
                    <div className="flex items-center gap-2">
                      {result.type === 'excel-rcsa' && (
                        <FileSpreadsheet className="h-5 w-5 text-green-600" />
                      )}
                      {result.type === 'policy-document' && (
                        <FileText className="h-5 w-5 text-blue-600" />
                      )}
                      {result.type === 'bulk-upload' && (
                        <Upload className="h-5 w-5 text-purple-600" />
                      )}
                      <span className="truncate">{result.filename}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <DaisyBadge
                          variant={result.status === 'completed' ? 'default' : 'destructive'}
                        >
                          {result.status}
                        </DaisyBadge>
                        <span className="text-sm text-gray-600 capitalize">
                          {result.type.replace('-', ' ')}
                        </span>
                      </div>
                      {result.summary && (
                        <div className="space-y-1">
                          {Object.entries(result.summary).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm">
                              <span className="text-gray-600">{key}:</span>
                              <span className="font-medium">{value as string}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </DaisyCard>
              ))}
            </div>
          </motion.div>
        )}

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <DaisyAlert>
            <Info className="h-4 w-4" />
            <div>
              <strong>Pro Tip:</strong> For best results with Excel RCSA templates, ensure your
              spreadsheets have clear column headers like "Risk Title", "Description", "Likelihood",
              "Impact", "Control Title", etc. The AI will automatically detect and map these fields
              to the appropriate data structures.
            </div>
          </DaisyAlert>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
            <Shield className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800">
              All uploads are encrypted and processed securely within your organization's
              environment
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
