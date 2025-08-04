'use client';

import React, { useState } from 'react';
import { DaisyCard, DaisyCardBody } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import {
  Upload,
  Zap,
  Play,
  FileSpreadsheet,
  Shield,
  TrendingUp,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Users
} from 'lucide-react';

interface EmptyStateWizardProps {
  onImportComplete?: () => void;
  onRiskCreated?: () => void;
  onDemoStarted?: () => void;
}

export default function EmptyStateWizard({
  onImportComplete,
  onRiskCreated,
  onDemoStarted
}: EmptyStateWizardProps) {
  const router = useRouter();
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [onboardingStep, setOnboardingStep] = useState(0);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setSelectedFile(file);
    setUploadingFile(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import/excel', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        
        // Save import to recent imports in localStorage
        try {
          const existingImports = localStorage.getItem('recentExcelImports');
          const imports = existingImports ? JSON.parse(existingImports) : [];
          imports.unshift({
            filename: file.name,
            risksImported: data.risksImported || 0,
            date: new Date().toISOString(),
            id: Date.now().toString()
          });
          // Keep only the last 10 imports
          localStorage.setItem('recentExcelImports', JSON.stringify(imports.slice(0, 10)));
        } catch (error) {
          // console.error('Failed to save import history:', error);
        }
        
        toast({
          title: "Import Successful",
          description: `Imported ${data.risksImported || 0} risks from ${file.name}`,
        });
        setOnboardingStep(1);
        onImportComplete?.();
      } else {
        const error = await response.json();
        toast({
          title: "Import Failed",
          description: error.message || "Unable to parse the file. Please check the format.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import Error",
        description: "An error occurred while importing the file.",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv']
    },
    maxSize: 10485760, // 10MB
    disabled: uploadingFile
  });

  const handleStartFresh = () => {
    router.push('/dashboard/risks/new');
    onRiskCreated?.();
  };

  const handleExploreDemo = () => {
    router.push('/dashboard?demo=true');
    onDemoStarted?.();
  };

  const onboardingSteps = [
    { id: 'import', label: 'Import/Create', completed: onboardingStep > 0 },
    { id: 'map', label: 'Map Controls', completed: onboardingStep > 1 },
    { id: 'schedule', label: 'Schedule Tests', completed: onboardingStep > 2 }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold text-gray-900">
          Welcome to Riscura! Let's migrate from Excel in 3 easy steps
        </h2>
        <p className="text-lg text-gray-600">
          Join 500+ risk managers who saved 10+ hours monthly
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Setup Progress</h3>
          <span className="text-sm text-gray-600">
            {onboardingSteps.filter(s => s.completed).length}/3 steps completed
          </span>
        </div>
        <div className="space-y-3">
          <DaisyProgress 
            value={(onboardingSteps.filter(s = />s.completed).length / 3) * 100} 
            className="h-2" />
          <div className="flex justify-between">
            {onboardingSteps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step.completed 
                    ? 'bg-green-100 text-green-700' 
                    : index === onboardingStep 
                      ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-400 ring-offset-2'
                      : 'bg-gray-100 text-gray-400'
                  }
                `}>
                  {step.completed ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                </div>
                <span className={`text-sm ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Import Excel Card */}
        <DaisyCard 
          className={`
            relative overflow-hidden transition-all duration-300 cursor-pointer
            ${hoveredCard === 'import' ? 'shadow-lg scale-105' : 'shadow-md'}
            ${uploadingFile ? 'opacity-75' : ''}
          `}
          onMouseEnter={() => setHoveredCard('import')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div {...getRootProps()} className="h-full">
            <input {...getInputProps()} />
            <DaisyCardBody className="p-6 h-full flex flex-col" >
  <div className="flex items-center justify-between mb-4">
</DaisyProgress>
                <div className="p-3 bg-green-100 rounded-lg">
                  <FileSpreadsheet className="w-6 h-6 text-green-700" />
                </div>
                <DaisyBadge className="bg-green-100 text-green-700">Excel</DaisyBadge>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Import Excel RCSA
              </h3>
              
              <p className="text-gray-600 mb-4 flex-grow">
                {isDragActive 
                  ? "Drop your Excel file here..."
                  : "Drag your Excel file here or browse"
                }
              </p>

              <div className="space-y-2 text-sm text-gray-500">
                <p>Supports: .xlsx, .xls, .csv</p>
                <p>Max size: 10MB</p>
              </div>

              {uploadingFile && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-700">Importing your data...</p>
                  </div>
                </div>
              )}

              {hoveredCard === 'import' && !uploadingFile && (
                <div className="absolute inset-0 bg-gradient-to-t from-blue-50 to-transparent opacity-0 animate-fade-in" />
              )}
            </DaisyCardBody>
          </div>
        </DaisyCard>

        {/* Start Fresh Card */}
        <DaisyCard 
          className={`
            relative overflow-hidden transition-all duration-300 cursor-pointer
            ${hoveredCard === 'fresh' ? 'shadow-lg scale-105' : 'shadow-md'}
          `}
          onMouseEnter={() => setHoveredCard('fresh')}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={handleStartFresh}
        >
          <DaisyCardBody className="p-6 h-full flex flex-col" >
  <div className="flex items-center justify-between mb-4">
</DaisyCard>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Zap className="w-6 h-6 text-blue-700" />
              </div>
              <DaisyBadge className="bg-blue-100 text-blue-700">AI-Powered</DaisyBadge>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Start Fresh
            </h3>
            
            <p className="text-gray-600 mb-4 flex-grow">
              Create your first risk with AI assistance
            </p>

            <div className="space-y-2">
              <p className="text-sm text-gray-500">Estimated time: 5 minutes</p>
              <DaisyButton variant="outline" className="w-full group">
          Get Started

        </DaisyButton>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </DaisyButton>
            </div>
          </DaisyCardBody>
        </DaisyCard>

        {/* Explore Demo Card */}
        <DaisyCard 
          className={`
            relative overflow-hidden transition-all duration-300 cursor-pointer
            ${hoveredCard === 'demo' ? 'shadow-lg scale-105' : 'shadow-md'}
          `}
          onMouseEnter={() => setHoveredCard('demo')}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={handleExploreDemo}
        >
          <DaisyCardBody className="p-6 h-full flex flex-col" >
  <div className="flex items-center justify-between mb-4">
</DaisyCard>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Play className="w-6 h-6 text-purple-700" />
              </div>
              <DaisyBadge className="bg-purple-100 text-purple-700">2 min tour</DaisyBadge>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Explore Demo
            </h3>
            
            <p className="text-gray-600 mb-4 flex-grow">
              See Riscura in action with sample data
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                <span>Live demo environment</span>
              </div>
              <DaisyButton variant="outline" className="w-full group">
          Start Tour

        </DaisyButton>
                <Play className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
              </DaisyButton>
            </div>
          </DaisyCardBody>
        </DaisyCard>
      </div>

      {/* Interactive Heat Map Preview */}
      <DaisyCard className="overflow-hidden" >
  <DaisyCardBody className="p-8" >
  </DaisyCard>
</DaisyCardBody>
          <div className="text-center space-y-4">
            <div className="relative mx-auto w-full max-w-2xl">
              <div className="aspect-[16/9] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
                {/* Animated pulse effect */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-blue-400/20 rounded-full animate-pulse" />
                  <div className="absolute w-24 h-24 bg-blue-500/20 rounded-full animate-pulse animation-delay-200" />
                  <div className="absolute w-16 h-16 bg-blue-600/20 rounded-full animate-pulse animation-delay-400" />
                </div>
                
                <BarChart3 className="w-16 h-16 text-gray-400 relative z-10" />
                
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                  <p className="text-sm text-gray-700 font-medium">
                    Your risks will appear here
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Your Risk Heat Map Awaits
              </h3>
              <p className="text-gray-600">
                Visualize and manage all your risks in one interactive dashboard
              </p>
            </div>
          </div>
        </DaisyCardBody>
      </DaisyCard>

      {/* Value Propositions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
          <TrendingUp className="w-5 h-5 text-green-700 flex-shrink-0" />
          <p className="text-sm text-green-900">
            <strong>10x faster</strong> than manual Excel processes
          </p>
        </div>
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
          <Shield className="w-5 h-5 text-blue-700 flex-shrink-0" />
          <p className="text-sm text-blue-900">
            <strong>AI-powered</strong> risk identification
          </p>
        </div>
        <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
          <Users className="w-5 h-5 text-purple-700 flex-shrink-0" />
          <p className="text-sm text-purple-900">
            <strong>Trusted by 500+</strong> risk managers
          </p>
        </div>
      </div>
    </div>
  );
}