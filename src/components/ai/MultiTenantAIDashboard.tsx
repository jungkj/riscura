import React, { useState, useEffect } from 'react';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, AreaChart 
} from 'recharts';
import {
  Building2,
  Users,
  Settings,
  CreditCard,
  BarChart3,
  Shield,
  Palette,
  Plus,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity
} from 'lucide-react';

import { multiTenantAIService } from '@/services/MultiTenantAIService';
import type { 
  Tenant, 
  TenantAnalytics, 
  TenantBilling,
  TenantSubscription,
  TenantStatus 
} from '@/types/multi-tenant-ai.types';

interface MultiTenantAIDashboardProps {
  currentTenantId?: string;
  userRole: 'admin' | 'tenant_admin' | 'user';
}

export const MultiTenantAIDashboard: React.FC<MultiTenantAIDashboardProps> = ({
  currentTenantId,
  userRole = 'admin'
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [analytics, setAnalytics] = useState<TenantAnalytics | null>(null);
  const [billing, setBilling] = useState<TenantBilling | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load tenants on component mount
  useEffect(() => {
    loadTenants();
  }, []);

  // Load tenant-specific data when tenant is selected
  useEffect(() => {
    if (selectedTenant) {
      loadTenantData(selectedTenant.id);
    }
  }, [selectedTenant]);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const allTenants = await multiTenantAIService.getAllTenants();
      setTenants(allTenants);
      
      // If currentTenantId is provided, select that tenant
      if (currentTenantId) {
        const currentTenant = allTenants.find(t => t.id === currentTenantId);
        if (currentTenant) {
          setSelectedTenant(currentTenant);
        }
      } else if (allTenants.length > 0) {
        setSelectedTenant(allTenants[0]);
      }
    } catch (err) {
      setError('Failed to load tenants');
      console.error('Error loading tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTenantData = async (tenantId: string) => {
    try {
      setLoading(true);
      const currentPeriod = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
        status: 'current' as const
      };
      
      const [analyticsData, billingData] = await Promise.all([
        multiTenantAIService.getTenantAnalytics(tenantId, currentPeriod),
        multiTenantAIService.getTenantBilling(tenantId, currentPeriod)
      ]);
      
      setAnalytics(analyticsData);
      setBilling(billingData);
    } catch (err) {
      setError('Failed to load tenant data');
      console.error('Error loading tenant data:', err);
    } finally {
      setLoading(false);
    }
  };

  const createNewTenant = async () => {
    try {
      const defaultSubscription: TenantSubscription = {
        plan: {
          id: 'starter',
          name: 'Starter Plan',
          description: 'Basic AI capabilities',
          price: 99,
          currency: 'USD',
          billingCycle: 'monthly',
          features: ['ai_assistant', 'basic_analytics'],
          limits: {
            maxUsers: 10,
            maxAIQueries: 1000,
            maxModels: 2,
            maxKnowledgeBases: 1,
            maxDocuments: 100,
            maxStorage: 5,
            maxAPIRequests: 5000,
            maxCustomBranding: false,
            maxIntegrations: 2
          }
        },
        tier: 'starter',
        status: 'active',
        limits: {
          maxUsers: 10,
          maxAIQueries: 1000,
          maxModels: 2,
          maxKnowledgeBases: 1,
          maxDocuments: 100,
          maxStorage: 5,
          maxAPIRequests: 5000,
          maxCustomBranding: false,
          maxIntegrations: 2
        },
        features: {
          customModels: false,
          knowledgeBase: true,
          advancedAnalytics: false,
          customBranding: false,
          apiAccess: true,
          ssoIntegration: false,
          auditLogs: false,
          prioritySupport: false,
          customIntegrations: false,
          whiteLabeling: false
        },
        billing: {
          billingEmail: 'billing@example.com',
          billingAddress: {
            street: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            country: 'US',
            postalCode: '94105'
          },
          paymentMethod: {
            id: 'pm_default',
            type: 'credit_card',
            details: {},
            isDefault: true,
            isValid: true
          },
          taxInformation: {
            taxRate: 0.0875,
            taxExempt: false
          }
        },
        startDate: new Date(),
        autoRenew: true
      };

      const newTenant = await multiTenantAIService.createTenant(
        'New Organization',
        'new-org.com',
        defaultSubscription
      );
      
      setTenants([...tenants, newTenant]);
      setSelectedTenant(newTenant);
    } catch (err) {
      setError('Failed to create tenant');
      console.error('Error creating tenant:', err);
    }
  };

  const getStatusColor = (status: TenantStatus): string => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'trial': return 'bg-blue-500';
      case 'suspended': return 'bg-red-500';
      case 'inactive': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  if (loading && tenants.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading multi-tenant dashboard...</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Multi-Tenant AI Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage AI tenants, monitor usage, and configure isolation
          </p>
        </div>
        {userRole === 'admin' && (
          <DaisyButton onClick={createNewTenant} className="flex items-center gap-2" >
  <Plus className="w-4 h-4" />
</DaisyButton>
            Create Tenant
          </DaisyButton>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <DaisyAlertTriangle className="w-5 h-5 text-red-600" >
  <p className="text-red-800">
</DaisyAlertTriangle>{error}</p>
            <DaisyButton 
              variant="ghost" 
              size="sm" 
              onClick={() => setError(null)}
              className="ml-auto" />
              ×
            </DaisyButton>
          </div>
        </div>
      )}

      {/* Tenant Selector */}
      <DaisyCard >
  <DaisyCardBody />
</DaisyCard>
          <DaisyCardTitle className="flex items-center gap-2" >
  <Building2 className="w-5 h-5" />
</DaisyCardTitle>
            Tenant Selection
          </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
</DaisyCardBody>
            {tenants.map((tenant) => (
              <div
                key={tenant.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedTenant?.id === tenant.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedTenant(tenant)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{tenant.name}</h3>
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(tenant.status)}`}></div>
                </div>
                <p className="text-sm text-gray-600 mb-1">{tenant.domain}</p>
                <p className="text-xs text-gray-500">{tenant.subscription.tier}</p>
                <DaisyBadge variant={tenant.status === 'active' ? 'default' : 'secondary'} className="mt-2" >
  {tenant.status}
</DaisyBadge>
                </DaisyBadge>
              </div>
            ))}
          </div>
        </DaisyCardBody>
      </DaisyCard>

      {selectedTenant && (
        <DaisyTabs value={activeTab} onValueChange={setActiveTab} />
          <DaisyTabsList className="grid w-full grid-cols-7" />
            <DaisyTabsTrigger value="overview" className="flex items-center gap-2" />
              <BarChart3 className="w-4 h-4" />
              Overview
            </DaisyTabs>
            <DaisyTabsTrigger value="analytics" className="flex items-center gap-2" />
              <Activity className="w-4 h-4" />
              Analytics
            </DaisyTabsTrigger>
            <DaisyTabsTrigger value="billing" className="flex items-center gap-2" />
              <CreditCard className="w-4 h-4" />
              Billing
            </DaisyTabsTrigger>
            <DaisyTabsTrigger value="isolation" className="flex items-center gap-2" />
              <Shield className="w-4 h-4" />
              Isolation
            </DaisyTabsTrigger>
            <DaisyTabsTrigger value="branding" className="flex items-center gap-2" />
              <Palette className="w-4 h-4" />
              Branding
            </DaisyTabsTrigger>
            <DaisyTabsTrigger value="users" className="flex items-center gap-2" />
              <Users className="w-4 h-4" />
              Users
            </DaisyTabsTrigger>
            <DaisyTabsTrigger value="settings" className="flex items-center gap-2" />
              <Settings className="w-4 h-4" />
              Settings
            </DaisyTabsTrigger>
          </DaisyTabsList>

          {/* Overview Tab */}
          <DaisyTabsContent value="overview" />
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DaisyCard >
  <DaisyCardBody className="p-6" >
  </DaisyTabsContent>
</DaisyCardBody>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">AI Queries</p>
                        <p className="text-2xl font-bold">
                          {analytics?.usage.aiQueries.totalQueries || 0}
                        </p>
                      </div>
                      <Activity className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-green-600">+12%</span>
                      <span className="text-gray-600 ml-1">vs last month</span>
                    </div>
                  </DaisyCardBody>
                </DaisyCard>

                <DaisyCard >
  <DaisyCardBody className="p-6" >
  </DaisyCard>
</DaisyCardBody>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Users</p>
                        <p className="text-2xl font-bold">
                          {analytics?.users.activeUsers || 0}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-green-600">+5%</span>
                      <span className="text-gray-600 ml-1">vs last month</span>
                    </div>
                  </DaisyCardBody>
                </DaisyCard>

                <DaisyCard >
  <DaisyCardBody className="p-6" >
  </DaisyCard>
</DaisyCardBody>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Monthly Cost</p>
                        <p className="text-2xl font-bold">
                          {billing ? formatCurrency(billing.costs.total, billing.costs.currency) : '$0'}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-yellow-600" />
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                      <span className="text-red-600">-3%</span>
                      <span className="text-gray-600 ml-1">vs last month</span>
                    </div>
                  </DaisyCardBody>
                </DaisyCard>

                <DaisyCard >
  <DaisyCardBody className="p-6" >
  </DaisyCard>
</DaisyCardBody>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Response Time</p>
                        <p className="text-2xl font-bold">
                          {analytics?.usage.aiQueries.averageResponseTime || 0}ms
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-[#191919]" />
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <TrendingDown className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-green-600">-8%</span>
                      <span className="text-gray-600 ml-1">improved</span>
                    </div>
                  </DaisyCardBody>
                </DaisyCard>
              </div>

              {/* Tenant Information */}
              <DaisyCard >
  <DaisyCardBody />
</DaisyCard>
                  <DaisyCardTitle>Tenant Information</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
</DaisyCardBody>
                    <div className="space-y-4">
                      <div>
                        <DaisyLabel className="text-sm font-medium">Organization Name</DaisyLabel>
                        <p className="text-lg">{selectedTenant.name}</p>
                      </div>
                      <div>
                        <DaisyLabel className="text-sm font-medium">Domain</DaisyLabel>
                        <p className="text-lg">{selectedTenant.domain}</p>
                      </div>
                      <div>
                        <DaisyLabel className="text-sm font-medium">Subdomain</DaisyLabel>
                        <p className="text-lg">{selectedTenant.subdomain}</p>
                      </div>
                      <div>
                        <DaisyLabel className="text-sm font-medium">Status</DaisyLabel>
                        <DaisyBadge variant={selectedTenant.status === 'active' ? 'default' : 'secondary'} >
  {selectedTenant.status}
</DaisyBadge>
                        </DaisyBadge>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <DaisyLabel className="text-sm font-medium">Subscription Tier</DaisyLabel>
                        <p className="text-lg capitalize">{selectedTenant.subscription.tier}</p>
                      </div>
                      <div>
                        <DaisyLabel className="text-sm font-medium">Created</DaisyLabel>
                        <p className="text-lg">{selectedTenant.createdAt.toLocaleDateString()}</p>
                      </div>
                      <div>
                        <DaisyLabel className="text-sm font-medium">Last Updated</DaisyLabel>
                        <p className="text-lg">{selectedTenant.updatedAt.toLocaleDateString()}</p>
                      </div>
                      <div>
                        <DaisyLabel className="text-sm font-medium">Region</DaisyLabel>
                        <p className="text-lg">{selectedTenant.metadata.region}</p>
                      </div>
                    </div>
                  </div>
                </DaisyCardBody>
              </DaisyCard>
            </div>
          </DaisyTabsContent>

          {/* Analytics Tab */}
          <DaisyTabsContent value="analytics" />
            <div className="space-y-6">
              <DaisyCard >
  <DaisyCardBody />
</DaisyTabsContent>
                  <DaisyCardTitle>Usage Analytics</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="h-80">
</DaisyCardBody>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics?.usage.aiQueries.queriesPerDay || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" />
                        <YAxis />
                        <DaisyTooltip />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#3b82f6" 
                          fill="#3b82f6" 
                          fillOpacity={0.2} 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </DaisyTooltip>
              </DaisyCard>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DaisyCard >
  <DaisyCardBody />
</DaisyCard>
                    <DaisyCardTitle>Model Usage</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="space-y-4">
</DaisyCardBody>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {analytics?.usage.modelUsage.modelId || 'GPT-3.5 Turbo'}
                        </span>
                        <span className="text-sm text-gray-600">
                          {analytics?.usage.modelUsage.queriesCount || 0} queries
                        </span>
                      </div>
                      <DaisyProgress 
                        value={85} 
                        className="w-full" 
                      />
                      <div className="text-xs text-gray-500">
                        Success Rate: {analytics?.usage.modelUsage.successRate || 95}%
                      </div>
                    </div>
                  </DaisyProgress>
                </DaisyCard>

                <DaisyCard >
  <DaisyCardBody />
</DaisyCard>
                    <DaisyCardTitle>Performance Metrics</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="space-y-4">
</DaisyCardBody>
                      <div className="flex justify-between">
                        <span className="text-sm">Average Response Time</span>
                        <span className="text-sm font-medium">
                          {analytics?.usage.modelUsage.averageResponseTime || 245}ms
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">User Satisfaction</span>
                        <span className="text-sm font-medium">
                          {analytics?.usage.modelUsage.userSatisfaction || 4.8}/5.0
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Error Rate</span>
                        <span className="text-sm font-medium text-green-600">0.2%</span>
                      </div>
                    </div>
                  </DaisyCardBody>
                </DaisyCard>
              </div>
            </div>
          </DaisyTabsContent>

          {/* Additional tabs would continue here... */}
          <DaisyTabsContent value="billing" />
            <DaisyCard >
  <DaisyCardBody />
</DaisyTabsContent>
                <DaisyCardTitle>Billing Information</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <p>
</DaisyCardBody>Billing dashboard implementation continues...</p>
              </DaisyCardBody>
            </DaisyCard>
          </DaisyTabsContent>

          <DaisyTabsContent value="isolation" />
            <DaisyCard >
  <DaisyCardBody />
</DaisyTabsContent>
                <DaisyCardTitle>Tenant Isolation</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <p>
</DaisyCardBody>Isolation settings implementation continues...</p>
              </DaisyCardBody>
            </DaisyCard>
          </DaisyTabsContent>

          <DaisyTabsContent value="branding" />
            <DaisyCard >
  <DaisyCardBody />
</DaisyTabsContent>
                <DaisyCardTitle>Branding & Customization</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <p>
</DaisyCardBody>Branding configuration implementation continues...</p>
              </DaisyCardBody>
            </DaisyCard>
          </DaisyTabsContent>

          <DaisyTabsContent value="users" />
            <DaisyCard >
  <DaisyCardBody />
</DaisyTabsContent>
                <DaisyCardTitle>User Management</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <p>
</DaisyCardBody>User management implementation continues...</p>
              </DaisyCardBody>
            </DaisyCard>
          </DaisyTabsContent>

          <DaisyTabsContent value="settings" />
            <DaisyCard >
  <DaisyCardBody />
</DaisyTabsContent>
                <DaisyCardTitle>Tenant Settings</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <p>
</DaisyCardBody>Settings configuration implementation continues...</p>
              </DaisyCardBody>
            </DaisyCard>
          </DaisyTabsContent>
        </DaisyTabs>
      )}
    </div>
  );
};

export default MultiTenantAIDashboard; 