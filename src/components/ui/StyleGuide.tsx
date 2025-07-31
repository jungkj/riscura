'use client';

import React from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  X,
  Search,
  Settings,
  User,
  Bell,
  Download
} from 'lucide-react';

export function StyleGuide() {

  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Riscura Style Guide</h1>
          <p className="text-lg text-foreground font-semibold">
            Consistent theming with thick bold black lines, cream background, and bold Inter text
          </p>
        </div>

        {/* Color Palette */}
        <DaisyCard className="mb-8">
          <DaisyCardHeader>
            <DaisyCardTitle>Color Palette</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="w-full h-20 bg-background border-2 border-border rounded-md"></div>
                <p className="text-sm font-semibold text-foreground">Background</p>
                <p className="text-xs text-foreground">#F5F1E9</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-20 bg-card border-2 border-border rounded-md"></div>
                <p className="text-sm font-semibold text-foreground">Card</p>
                <p className="text-xs text-foreground">#FAFAFA</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-20 bg-foreground border-2 border-border rounded-md"></div>
                <p className="text-sm font-semibold text-foreground">Foreground</p>
                <p className="text-xs text-foreground">#191919</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-20 bg-secondary border-2 border-border rounded-md"></div>
                <p className="text-sm font-semibold text-foreground">Secondary</p>
                <p className="text-xs text-foreground">#D8C3A5</p>
              </div>
            </div>
          </DaisyCardContent>
        </DaisyCard>

        {/* Typography */}
        <DaisyCard className="mb-8">
          <DaisyCardHeader>
            <DaisyCardTitle>Typography - Bold Inter Font</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent className="space-y-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Heading 1 - Bold</h1>
              <p className="text-sm text-foreground">font-bold, text-4xl</p>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Heading 2 - Bold</h2>
              <p className="text-sm text-foreground">font-bold, text-3xl</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Heading 3 - Bold</h3>
              <p className="text-sm text-foreground">font-bold, text-2xl</p>
            </div>
            <div>
              <p className="text-base font-semibold text-foreground mb-2">
                Body text - All text is bold for maximum readability and consistency
              </p>
              <p className="text-sm text-foreground">font-semibold, text-base</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Small text - Still bold</p>
              <p className="text-xs text-foreground">font-semibold, text-sm</p>
            </div>
          </DaisyCardContent>
        </DaisyCard>

        {/* Buttons */}
        <DaisyCard className="mb-8">
          <DaisyCardHeader>
            <DaisyCardTitle>Buttons - Thick Borders & Bold Text</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <DaisyButton className="w-full">Primary</DaisyButton>
                <p className="text-xs text-foreground">Default button</p>
              </div>
              <div className="space-y-2">
                <DaisyButton variant="secondary" className="w-full">Secondary</DaisyButton>
                <p className="text-xs text-foreground">Secondary variant</p>
              </div>
              <div className="space-y-2">
                <DaisyButton variant="outline" className="w-full">Outline</DaisyButton>
                <p className="text-xs text-foreground">Outline variant</p>
              </div>
              <div className="space-y-2">
                <DaisyButton variant="ghost" className="w-full">Ghost</DaisyButton>
                <p className="text-xs text-foreground">Ghost variant</p>
              </div>
            </div>
            
            <DaisySeparator className="my-6" />
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <DaisyButton size="sm" className="w-full">Small</DaisyButton>
                <p className="text-xs text-foreground">Small size</p>
              </div>
              <div className="space-y-2">
                <DaisyButton size="default" className="w-full">Default</DaisyButton>
                <p className="text-xs text-foreground">Default size</p>
              </div>
              <div className="space-y-2">
                <DaisyButton size="lg" className="w-full">Large</DaisyButton>
                <p className="text-xs text-foreground">Large size</p>
              </div>
            </div>
          </DaisyCardContent>
        </DaisyCard>

        {/* Form Elements */}
        <DaisyCard className="mb-8">
          <DaisyCardHeader>
            <DaisyCardTitle>Form Elements - Thick Black Borders</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Input Field</label>
              <DaisyInput placeholder="Enter text here..." />
              <p className="text-xs text-foreground">Thick black border, bold text</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Search Input</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground" />
                <DaisyInput placeholder="Search..." className="pl-10" />
              </div>
              <p className="text-xs text-foreground">With icon, consistent styling</p>
            </div>
          </DaisyCardContent>
        </DaisyCard>

        {/* Cards */}
        <DaisyCard className="mb-8">
          <DaisyCardHeader>
            <DaisyCardTitle>Cards - Clean & Consistent</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <DaisyCard>
                <DaisyCardHeader>
                  <DaisyCardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security
                  </DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent>
                  <p className="text-sm font-semibold text-foreground">
                    All security measures are active and monitoring.
                  </p>
                </DaisyCardContent>
              </DaisyCard>
              
              <DaisyCard>
                <DaisyCardHeader>
                  <DaisyCardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Compliance
                  </DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent>
                  <p className="text-sm font-semibold text-foreground">
                    System is fully compliant with regulations.
                  </p>
                </DaisyCardContent>
              </DaisyCard>
              
              <DaisyCard>
                <DaisyCardHeader>
                  <DaisyCardTitle className="flex items-center gap-2">
                    <DaisyAlertTriangle className="w-5 h-5" />
                    Alerts
                  </DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent>
                  <p className="text-sm font-semibold text-foreground">
                    No active alerts at this time.
                  </p>
                </DaisyCardContent>
              </DaisyCard>
            </div>
          </DaisyCardBody>
        </DaisyCard>

        {/* Badges & Status */}
        <DaisyCard className="mb-8">
          <DaisyCardHeader>
            <DaisyCardTitle>Badges & Status Indicators</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <DaisyBadge variant="default">Default</DaisyBadge>
                <DaisyBadge variant="secondary">Secondary</DaisyBadge>
                <DaisyBadge variant="outline">Outline</DaisyBadge>
                <DaisyBadge variant="error">Destructive</DaisyBadge>
              </div>
              
              <DaisySeparator />
              
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Progress Indicators</p>
                <DaisyProgress value={33} className="w-full" />
                <DaisyProgress value={66} className="w-full" />
                <DaisyProgress value={100} className="w-full" />
              </div>
            </div>
          </DaisyCardContent>
        </DaisyCard>

        {/* Icons */}
        <DaisyCard className="mb-8">
          <DaisyCardHeader>
            <DaisyCardTitle>Icons - Bold & Clear</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
              {[
                Shield,
                CheckCircle,
                AlertTriangle,
                Info,
                X,
                Search,
                Settings,
                User,
                Bell,
                Download
              ].map((Icon, index) => (
                <div key={index} className="flex flex-col items-center space-y-2">
                  <div className="p-3 border-2 border-border rounded-md bg-card">
                    <Icon className="w-6 h-6 text-foreground" />
                  </div>
                  <p className="text-xs text-foreground font-semibold">{Icon.name}</p>
                </div>
              ))}
            </div>
          </DaisyCardContent>
        </DaisyCard>

        {/* Layout Examples */}
        <DaisyCard className="mb-8">
          <DaisyCardHeader>
            <DaisyCardTitle>Layout Examples</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent>
            <div className="space-y-6">
              {/* Header Example */}
              <div className="border-2 border-border rounded-md p-4 bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-6 h-6 text-foreground" />
                    <h3 className="text-lg font-bold text-foreground">Dashboard Header</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DaisyButton variant="ghost" size="sm">
                      <Bell className="w-4 h-4" />
                    </DaisyButton>
                    <DaisyButton variant="ghost" size="sm">
                      <Settings className="w-4 h-4" />
                    </DaisyButton>
                    <DaisyButton variant="ghost" size="sm">
                      <User className="w-4 h-4" />
                    </DaisyButton>
                  </div>
                </div>
              </div>

              {/* Content Grid Example */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DaisyCard>
                  <DaisyCardHeader>
                    <DaisyCardTitle>Metric 1</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent>
                    <div className="text-2xl font-bold text-foreground">1,234</div>
                    <p className="text-sm font-semibold text-foreground">Total items</p>
                  </DaisyCardContent>
                </DaisyCard>
                
                <DaisyCard>
                  <DaisyCardHeader>
                    <DaisyCardTitle>Metric 2</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent>
                    <div className="text-2xl font-bold text-foreground">98.5%</div>
                    <p className="text-sm font-semibold text-foreground">Success rate</p>
                  </DaisyCardContent>
                </DaisyCard>
                
                <DaisyCard>
                  <DaisyCardHeader>
                    <DaisyCardTitle>Metric 3</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent>
                    <div className="text-2xl font-bold text-foreground">24/7</div>
                    <p className="text-sm font-semibold text-foreground">Uptime</p>
                  </DaisyCardContent>
                </DaisyCard>
              </div>
            </div>
          </DaisyCardBody>
        </DaisyCard>

        {/* Design Principles */}
        <DaisyCard>
          <DaisyCardHeader>
            <DaisyCardTitle>Design Principles</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-lg font-bold text-foreground">Visual Hierarchy</h4>
                <ul className="space-y-2 text-sm font-semibold text-foreground">
                  <li>• Bold Inter font for all text elements</li>
                  <li>• Thick black borders (2px) for definition</li>
                  <li>• Cream background (#F5F1E9) for warmth</li>
                  <li>• High contrast for accessibility</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-lg font-bold text-foreground">Consistency</h4>
                <ul className="space-y-2 text-sm font-semibold text-foreground">
                  <li>• Unified color palette across all components</li>
                  <li>• Consistent spacing and sizing</li>
                  <li>• Bold typography for readability</li>
                  <li>• Clean, minimal design approach</li>
                </ul>
              </div>
            </div>
          </DaisyCardContent>
        </DaisyCard>
      </div>
    </div>
  );
} 