/**
 * Smart lazy loading with preload support
 * Groups related routes and enables prefetching
 */

import { ReactNode, lazy } from 'react';

export interface PreloadConfig {
  /** CSS selector to trigger preload on hover */
  selector?: string;
  /** Delay in ms before preloading */
  delay?: number;
}

/**
 * Wrap lazy component with preload support
 * Usage:
 *   const Dashboard = preloadLazy(() => import('@/pages/dashboard'), '#nav-dashboard')
 *   
 *   On hover of #nav-dashboard, the chunk is prefetched
 */
export function preloadLazy<T extends Record<string, React.ComponentType<any>>>(
  importFunc: () => Promise<T>,
  selector?: string,
  delay: number = 200
) {
  const LazyComponent = lazy(importFunc);
  
  // Set up preload on hover if selector provided
  if (selector && typeof document !== 'undefined') {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        setTimeout(() => {
          // Trigger import to preload chunk
          importFunc().catch(() => {
            // Silently ignore preload failures
          });
        }, delay);
      });
    });
  }
  
  return LazyComponent;
}

/**
 * Batch preload multiple chunks
 * Useful for preloading dashboard + related pages on login
 */
export async function preloadChunks(
  importFuncs: Array<() => Promise<any>>
) {
  return Promise.all(
    importFuncs.map(fn =>
      fn().catch(() => {
        // Silently ignore individual failures
      })
    )
  );
}
