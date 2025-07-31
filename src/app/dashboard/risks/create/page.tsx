'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainContentArea } from '@/components/layout/MainContentArea';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { NewRiskFlow } from '@/components/risks/NewRiskFlow';
import { CreateRiskModal } from '@/components/risks/CreateRiskModal';
import { 
  Sparkles, 
  Zap, 
  MousePointerClick, 
  Layers, 
  ArrowRight,
  ChevronRight,
  Rocket
} from 'lucide-react';

export default function CreateRiskPage() {
  const router = useRouter();
  const [showNewFlow, setShowNewFlow] = useState(false);
  const [showOldFlow, setShowOldFlow] = useState(false);

  const features = [
    {
      icon: MousePointerClick,
      title: 'Drag & Drop Risk Positioning',
      description: 'Visually position risks on an interactive matrix',
      color: 'text-blue-600 bg-blue-50',
    },
    {
      icon: Layers,
      title: 'Step-by-Step Wizard',
      description: 'Guided flow with smooth animations',
      color: 'text-purple-600 bg-purple-50',
    },
    {
      icon: Sparkles,
      title: 'AI-Powered Suggestions',
      description: 'Get intelligent risk descriptions',
      color: 'text-green-600 bg-green-50',
    },
    {
      icon: Zap,
      title: 'Real-time Preview',
      description: 'See your risk card as you build it',
      color: 'text-orange-600 bg-orange-50',
    },
  ];

  return (
    <ProtectedRoute>
      <MainContentArea
        title="Create New Risk"
        subtitle="Choose your preferred risk creation experience"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Risks', href: '/dashboard/risks' },
          { label: 'Create', current: true },
        ]}
      >
        <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
          {/* New Flow Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <DaisyCard className="relative overflow-hidden h-full group hover:shadow-lg transition-shadow">
              <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-medium rounded-bl-lg">
                NEW
              </div>
              
              <DaisyCardHeader>
                <DaisyCardTitle className="flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-blue-600" />
                  Interactive Risk Flow
                </DaisyCardTitle>
                <DaisyCardDescription>
                  Modern, visual approach to risk creation with drag-and-drop
                </p>
              
              
              <DaisyCardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="flex items-start gap-2"
                    >
                      <div className={`p-1.5 rounded-md ${feature.color}`}>
                        <feature.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{feature.title}</p>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <DaisyButton 
                  onClick={() => setShowNewFlow(true)}
                  className="w-full group"
                  size="lg"
                >
                  Try New Experience
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </DaisyButton>
              </DaisyCardContent>
            </DaisyCard>
          </motion.div>

          {/* Classic Flow Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <DaisyCard className="h-full group hover:shadow-lg transition-shadow">
              <DaisyCardHeader>
                <DaisyCardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-gray-600" />
                  Classic Form
                </DaisyCardTitle>
                <DaisyCardDescription>
                  Traditional tabbed form with comprehensive options
                </p>
              
              
              <DaisyCardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    <span>Complete control over all risk attributes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    <span>Multi-tab interface for detailed input</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    <span>Familiar form-based workflow</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    <span>Batch input capabilities</span>
                  </div>
                </div>
                
                <DaisyButton 
                  onClick={() => setShowOldFlow(true)}
                  className="w-full"
                  variant="outline"
                  size="lg"
                >
                  Use Classic Form
                  <ChevronRight className="w-4 h-4 ml-2" />
                </DaisyButton>
              </DaisyCardContent>
            </DaisyCard>
          </motion.div>
        </div>

        {/* Demo Video Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 max-w-5xl mx-auto"
        >
          <DaisyCard>
            <DaisyCardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">See the New Flow in Action</h3>
              <p className="text-muted-foreground mb-4">
                Watch how the interactive risk creation flow makes risk management more intuitive
              </p>
              <DaisyButton variant="link" className="text-blue-600">
                View Demo Video →
              </DaisyButton>
            </DaisyCardContent>
          </DaisyCard>
        </motion.div>

        {/* Modals */}
        <NewRiskFlow
          open={showNewFlow}
          onOpenChange={setShowNewFlow}
          onSuccess={() => {
            setShowNewFlow(false);
            router.push('/dashboard/risks');
          }}
        />
        
        <CreateRiskModal
          open={showOldFlow}
          onOpenChange={setShowOldFlow}
          onRiskCreated={() => {
            setShowOldFlow(false);
            router.push('/dashboard/risks');
          }}
        />
      </MainContentArea>
    </ProtectedRoute>
  );
}