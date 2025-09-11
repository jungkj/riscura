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
          highlightColor: 0x2563eb,
          midtoneColor: 0x3b82f6,
          lowlightColor: 0x60a5fa,
          baseColor: 0x93c5fd,
          blurFactor: 0.72,
          speed: 0.5,
          zoom: 0.75
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
      {/* Palace.so exact blue gradient base */}
      <div 
        className="absolute inset-0 -z-20 overflow-hidden pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, #2563eb 0%, #3b82f6 20%, #60a5fa 40%, #93c5fd 70%, #dbeafe 100%)'
        }}
      />

      {/* Vanta.js fog effect - exact Palace.so setup */}
      {isMounted && (
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div ref={vantaRef} className="w-full h-full" />
        </div>
      )}

      {/* Palace.so exact white fade overlay */}
      {isMounted && (
        <div 
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 30%, rgba(255,255,255,0.4) 70%, rgba(255,255,255,0.9) 95%, rgba(255,255,255,1) 100%)'
          }}
        />
      )}
    </div>
  );
}