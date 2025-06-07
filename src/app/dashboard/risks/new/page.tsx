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
import { ArrowLeft, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRisks } from '@/context/RiskContext';
import { ToastProvider, useToastHelpers } from '@/components/ui/toast-system';

// Enhanced Layout Components
import { 
  EnhancedPageContainer,
  EnhancedCardContainer 
} from '@/components/layout/enhanced-layout';
import { EnhancedHeading, EnhancedBodyText } from '@/components/ui/enhanced-typography';
import { spacingClasses } from '@/lib/design-system/spacing';

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
        category: formData.category,
        priority: formData.priority as 'low' | 'medium' | 'high' | 'critical',
        likelihood: parseInt(formData.likelihood),
        impact: parseInt(formData.impact),
        riskScore: parseInt(formData.likelihood) * parseInt(formData.impact),
        status: 'identified' as const,
        riskOwner: formData.riskOwner,
        department: formData.department,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        createdAt: new Date(),
        updatedAt: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
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
    <div className="min-h-screen bg-[#F5F1E9]">
      <EnhancedPageContainer className="max-w-4xl mx-auto">
        {/* Header */}
        <div className={cn(spacingClasses.padding.lg, "border-b border-[#E5E1D8]")}>
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-[#8B7355] hover:text-[#6B5B47] hover:bg-[#F0EBE3]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Risks
            </Button>
          </div>
          
          <EnhancedHeading 
            level={1} 
            className="text-[#2C1810] mb-2"
          >
            Create New Risk
          </EnhancedHeading>
          <EnhancedBodyText className="text-[#8B7355]">
            Add a new risk to your organization's risk register. Provide detailed information to ensure proper assessment and management.
          </EnhancedBodyText>
        </div>

        {/* Form Content */}
        <div className={spacingClasses.padding.section}>
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            onSubmit={handleSubmit}
            className="space-y-8"
          >
            {/* Basic Information */}
            <EnhancedCardContainer>
              <Card className="border-[#E5E1D8] bg-white/60 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-[#2C1810] text-lg font-medium">
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#5D4E37]">
                        Risk Title *
                      </label>
                      <Input
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Enter a clear, descriptive title"
                        className="border-[#D1C7B8] focus:border-[#8B7355] bg-white/80"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#5D4E37]">
                        Category *
                      </label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                        <SelectTrigger className="border-[#D1C7B8] focus:border-[#8B7355] bg-white/80">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#D1C7B8]">
                          <SelectItem value="operational">Operational</SelectItem>
                          <SelectItem value="financial">Financial</SelectItem>
                          <SelectItem value="strategic">Strategic</SelectItem>
                          <SelectItem value="compliance">Compliance</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="reputational">Reputational</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#5D4E37]">
                      Description *
                    </label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Provide a detailed description of the risk, including potential causes and consequences"
                      className="border-[#D1C7B8] focus:border-[#8B7355] bg-white/80 min-h-[120px]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#5D4E37]">
                        Risk Owner *
                      </label>
                      <Input
                        value={formData.riskOwner}
                        onChange={(e) => handleInputChange('riskOwner', e.target.value)}
                        placeholder="Assign responsible person"
                        className="border-[#D1C7B8] focus:border-[#8B7355] bg-white/80"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#5D4E37]">
                        Department
                      </label>
                      <Input
                        value={formData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        placeholder="Department or business unit"
                        className="border-[#D1C7B8] focus:border-[#8B7355] bg-white/80"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </EnhancedCardContainer>

            {/* Risk Assessment */}
            <EnhancedCardContainer>
              <Card className="border-[#E5E1D8] bg-white/60 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-[#2C1810] text-lg font-medium">
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#5D4E37]">
                        Priority Level
                      </label>
                      <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                        <SelectTrigger className="border-[#D1C7B8] focus:border-[#8B7355] bg-white/80">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#D1C7B8]">
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#5D4E37]">
                        Likelihood (1-5)
                      </label>
                      <Select value={formData.likelihood} onValueChange={(value) => handleInputChange('likelihood', value)}>
                        <SelectTrigger className="border-[#D1C7B8] focus:border-[#8B7355] bg-white/80">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#D1C7B8]">
                          <SelectItem value="1">1 - Very Unlikely</SelectItem>
                          <SelectItem value="2">2 - Unlikely</SelectItem>
                          <SelectItem value="3">3 - Possible</SelectItem>
                          <SelectItem value="4">4 - Likely</SelectItem>
                          <SelectItem value="5">5 - Almost Certain</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#5D4E37]">
                        Impact (1-5)
                      </label>
                      <Select value={formData.impact} onValueChange={(value) => handleInputChange('impact', value)}>
                        <SelectTrigger className="border-[#D1C7B8] focus:border-[#8B7355] bg-white/80">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#D1C7B8]">
                          <SelectItem value="1">1 - Insignificant</SelectItem>
                          <SelectItem value="2">2 - Minor</SelectItem>
                          <SelectItem value="3">3 - Moderate</SelectItem>
                          <SelectItem value="4">4 - Major</SelectItem>
                          <SelectItem value="5">5 - Severe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="p-4 bg-[#F0EBE3] rounded-lg border border-[#E5E1D8]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#5D4E37]">
                        Calculated Risk Score:
                      </span>
                      <Badge 
                        variant={parseInt(formData.likelihood) * parseInt(formData.impact) >= 15 ? 'destructive' : 
                               parseInt(formData.likelihood) * parseInt(formData.impact) >= 9 ? 'default' : 'secondary'}
                        className="text-lg font-semibold px-3 py-1"
                      >
                        {parseInt(formData.likelihood) * parseInt(formData.impact)}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#5D4E37]">
                      Tags (comma-separated)
                    </label>
                    <Input
                      value={formData.tags}
                      onChange={(e) => handleInputChange('tags', e.target.value)}
                      placeholder="e.g. cybersecurity, data-breach, compliance"
                      className="border-[#D1C7B8] focus:border-[#8B7355] bg-white/80"
                    />
                  </div>
                </CardContent>
              </Card>
            </EnhancedCardContainer>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-[#E5E1D8]">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="border-[#D1C7B8] text-[#8B7355] hover:bg-[#F0EBE3]"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !formData.title || !formData.description || !formData.category || !formData.riskOwner}
                className="bg-[#8B7355] hover:bg-[#6B5B47] text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Creating...' : 'Create Risk'}
              </Button>
            </div>
          </motion.form>
        </div>
      </EnhancedPageContainer>
    </div>
  );
}

// Main export component - bypasses dashboard layout
export default function NewRiskPage() {
  return (
    <ProtectedRoute>
      <ToastProvider>
        <NewRiskForm />
      </ToastProvider>
    </ProtectedRoute>
  );
} 