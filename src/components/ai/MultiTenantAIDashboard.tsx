import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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
  }

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
          <Button onClick={createNewTenant} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Tenant
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setError(null)}
              className="ml-auto"
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Tenant Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Tenant Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'} className="mt-2">
                  {tenant.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedTenant && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="isolation" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Isolation
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
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
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
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
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
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
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Response Time</p>
                        <p className="text-2xl font-bold">
                          {analytics?.usage.aiQueries.averageResponseTime || 0}ms
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-purple-600" />
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <TrendingDown className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-green-600">-8%</span>
                      <span className="text-gray-600 ml-1">improved</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tenant Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Tenant Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Organization Name</Label>
                        <p className="text-lg">{selectedTenant.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Domain</Label>
                        <p className="text-lg">{selectedTenant.domain}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Subdomain</Label>
                        <p className="text-lg">{selectedTenant.subdomain}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <Badge variant={selectedTenant.status === 'active' ? 'default' : 'secondary'}>
                          {selectedTenant.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Subscription Tier</Label>
                        <p className="text-lg capitalize">{selectedTenant.subscription.tier}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Created</Label>
                        <p className="text-lg">{selectedTenant.createdAt.toLocaleDateString()}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Last Updated</Label>
                        <p className="text-lg">{selectedTenant.updatedAt.toLocaleDateString()}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Region</Label>
                        <p className="text-lg">{selectedTenant.metadata.region}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Usage Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics?.usage.aiQueries.queriesPerDay || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" />
                        <YAxis />
                        <Tooltip />
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
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Model Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {analytics?.usage.modelUsage.modelId || 'GPT-3.5 Turbo'}
                        </span>
                        <span className="text-sm text-gray-600">
                          {analytics?.usage.modelUsage.queriesCount || 0} queries
                        </span>
                      </div>
                      <Progress 
                        value={85} 
                        className="w-full" 
                      />
                      <div className="text-xs text-gray-500">
                        Success Rate: {analytics?.usage.modelUsage.successRate || 95}%
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
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
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Additional tabs would continue here... */}
          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Billing dashboard implementation continues...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="isolation">
            <Card>
              <CardHeader>
                <CardTitle>Tenant Isolation</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Isolation settings implementation continues...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding">
            <Card>
              <CardHeader>
                <CardTitle>Branding & Customization</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Branding configuration implementation continues...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p>User management implementation continues...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Tenant Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Settings configuration implementation continues...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default MultiTenantAIDashboard; 