"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import { DaisyCard, DaisyCardBody } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyButton } from '@/components/ui/DaisyButton';
// import { 
  Upload, 
  FileText, 
  Brain, 
  CheckCircle, 
  AlertTriangle,
  BarChart3,
  Download,
  Eye,
  Sparkles
} from 'lucide-react';

const InteractiveDemo = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Simulate file upload
    const files = ['RCSA_Template.xlsx', 'Risk_Policy.pdf', 'Controls_Matrix.xlsx'];
    setUploadedFiles(files);
    
    // Start AI analysis after a brief delay
    setTimeout(() => {
      setIsAnalyzing(true);
      
      // Show results after analysis
      setTimeout(() => {
        setIsAnalyzing(false);
        setShowResults(true);
      }, 3000);
    }, 1000);
  };

  const handleReset = () => {
    setUploadedFiles([]);
    setIsAnalyzing(false);
    setShowResults(false);
  };

  const mockResults = [
    { id: 1, title: 'Cybersecurity Risk', risk: 'High', score: 18, category: 'Technology' },
    { id: 2, title: 'Data Privacy Compliance', risk: 'Medium', score: 12, category: 'Compliance' },
    { id: 3, title: 'Third-Party Vendor Risk', risk: 'Medium', score: 9, category: 'Operational' },
    { id: 4, title: 'Financial Reporting Risk', risk: 'Low', score: 6, category: 'Financial' },
  ];

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <DaisyBadge className="bg-[#199BEC] text-white px-4 py-2 mb-4" >
  Interactive Demo
</DaisyBadge>
          </DaisyBadge>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Try It Yourself
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience the power of AI-driven risk assessment. Drop your documents and watch the magic happen.
          </p>
        </div>

        {/* Interactive Demo Area */}
        <DaisyCard className="border-2 border-gray-200 shadow-xl overflow-hidden" >
  <DaisyCardBody className="p-0" >
  </DaisyCard>
</DaisyCardBody>
            {/* Step 1: Upload Area */}
            {!uploadedFiles.length && !isAnalyzing && !showResults && (
              <div className="p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  Step 1: Upload Your Documents
                </h3>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`
                    border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer
                    ${isDragging 
                                          ? 'border-[#199BEC] bg-[#e6f4fd] scale-105'
                    : 'border-gray-300 bg-gray-50 hover:border-[#199BEC]/50 hover:bg-[#e6f4fd]/50'
                    }
                  `}
                >
                  <motion.div
                    animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Upload className={`w-16 h-16 mx-auto mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">
                      {isDragging ? 'Drop your files here!' : 'Drag & Drop your documents'}
                    </h4>
                    <p className="text-gray-600 mb-4">
                      RCSA templates, risk policies, control matrices, or any risk-related documents
                    </p>
                    <div className="flex justify-center space-x-2 text-sm text-gray-500">
                      <span>Excel</span>
                      <span>•</span>
                      <span>PDF</span>
                      <span>•</span>
                      <span>Word</span>
                      <span>•</span>
                      <span>CSV</span>
                    </div>
                  </motion.div>
                </div>
              </div>
            )}

            {/* Step 2: Processing Files */}
            {uploadedFiles.length > 0 && !showResults && (
              <div className="p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
                  {isAnalyzing ? 'Step 2: AI Analysis in Progress' : 'Files Uploaded Successfully'}
                </h3>
                
                {/* Uploaded Files */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {uploadedFiles.map((file, index) => (
                    <motion.div
                      key={file}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.2 }}
                      className="bg-white border border-gray-200 rounded-lg p-4 flex items-center space-x-3"
                    >
                      <FileText className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{file}</p>
                        <p className="text-xs text-gray-500">
                          {Math.floor(Math.random() * 500 + 100)} KB
                        </p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                    </motion.div>
                  ))}
                </div>

                {/* AI Analysis Animation */}
                {Boolean(isAnalyzing) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-12 h-12 mx-auto mb-4"
                    >
                      <Brain className="w-12 h-12 text-purple-600" />
                    </motion.div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      AI is analyzing your documents...
                    </h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        ✓ Extracting risk information
                      </motion.p>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5 }}
                      >
                        ✓ Identifying control gaps
                      </motion.p>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.5 }}
                      >
                        ✓ Calculating risk scores
                      </motion.p>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Step 3: Results */}
            {Boolean(showResults) && (
              <div className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Step 3: AI Analysis Complete!
                  </h3>
                  <p className="text-gray-600">
                    Your comprehensive risk assessment is ready
                  </p>
                </div>

                {/* Results Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <DaisyCard className="bg-red-50 border-red-200" >
  <DaisyCardBody className="p-4 text-center" >
  </DaisyCard>
</DaisyCardBody>
                      <div className="text-2xl font-bold text-red-600">1</div>
                      <div className="text-sm text-red-700">High Risk</div>
                    </DaisyCardBody>
                  </DaisyCard>
                  <DaisyCard className="bg-yellow-50 border-yellow-200" >
  <DaisyCardBody className="p-4 text-center" >
  </DaisyCard>
</DaisyCardBody>
                      <div className="text-2xl font-bold text-yellow-600">2</div>
                      <div className="text-sm text-yellow-700">Medium Risk</div>
                    </DaisyCardBody>
                  </DaisyCard>
                  <DaisyCard className="bg-green-50 border-green-200" >
  <DaisyCardBody className="p-4 text-center" >
  </DaisyCard>
</DaisyCardBody>
                      <div className="text-2xl font-bold text-green-600">1</div>
                      <div className="text-sm text-green-700">Low Risk</div>
                    </DaisyCardBody>
                  </DaisyCard>
                  <DaisyCard className="bg-blue-50 border-blue-200" >
  <DaisyCardBody className="p-4 text-center" >
  </DaisyCard>
</DaisyCardBody>
                      <div className="text-2xl font-bold text-blue-600">4</div>
                      <div className="text-sm text-blue-700">Total Risks</div>
                    </DaisyCardBody>
                  </DaisyCard>
                </div>

                {/* Risk List */}
                <div className="space-y-3 mb-8">
                  {mockResults.map((result, index) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <div>
                          <h4 className="font-medium text-gray-900">{result.title}</h4>
                          <p className="text-sm text-gray-500">{result.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <DaisyBadge 
                          variant={
                            result.risk === 'High' ? 'destructive' : 
                            result.risk === 'Medium' ? 'secondary' : 'default'
                          } >
  {result.risk} Risk
</DaisyBadge>
                        </DaisyBadge>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">Score: {result.score}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center space-x-4">
                  <DaisyButton variant="outline" onClick={handleReset}>
          Try Again

        </DaisyButton>
                  </DaisyButton>
                  <DaisyButton className="bg-blue-600 hover:bg-blue-700" >
  <Download className="w-4 h-4 mr-2" />
</DaisyButton>
                    Export Report
                  </DaisyButton>
                  <DaisyButton variant="outline" >
  <Eye className="w-4 h-4 mr-2" />
</DaisyButton>
                    View Dashboard
                  </DaisyButton>
                </div>
              </div>
            )}
          </DaisyCardBody>
        </DaisyCard>

        {/* Call to Action */}
        {Boolean(showResults) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-8"
          >
            <p className="text-gray-600 mb-4">
              This is just a preview. The full platform offers much more!
            </p>
            <DaisyButton size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" >
  <Sparkles className="w-5 h-5 mr-2" />
</DaisyButton>
              Get Full Access
            </DaisyButton>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default InteractiveDemo; 