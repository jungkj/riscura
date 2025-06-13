'use client';

import React from 'react';
import PolicyImporter from '@/components/PolicyImporter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Sparkles,
  Upload,
  Edit3,
  Eye
} from 'lucide-react';

export default function PolicyImporterDemo() {
  const handleAnalysisComplete = (result: any) => {
    console.log('Analysis completed:', result);
    // Here you could save to your state management, database, etc.
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              AI Policy Analyzer
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Upload your policy documents and let AI extract risks and controls automatically. 
            Review, edit, and approve findings with our intelligent analysis system.
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-2">
                <Upload className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-1">Smart Upload</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Drag & drop PDF, DOCX, or TXT files
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-2">
                <Sparkles className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-1">AI Analysis</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Intelligent risk & control extraction
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-2">
                <Edit3 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-1">Inline Editing</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Edit and refine extracted content
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-2">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="font-semibold mb-1">Approval Flow</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Review and approve findings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Demo Instructions */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <Eye className="h-5 w-5" />
              Demo Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-blue-800 dark:text-blue-200">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">1</Badge>
                <div>
                  <p className="font-medium">Upload a Policy Document</p>
                  <p className="text-sm opacity-90">
                    Try uploading a security policy, procedure document, or compliance guide (PDF, DOCX, TXT)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">2</Badge>
                <div>
                  <p className="font-medium">Review AI Findings</p>
                  <p className="text-sm opacity-90">
                    See extracted risks and controls organized in expandable sections with confidence scores
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">3</Badge>
                <div>
                  <p className="font-medium">Edit & Approve</p>
                  <p className="text-sm opacity-90">
                    Click edit icons to modify text, then approve individual items or use "Approve All"
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Component */}
        <PolicyImporter 
          onAnalysisComplete={handleAnalysisComplete}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6"
        />

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-600" />
              Technical Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Risk Detection
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Identifies security vulnerabilities</li>
                  <li>• Finds compliance risks</li>
                  <li>• Detects operational threats</li>
                  <li>• Extracts implicit risk statements</li>
                  <li>• Provides confidence scoring</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  Control Analysis
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Finds security controls</li>
                  <li>• Identifies procedures & safeguards</li>
                  <li>• Extracts mitigation measures</li>
                  <li>• Discovers governance controls</li>
                  <li>• Maps control effectiveness</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-semibold mb-2">Supported File Formats</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">PDF documents</Badge>
                <Badge variant="outline">Microsoft Word (.docx)</Badge>
                <Badge variant="outline">Word 97-2003 (.doc)</Badge>
                <Badge variant="outline">Plain text (.txt)</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                Maximum file size: 10MB • Rate limit: 10 uploads per 15 minutes
              </p>
            </div>
          </CardContent>
        </Card>

        {/* API Integration Info */}
        <Card>
          <CardHeader>
            <CardTitle>Integration Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Component Usage</h4>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm font-mono">
                  {`import PolicyImporter from '@/components/PolicyImporter';

<PolicyImporter 
  onAnalysisComplete={(result) => {
    // Handle the analysis results
    console.log(result.data.risks);
    console.log(result.data.controls);
  }}
  className="custom-styling"
/>`}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">API Endpoint</h4>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm font-mono">POST /api/upload/policy</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Accepts multipart/form-data with file field
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 