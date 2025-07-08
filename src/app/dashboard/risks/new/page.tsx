'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, X, Shield, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRisks } from '@/context/RiskContext';
import { ToastProvider, useToastHelpers } from '@/components/ui/toast-system';
import type { Document } from '@/types';

// Internal component that uses toast hooks
function NewRiskForm() {
  const router = useRouter();
  const { createRisk } = useRisks();
  const { success, error } = useToastHelpers();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    likelihood: '3',
    impact: '3',
    riskOwner: '',
    department: '',
    tags: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const riskData = {
        title: formData.title,
        description: formData.description,
        category: formData.category as 'OPERATIONAL' | 'FINANCIAL' | 'STRATEGIC' | 'COMPLIANCE' | 'TECHNOLOGY',
        likelihood: parseInt(formData.likelihood),
        impact: parseInt(formData.impact),
        status: 'identified' as const,
        owner: formData.riskOwner,
        controls: [] as string[],
        evidence: [] as Document[],
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      };

      await createRisk(riskData);
      success('Risk created successfully!');
      router.push('/dashboard/risks');
    } catch (err) {
      error('Failed to create risk. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/risks');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Modern Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Risks
              </Button>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">Create New Risk</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="border-gray-200 text-gray-600 hover:bg-gray-50"
                disabled={isLoading}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                form="risk-form"
                disabled={isLoading || !formData.title || !formData.description || !formData.category}
                className="bg-[#199BEC] hover:bg-[#0f7dc7] text-white shadow-sm"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Creating...' : 'Create Risk'}
              </Button>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mt-2">
            Add a new risk to your organization's risk register. Provide detailed information to ensure proper assessment and management.
          </p>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <motion.form
          id="risk-form"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          {/* Basic Information */}
          <Card className="border-gray-200/60 bg-white/70 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-gray-900 text-lg font-semibold">
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Risk Title *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter a clear, descriptive title"
                    className="border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white rounded-lg"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Category *
                  </label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger className="border-gray-200 focus:border-blue-500 bg-white rounded-lg">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 rounded-lg shadow-lg">
                      <SelectItem value="OPERATIONAL">Operational</SelectItem>
                      <SelectItem value="FINANCIAL">Financial</SelectItem>
                      <SelectItem value="STRATEGIC">Strategic</SelectItem>
                      <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                      <SelectItem value="TECHNOLOGY">Technology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Description *
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Provide a detailed description of the risk, including potential causes and consequences"
                  className="border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white rounded-lg min-h-[120px]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Risk Owner *
                  </label>
                  <Input
                    value={formData.riskOwner}
                    onChange={(e) => handleInputChange('riskOwner', e.target.value)}
                    placeholder="Assign responsible person"
                    className="border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white rounded-lg"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <Input
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    placeholder="Department or business unit"
                    className="border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white rounded-lg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Assessment */}
          <Card className="border-gray-200/60 bg-white/70 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-gray-900 text-lg font-semibold">
                Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Likelihood (1-5)
                  </label>
                  <Select value={formData.likelihood} onValueChange={(value) => handleInputChange('likelihood', value)}>
                    <SelectTrigger className="border-gray-200 focus:border-blue-500 bg-white rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 rounded-lg shadow-lg">
                      <SelectItem value="1">1 - Very Low</SelectItem>
                      <SelectItem value="2">2 - Low</SelectItem>
                      <SelectItem value="3">3 - Medium</SelectItem>
                      <SelectItem value="4">4 - High</SelectItem>
                      <SelectItem value="5">5 - Very High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Impact (1-5)
                  </label>
                  <Select value={formData.impact} onValueChange={(value) => handleInputChange('impact', value)}>
                    <SelectTrigger className="border-gray-200 focus:border-blue-500 bg-white rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 rounded-lg shadow-lg">
                      <SelectItem value="1">1 - Very Low</SelectItem>
                      <SelectItem value="2">2 - Low</SelectItem>
                      <SelectItem value="3">3 - Medium</SelectItem>
                      <SelectItem value="4">4 - High</SelectItem>
                      <SelectItem value="5">5 - Very High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Risk Score
                  </label>
                  <div className="h-10 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 flex items-center">
                    <Badge 
                      variant={
                        parseInt(formData.likelihood) * parseInt(formData.impact) >= 15 ? 'destructive' :
                        parseInt(formData.likelihood) * parseInt(formData.impact) >= 9 ? 'secondary' :
                        'default'
                      }
                      className="font-medium"
                    >
                      {parseInt(formData.likelihood) * parseInt(formData.impact)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Priority
                </label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                  <SelectTrigger className="border-gray-200 focus:border-blue-500 bg-white rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 rounded-lg shadow-lg">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="border-gray-200/60 bg-white/70 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-gray-900 text-lg font-semibold">
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Tags
                </label>
                <Input
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="Enter tags separated by commas (e.g., cybersecurity, data breach, financial)"
                  className="border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white rounded-lg"
                />
                <p className="text-xs text-gray-500">
                  Tags help categorize and search for risks. Use relevant keywords separated by commas.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.form>
      </div>
    </div>
  );
}

export default function NewRiskPage() {
  return (
    <ProtectedRoute>
      <ToastProvider>
        <NewRiskForm />
      </ToastProvider>
    </ProtectedRoute>
  );
} 