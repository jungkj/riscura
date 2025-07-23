'use client';

import React, { useState, useEffect } from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  Shield, 
  FileText, 
  TrendingUp,
  Activity,
  Users,
  Calendar,
  BarChart
} from 'lucide-react';

interface DashboardStats {
  totalRisks: number;
  highRisks: number;
  complianceScore: number;
  activeControls: number;
  pendingActions: number;
}

export default function DaisyDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalRisks: 47,
    highRisks: 12,
    complianceScore: 94,
    activeControls: 124,
    pendingActions: 8
  });
  const [loading, setLoading] = useState(false);

  const statsCards = [
    { 
      label: 'Total Risks', 
      value: stats.totalRisks, 
      icon: AlertTriangle, 
      change: '+12%', 
      color: 'warning',
      onClick: () => router.push('/dashboard/risks')
    },
    { 
      label: 'Active Controls', 
      value: stats.activeControls, 
      icon: Shield, 
      change: '+5%', 
      color: 'success',
      onClick: () => router.push('/dashboard/controls')
    },
    { 
      label: 'Compliance Score', 
      value: `${stats.complianceScore}%`, 
      icon: TrendingUp, 
      change: '+2%', 
      color: 'primary',
      onClick: () => router.push('/dashboard/compliance')
    },
    { 
      label: 'Pending Actions', 
      value: stats.pendingActions, 
      icon: FileText, 
      change: '-3', 
      color: 'info',
      onClick: () => router.push('/dashboard/actions')
    },
  ];

  const recentRisks = [
    { id: 'R001', title: 'Data Breach Risk', category: 'Cybersecurity', severity: 'high', status: 'open' },
    { id: 'R002', title: 'Compliance Violation', category: 'Regulatory', severity: 'medium', status: 'mitigating' },
    { id: 'R003', title: 'Third-party Vendor Risk', category: 'Operational', severity: 'low', status: 'monitoring' },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'ghost';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'error';
      case 'mitigating': return 'warning';
      case 'monitoring': return 'info';
      default: return 'ghost';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-base-content/70 mt-1">
            Welcome back! Here\'s your risk management overview.
          </p>
        </div>
        <DaisyBadge variant="secondary">Live</DaisyBadge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <DaisyCard 
              key={stat.label} 
              compact 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={stat.onClick}
            >
              <DaisyCardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-base-content/70">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <p className={`text-sm mt-1 text-${stat.color}`}>
                      {stat.change} from last month
                    </p>
                  </div>
                  <div className={`avatar placeholder`}>
                    <div className={`bg-${stat.color}/20 text-${stat.color} rounded-full w-12`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </div>
              </DaisyCardBody>
            </DaisyCard>
          );
        })}
      </div>

      {/* Recent Risks and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DaisyCard>
          <DaisyCardBody>
            <DaisyCardTitle>Recent Risks</DaisyCardTitle>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Severity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRisks.map((risk) => (
                    <tr key={risk.id} className="hover">
                      <td>{risk.id}</td>
                      <td>{risk.title}</td>
                      <td>{risk.category}</td>
                      <td>
                        <DaisyBadge variant={getSeverityColor(risk.severity)} size="sm">
                          {risk.severity}
                        </DaisyBadge>
                      </td>
                      <td>
                        <DaisyBadge variant={getStatusColor(risk.status)} size="sm" outline>
                          {risk.status}
                        </DaisyBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card-actions mt-4">
              <DaisyButton variant="primary" size="sm" onClick={() => router.push('/dashboard/risks')}>
                View All Risks
              </DaisyButton>
            </div>
          </DaisyCardBody>
        </DaisyCard>

        <DaisyCard>
          <DaisyCardBody>
            <DaisyCardTitle>Recent Activity</DaisyCardTitle>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="avatar placeholder">
                  <div className="bg-info/20 text-info rounded-full w-8">
                    <Activity className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New risk assessment completed</p>
                  <p className="text-xs text-base-content/70">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="avatar placeholder">
                  <div className="bg-success/20 text-success rounded-full w-8">
                    <Shield className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Control effectiveness updated</p>
                  <p className="text-xs text-base-content/70">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="avatar placeholder">
                  <div className="bg-warning/20 text-warning rounded-full w-8">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Team member added to project</p>
                  <p className="text-xs text-base-content/70">1 day ago</p>
                </div>
              </div>
            </div>
          </DaisyCardBody>
        </DaisyCard>
      </div>

      {/* Quick Actions */}
      <DaisyCard>
        <DaisyCardBody>
          <DaisyCardTitle>Quick Actions</DaisyCardTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DaisyButton variant="outline" onClick={() => router.push('/dashboard/risks/new')}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Create New Risk
            </DaisyButton>
            <DaisyButton variant="outline" onClick={() => router.push('/dashboard/controls/new')}>
              <Shield className="h-4 w-4 mr-2" />
              Add Control
            </DaisyButton>
            <DaisyButton variant="outline" onClick={() => router.push('/dashboard/documents/upload')}>
              <FileText className="h-4 w-4 mr-2" />
              Upload Document
            </DaisyButton>
          </div>
        </DaisyCardBody>
      </DaisyCard>

      {/* Empty State Example */}
      {stats.totalRisks === 0 && (
        <DaisyAlert variant="info">
          <div>
            <h3 className="font-bold">No risks identified yet</h3>
            <div className="text-xs">Start by creating your first risk assessment to get insights.</div>
          </div>
          <DaisyButton size="sm" variant="primary" onClick={() => router.push('/dashboard/risks/new')}>
            Create First Risk
          </DaisyButton>
        </DaisyAlert>
      )}
    </div>
  );
}