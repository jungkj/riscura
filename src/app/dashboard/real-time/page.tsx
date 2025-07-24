'use client'

import React, { Suspense } from 'react'
import RealTimeDashboard from '@/components/dashboard/RealTimeDashboard'
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard'
import { DaisyBadge } from '@/components/ui/DaisyBadge'
import { DaisyAlert } from '@/components/ui/DaisyAlert'
import { Database, Zap, Activity, Globe } from 'lucide-react'

// Mock organization and user IDs for demo
const DEMO_ORGANIZATION_ID = 'org_demo_123'
const DEMO_USER_ID = 'user_demo_123'

export default function RealTimeDashboardPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Zap className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Real-Time Dashboard</h1>
            <p className="text-muted-foreground">
              Live data integration with Supabase PostgreSQL
            </p>
          </div>
        </div>
        
        {/* Connection Info */}
        <DaisyAlert>
          <Database className="h-4 w-4" />
          <DaisyAlertDescription>
            <div className="flex items-center justify-between">
              <span>
                Connected to Supabase database with real-time subscriptions enabled.
                Changes to risks, controls, documents, and activities will appear instantly.
              </span>
              <div className="flex items-center gap-2">
                <DaisyBadge variant="secondary" className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  zggstcxinvxsfksssydyr.supabase.co
                </DaisyBadge>
                <DaisyBadge variant="outline" className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  Real-time
                </DaisyBadge>
              </div>
            </div>
          
        </DaisyAlert>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DaisyCard>
          <DaisyCardHeader>
            <DaisyCardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              Live Database Connection
            </DaisyCardTitle>
            <DaisyCardDescription>
              Direct connection to your Supabase PostgreSQL database
            </p>
          
          <DaisyCardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Real-time data synchronization</li>
              <li>• Automatic reconnection handling</li>
              <li>• Connection status monitoring</li>
              <li>• Offline mode detection</li>
            </ul>
          </DaisyCardBody>
        </DaisyCard>

        <DaisyCard>
          <DaisyCardHeader>
            <DaisyCardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Instant Updates
            </DaisyCardTitle>
            <DaisyCardDescription>
              See changes as they happen across all data types
            </p>
          
          <DaisyCardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Risk management updates</li>
              <li>• Control effectiveness changes</li>
              <li>• Document uploads/modifications</li>
              <li>• User activity tracking</li>
            </ul>
          </DaisyCardBody>
        </DaisyCard>

        <DaisyCard>
          <DaisyCardHeader>
            <DaisyCardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              Live Metrics
            </DaisyCardTitle>
            <DaisyCardDescription>
              Real-time analytics and performance indicators
            </p>
          
          <DaisyCardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Risk distribution analysis</li>
              <li>• Control effectiveness rates</li>
              <li>• Activity feed monitoring</li>
              <li>• Team collaboration metrics</li>
            </ul>
          </DaisyCardBody>
        </DaisyCard>
      </div>

      {/* Real-Time Dashboard */}
      <Suspense 
        fallback={
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <DaisyCard key={i} className="animate-pulse">
                  <DaisyCardHeader className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  
                </DaisyCard>
              ))}
            </div>
          </div>
        }
      >
        <RealTimeDashboard 
          organizationId={DEMO_ORGANIZATION_ID}
          userId={DEMO_USER_ID}
        />
      </Suspense>

      {/* Instructions */}
      <DaisyCard>
        <DaisyCardHeader>
          <DaisyCardTitle>How to Test Real-Time Features</DaisyCardTitle>
          <DaisyCardDescription>
            Follow these steps to see live updates in action
          </p>
        
        <DaisyCardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Option 1: Database Direct Access</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>1. Open Supabase dashboard</li>
                  <li>2. Navigate to Table Editor</li>
                  <li>3. Insert/update/delete records</li>
                  <li>4. Watch changes appear instantly here</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Option 2: API Integration</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>1. Use the built-in form components</li>
                  <li>2. Create/edit risks and controls</li>
                  <li>3. Upload documents</li>
                  <li>4. See real-time activity updates</li>
                </ul>
              </div>
            </div>
            
            <DaisyAlert>
              <Activity className="h-4 w-4" />
              <DaisyAlertDescription>
                <strong>Pro Tip:</strong> Open this page in multiple browser tabs or windows 
                to see real-time synchronization between different sessions. Changes made in 
                one tab will instantly appear in all other tabs.
              
            </DaisyAlert>
          </div>
        </DaisyCardBody>
      </DaisyCard>
    </div>
  )
} 