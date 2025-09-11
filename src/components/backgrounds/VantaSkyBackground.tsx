'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    VANTA: any;
    THREE: any;
  }
}

export const VantaSkyBackground = () => {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);

  useEffect(() => {
    // Load Three.js
    const loadThreeJS = () => {
      return new Promise((resolve) => {
        if (window.THREE) {
          resolve(window.THREE);
          return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js';
        script.onload = () => resolve(window.THREE);
        document.head.appendChild(script);
      });
    };

    // Load Vanta Fog
    const loadVantaFog = () => {
      return new Promise((resolve) => {
        if (window.VANTA?.FOG) {
          resolve(window.VANTA.FOG);
          return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.fog.min.js';
        script.onload = () => resolve(window.VANTA.FOG);
        document.head.appendChild(script);
      });
    };

    const initializeVanta = async () => {
      if (!vantaRef.current) return;

      try {
        await loadThreeJS();
        await loadVantaFog();

        // Destroy existing effect
        if (vantaEffect.current) {
          vantaEffect.current.destroy();
        }

        // Initialize Vanta FOG effect (Palace.so style)
        vantaEffect.current = window.VANTA.FOG({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          highlightColor: 0xb8c5d1, // Soft blue-gray highlights
          midtoneColor: 0xd5dfe5,   // Light blue-gray midtones  
          lowlightColor: 0xe8eef3,  // Very light blue-gray shadows
          baseColor: 0xffffff,      // White base
          blurFactor: 0.6,
          speed: 1.5,               // Slow, elegant movement
          zoom: 1.2
        });
      } catch (error) {
        console.error('Failed to load Vanta effect:', error);
      }
    };

    initializeVanta();

    // Cleanup
    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
      }
    };
  }, []);

  return (
    <div 
      ref={vantaRef} 
      className="absolute inset-0 -z-10 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
      }}
    />
  );
};