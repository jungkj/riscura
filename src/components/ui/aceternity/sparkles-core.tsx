import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  life: number;
  maxLife: number;
  color: string;
}

interface SparklesCoreProps {
  className?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  particleDensity?: number;
  particleColor?: string;
  particleSpeed?: number;
  children?: React.ReactNode;
  id?: string;
}

export const SparklesCore: React.FC<SparklesCoreProps> = ({
  className,
  background = 'transparent',
  minSize = 1,
  maxSize = 3,
  particleDensity = 100,
  particleColor = '#3B82F6',
  particleSpeed = 1,
  children,
  id,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateDimensions = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    const createParticle = (): Particle => {
      const colors = [
        '#3B82F6', // blue
        '#8B5CF6', // purple
        '#06B6D4', // cyan
        '#10B981', // emerald
        '#F59E0B', // amber
      ];

      return {
        id: Math.random(),
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * (maxSize - minSize) + minSize,
        speedX: (Math.random() - 0.5) * particleSpeed,
        speedY: (Math.random() - 0.5) * particleSpeed,
        opacity: Math.random() * 0.8 + 0.2,
        life: 0,
        maxLife: Math.random() * 100 + 50,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    };

    const initParticles = () => {
      particlesRef.current = Array.from({ length: particleDensity }, createParticle);
    };

    const drawParticle = (particle: Particle) => {
      const gradient = ctx.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        particle.size * 2
      );

      gradient.addColorStop(
        0,
        `${particle.color}${Math.floor(particle.opacity * 255)
          .toString(16)
          .padStart(2, '0')}`
      );
      gradient.addColorStop(
        0.5,
        `${particle.color}${Math.floor(particle.opacity * 128)
          .toString(16)
          .padStart(2, '0')}`
      );
      gradient.addColorStop(1, `${particle.color}00`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
      ctx.fill();

      // Core sparkle
      ctx.fillStyle = `${particle.color}${Math.floor(particle.opacity * 255)
        .toString(16)
        .padStart(2, '0')}`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    };

    const updateParticle = (particle: Particle) => {
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      particle.life++;

      // Fade out as life progresses
      particle.opacity = Math.max(0, 1 - particle.life / particle.maxLife);

      // Wrap around edges
      if (particle.x < 0) particle.x = canvas.width;
      if (particle.x > canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = canvas.height;
      if (particle.y > canvas.height) particle.y = 0;

      // Reset particle if it's dead
      if (particle.life >= particle.maxLife) {
        Object.assign(particle, createParticle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle) => {
        updateParticle(particle);
        drawParticle(particle);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    updateDimensions();
    initParticles();
    animate();

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(canvas);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [minSize, maxSize, particleDensity, particleColor, particleSpeed]);

  return (
    <div className={cn('relative', className)} id={id}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ background }}
      />
      {Boolean(children) && <div className="relative z-10">{children}</div>}
    </div>
  );
};

interface SparklesTextProps {
  text: string;
  className?: string;
  sparklesClassName?: string;
}

export const SparklesText: React.FC<SparklesTextProps> = ({
  text,
  className,
  sparklesClassName,
}) => {
  return (
    <div className={cn('relative inline-block', className)}>
      <SparklesCore
        className={cn('absolute inset-0', sparklesClassName)}
        particleDensity={50}
        minSize={0.5}
        maxSize={1.5}
        particleSpeed={0.5}
      />
      <span className="relative z-10">{text}</span>
    </div>
  );
};
