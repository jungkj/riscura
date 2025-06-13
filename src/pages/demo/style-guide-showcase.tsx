'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StyleGuide } from '@/components/ui/style-guide';
import { CheckCircle, Palette, Shield } from 'lucide-react';

const StyleGuideShowcase: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAFAFA] p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#191919] font-inter mb-4">
            RCSA Design System Style Guide
          </h1>
          <p className="text-xl text-gray-600 font-inter max-w-4xl mx-auto">
            Complete design system documentation for the RCSA platform. 
            Features the Notion-like aesthetic with cream backgrounds, clean typography, and consistent spacing.
          </p>
          <div className="flex items-center justify-center gap-4 mt-6">
            <Badge className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Phase 8 Complete
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Production Ready
            </Badge>
          </div>
        </div>

        {/* Quick Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="text-center">
              <Palette className="h-8 w-8 mx-auto text-[#199BEC] mb-2" />
              <CardTitle className="font-inter">Color System</CardTitle>
              <CardDescription>
                Consistent palette with cream backgrounds and blue accents
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex justify-center gap-2 mb-4">
                <div className="w-6 h-6 rounded bg-[#FAFAFA] border border-gray-300"></div>
                <div className="w-6 h-6 rounded bg-[#191919]"></div>
                <div className="w-6 h-6 rounded bg-[#199BEC]"></div>
              </div>
              <p className="text-sm text-gray-600 font-inter">
                12 semantic colors defined
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="h-8 w-8 mx-auto text-[#199BEC] mb-2 flex items-center justify-center">
                <span className="font-bold text-xl">Aa</span>
              </div>
              <CardTitle className="font-inter">Typography</CardTitle>
              <CardDescription>
                Inter font family with consistent hierarchy
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-1 mb-4">
                <div className="text-xs font-inter">12px - Caption</div>
                <div className="text-sm font-inter">14px - Secondary</div>
                <div className="text-base font-inter">16px - Body</div>
                <div className="text-lg font-inter">18px - Large</div>
              </div>
              <p className="text-sm text-gray-600 font-inter">
                8 sizes, 4 weights
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="h-8 w-8 mx-auto text-[#199BEC] mb-2 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-1">
                  <div className="w-2 h-2 bg-current rounded-sm"></div>
                  <div className="w-2 h-2 bg-current rounded-sm"></div>
                  <div className="w-2 h-2 bg-current rounded-sm"></div>
                  <div className="w-2 h-2 bg-current rounded-sm"></div>
                </div>
              </div>
              <CardTitle className="font-inter">8px Grid</CardTitle>
              <CardDescription>
                Consistent spacing system based on 8px units
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex justify-center items-end gap-1 mb-4">
                <div className="w-2 h-2 bg-[#199BEC]"></div>
                <div className="w-2 h-4 bg-[#199BEC]"></div>
                <div className="w-2 h-6 bg-[#199BEC]"></div>
                <div className="w-2 h-8 bg-[#199BEC]"></div>
              </div>
              <p className="text-sm text-gray-600 font-inter">
                13 spacing units
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Implementation Status */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-semibold text-green-800 font-inter">
                Implementation Complete
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-700 font-inter">Color Consistency</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-700 font-inter">Typography System</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-700 font-inter">Spacing Grid</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-700 font-inter">Accessibility</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Style Guide */}
        <StyleGuide />

        {/* Footer */}
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold text-[#191919] font-inter mb-2">
              Design System Ready
            </h3>
            <p className="text-sm text-gray-600 font-inter max-w-2xl mx-auto">
              The RCSA platform design system is fully implemented with consistent colors, typography, spacing, and components. 
              All elements follow the Notion-like aesthetic with proper accessibility and responsive design.
            </p>
            <div className="flex justify-center gap-2 mt-4">
              <Button size="sm">
                View Components
              </Button>
              <Button variant="secondary" size="sm">
                Implementation Guide
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StyleGuideShowcase; 