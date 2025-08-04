import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
// import { Upload, AlertCircle, FileText, CheckCircle2, XCircle, Sparkles } from 'lucide-react'
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard'
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
import { DaisyCardTitle } from '@/components/ui/daisy-components';
import { Sparkles } from 'lucide-react';
  DaisyTabs,
  DaisyTabsContent,
  DaisyTabsList,
  DaisyTabsTrigger,
} from '@/components/ui/DaisyTabs';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisyScrollArea } from '@/components/ui/DaisyScrollArea';

interface RiskInsight {
  id: string;
  title: string;
  description: string;
  confidence: number;
  category: string;
}

export default function DocumentAnalysisPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [analyzedDocument, setAnalyzedDocument] = useState<{
    name: string;
    size: number;
    type: string;
    uploadedAt: string;
  } | null>(null);
  const [riskInsights, setRiskInsights] = useState<RiskInsight[]>([]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  // Handle file upload
  const handleUpload = async () => {
    if (!file) return

    setUploading(true);

    // Simulate file upload
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setUploading(false);
    setProcessing(true);

    // Simulate AI processing with progress updates
    const processingInterval = setInterval(() => {
      setProcessingProgress((prev) => {
        const newProgress = prev + Math.random() * 10
        if (newProgress >= 100) {
          clearInterval(processingInterval);
          // Generate mock results after processing is complete
          generateMockResults()
          return 100;
        }
        return newProgress;
      });
    }, 600);
  }

  // Generate mock AI analysis results
  const generateMockResults = () => {
    // Mock document metadata
    setAnalyzedDocument({
      name: file?.name || 'Unknown document',
      size: file?.size || 0,
      type: file?.type || 'application/pdf',
      uploadedAt: new Date().toISOString(),
    })

    // Mock risk insights
    setRiskInsights([
      {
        id: '1',
        title: 'Inadequate Data Protection Controls',
        description:
          'Document mentions customer data processing without specifying encryption methods or access controls, potentially violating GDPR and data protection regulations.',
        confidence: 0.92,
        category: 'Compliance',
      },
      {
        id: '2',
        title: 'IT System Downtime Risk',
        description:
          'Critical systems mentioned in the document lack redundancy plans or backup procedures, creating operational risk of extended downtime.',
        confidence: 0.85,
        category: 'Operational',
      },
      {
        id: '3',
        title: 'Third-Party Vendor Oversight Gap',
        description:
          'Multiple vendor relationships described without clear monitoring or performance metrics, creating potential service delivery risks.',
        confidence: 0.78,
        category: 'Strategic',
      },
      {
        id: '4',
        title: 'Insufficient Fraud Detection Mechanisms',
        description:
          'Payment processing section lacks fraud detection controls and monitoring tools, potentially exposing the organization to financial losses.',
        confidence: 0.88,
        category: 'Financial',
      },
      {
        id: '5',
        title: 'Inadequate Disaster Recovery Planning',
        description:
          "Business continuity measures mentioned are outdated and don't address remote work scenarios or modern cloud-based recovery options.",
        confidence: 0.81,
        category: 'Technology',
      },
    ])

    setProcessing(false);

    toast({
      title: 'Analysis Complete',
      description: 'AI has identified potential risks in your document.',
    });
  }

  // Helper function to get badge color based on confidence
  const getConfidenceBadgeVariant = (confidence: number) => {
    if (confidence >= 0.9) return 'default'
    if (confidence >= 0.7) return 'secondary';
    return 'outline';
  }

  // Helper function to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Add risk to register
  const addRiskToRegister = (_risk: RiskInsight) => {
    toast({
      title: 'Risk Added',
      description: `"${risk.title}" has been added to your risk register.`,
    })

    // In a real app, we would add the risk to the risk register
    // For now, just navigate to the risk list page
    setTimeout(() => {
      router.push('/risks')
    }, 1000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Document Analysis</h1>
        <p className="text-muted-foreground">
          Upload documents for AI-powered risk identification and analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Upload Panel */}
        <DaisyCard className="lg:col-span-1">
          <DaisyCardBody>
            <DaisyCardTitle>Upload Document</DaisyCardTitle>
            <p className="text-muted-foreground text-sm mb-4">
              Supported formats: PDF, DOC, DOCX, TXT
            </p>

            {!analyzedDocument ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Upload a Document</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Drag files here or click to browse
                  </p>
                  <DaisyInput
                    type="file"
                    id="document-upload"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt"
                  />
                  <DaisyButton
                    variant="outline"
                    onClick={() => document.getElementById('document-upload')?.click()}
                  >
                    Select File
                  </DaisyButton>
                </div>

                {Boolean(file) && (
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                      <DaisyButton
                        variant="secondary"
                        size="sm"
                        onClick={handleUpload}
                        disabled={uploading || processing}
                      >
                        {uploading ? 'Uploading...' : 'Analyze'}
                      </DaisyButton>
                    </div>
                  </div>
                )}

                {(uploading || processing) && (
                  <DaisyCard className="border border-muted/50">
                    <DaisyCardBody className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                        <div className="space-y-2 flex-1">
                          <p className="font-medium">
                            {uploading ? 'Uploading Document...' : 'Analyzing Document...'}
                          </p>
                          <DaisyProgress
                            value={uploading ? undefined : processingProgress}
                            className="h-2"
                          />
                          {Boolean(processing) && (
                            <p className="text-xs text-muted-foreground">
                              Identifying risks and controls...
                            </p>
                          )}
                        </div>
                      </div>
                    </DaisyCardBody>
                  </DaisyCard>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border p-3">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{analyzedDocument.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(analyzedDocument.size)} • Analyzed{' '}
                        {new Date(analyzedDocument.uploadedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <DaisyBadge
                      variant="default"
                      className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    >
                      Analyzed
                    </DaisyBadge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <DaisyLabel>Identified Risks</DaisyLabel>
                    <DaisyBadge variant="outline">{riskInsights.length}</DaisyBadge>
                  </div>
                  <div className="flex justify-between items-center">
                    <DaisyLabel>High Confidence</DaisyLabel>
                    <DaisyBadge variant="outline">
                      {riskInsights.filter((r) => r.confidence >= 0.8).length}
                    </DaisyBadge>
                  </div>
                </div>

                <DaisyButton
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    setFile(null);
                    setAnalyzedDocument(null);
                    setRiskInsights([]);
                    setProcessingProgress(0);
                  }}
                >
                  Start New Analysis
                </DaisyButton>
              </div>
            )}
          </DaisyCardBody>
        </DaisyCard>

        {/* Analysis Results Panel */}
        <DaisyCard className="lg:col-span-2">
          <DaisyCardBody>
            <DaisyCardTitle>Analysis Results</DaisyCardTitle>
            <p className="text-muted-foreground text-sm mb-4">
              AI-identified risks and suggested controls
            </p>

            {!analyzedDocument ? (
              <div className="flex flex-col items-center justify-center h-72 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
                <h3 className="text-lg font-semibold mb-2">No Document Analyzed</h3>
                <p className="text-muted-foreground text-sm max-w-md mb-4">
                  Upload a document to have our AI analyze it for potential risks and controls.
                </p>
              </div>
            ) : (
              <DaisyTabs defaultValue="risks" className="w-full">
                <DaisyTabsList className="grid w-full grid-cols-2">
                  <DaisyTabsTrigger value="risks">Identified Risks</DaisyTabsTrigger>
                  <DaisyTabsTrigger value="insights">AI Insights</DaisyTabsTrigger>
                </DaisyTabsList>

                <DaisyTabsContent value="risks" className="space-y-4 pt-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>AI Analysis Complete</AlertTitle>
                    <AlertDescription>
                      Found {riskInsights.length} potential risks in the document
                    </AlertDescription>
                  </Alert>

                  <DaisyScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {riskInsights.map((risk) => (
                        <DaisyCard key={risk.id} className="hover:shadow-sm transition-shadow">
                          <DaisyCardBody className="p-4">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                              <div className="space-y-1">
                                <div className="flex items-center">
                                  <h4 className="font-semibold">{risk.title}</h4>
                                  <DaisyBadge className="ml-2" variant="outline">
                                    {risk.category}
                                  </DaisyBadge>
                                </div>
                                <p className="text-sm text-muted-foreground">{risk.description}</p>
                              </div>
                              <div className="flex flex-col gap-2 items-end shrink-0">
                                <DaisyBadge variant={getConfidenceBadgeVariant(risk.confidence)}>
                                  {Math.round(risk.confidence * 100)}% confidence
                                </DaisyBadge>
                                <DaisyButton size="sm" onClick={() => addRiskToRegister(risk)}>
                                  Add to Register
                                </DaisyButton>
                              </div>
                            </div>
                          </DaisyCardBody>
                        </DaisyCard>
                      ))}
                    </div>
                  </DaisyScrollArea>
                </DaisyTabsContent>

                <DaisyTabsContent value="insights" className="pt-4">
                  <DaisyCard>
                    <DaisyCardBody className="p-6">
                      <h3 className="text-xl font-semibold mb-4">Document Summary</h3>
                      <p className="text-sm mb-6">
                        This document appears to be a policy document outlining operational
                        procedures across multiple departments. The AI has identified several key
                        risk areas that may require attention based on industry standards and
                        regulatory requirements.
                      </p>

                      <h4 className="font-semibold mb-2">Key Observations:</h4>
                      <ul className="list-disc pl-5 space-y-2 mb-6 text-sm">
                        <li>
                          Data protection measures appear outdated relative to current regulatory
                          standards
                        </li>
                        <li>IT infrastructure redundancy is not adequately addressed</li>
                        <li>Third-party vendor management lacks clear oversight procedures</li>
                        <li>Financial controls around payment processing may need enhancement</li>
                        <li>Business continuity planning requires modernization</li>
                      </ul>

                      <div className="flex space-x-2 mb-6">
                        <div className="flex items-center space-x-1 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>Strong in compliance awareness</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span>Weak in technology controls</span>
                        </div>
                      </div>

                      <DaisyButton className="w-full" variant="outline">
                        Generate Full Report
                      </DaisyButton>
                    </DaisyCardBody>
                  </DaisyCard>
                </DaisyTabsContent>
              </DaisyTabs>
            )}
          </DaisyCardBody>
        </DaisyCard>
      </div>
    </div>
  );
}
