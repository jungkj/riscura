import React from 'react';
import Image from 'next/image';

const LogoTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAFAFA] p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#191919] font-inter mb-4">
            🎉 Your Riscura Logo is Live!
          </h1>
          <p className="text-xl text-gray-600 font-inter">
            Testing your uploaded logo in different sizes and contexts
          </p>
        </div>

        {/* Logo Showcase */}
        <div className="bg-white border rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-[#191919] font-inter mb-6 text-center">
            Logo Variations
          </h2>
          
          <div className="space-y-8">
            {/* Large - Hero/Landing */}
            <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-lg">
              <h3 className="text-lg font-medium text-[#191919] font-inter mb-4">
                Large (Hero/Landing Page)
              </h3>
              <Image
                src="/images/logo/riscura.png"
                alt="Riscura Logo"
                width={240}
                height={80}
                className="mx-auto object-contain"
                priority
              />
              <p className="text-sm text-gray-500 mt-2 font-inter">240x80px</p>
            </div>

            {/* Medium - Header/Navigation */}
            <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-lg">
              <h3 className="text-lg font-medium text-[#191919] font-inter mb-4">
                Medium (Header/Navigation)
              </h3>
              <Image
                src="/images/logo/riscura.png"
                alt="Riscura Logo"
                width={120}
                height={40}
                className="mx-auto object-contain"
              />
              <p className="text-sm text-gray-500 mt-2 font-inter">120x40px</p>
            </div>

            {/* Small - Compact/Mobile */}
            <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-lg">
              <h3 className="text-lg font-medium text-[#191919] font-inter mb-4">
                Small (Mobile/Compact)
              </h3>
              <Image
                src="/images/logo/riscura.png"
                alt="Riscura Logo"
                width={80}
                height={28}
                className="mx-auto object-contain"
              />
              <p className="text-sm text-gray-500 mt-2 font-inter">80x28px</p>
            </div>
          </div>
        </div>

        {/* Context Examples */}
        <div className="bg-white border rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-[#191919] font-inter mb-6">
            In Context Examples
          </h2>
          
          <div className="space-y-6">
            {/* Header Example */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image
                    src="/images/logo/riscura.png"
                    alt="Riscura Logo"
                    width={100}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 font-inter">Dashboard</span>
                  <span className="text-sm text-gray-600 font-inter">Reports</span>
                  <span className="text-sm text-gray-600 font-inter">Settings</span>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-2 text-sm text-gray-500 font-inter">
                Header/Navigation Bar Example
              </div>
            </div>

            {/* Login Card Example */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-white p-8 text-center">
                <Image
                  src="/images/logo/riscura.png"
                  alt="Riscura Logo"
                  width={160}
                  height={54}
                  className="mx-auto object-contain mb-6"
                />
                <h3 className="text-xl font-semibold text-[#191919] font-inter mb-2">
                  Welcome to Riscura
                </h3>
                <p className="text-gray-600 font-inter mb-4">
                  Sign in to your account
                </p>
                <div className="space-y-3 max-w-sm mx-auto">
                  <input 
                    type="email" 
                    placeholder="Email" 
                    className="w-full px-3 py-2 border rounded-lg font-inter"
                  />
                  <input 
                    type="password" 
                    placeholder="Password" 
                    className="w-full px-3 py-2 border rounded-lg font-inter"
                  />
                  <button className="w-full bg-[#199BEC] text-white py-2 rounded-lg font-inter hover:bg-blue-600 transition-colors">
                    Sign In
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-2 text-sm text-gray-500 font-inter">
                Login/Auth Page Example
              </div>
            </div>

            {/* Dark Background Example */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-[#191919] p-8 text-center">
                <Image
                  src="/images/logo/riscura.png"
                  alt="Riscura Logo"
                  width={140}
                  height={46}
                  className="mx-auto object-contain mb-4"
                />
                <h3 className="text-xl font-semibold text-white font-inter mb-2">
                  Risk & Compliance Platform
                </h3>
                <p className="text-gray-300 font-inter">
                  Streamline your compliance workflow
                </p>
              </div>
              <div className="bg-gray-50 px-6 py-2 text-sm text-gray-500 font-inter">
                Dark Background Example
              </div>
            </div>
          </div>
        </div>

        {/* Implementation Code */}
        <div className="bg-white border rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-[#191919] font-inter mb-6">
            💻 How to Use Your Logo
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-[#191919] font-inter mb-2">
                Next.js Image Component (Recommended)
              </h3>
              <div className="bg-gray-900 text-gray-300 p-4 rounded-lg font-mono text-sm">
                <div className="space-y-1">
                  <div><span className="text-purple-400">import</span> Image <span className="text-purple-400">from</span> <span className="text-green-400">'next/image'</span>;</div>
                  <div></div>
                  <div>&lt;<span className="text-blue-400">Image</span></div>
                  <div>&nbsp;&nbsp;<span className="text-yellow-400">src</span>=<span className="text-green-400">"/images/logo/riscura.png"</span></div>
                  <div>&nbsp;&nbsp;<span className="text-yellow-400">alt</span>=<span className="text-green-400">"Riscura Logo"</span></div>
                  <div>&nbsp;&nbsp;<span className="text-yellow-400">width</span>={<span className="text-orange-400">120</span>}</div>
                  <div>&nbsp;&nbsp;<span className="text-yellow-400">height</span>={<span className="text-orange-400">40</span>}</div>
                  <div>&nbsp;&nbsp;<span className="text-yellow-400">className</span>=<span className="text-green-400">"object-contain"</span></div>
                  <div>/&gt;</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-[#191919] font-inter mb-2">
                Using the Logo Component
              </h3>
              <div className="bg-gray-900 text-gray-300 p-4 rounded-lg font-mono text-sm">
                <div className="space-y-1">
                  <div><span className="text-purple-400">import</span> Logo <span className="text-purple-400">from</span> <span className="text-green-400">'@/components/ui/logo'</span>;</div>
                  <div></div>
                  <div>&lt;<span className="text-blue-400">Logo</span> <span className="text-yellow-400">size</span>=<span className="text-green-400">"md"</span> /&gt;</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-semibold text-green-800 font-inter mb-2">
            🎉 Logo Successfully Integrated!
          </h2>
          <p className="text-green-700 font-inter">
            Your Riscura logo is now ready to use throughout your platform. 
            The Logo component has been updated to use your uploaded <code className="bg-green-100 px-1 rounded">riscura.png</code> file.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LogoTest; 