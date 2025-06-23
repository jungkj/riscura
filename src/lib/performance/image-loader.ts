// Enhanced Image Loader for Performance Optimization
import type { ImageLoaderProps } from 'next/image';

export interface OptimizedImageLoaderConfig {
  enableWebP: boolean;
  enableAVIF: boolean;
  quality: number;
  enableBlur: boolean;
  enableLazyLoading: boolean;
  enableResponsive: boolean;
  cacheTTL: number;
}

const defaultConfig: OptimizedImageLoaderConfig = {
  enableWebP: true,
  enableAVIF: true,
  quality: 85,
  enableBlur: true,
  enableLazyLoading: true,
  enableResponsive: true,
  cacheTTL: 31536000, // 1 year
};

class ImageOptimizer {
  private config: OptimizedImageLoaderConfig;
  private cache: Map<string, string> = new Map();
  private loadingImages: Set<string> = new Set();

  constructor(config: Partial<OptimizedImageLoaderConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  // Main image loader function
  public loader = ({ src, width, quality }: ImageLoaderProps): string => {
    // Handle external URLs
    if (src.startsWith('http')) {
      return this.optimizeExternalImage(src, width, quality);
    }

    // Handle local images
    return this.optimizeLocalImage(src, width, quality);
  };

  // Optimize external images through proxy
  private optimizeExternalImage(src: string, width: number, quality?: number): string {
    const params = new URLSearchParams({
      url: src,
      w: width.toString(),
      q: (quality || this.config.quality).toString(),
    });

    if (this.config.enableWebP) {
      params.set('f', 'webp');
    }

    return `/api/image-proxy?${params.toString()}`;
  }

  // Optimize local images
  private optimizeLocalImage(src: string, width: number, quality?: number): string {
    const cacheKey = `${src}-${width}-${quality}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const params = new URLSearchParams({
      url: src,
      w: width.toString(),
      q: (quality || this.config.quality).toString(),
    });

    // Add format optimization
    if (this.config.enableAVIF) {
      params.set('f', 'avif');
    } else if (this.config.enableWebP) {
      params.set('f', 'webp');
    }

    const optimizedUrl = `/_next/image?${params.toString()}`;
    this.cache.set(cacheKey, optimizedUrl);
    
    return optimizedUrl;
  }

  // Preload critical images
  public preloadImage(src: string, sizes?: string): void {
    if (typeof window === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    
    if (sizes) {
      link.setAttribute('imagesizes', sizes);
    }

    // Add responsive srcset for preloading
    if (this.config.enableResponsive) {
      const srcset = this.generateResponsiveSrcSet(src);
      if (srcset) {
        link.setAttribute('imagesrcset', srcset);
      }
    }

    document.head.appendChild(link);
  }

  // Generate responsive srcset
  private generateResponsiveSrcSet(src: string): string {
    const widths = [640, 750, 828, 1080, 1200, 1920];
    return widths
      .map(width => `${this.optimizeLocalImage(src, width)} ${width}w`)
      .join(', ');
  }

  // Lazy load images with intersection observer
  public setupLazyLoading(): void {
    if (typeof window === 'undefined' || !this.config.enableLazyLoading) return;

    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            
            if (src && !this.loadingImages.has(src)) {
              this.loadingImages.add(src);
              this.loadImageWithFallback(img, src);
              imageObserver.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
      }
    );

    // Observe all lazy images
    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });
  }

  // Load image with fallback and error handling
  private async loadImageWithFallback(img: HTMLImageElement, src: string): Promise<void> {
    try {
      // Try loading optimized format first
      const optimizedSrc = this.optimizeLocalImage(src, img.width || 800);
      await this.loadImage(optimizedSrc);
      img.src = optimizedSrc;
      img.classList.add('loaded');
    } catch (error) {
      // Fallback to original image
      try {
        await this.loadImage(src);
        img.src = src;
        img.classList.add('loaded');
      } catch (fallbackError) {
        // Show placeholder or error image
        img.src = '/images/placeholder.png';
        img.classList.add('error');
        console.warn('Failed to load image:', src, fallbackError);
      }
    } finally {
      this.loadingImages.delete(src);
    }
  }

  // Promise-based image loading
  private loadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  }

  // Generate blur placeholder
  public generateBlurPlaceholder(src: string): string {
    if (!this.config.enableBlur) return '';
    
    // Generate a low-quality placeholder
    return this.optimizeLocalImage(src, 10, 10);
  }

  // Clear cache
  public clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Create singleton instance
const imageOptimizer = new ImageOptimizer();

// Export the loader function for Next.js
export default imageOptimizer.loader;

// Export additional utilities
export { imageOptimizer };

// Utility functions for responsive images
export const generateSrcSet = (src: string, widths: number[] = [640, 750, 828, 1080, 1200, 1920]): string => {
  return widths
    .map(width => `${imageOptimizer.loader({ src, width, quality: 85 })} ${width}w`)
    .join(', ');
};

export const generateSizes = (breakpoints: Record<string, string> = {
  '(max-width: 640px)': '100vw',
  '(max-width: 1200px)': '50vw',
  default: '33vw'
}): string => {
  const entries = Object.entries(breakpoints);
  const mediaQueries = entries.slice(0, -1).map(([query, size]) => `${query} ${size}`);
  const defaultSize = breakpoints.default || '100vw';
  
  return [...mediaQueries, defaultSize].join(', ');
};

// Hook for optimized images in React components
export const useOptimizedImage = (src: string, options: Partial<OptimizedImageLoaderConfig> = {}) => {
  const optimizer = new ImageOptimizer(options);
  
  return {
    loader: optimizer.loader,
    preload: (sizes?: string) => optimizer.preloadImage(src, sizes),
    generateBlur: () => optimizer.generateBlurPlaceholder(src),
    generateSrcSet: (widths?: number[]) => generateSrcSet(src, widths),
    generateSizes: (breakpoints?: Record<string, string>) => generateSizes(breakpoints),
  };
};

// Initialize lazy loading on client side
if (typeof window !== 'undefined') {
  // Setup lazy loading when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      imageOptimizer.setupLazyLoading();
    });
  } else {
    imageOptimizer.setupLazyLoading();
  }

  // Setup lazy loading for dynamically added images
  const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const lazyImages = element.querySelectorAll('img[data-src]');
            if (lazyImages.length > 0) {
              imageOptimizer.setupLazyLoading();
            }
          }
        });
      }
    });
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
} 