import { useState } from 'react';
import { Risk } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

export default function RiskListPage() {
  const [risks] = useState<Risk[]>([
    {
      id: 'risk-1',
      title: 'Data Breach Risk',
      description: 'Risk of unauthorized access to sensitive customer data',
      category: 'technology',
      likelihood: 3,
      impact: 5,
      riskScore: 15,
      riskLevel: 'high',
      owner: 'admin',
      status: 'identified',
      controls: ['control-1', 'control-2'],
      evidence: [],
      createdAt: new Date('2024-01-15').toISOString(),
      updatedAt: new Date('2024-01-20').toISOString(),
      dateIdentified: new Date('2024-01-15'),
    },
    {
      id: 'risk-2',
      title: 'Process Failure Risk',
      description: 'Risk of process failures leading to service disruption',
      category: 'operational',
      likelihood: 2,
      impact: 3,
      riskScore: 6,
      riskLevel: 'medium',
      owner: 'manager',
      status: 'assessed',
      controls: ['control-3'],
      evidence: [],
      createdAt: new Date('2024-01-20').toISOString(),
      updatedAt: new Date('2024-01-25').toISOString(),
      dateIdentified: new Date('2024-01-20'),
    },
    {
      id: 'risk-3',
      title: 'Compliance Risk',
      description: 'Risk of regulatory non-compliance',
      category: 'compliance',
      likelihood: 1,
      impact: 4,
      riskScore: 4,
      riskLevel: 'low',
      owner: 'admin',
      status: 'mitigated',
      controls: ['control-4'],
      evidence: [],
      createdAt: new Date('2024-01-10').toISOString(),
      updatedAt: new Date('2024-01-30').toISOString(),
      dateIdentified: new Date('2024-01-10'),
    },
  ]);

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'identified': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'assessed': return <Shield className="h-4 w-4 text-blue-500" />;
      case 'mitigated': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

     const stats = {
     total: risks.length,
     high: risks.filter(r => r.riskLevel === 'high').length,
     medium: risks.filter(r => r.riskLevel === 'medium').length,
     low: risks.filter(r => r.riskLevel === 'low').length,
   };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Risk Management</h1>
          <p className="text-muted-foreground mt-1">Manage and track organizational risks</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Risk
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Risks</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold text-red-600">{stats.high}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Medium Risk</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.medium}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Risk</p>
                <p className="text-2xl font-bold text-green-600">{stats.low}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk List */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Register</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {risks.map((risk) => (
              <div
                key={risk.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(risk.status)}
                  <div>
                    <h3 className="font-semibold text-foreground">{risk.title}</h3>
                    <p className="text-sm text-muted-foreground">{risk.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {risk.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Score: {risk.riskScore}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                                     <Badge className={getRiskLevelColor(risk.riskLevel || 'low')}>
                     {(risk.riskLevel || 'low').toUpperCase()}
                  </Badge>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}