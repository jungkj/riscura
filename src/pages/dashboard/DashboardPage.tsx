import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RiskHeatMap from '@/components/dashboard/RiskHeatMap';
import RecentActivityTimeline from '@/components/dashboard/RecentActivityTimeline';
import { ComplianceDonut } from '@/components/dashboard/ComplianceDonut';
import { RiskByCategory } from '@/components/dashboard/RiskByCategory';
import { toast } from '@/hooks/use-toast';

// Enhanced components
import { MetricsGrid } from '@/components/ui/aceternity/animated-counter';
import { DashboardErrorBoundary } from '@/components/ui/error-boundary';
import { PageLoading } from '@/components/ui/enhanced-loading';

// Icons
import { 
  ArrowRight, 
  BarChart, 
  Calendar, 
  FileText, 
  Plus, 
  RefreshCw,
  Shield,
  AlertTriangle,
  CheckCircle,
  Activity
} from 'lucide-react';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    // Simulate data loading with realistic delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: 'Dashboard Updated',
        description: 'The dashboard data has been refreshed.',
      });
    } catch {
      toast({
        title: 'Refresh Failed',
        description: 'Unable to refresh dashboard data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const metrics = [
    {
      id: 'total-risks',
      title: 'Total Risks',
      value: 156,
      trend: { value: 12, isPositive: true },
      icon: <BarChart className="h-5 w-5" />,
    },
    {
      id: 'high-priority',
      title: 'High Priority',
      value: 23,
      trend: { value: 5, isPositive: false },
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    {
      id: 'controls',
      title: 'Active Controls',
      value: 89,
      trend: { value: 8, isPositive: true },
      icon: <Shield className="h-5 w-5" />,
    },
    {
      id: 'compliance',
      title: 'Compliance Score',
      value: 94,
      suffix: '%',
      trend: { value: 2, isPositive: true },
      icon: <CheckCircle className="h-5 w-5" />,
    },
  ];

  if (isLoading) {
    return <PageLoading title="Loading Dashboard" description="Preparing your risk management overview" />;
  }

  return (
    <DashboardErrorBoundary>
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Your risk management overview and key metrics.
            </p>
          </div>
          <Button 
            onClick={handleRefresh} 
            variant="outline"
            disabled={refreshing}
            className="transition-all duration-200 hover:scale-105"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </motion.div>

        <Tabs defaultValue="overview" className="space-y-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="transition-all duration-200">Overview</TabsTrigger>
              <TabsTrigger value="risks" className="transition-all duration-200">Risks</TabsTrigger>
              <TabsTrigger value="controls" className="transition-all duration-200">Controls</TabsTrigger>
              <TabsTrigger value="compliance" className="transition-all duration-200">Compliance</TabsTrigger>
            </TabsList>
          </motion.div>
          
          <TabsContent value="overview" className="space-y-6">
            {/* Enhanced Metrics Grid */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <MetricsGrid metrics={metrics} />
            </motion.div>

            {/* Main Content with Enhanced Cards */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {/* Risk Heat Map */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-md font-medium flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Risk Heat Map
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs hover:scale-105 transition-transform">
                    View All <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <RiskHeatMap isLoading={false} />
                </CardContent>
              </Card>
              
              {/* Recent Activity */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-md font-medium flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    Recent Activity
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs hover:scale-105 transition-transform">
                    View All <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <RecentActivityTimeline isLoading={false} />
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Additional Analytics */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-md font-medium flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                    Compliance Status
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs hover:scale-105 transition-transform">
                    View Details <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <ComplianceDonut isLoading={false} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-md font-medium flex items-center gap-2">
                    <BarChart className="h-5 w-5 text-orange-600" />
                    Risks by Category
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs hover:scale-105 transition-transform">
                    View All <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <RiskByCategory />
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Enhanced Quick Actions */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    icon: Plus,
                    title: 'Add New Risk',
                    description: 'Create a new risk entry',
                    color: 'text-blue-600',
                    delay: 0.1,
                  },
                  {
                    icon: FileText,
                    title: 'Upload Document',
                    description: 'Analyze with AI',
                    color: 'text-green-600',
                    delay: 0.2,
                  },
                  {
                    icon: Calendar,
                    title: 'Schedule Assessment',
                    description: 'Plan your next review',
                    color: 'text-purple-600',
                    delay: 0.3,
                  },
                  {
                    icon: BarChart,
                    title: 'Generate Report',
                    description: 'Create compliance report',
                    color: 'text-orange-600',
                    delay: 0.4,
                  },
                ].map((action) => (
                  <motion.div
                    key={action.title}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: action.delay }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 px-4 justify-start w-full group hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-2">
                          <action.icon className={`h-4 w-4 ${action.color} group-hover:scale-110 transition-transform`} />
                          <span className="font-medium">{action.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {action.description}
                        </span>
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* Other tab contents with similar enhancements */}
          <TabsContent value="risks" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Risk Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Risk management content coming soon...</p>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="controls" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Control Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Control management content coming soon...</p>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Compliance overview content coming soon...</p>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardErrorBoundary>
  );
}