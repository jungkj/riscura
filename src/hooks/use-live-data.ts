import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';

interface UseApiDataOptions {
  enabled?: boolean;
  refetchInterval?: number;
  cacheKey?: string;
  staleTime?: number; // Time in ms before data is considered stale
  dependencies?: any[]; // Dependencies that trigger refetch
}

interface ApiResponse<T> {
  data: T;
  meta?: any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  staleTime: number;
}

// Simple in-memory cache
const cache = new Map<string, CacheEntry<any>>()

export function useApiData<T>(endpoint: string, options: UseApiDataOptions = {}) {
  const {
    enabled = true,
    refetchInterval,
    cacheKey = endpoint,
    staleTime = 5 * 60 * 1000, // 5 minutes default
    dependencies = [],
  } = options;

  const { isAuthenticated, token } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Memoize dependencies to prevent unnecessary re-renders
  const dependenciesString = useMemo(() => JSON.stringify(dependencies), [dependencies])

  // Check cache first
  const getCachedData = useCallback((): T | null => {
    const _cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < cached.staleTime) {
      return cached.data;
    }
    return null;
  }, [cacheKey]);

  // Cache data
  const setCachedData = useCallback(
    (_newData: T) => {
      cache.set(cacheKey, {
        data: newData,
        timestamp: Date.now(),
        staleTime,
      })
    },
    [cacheKey, staleTime]
  );

  const fetchData = useCallback(
    async (showLoading = true) => {
      // Don't fetch if component is unmounted
      if (!isMountedRef.current) return

      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Check cache first
      const cachedData = getCachedData()
      if (cachedData && !showLoading) {
        if (isMountedRef.current) {
          setData(cachedData);
          setError(null);
        }
        return;
      }

      abortControllerRef.current = new AbortController();

      try {
        if (showLoading && isMountedRef.current) setLoading(true);
        if (isMountedRef.current) setError(null);

        // Check if user is authenticated before making API calls to protected endpoints
        if (
          endpoint.startsWith('/api/') &&
          !endpoint.includes('/api/health') &&
          !endpoint.includes('/api/auth/session')
        ) {
          if (!isAuthenticated || !token) {
            // console.log(`User not authenticated, skipping fetch for ${endpoint}`)
            if (isMountedRef.current) {
              setError('Please log in to access this data');
              setLoading(false);
            }
            return;
          }
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }

        // Add authentication header if we have a token
        if (token && endpoint.startsWith('/api/') && !endpoint.includes('/api/auth/')) {
          headers['Authorization'] = `Bearer ${token}`
        }

        const response = await fetch(endpoint, {
          headers,
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }

        const result: ApiResponse<T> = await response.json();
        const fetchedData = result.data;

        if (isMountedRef.current) {
          setData(fetchedData);
          setCachedData(fetchedData);
          setLastFetchTime(Date.now());
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return; // Request was aborted, don't update state
        }

        if (isMountedRef.current) {
          // console.error(`Error fetching ${endpoint}:`, err)
          setError(err instanceof Error ? err.message : 'Failed to fetch data');

          // Fallback to cached data if available
          const cachedData = getCachedData()
          if (cachedData) {
            setData(cachedData);
          }
        }
      } finally {
        if (showLoading && isMountedRef.current) setLoading(false);
      }
    },
    [endpoint, getCachedData, setCachedData, isAuthenticated, token]
  );

  const refetch = useCallback(() => {
    if (enabled && isMountedRef.current) {
      return fetchData(true);
    }
  }, [enabled, fetchData]);

  // Initial fetch and dependency changes
  useEffect(() => {
    if (enabled) {
      fetchData()
    }
  }, [enabled, endpoint, dependenciesString]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, []);

  // Polling interval
  useEffect(() => {
    if (enabled && refetchInterval && refetchInterval > 0 && isMountedRef.current) {
      const interval = setInterval(() => {
        if (isMountedRef.current) {
          fetchData(false); // Don't show loading for background refetch
        }
      }, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [enabled, refetchInterval, fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    lastFetchTime,
    isStale: lastFetchTime > 0 && Date.now() - lastFetchTime > staleTime,
  }
}

// Enhanced specific hooks for different endpoints
export function useDashboardData(_timeRange: string = '30d') {
  return useApiData(`/api/dashboard?timeRange=${timeRange}`, {
    cacheKey: `dashboard-${timeRange}`,
    staleTime: 2 * 60 * 1000, // 2 minutes for dashboard
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    dependencies: [timeRange],
  })
}

export function useRisksData(_filters: Record<string, any> = {}) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const endpoint = `/api/risks${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

  return useApiData(endpoint, {
    cacheKey: `risks-${JSON.stringify(filters)}`,
    staleTime: 1 * 60 * 1000, // 1 minute for risks
    dependencies: [filters],
  });
}

export function useControlsData(_filters: Record<string, any> = {}) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const endpoint = `/api/controls${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

  return useApiData(endpoint, {
    cacheKey: `controls-${JSON.stringify(filters)}`,
    staleTime: 1 * 60 * 1000, // 1 minute for controls
    dependencies: [filters],
  });
}

export function useDocumentsData(_filters: Record<string, any> = {}) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const endpoint = `/api/documents${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

  return useApiData(endpoint, {
    cacheKey: `documents-${JSON.stringify(filters)}`,
    staleTime: 2 * 60 * 1000, // 2 minutes for documents
    dependencies: [filters],
  });
}

export function useQuestionnairesData(_filters: Record<string, any> = {}) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const endpoint = `/api/questionnaires${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

  return useApiData(endpoint, {
    cacheKey: `questionnaires-${JSON.stringify(filters)}`,
    staleTime: 3 * 60 * 1000, // 3 minutes for questionnaires
    dependencies: [filters],
  });
}

// Hook for single item fetching
export function useItemData<T>(endpoint: string, id: string | null) {
  return useApiData<T>(id ? `${endpoint}/${id}` : '', {
    enabled: !!id,
    cacheKey: `${endpoint}-${id}`,
    staleTime: 5 * 60 * 1000, // 5 minutes for single items
    dependencies: [id],
  })
}

// Hook for analytics data
export function useAnalyticsData(_type: string, filters: Record<string, any> = {}) {
  const queryParams = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const endpoint = `/api/analytics/${type}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

  return useApiData(endpoint, {
    cacheKey: `analytics-${type}-${JSON.stringify(filters)}`,
    staleTime: 10 * 60 * 1000, // 10 minutes for analytics
    dependencies: [type, filters],
  });
}

// Clear cache utility
export function clearCache(pattern?: string) {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key)
      }
    }
  } else {
    cache.clear();
  }
}
