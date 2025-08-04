'use client';

import React, { useState } from 'react';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard'
import { DaisyButton } from '@/components/ui/DaisyButton';
import { Upload, CheckCircle, Loader2 } from 'lucide-react';
import { DaisyCardTitle } from '@/components/ui/daisy-components';

interface RCSAImportFlowProps {
  onComplete?: () => void;
}

export default function RCSAImportFlow({ onComplete }: RCSAImportFlowProps) {
  const [step, setStep] = useState<'upload' | 'analyzing' | 'review' | 'importing' | 'complete'>(
    'upload'
  );

  const handleAnalysis = () => {
    setStep('analyzing');
    setTimeout(() => {
      setStep('complete');
    }, 2000);
  };

  if (step === 'upload') {
    return (
      <DaisyCard>
        <DaisyCardBody>
          <DaisyCardTitle>Import RCSA Data</DaisyCardTitle>
          <p>Upload an Excel file or paste your RCSA data to begin the analysis</p>
        </DaisyCardBody>
        <DaisyCardBody>
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-sm text-gray-600">
              Drop your RCSA Excel file here or click to browse
            </p>
            <DaisyButton onClick={handleAnalysis} className="mt-4">
              Analyze Data
            </DaisyButton>
          </div>
        </DaisyCardBody>
      </DaisyCard>
    );
  }

  if (step === 'analyzing') {
    return (
      <DaisyCard>
        <DaisyCardBody className="py-12">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg font-medium">Analyzing RCSA Data...</p>
            <p className="text-sm text-gray-500">
              Our AI is reviewing your data and performing gap analysis
            </p>
          </div>
        </DaisyCardBody>
      </DaisyCard>
    );
  }

  if (step === 'complete') {
    return (
      <DaisyCard>
        <DaisyCardBody className="py-12">
          <div className="flex flex-col items-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-lg font-medium">Import Complete!</p>
            <p className="text-sm text-gray-500">
              Your RCSA data has been successfully imported and analyzed
            </p>
            <div className="flex space-x-3 mt-4">
              <DaisyButton onClick={() => setStep('upload')}>Import More Data</DaisyButton>
              <DaisyButton variant="outline" onClick={onComplete}>
                View Dashboard
              </DaisyButton>
            </div>
          </div>
        </DaisyCardBody>
      </DaisyCard>
    );
  }

  return null;
}
