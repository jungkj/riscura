import { useState } from 'react';
import { motion } from 'framer-motion';
import DocumentUpload from '@/components/documents/DocumentUpload';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { toast } from '@/hooks/use-toast';

// Icons
import {
  FileText,
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Download,
  RefreshCw
} from 'lucide-react';

// Types
interface AnalysisStats {
  totalDocuments: number;
  analyzedDocuments: number;
  risksIdentified: number;
  averageConfidence: number;
  processingTime: number;
}

interface RiskTrend {
  category: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  percentage: number;
}

export default function DocumentAnalysisPage() {
  const [analysisStats, setAnalysisStats] = useState<AnalysisStats>({
    totalDocuments: 0,
    analyzedDocuments: 0,
    risksIdentified: 0,
    averageConfidence: 0,
    processingTime: 0
  });

  const [riskTrends] = useState<RiskTrend[]>([
    { category: 'Data Privacy', count: 12, trend: 'up', percentage: 15 },
    { category: 'Operational', count: 8, trend: 'down', percentage: -8 },
    { category: 'Compliance', count: 15, trend: 'up', percentage: 22 },
    { category: 'Financial', count: 5, trend: 'stable', percentage: 0 },
  ]);

  const [recentAnalyses] = useState([
    {
      id: '1',
      fileName: 'Privacy Policy 2024.pdf',
      analyzedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      risksFound: 3,
      confidence: 92,
      status: 'completed'
    },
    {
      id: '2',
      fileName: 'Operational Procedures.docx',
      analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      risksFound: 5,
      confidence: 87,
      status: 'completed'
    },
    {
      id: '3',
      fileName: 'Financial Report Q4.xlsx',
      analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      risksFound: 2,
      confidence: 95,
      status: 'completed'
    }
  ]);

  const handleFilesUploaded = (files: { id: string; name: string; size: number; type: string }[]) => {
    setAnalysisStats(prev => ({
      ...prev,
      totalDocuments: prev.totalDocuments + files.length
    }));
    
    toast({
      title: 'Files Uploaded',
      description: `${files.length} file(s) uploaded and queued for analysis`,
    });
  };

  const handleRefreshStats = () => {
    // Simulate refreshing stats
    setAnalysisStats(prev => ({
      ...prev,
      analyzedDocuments: Math.min(prev.totalDocuments, prev.analyzedDocuments + 1),
      risksIdentified: prev.risksIdentified + Math.floor(Math.random() * 3),
      averageConfidence: 85 + Math.floor(Math.random() * 10),
      processingTime: 2.5 + Math.random() * 2
    }));
    
    toast({
      title: 'Stats Updated',
      description: 'Analysis statistics have been refreshed',
    });
  };

  const getTrendIcon = (trend: RiskTrend['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingUp className="h-4 w-4 text-green-500 rotate-180" />;
      case 'stable':
        return <div className="h-4 w-4 bg-muted rounded-full" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <DaisyBadge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Completed</DaisyBadge>;
      case 'processing':
        return <DaisyBadge variant="secondary"><Clock className="h-3 w-3 mr-1" />Processing</DaisyBadge>;
      case 'failed':
        return <DaisyBadge variant="error"><DaisyAlertTriangle className="h-3 w-3 mr-1" />Failed</DaisyBadge>;
      default:
        return <DaisyBadge variant="outline">Unknown</DaisyBadge>;
    }
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Document Analysis
          </h1>
          <p className="text-muted-foreground">
            Upload and analyze documents with AI-powered risk identification.
          </p>
        </div>
        <DaisyButton onClick={handleRefreshStats} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Stats
        </DaisyButton>
      </motion.div>

      {/* Stats Overview */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <DaisyCard>
          <DaisyCardContent className="p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{analysisStats.totalDocuments}</p>
                <p className="text-sm text-muted-foreground">Total Documents</p>
              </div>
            </div>
          </DaisyCardContent>
        </DaisyCard>
        
        <DaisyCard>
          <DaisyCardContent className="p-6">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-[#191919]" />
              <div>
                <p className="text-2xl font-bold">{analysisStats.analyzedDocuments}</p>
                <p className="text-sm text-muted-foreground">Analyzed</p>
              </div>
            </div>
          </DaisyCardContent>
        </DaisyCard>
        
        <DaisyCard>
          <DaisyCardContent className="p-6">
            <div className="flex items-center gap-2">
              <DaisyAlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{analysisStats.risksIdentified}</p>
                <p className="text-sm text-muted-foreground">Risks Found</p>
              </div>
            </div>
          </DaisyCardContent>
        </DaisyCard>
        
        <DaisyCard>
          <DaisyCardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{analysisStats.averageConfidence}%</p>
                <p className="text-sm text-muted-foreground">Avg Confidence</p>
              </div>
            </div>
          </DaisyCardContent>
        </DaisyCard>
      </motion.div>

      <DaisyTabs defaultValue="upload" className="space-y-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <DaisyTabsList className="grid w-full grid-cols-4">
            <DaisyTabsTrigger value="upload">Upload & Analyze</DaisyTabsTrigger>
            <DaisyTabsTrigger value="history">Analysis History</DaisyTabsTrigger>
            <DaisyTabsTrigger value="trends">Risk Trends</DaisyTabsTrigger>
            <DaisyTabsTrigger value="insights">AI Insights</DaisyTabsTrigger>
          </DaisyTabsList>
        </motion.div>

        <DaisyTabsContent value="upload" className="space-y-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <DocumentUpload 
              onUpload={async (formData: FormData) => {
                // Handle the upload - this would typically send to an API
                console.log('Uploading files:', formData);
                // For now, just simulate the file upload completion
                const files = Array.from(formData.getAll('files') as File[]).map(file => ({
                  id: Math.random().toString(36).substring(2),
                  name: file.name,
                  size: file.size,
                  type: file.type
                }));
                handleFilesUploaded(files);
              }}
              organizationId="demo-org"
              userId="demo-user"
            />
          </motion.div>
        </DaisyTabsContent>

        <DaisyTabsContent value="history" className="space-y-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <DaisyCard>
              <DaisyCardHeader>
                <DaisyCardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Analyses
                </DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent>
                <div className="space-y-4">
                  {recentAnalyses.map((analysis) => (
                    <div key={analysis.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="font-medium">{analysis.fileName}</p>
                          <p className="text-sm text-muted-foreground">
                            {analysis.analyzedAt.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{analysis.risksFound} risks found</p>
                          <p className="text-sm text-muted-foreground">{analysis.confidence}% confidence</p>
                        </div>
                        {getStatusBadge(analysis.status)}
                        <DaisyButton variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </DaisyButton>
                      </div>
                    </div>
                  ))}
                </div>
              </DaisyCardContent>
            </DaisyCard>
          </motion.div>
        </DaisyTabsContent>

        <DaisyTabsContent value="trends" className="space-y-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <DaisyCard>
              <DaisyCardHeader>
                <DaisyCardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Risk Category Trends
                </DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent>
                <div className="space-y-4">
                  {riskTrends.map((trend) => (
                    <div key={trend.category} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getTrendIcon(trend.trend)}
                        <div>
                          <p className="font-medium">{trend.category}</p>
                          <p className="text-sm text-muted-foreground">{trend.count} risks identified</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`text-sm font-medium ${
                            trend.trend === 'up' ? 'text-red-600' : 
                            trend.trend === 'down' ? 'text-green-600' : 
                            'text-gray-600'
                          }`}>
                            {trend.percentage > 0 ? '+' : ''}{trend.percentage}%
                          </p>
                          <p className="text-sm text-muted-foreground">vs last month</p>
                        </div>
                        <DaisyProgress 
                          value={Math.abs(trend.percentage)} 
                          className="w-20" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </DaisyCardContent>
            </DaisyCard>
          </motion.div>
        </DaisyTabsContent>

        <DaisyTabsContent value="insights" className="space-y-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <DaisyCard>
              <DaisyCardHeader>
                <DaisyCardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI-Generated Insights
                </DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent>
                <div className="space-y-6">
                  <div className="p-4 bg-[#D8C3A5]/20 dark:bg-[#D8C3A5]/10 rounded-lg border border-[#D8C3A5] dark:border-[#D8C3A5]">
                    <h4 className="font-medium text-[#191919] dark:text-[#191919] mb-2">
                      📊 Pattern Recognition
                    </h4>
                    <p className="text-sm text-[#191919] dark:text-[#191919]">
                      AI has identified recurring data privacy concerns across 75% of uploaded policy documents. 
                      Consider implementing standardized privacy protection templates.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">
                      ⚠️ Risk Correlation
                    </h4>
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      Documents with operational risks show 60% higher likelihood of compliance issues. 
                      Review operational procedures for regulatory alignment.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                      ✅ Improvement Opportunity
                    </h4>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Recent document analyses show 15% improvement in risk identification accuracy. 
                      Continue current documentation practices for optimal results.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-[#D8C3A5]/20 dark:bg-[#D8C3A5]/10 rounded-lg border border-[#D8C3A5] dark:border-[#D8C3A5]">
                    <h4 className="font-medium text-[#191919] dark:text-[#191919] mb-2">
                      🎯 Recommendation
                    </h4>
                    <p className="text-sm text-[#191919] dark:text-[#191919]">
                      Based on analysis patterns, consider scheduling quarterly reviews for high-risk documents 
                      and implementing automated monitoring for compliance-related content.
                    </p>
                  </div>
                </div>
              </DaisyCardContent>
            </DaisyCard>
          </motion.div>
        </DaisyTabsContent>
      </DaisyTabs>
    </motion.div>
  );
} 