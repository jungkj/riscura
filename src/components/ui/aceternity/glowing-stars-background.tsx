import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  glowIntensity: number;
}

interface GlowingStarsBackgroundProps {
  className?: string;
  starCount?: number;
  children?: React.ReactNode;
}

export const GlowingStarsBackground: React.FC<GlowingStarsBackgroundProps> = ({
  className,
  starCount = 100,
  children,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createStars = () => {
      starsRef.current = Array.from({ length: starCount }, (_, i) => ({
        id: i,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.5 + 0.1,
        glowIntensity: Math.random() * 0.5 + 0.5,
      }));
    };

    const drawStar = (star: Star) => {
      const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 3);

      gradient.addColorStop(0, `rgba(255, 255, 255, ${star.opacity})`);
      gradient.addColorStop(0.5, `rgba(147, 197, 253, ${star.opacity * 0.5})`);
      gradient.addColorStop(1, 'rgba(147, 197, 253, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
      ctx.fill();

      // Core star
      ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      starsRef.current.forEach((star) => {
        // Animate opacity for twinkling effect
        star.opacity += (Math.random() - 0.5) * 0.02;
        star.opacity = Math.max(0.1, Math.min(1, star.opacity));

        // Animate glow intensity
        star.glowIntensity += (Math.random() - 0.5) * 0.01;
        star.glowIntensity = Math.max(0.3, Math.min(1, star.glowIntensity));

        drawStar(star);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    createStars();
    animate();

    window.addEventListener('resize', () => {
      resizeCanvas();
      createStars();
    });

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [starCount]);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
