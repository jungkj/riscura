'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, AlertTriangle, Search } from 'lucide-react';

export function StyleGuide() {
  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Riscura Style Guide</h1>
          <p className="text-lg text-foreground font-semibold">
            Consistent theming with thick bold black lines, cream background, and bold Inter text
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Typography - Bold Inter Font</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Heading 1 - Bold</h1>
              <p className="text-sm text-foreground">font-bold, text-4xl</p>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Heading 2 - Bold</h2>
              <p className="text-sm text-foreground">font-bold, text-3xl</p>
            </div>
            <div>
              <p className="text-base font-semibold text-foreground mb-2">
                Body text - All text is bold for maximum readability and consistency
              </p>
              <p className="text-sm text-foreground">font-semibold, text-base</p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Buttons - Thick Borders & Bold Text</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Button className="w-full">Primary</Button>
                <p className="text-xs text-foreground">Default button</p>
              </div>
              <div className="space-y-2">
                <Button variant="secondary" className="w-full">Secondary</Button>
                <p className="text-xs text-foreground">Secondary variant</p>
              </div>
              <div className="space-y-2">
                <Button variant="outline" className="w-full">Outline</Button>
                <p className="text-xs text-foreground">Outline variant</p>
              </div>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full">Ghost</Button>
                <p className="text-xs text-foreground">Ghost variant</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Form Elements - Thick Black Borders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Input Field</label>
              <Input placeholder="Enter text here..." />
              <p className="text-xs text-foreground">Thick black border, bold text</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Search Input</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground" />
                <Input placeholder="Search..." className="pl-10" />
              </div>
              <p className="text-xs text-foreground">With icon, consistent styling</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Design Principles</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 