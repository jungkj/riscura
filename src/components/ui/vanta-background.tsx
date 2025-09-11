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
          highlightColor: 0xb8c5d1,
          midtoneColor: 0xd5dfe5,
          lowlightColor: 0xe8eef3,
          baseColor: 0xffffff,
          blurFactor: 0.6,
          speed: 1.5,
          zoom: 1.2
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
      {/* Palace.so background image - exact structure */}
      <div className="absolute inset-0 -z-20 overflow-hidden pointer-events-none">
        <Image
          src="/images/hero-background.png"
          alt="Background"
          fill
          className="object-cover object-center transition-opacity duration-500 opacity-100"
          sizes="100vw"
          priority
        />
      </div>

      {/* Vanta.js fog effect - exact Palace.so setup */}
      {isMounted && (
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div ref={vantaRef} className="w-full h-full" />
        </div>
      )}

      {/* Gradient overlay - exact Palace.so style */}
      {isMounted && (
        <div 
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 22%, rgba(255,255,255,0) 65%)'
          }}
        />
      )}
    </div>
  );
}