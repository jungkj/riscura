import React from 'react';

const SimpleLogoGuide: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAFAFA] p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#191919] font-inter mb-4">
            Riscura Logo Placement Guide
          </h1>
          <p className="text-xl text-gray-600 font-inter">
            Where and how to place your logo files in the Next.js project
          </p>
        </div>

        {/* Directory Structure */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-[#191919] font-inter mb-4">
            📁 Recommended File Structure
          </h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
            <div className="space-y-1">
              <div>📁 public/</div>
              <div className="ml-4">📁 images/</div>
              <div className="ml-8">📁 logo/</div>
              <div className="ml-12 text-cyan-400">🖼️ logo.svg</div>
              <div className="ml-16 text-blue-400"># Primary logo (vector format)</div>
              <div className="ml-12 text-cyan-400">🖼️ logo.png</div>
              <div className="ml-16 text-blue-400"># High-res PNG fallback</div>
              <div className="ml-12 text-cyan-400">🖼️ logo-white.svg</div>
              <div className="ml-16 text-blue-400"># White version for dark backgrounds</div>
              <div className="ml-12 text-cyan-400">🖼️ logo-icon.svg</div>
              <div className="ml-16 text-blue-400"># Icon-only version (dolphin)</div>
              <div className="ml-12 text-cyan-400">🖼️ favicon.ico</div>
              <div className="ml-16 text-blue-400"># Browser favicon (32x32px)</div>
            </div>
          </div>
        </div>

        {/* Upload Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-[#199BEC] font-inter mb-4">
            📤 How to Upload Your Logo
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 font-inter">
            <li>Save your DALL-E generated logo as an SVG file named <code className="bg-blue-100 px-1 rounded">logo.svg</code></li>
            <li>Create the directory structure: <code className="bg-blue-100 px-1 rounded">public/images/logo/</code></li>
            <li>Drag and drop your logo file into the <code className="bg-blue-100 px-1 rounded">public/images/logo/</code> folder</li>
            <li>The logo will be accessible at <code className="bg-blue-100 px-1 rounded">/images/logo/logo.svg</code></li>
          </ol>
        </div>

        {/* Usage Examples */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-[#191919] font-inter mb-4">
            💻 How to Use in Code
          </h2>
          
          <h3 className="text-lg font-medium text-[#191919] font-inter mb-2">
            Option 1: Next.js Image Component (Recommended)
          </h3>
          <div className="bg-gray-900 text-gray-300 p-4 rounded-lg font-mono text-sm mb-4">
            <div className="space-y-1">
              <div><span className="text-purple-400">import</span> Image <span className="text-purple-400">from</span> <span className="text-green-400">'next/image'</span>;</div>
              <div></div>
              <div>&lt;<span className="text-blue-400">Image</span></div>
              <div>&nbsp;&nbsp;<span className="text-yellow-400">src</span>=<span className="text-green-400">"/images/logo/logo.svg"</span></div>
              <div>&nbsp;&nbsp;<span className="text-yellow-400">alt</span>=<span className="text-green-400">"Riscura Logo"</span></div>
              <div>&nbsp;&nbsp;<span className="text-yellow-400">width</span>={<span className="text-orange-400">120</span>}</div>
              <div>&nbsp;&nbsp;<span className="text-yellow-400">height</span>={<span className="text-orange-400">40</span>}</div>
              <div>&nbsp;&nbsp;<span className="text-yellow-400">priority</span> <span className="text-gray-500">// For above-the-fold logos</span></div>
              <div>/&gt;</div>
            </div>
          </div>

          <h3 className="text-lg font-medium text-[#191919] font-inter mb-2">
            Option 2: Regular HTML Image
          </h3>
          <div className="bg-gray-900 text-gray-300 p-4 rounded-lg font-mono text-sm mb-4">
            <div>&lt;<span className="text-blue-400">img</span> <span className="text-yellow-400">src</span>=<span className="text-green-400">"/images/logo/logo.svg"</span> <span className="text-yellow-400">alt</span>=<span className="text-green-400">"Riscura Logo"</span> <span className="text-yellow-400">width</span>=<span className="text-green-400">"120"</span> /&gt;</div>
          </div>

          <h3 className="text-lg font-medium text-[#191919] font-inter mb-2">
            Option 3: CSS Background
          </h3>
          <div className="bg-gray-900 text-gray-300 p-4 rounded-lg font-mono text-sm">
            <div className="space-y-1">
              <div><span className="text-purple-400">.logo</span> {`{`}</div>
              <div>&nbsp;&nbsp;<span className="text-yellow-400">background-image</span>: <span className="text-green-400">url('/images/logo/logo.svg')</span>;</div>
              <div>&nbsp;&nbsp;<span className="text-yellow-400">background-size</span>: <span className="text-green-400">contain</span>;</div>
              <div>&nbsp;&nbsp;<span className="text-yellow-400">background-repeat</span>: <span className="text-green-400">no-repeat</span>;</div>
              <div>{`}`}</div>
            </div>
          </div>
        </div>

        {/* File Format Guide */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-[#191919] font-inter mb-4">
            🎨 File Format Recommendations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-[#199BEC] font-inter mb-2">SVG (Best)</h4>
              <ul className="text-sm text-gray-600 space-y-1 font-inter">
                <li>• Scales to any size perfectly</li>
                <li>• Small file size</li>
                <li>• Matches your #199BEC color exactly</li>
                <li>• Works great for web</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-[#199BEC] font-inter mb-2">PNG (Backup)</h4>
              <ul className="text-sm text-gray-600 space-y-1 font-inter">
                <li>• High resolution (2x or 3x)</li>
                <li>• Transparent background</li>
                <li>• Good for emails/external use</li>
                <li>• Minimum 200x200px</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-[#199BEC] font-inter mb-2">ICO (Favicon)</h4>
              <ul className="text-sm text-gray-600 space-y-1 font-inter">
                <li>• 32x32px simple version</li>
                <li>• Shows in browser tabs</li>
                <li>• Simplified dolphin design</li>
                <li>• Multiple sizes in one file</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Color System */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-[#191919] font-inter mb-4">
            🎨 Riscura Color System
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-8 h-8 bg-[#FAFAFA] border border-gray-300 rounded"></div>
              <div>
                <div className="font-medium text-[#191919] font-inter">Background</div>
                <div className="text-sm text-gray-600 font-mono">#FAFAFA</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-8 h-8 bg-[#191919] rounded"></div>
              <div>
                <div className="font-medium text-[#191919] font-inter">Primary</div>
                <div className="text-sm text-gray-600 font-mono">#191919</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-8 h-8 bg-[#199BEC] rounded"></div>
              <div>
                <div className="font-medium text-[#191919] font-inter">Accent</div>
                <div className="text-sm text-gray-600 font-mono">#199BEC</div>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 font-inter mt-4">
            These are the exact colors to use in your DALL-E prompt for perfect brand consistency.
          </p>
        </div>

        {/* Current Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-semibold text-green-800 font-inter mb-2">
            ✅ Ready for Your Logo!
          </h2>
          <p className="text-green-700 font-inter">
            The directory structure has been created at <code className="bg-green-100 px-1 rounded">public/images/logo/</code>.
            Simply upload your DALL-E generated logo files and they'll work automatically!
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleLogoGuide; 