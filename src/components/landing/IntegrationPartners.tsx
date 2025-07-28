'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

// Define integration partners type
interface IntegrationPartner {
  id: string;
  name: string;
  logo: string;
  color: string;
  description: string;
  available: boolean;
}

// Define integration partners with their logos and details
const integrationPartners: IntegrationPartner[] = [
  {
    id: 'microsoft',
    name: 'Microsoft SharePoint',
    logo: '/logos/sharepoint.png',
    color: '#0078D4',
    description: 'SharePoint document management integration',
    available: false
  },
  {
    id: 'google',
    name: 'Google Drive',
    logo: '/logos/googledrive.png',
    color: '#4285F4',
    description: 'Google Drive file import and sync',
    available: false
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    logo: '/logos/dropbox.png',
    color: '#0061FF',
    description: 'Dropbox Business integration',
    available: false
  },
  {
    id: 'slack',
    name: 'Slack',
    logo: '/logos/Slack.png',
    color: '#4A154B',
    description: 'Slack notifications and alerts',
    available: false
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    logo: '/logos/Teams.png',
    color: '#6264A7',
    description: 'Teams collaboration integration',
    available: false
  },
  {
    id: 'openai',
    name: 'OpenAI',
    logo: '/logos/OPenAi.png',
    color: '#000000',
    description: 'AI-powered risk analysis',
    available: false
  }
];

export const IntegrationPartners: React.FC = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [hoveredPartner, setHoveredPartner] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // Check for prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || prefersReducedMotion) return;

    let scrollPosition = 0;
    const scrollSpeed = 1; // pixels per frame

    const animate = () => {
      if (!isPaused && scrollContainer) {
        scrollPosition += scrollSpeed;
        
        // Reset scroll when reaching the end
        if (scrollPosition >= scrollContainer.scrollWidth / 2) {
          scrollPosition = 0;
        }
        
        scrollContainer.scrollLeft = scrollPosition;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPaused, prefersReducedMotion]);

  return (
    <section className="py-16 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Trusted by Leading Organizations
          </h2>
          <p className="text-xl text-gray-600">
            Integrated with <span className="font-semibold text-blue-600">{integrationPartners.length}+</span> industry-leading platforms
          </p>
        </div>

        <div className="relative">
          {/* Gradient overlays for smooth edges */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />
          
          {/* Scrolling container */}
          <div
            ref={scrollRef}
            className="flex overflow-x-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => {
              setIsPaused(false);
              setHoveredPartner(null);
            }}
            role="region"
            aria-label="Integration partners carousel"
            aria-live={prefersReducedMotion ? "polite" : "off"}
          >
            {/* Duplicate the partners array for infinite scroll effect */}
            {[...integrationPartners, ...integrationPartners].map((partner, index) => (
              <div
                key={`${partner.id}-${index}`}
                className="flex-shrink-0 px-8"
                onMouseEnter={() => setHoveredPartner(partner.id)}
                onMouseLeave={() => setHoveredPartner(null)}
                onFocus={() => {
                  setHoveredPartner(partner.id);
                  setFocusedIndex(index);
                  setIsPaused(true);
                }}
                onBlur={() => {
                  setHoveredPartner(null);
                  setFocusedIndex(null);
                  setIsPaused(false);
                }}
                tabIndex={0}
                role="button"
                aria-label={`${partner.name} - ${partner.available ? partner.description : 'Coming soon'}`}
              >
                <div className="relative w-32 h-24 flex items-center justify-center transition-all duration-300 transform hover:scale-110 focus-within:scale-110">
                  <div 
                    className={`
                      w-full h-full flex flex-col items-center justify-center rounded-lg p-4
                      ${hoveredPartner === partner.id ? 'bg-white shadow-lg' : 'bg-transparent'}
                      transition-all duration-300
                    `}
                  >
                    {/* Logo */}
                    <div className="relative w-12 h-12 mb-2">
                      <Image
                        src={partner.logo}
                        alt={partner.name}
                        fill
                        className="object-contain transition-all duration-300"
                        style={{
                          filter: hoveredPartner === partner.id 
                            ? 'none' 
                            : partner.available 
                              ? 'grayscale(0%) opacity(1)' 
                              : 'grayscale(100%) opacity(0.5)',
                          transform: hoveredPartner === partner.id ? 'scale(1.1)' : 'scale(1)'
                        }}
                      />
                    </div>
                    
                    {/* Name */}
                    <div className={`
                      text-center font-medium text-xs leading-tight
                      ${hoveredPartner === partner.id ? 'text-gray-900' : 'text-gray-500'}
                      transition-colors duration-300
                    `}>
                      {partner.name}
                    </div>
                  </div>
                  
                  {/* Hover card for Coming Soon */}
                  {hoveredPartner === partner.id && !partner.available && (
                    <div 
                      role="tooltip"
                      aria-hidden="false"
                      className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 z-20"
                    >
                      <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-xl animate-fadeIn">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span className="font-semibold text-sm whitespace-nowrap">Coming Soon</span>
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-blue-600" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Connect your existing tools and workflows seamlessly
          </p>
          {prefersReducedMotion && (
            <p className="text-xs text-gray-400 mt-2">
              Animation paused for accessibility. Use Tab to navigate through partners.
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -10px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </section>
  );
};