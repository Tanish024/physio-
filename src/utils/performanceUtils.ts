import { Gym } from '@/types/maps';

/**
 * Cache for storing gym search results
 */
class GymCache {
  private cache = new Map<string, { data: Gym[]; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate cache key from location and radius
   */
  private generateKey(lat: number, lng: number, radius: number): string {
    // Round to 3 decimal places for cache efficiency
    const roundedLat = Math.round(lat * 1000) / 1000;
    const roundedLng = Math.round(lng * 1000) / 1000;
    return `${roundedLat},${roundedLng},${radius}`;
  }

  /**
   * Get cached gym data
   */
  get(lat: number, lng: number, radius: number): Gym[] | null {
    const key = this.generateKey(lat, lng, radius);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Set gym data in cache
   */
  set(lat: number, lng: number, radius: number, data: Gym[]): void {
    const key = this.generateKey(lat, lng, radius);
    this.cache.set(key, {
      data: [...data], // Create a copy to avoid mutations
      timestamp: Date.now()
    });
    
    // Clean up old entries periodically
    this.cleanup();
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Global cache instance
export const gymCache = new GymCache();

/**
 * Throttle function to limit function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Debounce function to delay function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null;
  return function(this: any, ...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    const callNow = immediate && !timeout;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(this, args);
  };
}

/**
 * Lazy loading utility for images
 */
export class LazyImageLoader {
  private observer: IntersectionObserver | null = null;
  private imageQueue = new Set<HTMLImageElement>();

  constructor() {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              this.loadImage(img);
              this.observer?.unobserve(img);
            }
          });
        },
        {
          rootMargin: '50px'
        }
      );
    }
  }

  /**
   * Add image to lazy loading queue
   */
  observe(img: HTMLImageElement): void {
    if (this.observer) {
      this.observer.observe(img);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(img);
    }
  }

  /**
   * Load image with error handling
   */
  private loadImage(img: HTMLImageElement): void {
    const src = img.dataset.src;
    if (src) {
      img.src = src;
      img.onload = () => {
        img.classList.add('loaded');
      };
      img.onerror = () => {
        img.classList.add('error');
        // Set fallback image
        img.src = '/placeholder-gym.jpg';
      };
    }
  }

  /**
   * Cleanup observer
   */
  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Global lazy loader instance
export const lazyImageLoader = new LazyImageLoader();

/**
 * Virtual scrolling utility for large lists
 */
export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function calculateVirtualScrollItems<T>(
  items: T[],
  scrollTop: number,
  options: VirtualScrollOptions
): {
  visibleItems: Array<{ item: T; index: number }>;
  totalHeight: number;
  offsetY: number;
} {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  
  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    startIndex + visibleCount + overscan * 2
  );
  
  const visibleItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    visibleItems.push({ item: items[i], index: i });
  }
  
  const offsetY = startIndex * itemHeight;
  
  return {
    visibleItems,
    totalHeight,
    offsetY
  };
}

/**
 * Memory usage monitoring
 */
export class MemoryMonitor {
  private static instance: MemoryMonitor;
  
  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  /**
   * Get current memory usage (if available)
   */
  getMemoryUsage(): any {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }

  /**
   * Log memory usage
   */
  logMemoryUsage(label: string): void {
    const memory = this.getMemoryUsage();
    if (memory) {
      console.log(`[${label}] Memory Usage:`, {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + ' MB',
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + ' MB',
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + ' MB'
      });
    }
  }

  /**
   * Check if memory usage is high
   */
  isMemoryUsageHigh(): boolean {
    const memory = this.getMemoryUsage();
    if (!memory) return false;
    
    const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    return usageRatio > 0.8; // 80% threshold
  }
}

// Global memory monitor instance
export const memoryMonitor = MemoryMonitor.getInstance();