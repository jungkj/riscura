"use client";

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface VantaBackgroundProps {
  className?: string;
}

export function VantaBackground({ className = "" }: VantaBackgroundProps) {
  return (
    <div className={`${className} bg-gradient-to-b from-blue-50 via-blue-25 to-white`}>
      {/* Enhanced Palace.so Style Sky Animation */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Base atmospheric gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-blue-100/80 via-blue-50/60 to-white/40"
          animate={{
            opacity: [0.8, 1, 0.9, 1],
            filter: [
              "brightness(1.0) saturate(1.0) contrast(1.0)",
              "brightness(1.15) saturate(1.15) contrast(1.05)",
              "brightness(1.05) saturate(1.1) contrast(1.02)",
              "brightness(1.0) saturate(1.0) contrast(1.0)"
            ]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Prominent moving clouds - 6 layers */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${120 + i * 40}px`,
              height: `${60 + i * 20}px`,
              background: `radial-gradient(ellipse, rgba(255,255,255,${0.4 + i * 0.1}) 0%, rgba(255,255,255,${0.2 + i * 0.05}) 40%, transparent 70%)`,
              left: `${-10 + (i * 15)}%`,
              top: `${10 + (i * 8)}%`,
              filter: "blur(1px)"
            }}
            animate={{
              x: [
                -100,
                typeof window !== 'undefined' ? window.innerWidth + 200 : 1600
              ],
              y: [0, -20 + Math.sin(i) * 10, 0],
              scale: [1, 1.1, 1],
              opacity: [0.3 + i * 0.1, 0.6 + i * 0.1, 0.4 + i * 0.1]
            }}
            transition={{
              duration: 20 + i * 5,
              repeat: Infinity,
              ease: "linear",
              delay: i * 3
            }}
          />
        ))}

        {/* Atmospheric shift overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-50/20 via-transparent to-blue-100/30"
          animate={{
            transform: [
              "translateX(0%) scale(1)",
              "translateX(10%) scale(1.05)",
              "translateX(-5%) scale(0.98)",
              "translateX(0%) scale(1)"
            ],
            opacity: [0.6, 0.9, 0.7, 0.6]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Floating atmospheric layer */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-transparent via-blue-25/20 to-blue-50/40"
          animate={{
            transform: [
              "translateY(0px) scale(1)",
              "translateY(-15px) scale(1.02)",
              "translateY(10px) scale(0.99)",
              "translateY(0px) scale(1)"
            ],
            opacity: [0.4, 0.7, 0.5, 0.4]
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Subtle animated particles */}
        <div className="absolute inset-0">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/40 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${20 + Math.random() * 40}%`,
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, Math.random() * 20 - 10, 0],
                opacity: [0.2, 0.8, 0.3],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 3,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes prominentClouds {
          0% { 
            transform: translateX(-100px) translateY(0px) scale(1);
            opacity: 0.3;
          }
          33% { 
            transform: translateX(50vw) translateY(-10px) scale(1.05);
            opacity: 0.7;
          }
          66% { 
            transform: translateX(80vw) translateY(5px) scale(0.98);
            opacity: 0.9;
          }
          100% { 
            transform: translateX(calc(100vw + 200px)) translateY(0px) scale(1);
            opacity: 0.4;
          }
        }
        
        @keyframes skyMovement {
          0%, 100% { 
            filter: brightness(1.0) saturate(1.0) contrast(1.0);
            opacity: 0.8;
          }
          50% { 
            filter: brightness(1.15) saturate(1.15) contrast(1.05);
            opacity: 1.0;
          }
        }
        
        @keyframes atmosphericShift {
          0% { 
            transform: translateX(0%) scale(1);
            opacity: 0.6;
          }
          33% { 
            transform: translateX(15px) translateY(-5px) scale(1.02);
            opacity: 0.8;
          }
          66% { 
            transform: translateX(15px) translateY(5px) scale(0.98);
            opacity: 0.9;
          }
        }
        
        @keyframes atmosphericFloat {
          0% { 
            transform: translateY(0px) scale(1);
            opacity: 0.4;
          }
          33% { 
            transform: translateY(-10px) scale(1.01);
            opacity: 0.6;
          }
          66% { 
            transform: translateX(15px) translateY(5px) scale(0.98);
            opacity: 0.9;
          }
        }
      `}</style>
    </div>
  );
}