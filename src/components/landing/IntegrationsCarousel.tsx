'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

// Integration data - these would typically be stored in public/images/integrations/
const integrations = [
  {
    name: 'Microsoft SharePoint',
    logo: '/images/integrations/sharepoint.svg',
    category: 'Document Management'
  },
  {
    name: 'ServiceNow',
    logo: '/images/integrations/servicenow.svg',
    category: 'IT Service Management'
  },
  {
    name: 'Jira',
    logo: '/images/integrations/jira.svg',
    category: 'Project Management'
  },
  {
    name: 'Slack',
    logo: '/images/integrations/slack.svg',
    category: 'Team Collaboration'
  },
  {
    name: 'Salesforce',
    logo: '/images/integrations/salesforce.svg',
    category: 'CRM Platform'
  },
  {
    name: 'AWS',
    logo: '/images/integrations/aws.svg',
    category: 'Cloud Infrastructure'
  },
  {
    name: 'Azure',
    logo: '/images/integrations/azure.svg',
    category: 'Cloud Platform'
  },
  {
    name: 'Google Workspace',
    logo: '/images/integrations/google-workspace.svg',
    category: 'Productivity Suite'
  },
  {
    name: 'Okta',
    logo: '/images/integrations/okta.svg',
    category: 'Identity Management'
  },
  {
    name: 'Splunk',
    logo: '/images/integrations/splunk.svg',
    category: 'Security Analytics'
  }
];

export function IntegrationsCarousel() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 font-inter">
            Seamlessly integrates with your existing tools
          </h3>
          <p className="text-gray-600 max-w-2xl mx-auto font-inter">
            Connect Riscura to your existing enterprise systems for automated data collection, 
            streamlined workflows, and comprehensive risk visibility.
          </p>
        </div>

        {/* Integration Logos Carousel */}
        <div className="relative overflow-hidden">
          <motion.div
            className="flex space-x-12"
            animate={{
              x: [0, -100 * integrations.length * 0.6],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {/* Duplicate the array for seamless loop */}
            {[...integrations, ...integrations].map((integration, index) => (
              <div
                key={`${integration.name}-${index}`}
                className="flex-shrink-0 relative group"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="w-24 h-24 flex items-center justify-center p-4 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition-all duration-300">
                  {/* Placeholder for logo - using text for now since logos don't exist yet */}
                  <div 
                    className={`w-full h-full flex items-center justify-center text-xs font-semibold rounded-lg transition-all duration-300 ${
                      hoveredIndex === index 
                        ? 'text-[#199BEC] bg-[#199BEC]/10' 
                        : 'text-gray-400 bg-gray-50'
                    }`}
                  >
                    {integration.name.split(' ').map(word => word[0]).join('')}
                  </div>
                </div>

                {/* Hover Card */}
                {hoveredIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 z-10"
                  >
                    <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[200px]">
                      <div className="text-center">
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">
                          {integration.name}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {integration.category}
                        </p>
                      </div>
                      {/* Arrow pointer */}
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <div className="w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45"></div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom gradient fade effect */}
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
      </div>
    </section>
  );
}