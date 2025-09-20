import { useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

interface SmartCacheOptions {
  maxSize?: number;
  ttl?: number; // Time to live in milliseconds
  prefetchThreshold?: number; // Prefetch when cache is this % full
}

export const useSmartCache = <T,>(options: SmartCacheOptions = {}) => {
  const {
    maxSize = 100,
    ttl = 5 * 60 * 1000, // 5 minutes default
    prefetchThreshold = 0.8
  } = options;

  const cache = useRef<Map<string, CacheEntry<T>>>(new Map());
  const queryClient = useQueryClient();

  // Cache cleanup
  const cleanup = useCallback(() => {
    const now = Date.now();
    const entries = Array.from(cache.current.entries());
    
    // Remove expired entries
    entries.forEach(([key, entry]) => {
      if (now - entry.timestamp > ttl) {
        cache.current.delete(key);
      }
    });

    // If still over limit, remove least recently used
    if (cache.current.size > maxSize) {
      const sortedEntries = entries
        .filter(([key]) => cache.current.has(key)) // Only existing entries
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

      const toRemove = sortedEntries.slice(0, cache.current.size - maxSize);
      toRemove.forEach(([key]) => cache.current.delete(key));
    }
  }, [maxSize, ttl]);

  // Get from cache
  const get = useCallback((key: string): T | null => {
    const entry = cache.current.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > ttl) {
      cache.current.delete(key);
      return null;
    }

    // Update access info
    entry.lastAccessed = now;
    entry.accessCount++;

    return entry.data;
  }, [ttl]);

  // Set cache entry
  const set = useCallback((key: string, data: T) => {
    const now = Date.now();
    cache.current.set(key, {
      data,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now
    });

    // Trigger cleanup if needed
    if (cache.current.size > maxSize) {
      cleanup();
    }
  }, [maxSize, cleanup]);

  // Smart prefetch based on patterns
  const prefetch = useCallback(async (key: string, fetchFn: () => Promise<T>) => {
    // Only prefetch if not already cached or cache is stale
    const cached = get(key);
    if (cached) return cached;

    try {
      const data = await fetchFn();
      set(key, data);
      return data;
    } catch (error) {
      console.warn(`Prefetch failed for key ${key}:`, error);
      return null;
    }
  }, [get, set]);

  // Invalidate cache entries
  const invalidate = useCallback((pattern?: string) => {
    if (!pattern) {
      cache.current.clear();
      return;
    }

    const keys = Array.from(cache.current.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        cache.current.delete(key);
      }
    });
  }, []);

  // Get cache stats
  const getStats = useCallback(() => {
    const entries = Array.from(cache.current.values());
    return {
      size: cache.current.size,
      totalAccesses: entries.reduce((sum, entry) => sum + entry.accessCount, 0),
      averageAge: entries.length > 0 
        ? entries.reduce((sum, entry) => sum + (Date.now() - entry.timestamp), 0) / entries.length
        : 0,
      hitRate: entries.length > 0 
        ? entries.filter(entry => entry.accessCount > 1).length / entries.length
        : 0
    };
  }, []);

  // Periodic cleanup
  useEffect(() => {
    const interval = setInterval(cleanup, 60000); // Every minute
    return () => clearInterval(interval);
  }, [cleanup]);

  return {
    get,
    set,
    prefetch,
    invalidate,
    getStats,
    clear: () => cache.current.clear()
  };
};