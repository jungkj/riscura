'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

// Integration data using actual logos from public/images/logo/
const integrations = [
  {
    name: 'Microsoft SharePoint',
    logo: '/images/logo/sharepoint.png',
    category: 'Document Management'
  },
  {
    name: 'Slack',
    logo: '/images/logo/Slack.png',
    category: 'Team Collaboration'
  },
  {
    name: 'Microsoft Teams',
    logo: '/images/logo/Teams.png',
    category: 'Team Collaboration'
  },
  {
    name: 'Dropbox',
    logo: '/images/logo/dropbox.png',
    category: 'Cloud Storage'
  },
  {
    name: 'Google Drive',
    logo: '/images/logo/googledrive.png',
    category: 'Cloud Storage'
  },
  {
    name: 'OpenAI',
    logo: '/images/logo/OPenAi.png',
    category: 'AI Platform'
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
                  <div className={`w-full h-full flex items-center justify-center rounded-lg transition-all duration-300 ${
                    hoveredIndex === index ? 'grayscale-0' : 'grayscale'
                  }`}>
                    <Image
                      src={integration.logo}
                      alt={`${integration.name} logo`}
                      width={48}
                      height={48}
                      className="object-contain max-w-full max-h-full"
                    />
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