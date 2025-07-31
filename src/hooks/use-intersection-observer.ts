import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(options: UseIntersectionObserverOptions = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  const { freezeOnceVisible = false, ...observerOptions } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;

    if (freezeOnceVisible && hasIntersected) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;
        setIsIntersecting(isElementIntersecting);

        if (isElementIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...observerOptions,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [hasIntersected, freezeOnceVisible, observerOptions]);

  return {
    ref: elementRef,
    isIntersecting,
    hasIntersected,
  };
}

export default useIntersectionObserver;
