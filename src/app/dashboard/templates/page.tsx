'use client';

import React, { useState } from 'react';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { toast } from '@/hooks/use-toast';
import { DaisyCardTitle } from '@/components/ui/daisy-components';
// import {
  FileSpreadsheet,
  Download,
  Shield,
  Users,
  CheckCircle,
  FileText,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Template {
  id: string;
  name: string;
  description: string;
  type: 'rcsa' | 'controls' | 'vendor-assessment';
  icon: React.ComponentType<any>;
  features: string[];
  color: string;
  badge: string;
}

const templates: Template[] = [
  {
    id: 'rcsa',
    name: 'RCSA Template',
    description: 'Comprehensive Risk & Control Self-Assessment template with built-in formulas',
    type: 'rcsa',
    icon: Shield,
    features: [
      '19 pre-configured columns',
      'Risk scoring formulas',
      'Sample data included',
      'Instructions sheet',
      'Ready for import',
    ],
    color: 'text-blue-600',
    badge: 'Most Popular',
  },
  {
    id: 'controls',
    name: 'Controls Library',
    description: 'Document and track your security controls with testing schedules',
    type: 'controls',
    icon: CheckCircle,
    features: [
      'Control lifecycle tracking',
      'Testing schedule',
      'Evidence management',
      'Effectiveness ratings',
      'Risk linkage',
    ],
    color: 'text-green-600',
    badge: 'Essential',
  },
  {
    id: 'vendor',
    name: 'Vendor Assessment',
    description: 'Evaluate and monitor third-party vendor risks and compliance',
    type: 'vendor-assessment',
    icon: Users,
    features: [
      'Vendor risk ratings',
      'Compliance tracking',
      'Contract management',
      'Security certifications',
      'Assessment scheduling',
    ],
    color: 'text-purple-600',
    badge: 'Advanced',
  },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (templateType: string) => {
    setDownloading(templateType);

    try {
      const response = await fetch(`/api/templates/${templateType}`);

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      // Get the blob from the response
      const blob = await response.blob()

      // Create a download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a');
      a.href = url;
      a.download = `riscura-${templateType}-template.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Template Downloaded',
        description: 'Your Excel template has been downloaded successfully.',
      });
    } catch (error) {
      // console.error('Download error:', error)
      toast({
        title: 'Download Failed',
        description: 'Unable to download the template. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <DaisyButton variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </DaisyButton>

        <div className="flex items-center gap-3 mb-2">
          <FileSpreadsheet className="h-8 w-8 text-green-600" />
          <h1 className="text-3xl font-bold text-[#191919]">Excel Templates</h1>
        </div>
        <p className="text-lg text-gray-600">
          Download pre-configured Excel templates to jumpstart your risk management journey
        </p>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => {
          const Icon = template.icon;
          return (
            <DaisyCard
              key={template.id}
              className="border-gray-200 hover:shadow-lg transition-all duration-300"
            >
              <DaisyCardBody>
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-3 bg-gray-50 rounded-lg ${template.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <DaisyBadge variant="secondary" className="text-xs">
                    {template.badge}
                  </DaisyBadge>
                </div>
                <DaisyCardTitle className="text-xl">{template.name}</DaisyCardTitle>
                <p className="text-gray-600 mb-4">{template.description}</p>
              </DaisyCardBody>
              <DaisyCardBody>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Includes:</p>
                    <ul className="space-y-1">
                      {template.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <DaisyButton
                    className="w-full"
                    onClick={() => handleDownload(template.type)}
                    disabled={downloading === template.type}
                  >
                    {downloading === template.type ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                      </>
                    )}
                  </DaisyButton>
                </div>
              </DaisyCardBody>
            </DaisyCard>
          );
        })}
      </div>

      {/* Instructions Section */}
      <DaisyCard className="mt-8 border-gray-200">
        <DaisyCardBody>
          <DaisyCardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            How to Use These Templates
          </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                  1
                </div>
                <h3 className="font-semibold">Download Template</h3>
              </div>
              <p className="text-sm text-gray-600">
                Choose the template that matches your needs and download it to your computer.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                  2
                </div>
                <h3 className="font-semibold">Fill Your Data</h3>
              </div>
              <p className="text-sm text-gray-600">
                Open in Excel and replace the sample data with your organization's information.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                  3
                </div>
                <h3 className="font-semibold">Import to Riscura</h3>
              </div>
              <p className="text-sm text-gray-600">
                Return to the dashboard and use "Import Excel RCSA" to upload your completed
                template.
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Pro Tip:</strong> Start with the sample data to understand the format, then
              gradually replace it with your own information. The templates include validation rules
              to help ensure data quality.
            </p>
          </div>
        </DaisyCardBody>
      </DaisyCard>
    </div>
  );
}
