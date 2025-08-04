import React from 'react';
import Image from 'next/image';

interface LogoProps {
  variant?: 'full' | 'icon' | 'white';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  priority?: boolean;
}

const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  className,
  priority = false,
}) => {
  // Size mappings
  const sizeMap = {
    sm: { width: 80, height: 28, iconWidth: 24, iconHeight: 24 },
    md: { width: 120, height: 40, iconWidth: 32, iconHeight: 32 },
    lg: { width: 160, height: 54, iconWidth: 48, iconHeight: 48 },
    xl: { width: 200, height: 67, iconWidth: 64, iconHeight: 64 },
  }

  // Logo source mapping
  const logoSrc = {
    full: '/images/logo/riscura.png',
    icon: '/images/logo/riscura.png', // Using same logo for now
    white: '/images/logo/riscura.png', // Using same logo for now
  }

  const { width, height, iconWidth, iconHeight } = sizeMap[size];
  const isIcon = variant === 'icon';

  return (
    <div className={`flex items-center ${className || ''}`}>
      <Image
        src={logoSrc[variant]}
        alt={variant === 'icon' ? 'Riscura' : 'Riscura Logo'}
        width={isIcon ? iconWidth : width}
        height={isIcon ? iconHeight : height}
        priority={priority}
        className="object-contain"
      />
    </div>
  );
}

// Placeholder component (until you upload your logo)
export const LogoPlaceholder: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  className,
}) => {
  const sizeMap = {
    sm: { width: 80, height: 28 },
    md: { width: 120, height: 40 },
    lg: { width: 160, height: 54 },
    xl: { width: 200, height: 67 },
  }

  const { width, height } = sizeMap[size];
  const isIcon = variant === 'icon';

  if (isIcon) {
    return (
      <div
        className={`rounded-full bg-[#199BEC] flex items-center justify-center text-white font-bold ${
          size === 'sm'
            ? 'w-6 h-6 text-xs'
            : size === 'md'
              ? 'w-8 h-8 text-sm'
              : size === 'lg'
                ? 'w-12 h-12 text-lg'
                : 'w-16 h-16 text-xl'
        } ${className || ''}`}
      >
        🐬
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className || ''}`} style={{ width, height }}>
      <div
        className={`rounded-full bg-[#199BEC] flex items-center justify-center text-white font-bold ${
          size === 'sm'
            ? 'w-6 h-6 text-xs'
            : size === 'md'
              ? 'w-8 h-8 text-sm'
              : size === 'lg'
                ? 'w-10 h-10 text-base'
                : 'w-12 h-12 text-lg'
        }`}
      >
        🐬
      </div>
      <span
        className={`font-bold text-[#191919] font-inter ${
          size === 'sm'
            ? 'text-sm'
            : size === 'md'
              ? 'text-lg'
              : size === 'lg'
                ? 'text-xl'
                : 'text-2xl'
        }`}
      >
        Riscura
      </span>
    </div>
  );
}

export default Logo;
