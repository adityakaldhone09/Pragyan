/**
 * Service Worker Registration Hook
 * Enables offline support and asset caching
 */

import { useEffect } from 'react';

export function useServiceWorker() {
  useEffect(() => {
    // Only register in production
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('[SW] Service Workers not supported');
      return;
    }

    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('[SW] Registered successfully');
        
        // Check for updates every minute
        setInterval(() => {
          registration.update();
        }, 60000);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New SW ready, notify user
              console.log('[SW] New version available');
              // You could trigger a "update available" notification here
            }
          });
        });
      })
      .catch((err) => {
        console.error('[SW] Registration failed:', err);
      });

    // Handle online/offline events
    window.addEventListener('online', () => {
      console.log('[SW] App is online');
    });

    window.addEventListener('offline', () => {
      console.log('[SW] App is offline');
    });
  }, []);
}
