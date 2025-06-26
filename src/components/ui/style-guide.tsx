'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Palette,
  Type,
  Grid3X3,
  MousePointer,
  Eye,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Smartphone,
  Tablet,
  Monitor,
  Copy,
  Check,
  Star,
  Heart,
  Home,
  Search,
  Settings,
  Bell,
  User,
  Mail,
  Lock,
  Calendar,
  FileText,
  BarChart3,
  Shield,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Import design system constants
import { designSystem } from '@/lib/design-system/constants';

// Re-export for backward compatibility
export { designSystem };

// Color Palette Component
const ColorPalette: React.FC = () => {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const copyToClipboard = (color: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#191919] font-inter mb-4">
          Primary Colors
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(designSystem.colors).slice(0, 4).map(([name, value]) => (
            <div 
              key={name}
              className="group cursor-pointer p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              onClick={() => copyToClipboard(name, value)}
            >
              <div 
                className="w-full h-16 rounded-md mb-3 border"
                style={{ backgroundColor: value }}
              />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm font-inter capitalize">
                    {name.replace('-', ' ')}
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    {value}
                  </div>
                </div>
                {copiedColor === name ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[#191919] font-inter mb-4">
          Semantic Colors
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(designSystem.colors).slice(4).map(([name, value]) => (
            <div 
              key={name}
              className="group cursor-pointer p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              onClick={() => copyToClipboard(name, value)}
            >
              <div 
                className="w-full h-12 rounded-md mb-3 border"
                style={{ backgroundColor: value }}
              />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm font-inter capitalize">
                    {name.replace('-', ' ')}
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    {value}
                  </div>
                </div>
                {copiedColor === name ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Typography Component
const Typography: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-[#191919] font-inter mb-4">
          Font Family
        </h3>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="font-inter text-base">
            <strong>Primary:</strong> Inter (Google Fonts)
          </div>
          <div className="font-mono text-sm text-gray-600 mt-1">
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[#191919] font-inter mb-4">
          Type Scale
        </h3>
        <div className="space-y-4">
          {Object.entries(designSystem.typography.scale).map(([name, size]) => (
            <div key={name} className="flex items-center gap-6 p-3 hover:bg-gray-50 rounded-lg">
              <div className="w-16 text-sm text-gray-500 font-mono">
                {name}
              </div>
              <div className="w-16 text-xs text-gray-400 font-mono">
                {size}
              </div>
              <div 
                className="font-inter text-[#191919] flex-1"
                style={{ fontSize: size }}
              >
                The quick brown fox jumps over the lazy dog
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[#191919] font-inter mb-4">
          Font Weights
        </h3>
        <div className="space-y-3">
          {Object.entries(designSystem.typography.weights).map(([name, weight]) => (
            <div key={name} className="flex items-center gap-6 p-3 hover:bg-gray-50 rounded-lg">
              <div className="w-20 text-sm text-gray-500 font-mono">
                {name}
              </div>
              <div className="w-12 text-xs text-gray-400 font-mono">
                {weight}
              </div>
              <div 
                className="font-inter text-lg text-[#191919]"
                style={{ fontWeight: weight }}
              >
                Design System Typography
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[#191919] font-inter mb-4">
          Hierarchy Examples
        </h3>
        <div className="space-y-4 p-4 border rounded-lg">
          <h1 className="text-4xl font-bold text-[#191919] font-inter">
            Heading 1 - Page Title
          </h1>
          <h2 className="text-3xl font-semibold text-[#191919] font-inter">
            Heading 2 - Section Title
          </h2>
          <h3 className="text-2xl font-semibold text-[#191919] font-inter">
            Heading 3 - Subsection
          </h3>
          <h4 className="text-xl font-medium text-[#191919] font-inter">
            Heading 4 - Component Title
          </h4>
          <p className="text-base text-[#191919] font-inter">
            Body text - This is the standard paragraph text used throughout the application. 
            It should be readable and comfortable for extended reading.
          </p>
          <p className="text-sm text-gray-600 font-inter">
            Secondary text - Used for descriptions, help text, and less important information.
          </p>
          <p className="text-xs text-gray-500 font-inter">
            Caption text - Used for labels, timestamps, and metadata.
          </p>
        </div>
      </div>
    </div>
  );
};

// Spacing Grid Component
const SpacingGrid: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#191919] font-inter mb-4">
          8px Grid System
        </h3>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-base text-[#191919] font-inter mb-2">
            All spacing values are based on multiples of 8px for consistency.
          </p>
          <p className="text-sm text-gray-600 font-inter">
            This ensures visual harmony and makes the design feel more cohesive and predictable.
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[#191919] font-inter mb-4">
          Spacing Scale
        </h3>
        <div className="space-y-3">
          {Object.entries(designSystem.spacing).map(([name, value]) => (
            <div key={name} className="flex items-center gap-6">
              <div className="w-8 text-sm text-gray-500 font-mono">
                {name}
              </div>
              <div className="w-16 text-xs text-gray-400 font-mono">
                {value}
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="bg-[#199BEC] h-4"
                  style={{ width: value }}
                />
                <span className="text-sm text-gray-600 font-inter">
                  {value === '0px' ? 'None' : `${parseInt(value) / 8}× base unit`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[#191919] font-inter mb-4">
          Spacing Examples
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-[#191919] font-inter">Component Spacing</h4>
            <div className="border rounded-lg p-6 space-y-4">
              <div className="p-4 bg-gray-100 rounded">Padding: 16px (2 units)</div>
              <div className="p-6 bg-gray-100 rounded">Padding: 24px (3 units)</div>
              <div className="p-8 bg-gray-100 rounded">Padding: 32px (4 units)</div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-medium text-[#191919] font-inter">Layout Spacing</h4>
            <div className="border rounded-lg p-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-6"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component Variations
const ComponentVariations: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-[#191919] font-inter mb-4">
          Button Variations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700">Primary Buttons</h4>
            <div className="space-y-2">
              <Button size="sm">Small Primary</Button>
              <Button>Default Primary</Button>
              <Button size="lg">Large Primary</Button>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700">Secondary Buttons</h4>
            <div className="space-y-2">
              <Button variant="secondary" size="sm">Small Secondary</Button>
              <Button variant="secondary">Default Secondary</Button>
              <Button variant="secondary" size="lg">Large Secondary</Button>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700">Other Variants</h4>
            <div className="space-y-2">
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="link">Link Button</Button>
                              <Button variant="danger">Danger</Button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[#191919] font-inter mb-4">
          State Demonstrations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-[#191919] font-inter">Interactive States</h4>
            <div className="space-y-3 p-4 border rounded-lg">
              <Button className="w-full">Hover me for state change</Button>
              <Button className="w-full" disabled>Disabled State</Button>
              <Button 
                className="w-full" 
                onClick={() => {
                  setIsLoading(true);
                  setTimeout(() => setIsLoading(false), 2000);
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Click for Loading State'
                )}
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-medium text-[#191919] font-inter">Form Elements</h4>
            <div className="space-y-3 p-4 border rounded-lg">
              <div>
                <Label htmlFor="example-input">Input Field</Label>
                <Input 
                  id="example-input" 
                  placeholder="Placeholder text" 
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="disabled-input">Disabled Input</Label>
                <Input 
                  id="disabled-input" 
                  disabled 
                  value="Disabled value" 
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[#191919] font-inter mb-4">
          Badge Variations
        </h3>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[#191919] font-inter mb-4">
          Status Indicators
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 font-inter">Success State</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-red-800 font-inter">Error State</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="text-yellow-800 font-inter">Warning State</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <span className="text-blue-800 font-inter">Info State</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Icon Patterns Component
const IconPatterns: React.FC = () => {
  const iconSets = {
    navigation: [Home, Search, Settings, Bell, User],
    actions: [Star, Heart, Mail, Lock, Calendar],
    content: [FileText, BarChart3, Shield, Zap, Target],
    status: [CheckCircle, AlertTriangle, Loader2, TrendingUp]
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#191919] font-inter mb-4">
          Icon Usage Guidelines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-[#191919] font-inter mb-2">Sizes</h4>
            <ul className="text-sm text-gray-600 space-y-1 font-inter">
              <li>• Small: 16px (h-4 w-4) - Inline with text</li>
              <li>• Medium: 20px (h-5 w-5) - Buttons, labels</li>
              <li>• Large: 24px (h-6 w-6) - Headers, emphasis</li>
              <li>• Extra Large: 32px (h-8 w-8) - Feature highlights</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-[#191919] font-inter mb-2">Colors</h4>
            <ul className="text-sm text-gray-600 space-y-1 font-inter">
              <li>• Primary: #191919 - Main actions</li>
              <li>• Accent: #199BEC - Interactive elements</li>
              <li>• Muted: #6B7280 - Secondary actions</li>
              <li>• Success/Error: Semantic colors</li>
            </ul>
          </div>
        </div>
      </div>

      {Object.entries(iconSets).map(([category, icons]) => (
        <div key={category}>
          <h3 className="text-lg font-semibold text-[#191919] font-inter mb-4 capitalize">
            {category} Icons
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {icons.map((Icon, index) => (
              <div key={index} className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <Icon className="h-6 w-6 text-[#191919] mb-2" />
                <span className="text-xs text-gray-600 font-inter text-center">
                  {Icon.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div>
        <h3 className="text-lg font-semibold text-[#191919] font-inter mb-4">
          Icon Size Demonstrations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['h-4 w-4', 'h-5 w-5', 'h-6 w-6', 'h-8 w-8'].map((size, index) => (
            <div key={size} className="text-center p-4 border rounded-lg">
              <Home className={cn(size, 'text-[#191919] mx-auto mb-2')} />
              <div className="text-sm text-gray-600 font-inter">{size}</div>
              <div className="text-xs text-gray-500 font-inter">
                {['16px', '20px', '24px', '32px'][index]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Responsive Preview Component
const ResponsivePreview: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  const deviceSizes = {
    mobile: { width: 375, height: 600 },
    tablet: { width: 768, height: 600 },
    desktop: { width: 1200, height: 600 }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#191919] font-inter mb-4">
          Responsive Breakpoints
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <Smartphone className="h-6 w-6 text-[#199BEC] mb-2" />
            <h4 className="font-medium text-[#191919] font-inter">Mobile</h4>
            <p className="text-sm text-gray-600 font-inter">&lt; 768px</p>
          </div>
          <div className="p-4 border rounded-lg">
            <Tablet className="h-6 w-6 text-[#199BEC] mb-2" />
            <h4 className="font-medium text-[#191919] font-inter">Tablet</h4>
            <p className="text-sm text-gray-600 font-inter">768px - 1024px</p>
          </div>
          <div className="p-4 border rounded-lg">
            <Monitor className="h-6 w-6 text-[#199BEC] mb-2" />
            <h4 className="font-medium text-[#191919] font-inter">Desktop</h4>
            <p className="text-sm text-gray-600 font-inter">&gt; 1024px</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[#191919] font-inter mb-4">
          Device Preview
        </h3>
        <div className="flex gap-2 mb-4">
          {(['mobile', 'tablet', 'desktop'] as const).map((device) => (
            <Button
              key={device}
              variant={selectedDevice === device ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setSelectedDevice(device)}
              className="capitalize"
            >
              {device}
            </Button>
          ))}
        </div>
        
        <div className="border rounded-lg p-4 bg-gray-50 overflow-auto">
          <div 
            className="mx-auto bg-white rounded-lg shadow-sm border transition-all duration-300"
            style={{
              width: `${deviceSizes[selectedDevice].width}px`,
              height: `${deviceSizes[selectedDevice].height}px`,
              maxWidth: '100%'
            }}
          >
            <div className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-[#191919] font-inter">Sample Layout</h4>
                <Badge>{selectedDevice}</Badge>
              </div>
              <div className="flex-1 space-y-4">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="h-16 bg-gray-100 rounded"></div>
                  <div className="h-16 bg-gray-100 rounded"></div>
                  {selectedDevice !== 'mobile' && (
                    <div className="h-16 bg-gray-100 rounded"></div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm">Action</Button>
                  <Button variant="secondary" size="sm">Cancel</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Style Guide Component
export const StyleGuide: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#191919] font-inter mb-4">
          RCSA Design System Style Guide
        </h1>
        <p className="text-lg text-gray-600 font-inter max-w-3xl mx-auto">
          A comprehensive guide to ensure consistency across the RCSA platform. 
          Built with a Notion-like aesthetic featuring cream backgrounds, clean typography, and subtle interactions.
        </p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <Badge className="flex items-center gap-1">
            <Palette className="h-3 w-3" />
            Design System
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Validated
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="spacing" className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            Spacing
          </TabsTrigger>
          <TabsTrigger value="components" className="flex items-center gap-2">
            <MousePointer className="h-4 w-4" />
            Components
          </TabsTrigger>
          <TabsTrigger value="icons" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Icons
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Color Palette
              </CardTitle>
              <CardDescription>
                Consistent color scheme based on Notion's aesthetic with cream backgrounds and blue accents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ColorPalette />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Typography System
              </CardTitle>
              <CardDescription>
                Inter font family with consistent sizing and weight hierarchy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Typography />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spacing" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5" />
                Spacing System
              </CardTitle>
              <CardDescription>
                8px grid system for consistent spacing and layout rhythm
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SpacingGrid />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer className="h-5 w-5" />
                Component Library
              </CardTitle>
              <CardDescription>
                Consistent component variations with proper states and interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ComponentVariations />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="icons" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Icon System
              </CardTitle>
              <CardDescription>
                Lucide icons with consistent sizing and usage patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IconPatterns />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Responsive Design
          </CardTitle>
          <CardDescription>
            Mobile-first responsive design with consistent breakpoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsivePreview />
        </CardContent>
      </Card>
    </div>
  );
};

export default StyleGuide; 