// Image Optimizer Component with Lazy Loading and Progressive Enhancement
'use client';

import React, { 
  useState, 
  useRef, 
  useEffect, 
  useCallback, 
  memo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { DaisySkeleton } from '@/components/ui/DaisySkeleton';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { AlertCircle, Download, Maximize2 } from 'lucide-react';

export interface ImageOptimizerProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: 'blur' | 'empty' | 'data:image/...';
  blurDataURL?: string;
  priority?: boolean;
  quality?: number;
  fill?: boolean;
  sizes?: string;
  style?: React.CSSProperties;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  loading?: 'eager' | 'lazy';
  unoptimized?: boolean;
  draggable?: boolean;
  crossOrigin?: 'anonymous' | 'use-credentials';
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  decoding?: 'async' | 'auto' | 'sync';
  
  // Progressive enhancement options
  enableWebP?: boolean;
  enableAvif?: boolean;
  enableProgressiveJPEG?: boolean;
  enableLazyLoading?: boolean;
  enableIntersectionObserver?: boolean;
  threshold?: number;
  rootMargin?: string;
  
  // Responsive options
  breakpoints?: Array<{
    maxWidth: number;
    width: number;
    height?: number;
    quality?: number;
  }>;
  
  // Error handling
  fallbackSrc?: string;
  showErrorState?: boolean;
  errorComponent?: React.ComponentType<{ error: string; retry: () => void }>;
  
  // Performance options
  preload?: boolean;
  prefetch?: boolean;
  critical?: boolean;
  
  // Callbacks
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  onLoadStart?: () => void;
  onProgress?: (loaded: number, total: number) => void;
  
  // Additional features
  enableZoom?: boolean;
  enableDownload?: boolean;
  enableFullscreen?: boolean;
  watermark?: {
    text: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    opacity?: number;
  };
}

export interface ImageOptimizerRef {
  reload: () => void;
  getImageData: () => Promise<Blob | null>;
  downloadImage: () => void;
}

// Image format detection utility
const supportsWebP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new (window as any).Image();
    webP.onload = webP.onerror = () => resolve(webP.height === 2);
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

const supportsAvif = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const avif = new (window as any).Image();
    avif.onload = avif.onerror = () => resolve(avif.height === 2);
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });
};

// Intersection Observer hook
const useIntersectionObserver = (
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [ref, options]);

  return isIntersecting;
};

// Generate responsive image URLs
const generateResponsiveUrls = (
  src: string,
  breakpoints: Array<{ maxWidth: number; width: number; height?: number; quality?: number }>,
  enableWebP: boolean,
  enableAvif: boolean
) => {
  return breakpoints.map(bp => ({
    ...bp,
    urls: {
      original: `${src}?w=${bp.width}&q=${bp.quality || 75}`,
      webp: enableWebP ? `${src}?w=${bp.width}&q=${bp.quality || 75}&fm=webp` : null,
      avif: enableAvif ? `${src}?w=${bp.width}&q=${bp.quality || 75}&fm=avif` : null,
    }
  }));
};

// Error boundary component
const ImageErrorFallback = memo(({ 
  error, 
  retry, 
  fallbackSrc, 
  alt,
  className 
}: { 
  error: string; 
  retry: () => void;
  fallbackSrc?: string;
  alt: string;
  className?: string;
}) => {
  if (fallbackSrc) {
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        className={className}
        onError={() => {
          // If fallback also fails, show error state
        }}
      />
    );
  }

  return (
    <div className={cn(
      'flex items-center justify-center bg-gray-100 border border-gray-200 rounded',
      className
    )}>
      <div className="text-center p-4">
        <DaisyAlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500 mb-2">Failed to load image</p>
        <DaisyButton onClick={retry} variant="outline" size="sm">
          Retry
        </DaisyButton>
      </div>
    </div>
  );
});

ImageErrorFallback.displayName = 'ImageErrorFallback';

// Main optimized image component
export const ImageOptimizer = forwardRef<ImageOptimizerRef, ImageOptimizerProps>(({
  src,
  alt,
  width,
  height,
  className,
  placeholder = 'blur',
  blurDataURL,
  priority = false,
  quality = 75,
  fill = false,
  sizes,
  style,
  objectFit = 'cover',
  objectPosition,
  loading = 'lazy',
  unoptimized = false,
  draggable = false,
  crossOrigin,
  referrerPolicy,
  decoding = 'async',
  
  enableWebP = true,
  enableAvif = true,
  enableProgressiveJPEG = true,
  enableLazyLoading = true,
  enableIntersectionObserver = true,
  threshold = 0.1,
  rootMargin = '50px',
  
  breakpoints = [
    { maxWidth: 640, width: 640, quality: 75 },
    { maxWidth: 768, width: 768, quality: 75 },
    { maxWidth: 1024, width: 1024, quality: 75 },
    { maxWidth: 1280, width: 1280, quality: 75 },
    { maxWidth: 1920, width: 1920, quality: 75 },
  ],
  
  fallbackSrc,
  showErrorState = true,
  errorComponent: ErrorComponent,
  
  preload = false,
  prefetch = false,
  critical = false,
  
  onLoad,
  onError,
  onLoadStart,
  onProgress,
  
  enableZoom = false,
  enableDownload = false,
  enableFullscreen = false,
  watermark,
}, ref) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadProgress, setLoadProgress] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [supportedFormats, setSupportedFormats] = useState({
    webp: false,
    avif: false,
  });

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isIntersecting = useIntersectionObserver(containerRef, {
    threshold,
    rootMargin,
  });

  // Check format support
  useEffect(() => {
    const checkFormats = async () => {
      const [webpSupported, avifSupported] = await Promise.all([
        enableWebP ? supportsWebP() : Promise.resolve(false),
        enableAvif ? supportsAvif() : Promise.resolve(false),
      ]);

      setSupportedFormats({
        webp: webpSupported,
        avif: avifSupported,
      });
    };

    checkFormats();
  }, [enableWebP, enableAvif]);

  // Preload critical images
  useEffect(() => {
    if (critical || preload) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [critical, preload, src]);

  // Prefetch images
  useEffect(() => {
    if (prefetch) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = src;
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [prefetch, src]);

  // Generate optimized source URL
  const getOptimizedSrc = useCallback(() => {
    let optimizedSrc = src;

    // Add quality parameter
    const separator = src.includes('?') ? '&' : '?';
    optimizedSrc += `${separator}q=${quality}`;

    // Add format parameter based on support
    if (supportedFormats.avif && enableAvif) {
      optimizedSrc += '&fm=avif';
    } else if (supportedFormats.webp && enableWebP) {
      optimizedSrc += '&fm=webp';
    }

    // Add progressive JPEG
    if (enableProgressiveJPEG) {
      optimizedSrc += '&progressive=true';
    }

    return optimizedSrc;
  }, [src, quality, supportedFormats, enableAvif, enableWebP, enableProgressiveJPEG]);

  // Handle image loading
  const handleLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    setHasError(false);
    setLoadProgress(100);
    onLoad?.(event);
  }, [onLoad]);

  const handleError = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    setHasError(true);
    setErrorMessage('Failed to load image');
    onError?.(event);
  }, [onError]);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    setLoadProgress(0);
    onLoadStart?.();
  }, [onLoadStart]);

  // Retry loading
  const retryLoad = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    if (imageRef.current) {
      imageRef.current.src = getOptimizedSrc();
    }
  }, [getOptimizedSrc]);

  // Download image
  const downloadImage = useCallback(async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `image.${blob.type.split('/')[1]}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  }, [src]);

  // Get image data
  const getImageData = useCallback(async (): Promise<Blob | null> => {
    try {
      const response = await fetch(src);
      return await response.blob();
    } catch (error) {
      console.error('Failed to get image data:', error);
      return null;
    }
  }, [src]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    reload: retryLoad,
    getImageData,
    downloadImage,
  }), [retryLoad, getImageData, downloadImage]);

  // Generate responsive sizes string
  const responsiveSizes = sizes || breakpoints
    .map(bp => `(max-width: ${bp.maxWidth}px) ${bp.width}px`)
    .join(', ');

  // Determine if image should load
  const shouldLoad = !enableIntersectionObserver || 
                    !enableLazyLoading || 
                    isIntersecting || 
                    priority;

  // Render loading placeholder
  if (!shouldLoad || (isLoading && !hasError)) {
    return (
      <div ref={containerRef} className={cn('relative overflow-hidden', className)}>
        {placeholder === 'blur' && blurDataURL ? (
          <img
            src={blurDataURL}
            alt=""
            className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110"
            aria-hidden="true"
          />
        ) : (
          <DaisySkeleton className="w-full h-full" />
        )}
        
        {isLoading && loadProgress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  // Render error state
  if (hasError && showErrorState) {
    return (
      <div ref={containerRef} className={className}>
        {ErrorComponent ? (
          <ErrorComponent error={errorMessage} retry={retryLoad} />
        ) : (
          <ImageErrorFallback
            error={errorMessage}
            retry={retryLoad}
            fallbackSrc={fallbackSrc}
            alt={alt}
            className={className}
          />
        )}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={cn('relative group', className)}
      style={style}
    >
      {/* Main image */}
      <Image
        ref={imageRef}
        src={getOptimizedSrc()}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        sizes={responsiveSizes}
        quality={quality}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        loading={loading}
        unoptimized={unoptimized}
        draggable={draggable}
        crossOrigin={crossOrigin}
        referrerPolicy={referrerPolicy}
        decoding={decoding}
        className={cn(
          'transition-all duration-300',
          enableZoom && 'cursor-zoom-in hover:scale-105',
          isZoomed && 'scale-150 cursor-zoom-out',
          objectFit === 'contain' && 'object-contain',
          objectFit === 'cover' && 'object-cover',
          objectFit === 'fill' && 'object-fill',
          objectFit === 'none' && 'object-none',
          objectFit === 'scale-down' && 'object-scale-down'
        )}
        style={{ objectPosition }}
        onLoad={handleLoad}
        onError={handleError}
        onLoadStart={handleLoadStart}
        onClick={enableZoom ? () => setIsZoomed(!isZoomed) : undefined}
      />

      {/* Watermark */}
      {watermark && (
        <div 
          className={cn(
            'absolute pointer-events-none text-white text-sm font-medium',
            'bg-black bg-opacity-50 px-2 py-1 rounded',
            watermark.position === 'top-left' && 'top-2 left-2',
            watermark.position === 'top-right' && 'top-2 right-2',
            watermark.position === 'bottom-left' && 'bottom-2 left-2',
            watermark.position === 'bottom-right' && 'bottom-2 right-2',
            watermark.position === 'center' && 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
          )}
          style={{ opacity: watermark.opacity || 0.7 }}
        >
          {watermark.text}
        </div>
      )}

      {/* Overlay controls */}
      {(enableDownload || enableFullscreen) && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-1">
            {enableDownload && (
              <DaisyButton
                variant="secondary"
                size="sm"
                onClick={downloadImage}
                className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white border-none"
              >
                <Download className="w-4 h-4" />
              </DaisyButton>
            )}
            {enableFullscreen && (
              <DaisyButton
                variant="secondary"
                size="sm"
                onClick={() => setIsFullscreen(true)}
                className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white border-none"
              >
                <Maximize2 className="w-4 h-4" />
              </DaisyButton>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen modal */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
        >
          <Image
            src={getOptimizedSrc()}
            alt={alt}
            fill
            className="object-contain"
            quality={100}
          />
        </div>
      )}
    </div>
  );
});

ImageOptimizer.displayName = 'ImageOptimizer';

export default ImageOptimizer; 