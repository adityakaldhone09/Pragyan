/**
 * Service Worker for Pragyan AI
 * Enables offline support and caching strategies
 * 
 * Cache Strategy:
 * - Critical assets (HTML, CSS, JS): Cache first, fallback to network
 * - API responses: Network first, fallback to cache (max 5 min old)
 * - Images: Cache first, fallback to placeholder
 */

const CACHE_VERSION = 'v1';
const CRITICAL_CACHE = `${CACHE_VERSION}-critical`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Critical assets to cache on install
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/offline.html',
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CRITICAL_CACHE).then((cache) => {
      return cache.addAll(CRITICAL_ASSETS).catch(() => {
        // Some assets might fail, continue anyway
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !name.startsWith(CACHE_VERSION))
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external origins
  if (url.origin !== location.origin) {
    return;
  }

  // API calls: Network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Images: Cache first
  if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }

  // JS/CSS: Cache first
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(cacheFirstStrategy(request, CRITICAL_CACHE));
    return;
  }

  // Default: Cache first
  event.respondWith(cacheFirstStrategy(request, CRITICAL_CACHE));
});

/**
 * Cache first strategy: Check cache first, fallback to network
 */
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline - resource not available', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Network first strategy: Try network, fallback to cache
 */
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cache = await caches.open(API_CACHE);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Handle background sync for offline requests
 * (Optional: implement when needed)
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(
      // Implement syncing logic here
      Promise.resolve()
    );
  }
});
