"use client";

import { useEffect } from 'react';

interface ClientProviderProps {
  children: React.ReactNode;
}

export default function ClientProvider({ children }: ClientProviderProps) {
  useEffect(() => {
    // Handle browser extension interference
    const handleExtensionInterference = () => {
      // Remove common browser extension attributes that cause hydration mismatches
      const extensionAttributes = [
        'cz-shortcut-listen',
        'data-lastpass-icon-root',
        'data-1p-ignore',
        'data-grammarly-shadow-root',
        'spellcheck'
      ];

      extensionAttributes.forEach(attr => {
        const elements = document.querySelectorAll(`[${attr}]`);
        elements.forEach(el => {
          if (el.getAttribute(attr)) {
            el.removeAttribute(attr);
          }
        });
      });
    };

    // Clean immediately after mount
    handleExtensionInterference();

    // Set up a MutationObserver to clean up any future extension interference
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          const target = mutation.target as Element;
          const attributeName = mutation.attributeName;
          
          // Remove problematic attributes added by extensions
          if (attributeName && [
            'cz-shortcut-listen',
            'data-lastpass-icon-root',
            'data-1p-ignore',
            'data-grammarly-shadow-root'
          ].includes(attributeName)) {
            target.removeAttribute(attributeName);
          }
        }
      });
    });

    // Observe the entire document for attribute changes
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: [
        'cz-shortcut-listen',
        'data-lastpass-icon-root',
        'data-1p-ignore',
        'data-grammarly-shadow-root'
      ],
      subtree: true
    });

    // Cleanup observer on unmount
    return () => {
      observer.disconnect();
    };
  }, []);

  return <>{children}</>;
} 