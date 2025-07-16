'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Cloud, 
  Database, 
  Server, 
  HardDrive, 
  Share2, 
  FileText,
  Layers,
  Globe,
  Cpu,
  Package,
  Briefcase,
  BarChart3,
  PieChart,
  Activity,
  Zap
} from 'lucide-react';

// Define integration partners with their logos and details
const integrationPartners = [
  {
    id: 'microsoft',
    name: 'Microsoft SharePoint',
    icon: FileText,
    color: '#0078D4',
    description: 'SharePoint document management integration',
    available: true
  },
  {
    id: 'google',
    name: 'Google Drive',
    icon: Cloud,
    color: '#4285F4',
    description: 'Google Drive file import and sync',
    available: true
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    icon: Package,
    color: '#0061FF',
    description: 'Dropbox Business integration',
    available: false
  },
  {
    id: 'box',
    name: 'Box',
    icon: HardDrive,
    color: '#0061D5',
    description: 'Box cloud content management',
    available: false
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    icon: Cloud,
    color: '#0078D4',
    description: 'OneDrive for Business integration',
    available: false
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: Share2,
    color: '#4A154B',
    description: 'Slack notifications and alerts',
    available: false
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    icon: Layers,
    color: '#6264A7',
    description: 'Teams collaboration integration',
    available: false
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    icon: Cloud,
    color: '#00A1E0',
    description: 'Salesforce CRM integration',
    available: false
  },
  {
    id: 'sap',
    name: 'SAP',
    icon: Briefcase,
    color: '#0070BA',
    description: 'SAP ERP integration',
    available: false
  },
  {
    id: 'oracle',
    name: 'Oracle',
    icon: Database,
    color: '#F80000',
    description: 'Oracle database connectivity',
    available: false
  },
  {
    id: 'aws',
    name: 'AWS',
    icon: Server,
    color: '#FF9900',
    description: 'AWS S3 storage integration',
    available: false
  },
  {
    id: 'azure',
    name: 'Microsoft Azure',
    icon: Cloud,
    color: '#0078D4',
    description: 'Azure cloud services integration',
    available: false
  },
  {
    id: 'snowflake',
    name: 'Snowflake',
    icon: Database,
    color: '#29B5E8',
    description: 'Snowflake data warehouse',
    available: false
  },
  {
    id: 'tableau',
    name: 'Tableau',
    icon: BarChart3,
    color: '#E97627',
    description: 'Tableau analytics integration',
    available: false
  },
  {
    id: 'powerbi',
    name: 'Power BI',
    icon: PieChart,
    color: '#F2C811',
    description: 'Power BI reporting integration',
    available: false
  }
];

export const IntegrationPartners: React.FC = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [hoveredPartner, setHoveredPartner] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

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
  }, [isPaused]);

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
          >
            {/* Duplicate the partners array for infinite scroll effect */}
            {[...integrationPartners, ...integrationPartners].map((partner, index) => (
              <div
                key={`${partner.id}-${index}`}
                className="flex-shrink-0 px-8"
                onMouseEnter={() => setHoveredPartner(partner.id)}
                onMouseLeave={() => setHoveredPartner(null)}
              >
                <div className="relative w-32 h-24 flex items-center justify-center transition-all duration-300 transform hover:scale-110">
                  <div 
                    className={`
                      w-full h-full flex flex-col items-center justify-center rounded-lg p-4
                      ${hoveredPartner === partner.id ? 'bg-white shadow-lg' : 'bg-transparent'}
                      transition-all duration-300
                    `}
                  >
                    {/* Icon */}
                    <partner.icon 
                      className={`
                        w-8 h-8 mb-2 transition-all duration-300
                        ${hoveredPartner === partner.id ? '' : 'text-gray-400'}
                      `}
                      style={{
                        color: hoveredPartner === partner.id ? partner.color : undefined
                      }}
                    />
                    {/* Name */}
                    <div className={`
                      text-center font-medium text-xs leading-tight
                      ${hoveredPartner === partner.id ? 'text-gray-900' : 'text-gray-500'}
                      transition-colors duration-300
                    `}>
                      {partner.name}
                    </div>
                  </div>
                  
                  {/* Tooltip on hover */}
                  {hoveredPartner === partner.id && (
                    <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-white text-xs rounded whitespace-nowrap opacity-0 animate-fadeIn ${
                      partner.available ? 'bg-gray-900' : 'bg-blue-600'
                    }`}>
                      {partner.available ? partner.description : '✨ Coming soon!'}
                      <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent ${
                        partner.available ? 'border-t-gray-900' : 'border-t-blue-600'
                      }`} />
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
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -5px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </section>
  );
};