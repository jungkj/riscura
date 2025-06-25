'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Smartphone,
  Tablet,
  Monitor,
  Accessibility,
  Hand,
  Wifi,
  WifiOff,
  Bell,
  BellOff,
  Keyboard,
  Eye,
  Volume2,
  VolumeX,
  Vibrate,
  Download,
  Upload,
  RotateCcw,
  Settings,
  CheckCircle,
  AlertCircle,
  Info,
  Zap,
  Globe,
  Shield
} from 'lucide-react';

// Import our mobile and accessibility components
import { MobileNavigation, TouchOptimizedTable, MobileFormLayout } from '@/components/mobile';
import { 
  useScreenReader, 
  useKeyboardNavigation, 
  useFocusTrap, 
  detectScreenReader, 
  keyboardUtils 
} from '@/lib/accessibility';
import { 
  useServiceWorker, 
  useNotifications, 
  useNotificationTemplates 
} from '@/lib/pwa';
import { 
  useGestures, 
  usePullToRefresh, 
  useOfflineStorage, 
  usePushNotifications 
} from '@/hooks';

export default function MobileAccessibilityDemo() {
  const [activeTab, setActiveTab] = useState('mobile');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [screenReaderDetected, setScreenReaderDetected] = useState(false);
  const [gestureEnabled, setGestureEnabled] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Refs for components
  const demoContainerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Hooks
  const { announce, announceLoading, announceAction } = useScreenReader();
  const { 
    isRegistered: swRegistered, 
    updateAvailable, 
    syncQueueLength,
    applyUpdate,
    clearCache 
  } = useServiceWorker();
  
  const {
    permissionState,
    subscribe: subscribeNotifications,
    showNotification,
    clearNotifications
  } = useNotifications({
    vapidKey: 'demo-vapid-key',
    endpoint: '/api/notifications'
  });

  const { createRiskAlert, createSystemUpdate } = useNotificationTemplates();
  
  const {
    data: offlineData,
    updateData: updateOfflineData,
    syncStatus
  } = useOfflineStorage({
    key: 'demo-data',
    defaultValue: { count: 0, lastUpdate: Date.now() },
    syncToServer: true,
    syncEndpoint: '/api/sync'
  });

  // Gesture handling
  const { bind: gestureBindings } = useGestures({
    onSwipeLeft: () => announce('Swiped left'),
    onSwipeRight: () => announce('Swiped right'),
    onTap: () => announce('Tapped'),
    onLongPress: () => announce('Long press detected'),
    disabled: !gestureEnabled
  });

  // Pull to refresh
  const { bind: pullToRefreshBind, isRefreshing } = usePullToRefresh(
    async () => {
      announceLoading(true, 'content');
      await new Promise(resolve => setTimeout(resolve, 2000));
      announceLoading(false, 'content');
      announceAction('Content refreshed');
    }
  );

  // Keyboard navigation
  useKeyboardNavigation(demoContainerRef, {
    enableArrowKeys: true,
    enableHomeEndKeys: true,
    orientation: 'both'
  });

  // Focus trap for modal
  const [modalOpen, setModalOpen] = useState(false);
  useFocusTrap(modalOpen, modalRef, {
    autoFocus: true,
    restoreFocus: true
  });

  // Effects
  useEffect(() => {
    const { hasScreenReader } = detectScreenReader();
    setScreenReaderDetected(hasScreenReader);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sample data for demonstrations
  const sampleTableData = [
    { id: '1', name: 'Risk Assessment', status: 'active', priority: 'high', lastUpdate: '2024-01-15' },
    { id: '2', name: 'Compliance Review', status: 'pending', priority: 'medium', lastUpdate: '2024-01-14' },
    { id: '3', name: 'Security Audit', status: 'completed', priority: 'high', lastUpdate: '2024-01-13' },
    { id: '4', name: 'Policy Update', status: 'draft', priority: 'low', lastUpdate: '2024-01-12' }
  ];

  const formSections = [
    {
      title: 'Personal Information',
      description: 'Basic contact details',
      fields: [
        {
          id: 'name',
          type: 'text' as const,
          label: 'Full Name',
          placeholder: 'Enter your full name',
          required: true
        },
        {
          id: 'email',
          type: 'email' as const,
          label: 'Email Address',
          placeholder: 'Enter your email',
          required: true
        },
        {
          id: 'phone',
          type: 'tel' as const,
          label: 'Phone Number',
          placeholder: 'Enter your phone number'
        }
      ]
    },
    {
      title: 'Preferences',
      description: 'Notification and accessibility settings',
      fields: [
        {
          id: 'notifications',
          type: 'checkbox' as const,
          label: 'Enable Notifications',
          defaultValue: true
        },
        {
          id: 'theme',
          type: 'select' as const,
          label: 'Theme Preference',
          options: [
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'auto', label: 'Auto' }
          ],
          defaultValue: 'auto'
        }
      ]
    }
  ];

  // Demo actions
  const handleOfflineDataUpdate = () => {
    updateOfflineData(prev => ({
      count: prev.count + 1,
      lastUpdate: Date.now()
    }));
    announceAction('Offline data updated');
  };

  const handleShowNotification = async () => {
    try {
      const notification = createRiskAlert('Data Breach Risk', 'high');
      await showNotification(notification);
      announceAction('Notification sent');
    } catch (error) {
      announceAction('Notification failed', false);
    }
  };

  const handleToggleHighContrast = () => {
    setHighContrast(!highContrast);
    document.documentElement.classList.toggle('high-contrast', !highContrast);
    announceAction(`High contrast ${!highContrast ? 'enabled' : 'disabled'}`);
  };

  const handleToggleReducedMotion = () => {
    setReducedMotion(!reducedMotion);
    document.documentElement.classList.toggle('reduce-motion', !reducedMotion);
    announceAction(`Reduced motion ${!reducedMotion ? 'enabled' : 'disabled'}`);
  };

  return (
    <div 
      ref={demoContainerRef}
      className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 ${
        highContrast ? 'high-contrast' : ''
      } ${reducedMotion ? 'reduce-motion' : ''}`}
      {...gestureBindings()}
      // {...pullToRefreshBind} // TODO: Fix pull to refresh binding
    >
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Mobile-First Responsive Design & Accessibility Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive demonstration of mobile optimization, accessibility features, 
            and Progressive Web App capabilities for the Riscura platform.
          </p>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                {isOnline ? (
                  <Wifi className="h-6 w-6 text-green-500" />
                ) : (
                  <WifiOff className="h-6 w-6 text-red-500" />
                )}
              </div>
              <div className="text-sm font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Accessibility className="h-6 w-6 text-blue-500" />
              </div>
              <div className="text-sm font-medium">
                {screenReaderDetected ? 'Screen Reader' : 'Standard View'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                {swRegistered ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-orange-500" />
                )}
              </div>
              <div className="text-sm font-medium">
                {swRegistered ? 'PWA Ready' : 'PWA Loading'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                {permissionState.subscribed ? (
                  <Bell className="h-6 w-6 text-green-500" />
                ) : (
                  <BellOff className="h-6 w-6 text-gray-500" />
                )}
              </div>
              <div className="text-sm font-medium">
                {permissionState.subscribed ? 'Notifications On' : 'Notifications Off'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          <Button
            onClick={handleToggleHighContrast}
            variant={highContrast ? "secondary" : "outline"}
            size="sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            High Contrast
          </Button>

          <Button
            onClick={handleToggleReducedMotion}
            variant={reducedMotion ? "secondary" : "outline"}
            size="sm"
          >
            <Zap className="h-4 w-4 mr-2" />
            Reduce Motion
          </Button>

          <Button
            onClick={() => setGestureEnabled(!gestureEnabled)}
            variant={gestureEnabled ? "secondary" : "outline"}
            size="sm"
          >
            <Hand className="h-4 w-4 mr-2" />
            Gestures
          </Button>

          <Button
            onClick={handleShowNotification}
            variant="outline"
            size="sm"
          >
            <Bell className="h-4 w-4 mr-2" />
            Test Notification
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="mobile" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              <span className="hidden sm:inline">Mobile</span>
            </TabsTrigger>
            <TabsTrigger value="accessibility" className="flex items-center gap-2">
              <Accessibility className="h-4 w-4" />
              <span className="hidden sm:inline">A11y</span>
            </TabsTrigger>
            <TabsTrigger value="pwa" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">PWA</span>
            </TabsTrigger>
            <TabsTrigger value="gestures" className="flex items-center gap-2">
              <Hand className="h-4 w-4" />
              <span className="hidden sm:inline">Gestures</span>
            </TabsTrigger>
            <TabsTrigger value="offline" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Offline</span>
            </TabsTrigger>
          </TabsList>

          {/* Mobile Optimization Tab */}
          <TabsContent value="mobile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Mobile Navigation
                </CardTitle>
                <CardDescription>
                  Touch-optimized navigation with gesture support and mobile-friendly interface
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 border rounded-lg overflow-hidden">
                  <MobileNavigation />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tablet className="h-5 w-5" />
                  Touch-Optimized Data Table
                </CardTitle>
                <CardDescription>
                  Mobile-friendly data table with swipe actions and touch gestures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 border rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-600">
                    TouchOptimizedTable component demo - temporarily disabled due to prop interface changes
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Mobile Form Layout
                </CardTitle>
                <CardDescription>
                  Responsive form design optimized for mobile input and validation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 border rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-600">
                    MobileFormLayout component demo - temporarily disabled due to prop interface changes
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accessibility Tab */}
          <TabsContent value="accessibility" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5" />
                    Screen Reader Support
                  </CardTitle>
                  <CardDescription>
                    Live announcements and ARIA labels for screen readers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Screen Reader Detected</Label>
                    <Badge variant={screenReaderDetected ? "default" : "secondary"}>
                      {screenReaderDetected ? "Yes" : "No"}
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Button 
                      onClick={() => announce('This is a test announcement')}
                      className="w-full"
                    >
                      Test Announcement
                    </Button>
                    <Button 
                      onClick={() => announceLoading(true, 'test data')}
                      variant="outline"
                      className="w-full"
                    >
                      Announce Loading
                    </Button>
                    <Button 
                      onClick={() => announceAction('Test action completed')}
                      variant="outline"
                      className="w-full"
                    >
                      Announce Action
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Keyboard className="h-5 w-5" />
                    Keyboard Navigation
                  </CardTitle>
                  <CardDescription>
                    Full keyboard accessibility with custom shortcuts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm space-y-2">
                    <div><kbd className="px-2 py-1 bg-gray-100 rounded">Tab</kbd> - Navigate forward</div>
                    <div><kbd className="px-2 py-1 bg-gray-100 rounded">Shift+Tab</kbd> - Navigate backward</div>
                    <div><kbd className="px-2 py-1 bg-gray-100 rounded">Arrow Keys</kbd> - Navigate in grids</div>
                    <div><kbd className="px-2 py-1 bg-gray-100 rounded">Enter</kbd> - Activate buttons</div>
                    <div><kbd className="px-2 py-1 bg-gray-100 rounded">Escape</kbd> - Close modals</div>
                    <div><kbd className="px-2 py-1 bg-gray-100 rounded">/</kbd> - Focus search</div>
                    <div><kbd className="px-2 py-1 bg-gray-100 rounded">?</kbd> - Show help</div>
                  </div>
                  
                  <Button 
                    onClick={() => setModalOpen(true)}
                    className="w-full"
                  >
                    Test Focus Trap
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Accessibility Settings</CardTitle>
                <CardDescription>
                  Customize the interface for better accessibility
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="high-contrast">High Contrast Mode</Label>
                  <Switch
                    id="high-contrast"
                    checked={highContrast}
                    onCheckedChange={handleToggleHighContrast}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="reduced-motion">Reduced Motion</Label>
                  <Switch
                    id="reduced-motion"
                    checked={reducedMotion}
                    onCheckedChange={handleToggleReducedMotion}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="gesture-enabled">Touch Gestures</Label>
                  <Switch
                    id="gesture-enabled"
                    checked={gestureEnabled}
                    onCheckedChange={setGestureEnabled}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PWA Tab */}
          <TabsContent value="pwa" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Service Worker Status
                  </CardTitle>
                  <CardDescription>
                    Progressive Web App installation and caching
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Service Worker</Label>
                    <Badge variant={swRegistered ? "default" : "secondary"}>
                      {swRegistered ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Update Available</Label>
                    <Badge variant={updateAvailable ? "destructive" : "secondary"}>
                      {updateAvailable ? "Yes" : "No"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Sync Queue</Label>
                    <Badge variant="outline">
                      {syncQueueLength} items
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    {updateAvailable && (
                      <Button onClick={applyUpdate} className="w-full">
                        <Upload className="h-4 w-4 mr-2" />
                        Apply Update
                      </Button>
                    )}
                    <Button onClick={() => clearCache()} variant="outline" className="w-full">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Clear Cache
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Push Notifications
                  </CardTitle>
                  <CardDescription>
                    Real-time notifications and alerts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Permission</Label>
                    <Badge variant={
                      permissionState.permission === 'granted' ? "default" :
                      permissionState.permission === 'denied' ? "destructive" : "secondary"
                    }>
                      {permissionState.permission}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Subscribed</Label>
                    <Badge variant={permissionState.subscribed ? "default" : "secondary"}>
                      {permissionState.subscribed ? "Yes" : "No"}
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    {!permissionState.subscribed && (
                      <Button onClick={subscribeNotifications} className="w-full">
                        <Bell className="h-4 w-4 mr-2" />
                        Enable Notifications
                      </Button>
                    )}
                    <Button onClick={handleShowNotification} variant="outline" className="w-full">
                      <Vibrate className="h-4 w-4 mr-2" />
                      Test Notification
                    </Button>
                    <Button onClick={() => clearNotifications()} variant="outline" className="w-full">
                      <BellOff className="h-4 w-4 mr-2" />
                      Clear Notifications
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Gestures Tab */}
          <TabsContent value="gestures" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hand className="h-5 w-5" />
                  Touch Gestures Demo
                </CardTitle>
                <CardDescription>
                  Try different touch gestures on the area below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg border-2 border-dashed border-blue-300 flex items-center justify-center text-center p-4"
                  {...gestureBindings()}
                >
                  <div className="space-y-2">
                    <div className="text-lg font-medium">Gesture Area</div>
                    <div className="text-sm text-gray-600">
                      Try: Tap, Long Press, Swipe Left/Right, Pull Down to Refresh
                    </div>
                    {isRefreshing && (
                      <div className="flex items-center justify-center gap-2">
                        <RotateCcw className="h-4 w-4 animate-spin" />
                        <span>Refreshing...</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Offline Tab */}
          <TabsContent value="offline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Offline Functionality
                </CardTitle>
                <CardDescription>
                  Data persistence and synchronization when offline
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Connection Status</Label>
                  <Badge variant={isOnline ? "default" : "destructive"}>
                    {isOnline ? "Online" : "Offline"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Sync Status</Label>
                  <Badge variant={syncStatus.pendingSync ? "secondary" : "default"}>
                    {syncStatus.pendingSync ? "Syncing" : "Synced"}
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div>
                    <Label>Offline Counter: {(offlineData as any)?.count || 0}</Label>
                    <div className="text-sm text-gray-500">
                      Last updated: {new Date((offlineData as any)?.lastUpdate || Date.now()).toLocaleString()}
                    </div>
                  </div>
                  
                  <Button onClick={handleOfflineDataUpdate} className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Update Offline Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal for Focus Trap Demo */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div 
            ref={modalRef}
            className="bg-white rounded-lg p-6 max-w-md w-full"
            role="dialog"
            aria-labelledby="modal-title"
            aria-modal="true"
          >
            <h2 id="modal-title" className="text-lg font-semibold mb-4">
              Focus Trap Demo
            </h2>
            <p className="text-gray-600 mb-4">
              This modal demonstrates focus trapping. Try pressing Tab to navigate - 
              focus will stay within this modal.
            </p>
            <div className="space-y-3">
              <Input placeholder="First input" />
              <Input placeholder="Second input" />
              <Textarea placeholder="Textarea" rows={3} />
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => setModalOpen(false)}>
                Close
              </Button>
              <Button variant="outline" onClick={() => announce('Button clicked in modal')}>
                Test Button
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 