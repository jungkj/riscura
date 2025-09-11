"use client";

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface VantaBackgroundProps {
  className?: string;
}

export function VantaBackground({ className = "" }: VantaBackgroundProps) {
  const vantaRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    let effect: any = null;

    const initVanta = () => {
      if (typeof window !== 'undefined' && window.VANTA && vantaRef.current) {
        effect = window.VANTA.FOG({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          highlightColor: 0x4A90E2,
          midtoneColor: 0x6B9BD8,
          lowlightColor: 0x8BB1E8,
          baseColor: 0xA8C8F0,
          blurFactor: 0.8,
          speed: 0.8,
          zoom: 0.9
        });
      }
    };

    // Load Vanta scripts
    if (typeof window !== 'undefined' && !window.VANTA) {
      const script1 = document.createElement('script');
      script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js';
      script1.onload = () => {
        const script2 = document.createElement('script');
        script2.src = 'https://cdn.jsdelivr.net/npm/vanta@0.5.24/dist/vanta.fog.min.js';
        script2.onload = initVanta;
        document.head.appendChild(script2);
      };
      document.head.appendChild(script1);
    } else {
      initVanta();
    }

    return () => {
      if (effect) {
        effect.destroy();
      }
    };
  }, [isMounted]);

  return (
    <div className={className}>
      {/* Palace.so blue gradient base */}
      <div 
        className="absolute inset-0 -z-20 overflow-hidden pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, #4A90E2 0%, #6B9BD8 25%, #8BB1E8 50%, #A8C8F0 75%, #C5D9F1 100%)'
        }}
      />

      {/* Vanta.js fog effect - exact Palace.so setup */}
      {isMounted && (
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div ref={vantaRef} className="w-full h-full" />
        </div>
      )}

      {/* Palace.so style fade overlay */}
      {isMounted && (
        <div 
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 40%, rgba(255,255,255,0.8) 90%, rgba(255,255,255,1) 100%)'
          }}
        />
      )}
    </div>
  );
}