'use client';

import React, { useState } from 'react';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard'
import { DaisyButton } from '@/components/ui/DaisyButton';
import { Upload } from 'lucide-react';
import { DaisyCardTitle } from '@/components/ui/daisy-components';

// Simplified version for testing
interface DocumentUploadProps {
  onUpload?: (files: File[]) => void
  acceptedTypes?: string[];
  maxSize?: number;
  className?: string;
}

export function DocumentUpload({
  onUpload,
  acceptedTypes = ['.pdf', '.doc', '.docx'],
  maxSize = 10 * 1024 * 1024, // 10MB
  className
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);

  return (
    <DaisyCard className={`w-full max-w-4xl mx-auto ${className}`}>
      <DaisyCardBody >
  <DaisyCardTitle className="flex items-center gap-2" >
</DaisyCard>
          <Upload className="h-5 w-5" />
          Document Upload
        </DaisyCardTitle>
      </DaisyCardBody>
      <DaisyCardBody >
  <div className="text-center py-12 text-gray-500">
</DaisyCardBody>
          <Upload className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg mb-2">Document upload temporarily simplified for build testing</p>
          <p className="text-sm">Drag and drop functionality will be restored after build fixes</p>
          
          <div className="mt-6">
            <DaisyButton disabled={uploading} >
  <Upload className="w-4 h-4 mr-2" />
</DaisyButton>
              {uploading ? 'Uploading...' : 'Upload Documents'}
            </DaisyButton>
          </div>
        </div>
      </DaisyCardBody>
    </DaisyCard>
  );
}