'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Edit, Save, X, Loader2 } from 'lucide-react';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyCard, DaisyCardBody, DaisyCardHeader, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { RCSAGapAnalysis, MappedRisk, MappedControl, RiskGap, ControlGap } from '@/services/ai/rcsa-analysis';
import { RiskCategory, ControlType, AutomationLevel } from '@/types/rcsa.types';
import { toast } from 'sonner';
import { FixedSizeList } from 'react-window';

interface RCSAImportFlowProps {
  onComplete?: () => void;
}

export default function RCSAImportFlow({ onComplete }: RCSAImportFlowProps) {
  const [step, setStep] = useState<'upload' | 'analyzing' | 'review' | 'importing' | 'complete'>('upload');
  const [uploadMethod, setUploadMethod] = useState<'file' | 'paste'>('file');
  const [pastedData, setPastedData] = useState('');
  const [analysis, setAnalysis] = useState<RCSAGapAnalysis | null>(null);
  const [editedRisks, setEditedRisks] = useState<MappedRisk[]>([]);
  const [editedControls, setEditedControls] = useState<MappedControl[]>([]);
  const [editingRiskId, setEditingRiskId] = useState<string | null>(null);
  const [editingControlId, setEditingControlId] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
      return;
    }
    
    setStep('analyzing');
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result;
        if (!result || typeof result !== 'string') {
          toast.error('Failed to read file');
          setStep('upload');
          return;
        }
        
        const base64 = result.split(',')[1];
        if (!base64) {
          toast.error('Failed to read file');
          setStep('upload');
          return;
        }
        
        // Send to API for analysis
        const response = await fetch('/api/rcsa/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'file',
            content: base64,
            fileName: file.name
          })
        });
        
        const apiResult = await response.json();
        
        if (apiResult.success) {
          setAnalysis(apiResult.data.analysis);
          setEditedRisks(apiResult.data.analysis.mappedRisks);
          setEditedControls(apiResult.data.analysis.mappedControls);
          setStep('review');
        } else {
          toast.error(apiResult.error || 'Analysis failed');
          setStep('upload');
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to analyze file');
      setStep('upload');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });

  const handlePasteAnalysis = async () => {
    if (!pastedData.trim()) {
      toast.error('Please paste your RCSA data');
      return;
    }
    
    setStep('analyzing');
    
    try {
      const response = await fetch('/api/rcsa/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'text',
          content: pastedData
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAnalysis(result.data.analysis);
        setEditedRisks(result.data.analysis.mappedRisks);
        setEditedControls(result.data.analysis.mappedControls);
        setStep('review');
      } else {
        toast.error(result.error || 'Analysis failed');
        setStep('upload');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze data');
      setStep('upload');
    }
  };

  const handleImport = async () => {
    setStep('importing');
    
    try {
      const response = await fetch('/api/rcsa/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          risks: editedRisks,
          controls: editedControls,
          sourceFileName: 'RCSA Import'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setStep('complete');
        toast.success(result.data.message);
      } else {
        toast.error(result.error || 'Import failed');
        setStep('review');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import data');
      setStep('review');
    }
  };

  const updateRisk = (riskId: string, updates: Partial<MappedRisk>) => {
    setEditedRisks(prev => prev.map(r => 
      r.externalId === riskId ? { ...r, ...updates } : r
    ));
  };

  const updateControl = (controlId: string, updates: Partial<MappedControl>) => {
    setEditedControls(prev => prev.map(c => 
      c.externalId === controlId ? { ...c, ...updates } : c
    ));
  };

  // Virtual scrolling row renderer for risks
  const RiskRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const risk = editedRisks[index];
    return (
      <div style={style}>
        <div className="border rounded-lg p-4 mx-4 mb-4">
          {editingRiskId === risk.externalId ? (
            <div className="space-y-3">
              <DaisyInput
                value={risk.title}
                onChange={(e) => updateRisk(risk.externalId, { title: e.target.value })}
                placeholder="Risk Title"
              />
              <DaisyTextarea
                value={risk.description}
                onChange={(e) => updateRisk(risk.externalId, { description: e.target.value })}
                placeholder="Risk Description"
                rows={3}
              />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <DaisyLabel>Category</DaisyLabel>
                  <DaisySelect
                    value={risk.category}
                    onChange={(e) => updateRisk(risk.externalId, { category: e.target.value as RiskCategory })}
                  >
                    {Object.values(RiskCategory).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </DaisySelect>
                </div>
                <div>
                  <DaisyLabel>Likelihood (1-5)</DaisyLabel>
                  <DaisyInput
                    type="number"
                    min="1"
                    max="5"
                    value={risk.likelihood}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value >= 1 && value <= 5) {
                        updateRisk(risk.externalId, { likelihood: value });
                      } else if (e.target.value === '') {
                        updateRisk(risk.externalId, { likelihood: 1 });
                      }
                    }}
                  />
                </div>
                <div>
                  <DaisyLabel>Impact (1-5)</DaisyLabel>
                  <DaisyInput
                    type="number"
                    min="1"
                    max="5"
                    value={risk.impact}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value >= 1 && value <= 5) {
                        updateRisk(risk.externalId, { impact: value });
                      } else if (e.target.value === '') {
                        updateRisk(risk.externalId, { impact: 1 });
                      }
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <DaisyButton size="sm" variant="outline" onClick={() => setEditingRiskId(null)}>
                  Cancel
                </DaisyButton>
                <DaisyButton size="sm" onClick={() => setEditingRiskId(null)}>
                  Save
                </DaisyButton>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium">{risk.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">{risk.description}</p>
                  <div className="flex gap-4 mt-2">
                    <DaisyBadge variant="outline">{risk.category}</DaisyBadge>
                    <span className="text-xs text-gray-500">
                      Likelihood: {risk.likelihood} | Impact: {risk.impact} | Score: {risk.likelihood * risk.impact}
                    </span>
                  </div>
                </div>
                <DaisyButton
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingRiskId(risk.externalId)}
                >
                  <Edit className="h-4 w-4" />
                </DaisyButton>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Virtual scrolling row renderer for controls
  const ControlRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const control = editedControls[index];
    return (
      <div style={style}>
        <div className="border rounded-lg p-4 mx-4 mb-4">
          {editingControlId === control.externalId ? (
            <div className="space-y-3">
              <DaisyInput
                value={control.title}
                onChange={(e) => updateControl(control.externalId, { title: e.target.value })}
                placeholder="Control Title"
              />
              <DaisyTextarea
                value={control.description}
                onChange={(e) => updateControl(control.externalId, { description: e.target.value })}
                placeholder="Control Description"
                rows={3}
              />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <DaisyLabel>Type</DaisyLabel>
                  <DaisySelect
                    value={control.type}
                    onChange={(e) => updateControl(control.externalId, { type: e.target.value as ControlType })}
                  >
                    {Object.values(ControlType).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </DaisySelect>
                </div>
                <div>
                  <DaisyLabel>Frequency</DaisyLabel>
                  <DaisyInput
                    value={control.frequency}
                    onChange={(e) => updateControl(control.externalId, { frequency: e.target.value })}
                  />
                </div>
                <div>
                  <DaisyLabel>Automation</DaisyLabel>
                  <DaisySelect
                    value={control.automationLevel}
                    onChange={(e) => updateControl(control.externalId, { automationLevel: e.target.value as AutomationLevel })}
                  >
                    {Object.values(AutomationLevel).map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </DaisySelect>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <DaisyButton size="sm" variant="outline" onClick={() => setEditingControlId(null)}>
                  Cancel
                </DaisyButton>
                <DaisyButton size="sm" onClick={() => setEditingControlId(null)}>
                  Save
                </DaisyButton>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium">{control.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">{control.description}</p>
                  <div className="flex gap-4 mt-2">
                    <DaisyBadge variant="outline">{control.type}</DaisyBadge>
                    <DaisyBadge variant="outline">{control.automationLevel}</DaisyBadge>
                    <span className="text-xs text-gray-500">
                      Frequency: {control.frequency}
                    </span>
                  </div>
                  {control.riskIds.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      Linked to {control.riskIds.length} risk(s)
                    </p>
                  )}
                </div>
                <DaisyButton
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingControlId(control.externalId)}
                >
                  <Edit className="h-4 w-4" />
                </DaisyButton>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (step === 'upload') {
    return (
      <DaisyCard>
        <DaisyCardHeader>
          <DaisyCardTitle>Import RCSA Data</DaisyCardTitle>
          <p>
            Upload an Excel file or paste your RCSA data to begin the analysis
          </p>
        </DaisyCardHeader>
        <DaisyCardBody>
          <DaisyTabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as 'file' | 'paste')}>
            <DaisyTabsList className="grid w-full grid-cols-2">
              <DaisyTabsTrigger value="file">Upload File</DaisyTabsTrigger>
              <DaisyTabsTrigger value="paste">Paste Data</DaisyTabsTrigger>
            </DaisyTabsList>
            
            <DaisyTabsContent value="file" className="mt-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300'
                }`}
              >
                <input {...getInputProps()} />
                <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600">
                  {isDragActive
                    ? 'Drop the Excel file here'
                    : 'Drag and drop an Excel file here, or click to select'}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Supports .xlsx and .xls files
                </p>
              </div>
            </DaisyTabsContent>
            
            <DaisyTabsContent value="paste" className="mt-4">
              <div className="space-y-4">
                <DaisyTextarea
                  placeholder="Paste your RCSA data here (tab or comma separated)"
                  value={pastedData}
                  onChange={(e) => setPastedData(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
                <DaisyButton onClick={handlePasteAnalysis} disabled={!pastedData.trim()}>
                  Analyze Data
                </DaisyButton>
              </div>
            </DaisyTabsContent>
          </DaisyTabs>
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

  if (step === 'review' && analysis) {
    return (
      <div className="space-y-6">
        {/* Overview Card */}
        <DaisyCard>
          <DaisyCardHeader>
            <DaisyCardTitle>RCSA Analysis Complete</DaisyCardTitle>
            <p>{analysis.overallAssessment}</p>
          </DaisyCardHeader>
          <DaisyCardBody>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{analysis.completenessScore}%</p>
                <p className="text-sm text-gray-500">Data Completeness</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{editedRisks.length}</p>
                <p className="text-sm text-gray-500">Risks Identified</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{editedControls.length}</p>
                <p className="text-sm text-gray-500">Controls Mapped</p>
              </div>
            </div>
          </DaisyCardBody>
        </DaisyCard>

        {/* Gap Analysis */}
        {(analysis.riskGaps.length > 0 || analysis.controlGaps.length > 0) && (
          <DaisyCard>
            <DaisyCardHeader>
              <DaisyCardTitle>Gap Analysis</DaisyCardTitle>
              <p>Issues identified in your RCSA data</p>
            
            <DaisyCardBody>
              <DaisyTabs defaultValue="risks">
                <DaisyTabsList>
                  <DaisyTabsTrigger value="risks">
                    Risk Gaps ({analysis.riskGaps.length})
                  </DaisyTabsTrigger>
                  <DaisyTabsTrigger value="controls">
                    Control Gaps ({analysis.controlGaps.length})
                  </DaisyTabsTrigger>
                </DaisyTabsList>
                
                <DaisyTabsContent value="risks" className="space-y-3 mt-4">
                  {analysis.riskGaps.map((gap, index) => (
                    <DaisyAlert key={index}>
                      <DaisyAlertCircle className="h-4 w-4" />
                      <p>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{gap.issue}</p>
                            <p className="text-sm text-gray-500 mt-1">{gap.recommendation}</p>
                            {gap.missingFields.length > 0 && (
                              <p className="text-xs text-gray-400 mt-1">
                                Missing: {gap.missingFields.join(', ')}
                              </p>
                            )}
                          </div>
                          <DaisyBadge variant={gap.severity === 'high' ? 'destructive' : gap.severity === 'medium' ? 'default' : 'secondary'}>
                            {gap.severity}
                          </DaisyBadge>
                        </div>
                      
                    </DaisyAlert>
                  ))}
                </DaisyTabsContent>
                
                <DaisyTabsContent value="controls" className="space-y-3 mt-4">
                  {analysis.controlGaps.map((gap, index) => (
                    <DaisyAlert key={index}>
                      <DaisyAlertCircle className="h-4 w-4" />
                      <p>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{gap.controlId}: {gap.issue}</p>
                            <p className="text-sm text-gray-500 mt-1">{gap.recommendation}</p>
                            {gap.missingFields.length > 0 && (
                              <p className="text-xs text-gray-400 mt-1">
                                Missing: {gap.missingFields.join(', ')}
                              </p>
                            )}
                          </div>
                          <DaisyBadge variant={gap.severity === 'high' ? 'destructive' : gap.severity === 'medium' ? 'default' : 'secondary'}>
                            {gap.severity}
                          </DaisyBadge>
                        </div>
                      
                    </DaisyAlert>
                  ))}
                </DaisyTabsContent>
              </DaisyTabs>
            </DaisyCardBody>
          </DaisyCard>
        )}

        {/* Risks Review */}
        <DaisyCard>
          <DaisyCardHeader>
            <DaisyCardTitle>Review Risks</DaisyCardTitle>
            <p>Edit risk details before importing</p>
          
          <DaisyCardBody>
            {editedRisks.length > 10 ? (
              <FixedSizeList
                height={400}
                itemCount={editedRisks.length}
                itemSize={editingRiskId ? 350 : 120}
                width="100%"
              >
                {RiskRow}
              </FixedSizeList>
            ) : (
              <div className="space-y-4">
                {editedRisks.map((_, index) => (
                  <RiskRow key={editedRisks[index].externalId} index={index} style={{}} />
                ))}
              </div>
            )}
          </DaisyCardBody>
        </DaisyCard>

        {/* Controls Review */}
        <DaisyCard>
          <DaisyCardHeader>
            <DaisyCardTitle>Review Controls</DaisyCardTitle>
            <p>Edit control details before importing</p>
          
          <DaisyCardBody>
            {editedControls.length > 10 ? (
              <FixedSizeList
                height={400}
                itemCount={editedControls.length}
                itemSize={editingControlId ? 350 : 140}
                width="100%"
              >
                {ControlRow}
              </FixedSizeList>
            ) : (
              <div className="space-y-4">
                {editedControls.map((_, index) => (
                  <ControlRow key={editedControls[index].externalId} index={index} style={{}} />
                ))}
              </div>
            )}
          </DaisyCardBody>
        </DaisyCard>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <DaisyButton variant="outline" onClick={() => setStep('upload')}>
            Start Over
          </DaisyButton>
          <DaisyButton onClick={handleImport}>
            Import to Database
          </DaisyButton>
        </div>
      </div>
    );
  }

  if (step === 'importing') {
    return (
      <DaisyCard>
        <DaisyCardBody className="py-12">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg font-medium">Importing RCSA Data...</p>
            <p className="text-sm text-gray-500">
              Creating risks and controls in the database
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
              Your RCSA data has been successfully imported
            </p>
            <div className="flex space-x-3 mt-4">
              <DaisyButton onClick={() => setStep('upload')}>
                Import More Data
              </DaisyButton>
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