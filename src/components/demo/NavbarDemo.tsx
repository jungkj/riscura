"use client";

import React, { useState } from 'react';
import { 
  Navbar, 
  NavBody, 
  NavItems, 
  MobileNav, 
  MobileNavHeader, 
  MobileNavMenu,
  MobileNavToggle,
  NavbarLogo, 
  NavbarButton 
} from '@/components/ui/resizable-navbar';

export default function NavbarDemo() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Features", link: "#features" },
    { name: "Pricing", link: "#pricing" },
    { name: "About", link: "#about" },
    { name: "Contact", link: "#contact" },
  ];

  return (
    <>
      <Navbar>
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <div className="flex items-center space-x-3 flex-shrink-0">
            <NavbarButton variant="secondary" className="px-3 py-2 text-sm whitespace-nowrap">
              Login
            </NavbarButton>
            <NavbarButton variant="gradient" className="px-3 py-2 text-sm whitespace-nowrap">
              Get Started
            </NavbarButton>
          </div>
        </NavBody>
        
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle 
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>
          
          <MobileNavMenu 
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <a
                key={idx}
                href={item.link}
                className="block px-4 py-3 text-gray-700 hover:text-[#199BEC] font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </a>
            ))}
            <div className="flex flex-col space-y-3 pt-4 border-t border-gray-200">
              <NavbarButton variant="secondary" className="w-full justify-center">
                Login
              </NavbarButton>
              <NavbarButton variant="gradient" className="w-full justify-center">
                Get Started
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      {/* Demo Content to Show Scroll Behavior */}
      <div className="pt-20">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Resizable Navbar Demo
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Scroll down to see the navbar shrink and transform with beautiful animations
              </p>
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Key Features:</h2>
                <ul className="text-left space-y-3 text-gray-700">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-[#199BEC] rounded-full mr-3"></div>
                    Shrinks to 40% width when scrolled past 100px
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-[#199BEC] rounded-full mr-3"></div>
                    Smooth spring animations with backdrop blur
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-[#199BEC] rounded-full mr-3"></div>
                    Responsive mobile navigation with hamburger menu
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-[#199BEC] rounded-full mr-3"></div>
                    Integrated with our #199BEC accent color system
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Spacer content to enable scrolling */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 p-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Section {i + 2}
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Keep scrolling to see how the navbar behaves at different scroll positions. 
                  The navbar will smoothly transition between its full width and compact states,
                  providing an elegant user experience that adapts to user interaction.
                </p>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#199BEC]/10 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-800 mb-2">Smooth Transitions</h3>
                    <p className="text-gray-600">Spring-based animations create fluid motion</p>
                  </div>
                  <div className="bg-[#199BEC]/10 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-800 mb-2">Responsive Design</h3>
                    <p className="text-gray-600">Works perfectly on all device sizes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
} 