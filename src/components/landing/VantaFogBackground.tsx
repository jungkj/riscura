"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
// @ts-ignore
import FOG from 'vanta/dist/vanta.fog.min';

const VantaFogBackground = () => {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);

  useEffect(() => {
    if (!vantaEffect.current && vantaRef.current) {
      vantaEffect.current = FOG({
        el: vantaRef.current,
        THREE: THREE,
        mouseControls: false,
        touchControls: false,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        highlightColor: 0xe0f2fe, // Light blue
        midtoneColor: 0xddd6fe,   // Light purple
        lowlightColor: 0xfce7f3,  // Light pink
        baseColor: 0xf8fafc,      // Very light gray
        blurFactor: 0.68,
        speed: 1.20,
        zoom: 0.80,
        scale: 1.00,
        scaleMobile: 1.00
      });
    }

    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, []);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (vantaEffect.current) {
        vantaEffect.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div ref={vantaRef} className="absolute inset-0" style={{ zIndex: 0 }}>
        <canvas className="vanta-canvas" />
      </div>
      {/* Gradient overlay for better text readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.8) 100%)',
          zIndex: 1
        }}
      />
    </div>
  );
};

export default VantaFogBackground;