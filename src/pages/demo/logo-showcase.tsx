import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogoPlaceholder } from '@/components/ui/logo';
import { Badge } from '@/components/ui/badge';
import { Folder, Upload, Code, Eye } from 'lucide-react';

const LogoShowcase: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAFAFA] p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#191919] font-inter mb-4">
            Riscura Logo Integration Guide
          </h1>
          <p className="text-xl text-gray-600 font-inter max-w-3xl mx-auto">
            Complete guide for placing and using your logo across the Riscura platform.
          </p>
        </div>

        {/* File Structure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-[#199BEC]" />
              Recommended File Structure
            </CardTitle>
            <CardDescription>
              Where to place your logo files in the project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
              <div className="space-y-1">
                <div>📁 public/</div>
                <div className="ml-4">📁 images/</div>
                <div className="ml-8">📁 logo/</div>
                <div className="ml-12">🖼️ logo.svg &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-400"># Primary logo (vector)</span></div>
                <div className="ml-12">🖼️ logo.png &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-400"># Fallback (high-res PNG)</span></div>
                <div className="ml-12">🖼️ logo-white.svg &nbsp;&nbsp;&nbsp;<span className="text-blue-400"># White version for dark backgrounds</span></div>
                <div className="ml-12">🖼️ logo-icon.svg &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-400"># Icon-only version (dolphin)</span></div>
                <div className="ml-12">🖼️ favicon.ico &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-400"># Browser favicon</span></div>
                <div className="ml-8">📁 brand/</div>
                <div className="ml-12">🖼️ logo-full.svg &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-400"># Logo with text</span></div>
                <div className="ml-12">🖼️ logo-mark.svg &nbsp;&nbsp;&nbsp;<span className="text-blue-400"># Symbol/mascot only</span></div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800 font-inter">Upload Instructions</span>
              </div>
              <p className="text-sm text-blue-700 font-inter">
                Simply drag and drop your logo files into the <code className="bg-blue-100 px-1 rounded">public/images/logo/</code> directory. 
                The paths will automatically work with the Logo component.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Logo Variations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-[#199BEC]" />
              Logo Variations & Sizes
            </CardTitle>
            <CardDescription>
              Different logo formats for various use cases (showing placeholders)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Full Logo Sizes */}
              <div className="space-y-4">
                <h3 className="font-semibold text-[#191919] font-inter">Full Logo</h3>
                <div className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <LogoPlaceholder size="sm" />
                    <Badge variant="outline">Small</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <LogoPlaceholder size="md" />
                    <Badge variant="outline">Medium</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <LogoPlaceholder size="lg" />
                    <Badge variant="outline">Large</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <LogoPlaceholder size="xl" />
                    <Badge variant="outline">X-Large</Badge>
                  </div>
                </div>
              </div>

              {/* Icon Only */}
              <div className="space-y-4">
                <h3 className="font-semibold text-[#191919] font-inter">Icon Only</h3>
                <div className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <LogoPlaceholder variant="icon" size="sm" />
                    <Badge variant="outline">Small</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <LogoPlaceholder variant="icon" size="md" />
                    <Badge variant="outline">Medium</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <LogoPlaceholder variant="icon" size="lg" />
                    <Badge variant="outline">Large</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <LogoPlaceholder variant="icon" size="xl" />
                    <Badge variant="outline">X-Large</Badge>
                  </div>
                </div>
              </div>

              {/* Use Cases */}
              <div className="space-y-4">
                <h3 className="font-semibold text-[#191919] font-inter">Use Cases</h3>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <LogoPlaceholder size="md" />
                    </div>
                    <p className="text-xs text-gray-600 font-inter">Header/Navigation</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <LogoPlaceholder variant="icon" size="sm" />
                    </div>
                    <p className="text-xs text-gray-600 font-inter">Mobile/Compact</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <LogoPlaceholder size="xl" />
                    </div>
                    <p className="text-xs text-gray-600 font-inter">Landing Page</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Code Examples */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-[#199BEC]" />
              Usage Examples
            </CardTitle>
            <CardDescription>
              How to implement the logo in your components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Import Statement */}
              <div>
                <h4 className="font-medium text-[#191919] font-inter mb-2">1. Import the Logo Component</h4>
                <div className="bg-gray-900 text-gray-300 p-4 rounded-lg font-mono text-sm">
                  <div className="text-purple-400">import</div> Logo <div className="text-purple-400">from</div> <div className="text-green-400">'@/components/ui/logo'</div>;
                </div>
              </div>

              {/* Basic Usage */}
              <div>
                <h4 className="font-medium text-[#191919] font-inter mb-2">2. Basic Usage</h4>
                <div className="bg-gray-900 text-gray-300 p-4 rounded-lg font-mono text-sm space-y-2">
                  <div><div className="text-gray-500">{/* Default logo (medium size) */}</div></div>
                  <div>&lt;<span className="text-blue-400">Logo</span> /&gt;</div>
                  <div></div>
                  <div><div className="text-gray-500">{/* Icon only for mobile */}</div></div>
                  <div>&lt;<span className="text-blue-400">Logo</span> <span className="text-yellow-400">variant</span>=<span className="text-green-400">"icon"</span> <span className="text-yellow-400">size</span>=<span className="text-green-400">"sm"</span> /&gt;</div>
                  <div></div>
                  <div><div className="text-gray-500">{/* Large logo for hero sections */}</div></div>
                  <div>&lt;<span className="text-blue-400">Logo</span> <span className="text-yellow-400">size</span>=<span className="text-green-400">"xl"</span> <span className="text-yellow-400">priority</span> /&gt;</div>
                </div>
              </div>

              {/* Direct Image Usage */}
              <div>
                <h4 className="font-medium text-[#191919] font-inter mb-2">3. Direct Image Usage (Alternative)</h4>
                <div className="bg-gray-900 text-gray-300 p-4 rounded-lg font-mono text-sm space-y-2">
                  <div><span className="text-purple-400">import</span> Image <span className="text-purple-400">from</span> <span className="text-green-400">'next/image'</span>;</div>
                  <div></div>
                  <div>&lt;<span className="text-blue-400">Image</span></div>
                  <div>&nbsp;&nbsp;<span className="text-yellow-400">src</span>=<span className="text-green-400">"/images/logo/logo.svg"</span></div>
                  <div>&nbsp;&nbsp;<span className="text-yellow-400">alt</span>=<span className="text-green-400">"Riscura Logo"</span></div>
                  <div>&nbsp;&nbsp;<span className="text-yellow-400">width</span>={<span className="text-orange-400">120</span>}</div>
                  <div>&nbsp;&nbsp;<span className="text-yellow-400">height</span>={<span className="text-orange-400">40</span>}</div>
                  <div>/&gt;</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Format Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>File Format Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-[#191919] font-inter mb-2">SVG (Recommended)</h4>
                <ul className="text-sm text-gray-600 space-y-1 font-inter">
                  <li>• Scalable to any size</li>
                  <li>• Small file size</li>
                  <li>• Perfect for web</li>
                  <li>• Matches your #199BEC color exactly</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-[#191919] font-inter mb-2">PNG (Fallback)</h4>
                <ul className="text-sm text-gray-600 space-y-1 font-inter">
                  <li>• High resolution (2x/3x)</li>
                  <li>• Transparent background</li>
                  <li>• Good for email/external use</li>
                  <li>• 200x200px minimum</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-[#191919] font-inter mb-2">ICO (Favicon)</h4>
                <ul className="text-sm text-gray-600 space-y-1 font-inter">
                  <li>• 32x32px icon version</li>
                  <li>• Browser tab display</li>
                  <li>• Simplified dolphin design</li>
                  <li>• Multiple sizes included</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LogoShowcase; 