'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Search, 
  Edit2, 
  AlertTriangle,
  Calendar,
  User,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock
} from 'lucide-react';

interface Risk {
  id: string;
  title: string;
  category: string;
  status: string;
  riskScore: string;
  owner: string;
  lastUpdated: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export default function UpdateRiskAssessmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);

  useEffect(() => {
    fetchRisks();
  }, []);

  const fetchRisks = async () => {
    try {
      const response = await fetch('/api/risks');
      if (!response.ok) throw new Error('Failed to fetch risks');
      
      const data = await response.json();
      setRisks(data.data || []);
    } catch (error) {
      console.error('Failed to fetch risks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load risks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRisks = risks.filter(risk =>
    risk.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    risk.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    risk.owner.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRiskSelect = (riskId: string) => {
    setSelectedRisk(riskId);
    // Navigate to the edit page for the specific risk
    router.push(`/dashboard/risks/${riskId}/edit`);
  };

  const getRiskScoreColor = (score: string) => {
    switch (score.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-green-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <DaisyButton
              variant="ghost"
              onClick={() => router.push('/dashboard/quick-actions')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quick Actions
            </DaisyButton>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Update Risk Assessment</h1>
                <p className="text-gray-600 mt-1">Review and update existing risk assessments</p>
              </div>
              <DaisyBadge variant="outline" className="text-sm">
                <Clock className="h-4 w-4 mr-1" />
                10-15 min
              </DaisyBadge>
            </div>
          </div>

          {/* Search Bar */}
          <DaisyCard className="mb-6">
            <DaisyCardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <DaisyInput
                  placeholder="Search risks by title, category, or owner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </DaisyCardBody>
          </DaisyCard>

          {/* Risk List */}
          {loading ? (
            <DaisyCard>
              <DaisyCardContent className="p-12 text-center">
                <p className="text-gray-500">Loading risks...</p>
              </DaisyCardBody>
            </DaisyCard>
          ) : filteredRisks.length === 0 ? (
            <DaisyCard>
              <DaisyCardContent className="p-12 text-center">
                <DaisyAlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery ? 'No risks found' : 'No risks to update'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search criteria' 
                    : 'Create your first risk assessment to get started'}
                </p>
                {!searchQuery && (
                  <DaisyButton
                    onClick={() => router.push('/dashboard/workflows/risk-assessment/new')}
                  >
                    Create New Risk
                  </DaisyButton>
                )}
              </DaisyCardBody>
            </DaisyCard>
          ) : (
            <div className="grid gap-4">
              {filteredRisks.map((risk) => (
                <DaisyCard
                  key={risk.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleRiskSelect(risk.id)}
                >
                  <DaisyCardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {risk.title}
                          </h3>
                          <DaisyBadge className={getRiskScoreColor(risk.riskScore)}>
                            {risk.riskScore.toUpperCase()}
                          </DaisyBadge>
                          <DaisyBadge variant="outline">
                            {risk.category}
                          </DaisyBadge>
                          {getTrendIcon(risk.trend)}
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{risk.owner}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Last updated: {risk.lastUpdated}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DaisyBadge variant={risk.status === 'active' ? 'default' : 'secondary'}>
                              {risk.status}
                            </DaisyBadge>
                          </div>
                        </div>
                      </div>
                      
                      <DaisyButton variant="outline" size="sm">
                        <Edit2 className="h-4 w-4 mr-2" />
                        Update
                      </DaisyButton>
                    </div>
                  </DaisyCardBody>
                </DaisyCard>
              ))}
            </div>
          )}

          {/* Quick Stats */}
          {!loading && risks.length > 0 && (
            <DaisyCard className="mt-6">
              <DaisyCardHeader>
                <DaisyCardTitle className="text-lg">Quick Overview</DaisyCardTitle>
              
              <DaisyCardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{risks.length}</p>
                    <p className="text-sm text-gray-600">Total Risks</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {risks.filter(r => r.riskScore.toLowerCase() === 'critical' || r.riskScore.toLowerCase() === 'high').length}
                    </p>
                    <p className="text-sm text-gray-600">High/Critical Risks</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {risks.filter(r => r.trend === 'increasing').length}
                    </p>
                    <p className="text-sm text-gray-600">Increasing Trend</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {risks.filter(r => {
                        const lastUpdate = new Date(r.lastUpdated);
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        return lastUpdate < thirtyDaysAgo;
                      }).length}
                    </p>
                    <p className="text-sm text-gray-600">Need Review (&gt;30 days)</p>
                  </div>
                </div>
              </DaisyCardBody>
            </DaisyCard>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}