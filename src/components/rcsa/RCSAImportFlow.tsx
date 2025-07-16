'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Edit, Save, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
        const base64 = e.target?.result?.toString().split(',')[1];
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
              <Input
                value={risk.title}
                onChange={(e) => updateRisk(risk.externalId, { title: e.target.value })}
                placeholder="Risk Title"
              />
              <Textarea
                value={risk.description}
                onChange={(e) => updateRisk(risk.externalId, { description: e.target.value })}
                placeholder="Risk Description"
                rows={3}
              />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select
                    value={risk.category}
                    onValueChange={(v) => updateRisk(risk.externalId, { category: v as RiskCategory })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(RiskCategory).map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Likelihood (1-5)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={risk.likelihood}
                    onChange={(e) => updateRisk(risk.externalId, { likelihood: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Impact (1-5)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={risk.impact}
                    onChange={(e) => updateRisk(risk.externalId, { impact: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button size="sm" variant="outline" onClick={() => setEditingRiskId(null)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={() => setEditingRiskId(null)}>
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium">{risk.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">{risk.description}</p>
                  <div className="flex gap-4 mt-2">
                    <Badge variant="outline">{risk.category}</Badge>
                    <span className="text-xs text-gray-500">
                      Likelihood: {risk.likelihood} | Impact: {risk.impact} | Score: {risk.likelihood * risk.impact}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingRiskId(risk.externalId)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
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
              <Input
                value={control.title}
                onChange={(e) => updateControl(control.externalId, { title: e.target.value })}
                placeholder="Control Title"
              />
              <Textarea
                value={control.description}
                onChange={(e) => updateControl(control.externalId, { description: e.target.value })}
                placeholder="Control Description"
                rows={3}
              />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={control.type}
                    onValueChange={(v) => updateControl(control.externalId, { type: v as ControlType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ControlType).map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Frequency</Label>
                  <Input
                    value={control.frequency}
                    onChange={(e) => updateControl(control.externalId, { frequency: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Automation</Label>
                  <Select
                    value={control.automationLevel}
                    onValueChange={(v) => updateControl(control.externalId, { automationLevel: v as AutomationLevel })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(AutomationLevel).map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button size="sm" variant="outline" onClick={() => setEditingControlId(null)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={() => setEditingControlId(null)}>
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium">{control.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">{control.description}</p>
                  <div className="flex gap-4 mt-2">
                    <Badge variant="outline">{control.type}</Badge>
                    <Badge variant="outline">{control.automationLevel}</Badge>
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
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingControlId(control.externalId)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (step === 'upload') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import RCSA Data</CardTitle>
          <CardDescription>
            Upload an Excel file or paste your RCSA data to begin the analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as 'file' | 'paste')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file">Upload File</TabsTrigger>
              <TabsTrigger value="paste">Paste Data</TabsTrigger>
            </TabsList>
            
            <TabsContent value="file" className="mt-4">
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
            </TabsContent>
            
            <TabsContent value="paste" className="mt-4">
              <div className="space-y-4">
                <Textarea
                  placeholder="Paste your RCSA data here (tab or comma separated)"
                  value={pastedData}
                  onChange={(e) => setPastedData(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
                <Button onClick={handlePasteAnalysis} disabled={!pastedData.trim()}>
                  Analyze Data
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  }

  if (step === 'analyzing') {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg font-medium">Analyzing RCSA Data...</p>
            <p className="text-sm text-gray-500">
              Our AI is reviewing your data and performing gap analysis
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'review' && analysis) {
    return (
      <div className="space-y-6">
        {/* Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle>RCSA Analysis Complete</CardTitle>
            <CardDescription>{analysis.overallAssessment}</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Gap Analysis */}
        {(analysis.riskGaps.length > 0 || analysis.controlGaps.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Gap Analysis</CardTitle>
              <CardDescription>Issues identified in your RCSA data</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="risks">
                <TabsList>
                  <TabsTrigger value="risks">
                    Risk Gaps ({analysis.riskGaps.length})
                  </TabsTrigger>
                  <TabsTrigger value="controls">
                    Control Gaps ({analysis.controlGaps.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="risks" className="space-y-3 mt-4">
                  {analysis.riskGaps.map((gap, index) => (
                    <Alert key={index}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
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
                          <Badge variant={gap.severity === 'high' ? 'destructive' : gap.severity === 'medium' ? 'default' : 'secondary'}>
                            {gap.severity}
                          </Badge>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </TabsContent>
                
                <TabsContent value="controls" className="space-y-3 mt-4">
                  {analysis.controlGaps.map((gap, index) => (
                    <Alert key={index}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
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
                          <Badge variant={gap.severity === 'high' ? 'destructive' : gap.severity === 'medium' ? 'default' : 'secondary'}>
                            {gap.severity}
                          </Badge>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Risks Review */}
        <Card>
          <CardHeader>
            <CardTitle>Review Risks</CardTitle>
            <CardDescription>Edit risk details before importing</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Controls Review */}
        <Card>
          <CardHeader>
            <CardTitle>Review Controls</CardTitle>
            <CardDescription>Edit control details before importing</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep('upload')}>
            Start Over
          </Button>
          <Button onClick={handleImport}>
            Import to Database
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'importing') {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg font-medium">Importing RCSA Data...</p>
            <p className="text-sm text-gray-500">
              Creating risks and controls in the database
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'complete') {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-lg font-medium">Import Complete!</p>
            <p className="text-sm text-gray-500">
              Your RCSA data has been successfully imported
            </p>
            <div className="flex space-x-3 mt-4">
              <Button onClick={() => setStep('upload')}>
                Import More Data
              </Button>
              <Button variant="outline" onClick={onComplete}>
                View Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}