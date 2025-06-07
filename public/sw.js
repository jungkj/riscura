// Riscura Enterprise Service Worker
// Provides offline capability, caching strategies, and performance optimization

const CACHE_NAME = 'riscura-v1.0.0';
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;
const API_CACHE = `${CACHE_NAME}-api`;
const IMAGE_CACHE = `${CACHE_NAME}-images`;

// Cache versioning for updates
const CACHE_VERSION = '1.0.0';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/favicon.ico',
  '/logo.svg',
  '/manifest.json',
  '/_next/static/css/',
  '/_next/static/js/',
  'https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap'
];

// API routes to cache with specific strategies
const API_ROUTES = {
  critical: [
    '/api/auth/me',
    '/api/dashboard/insights',
    '/api/health'
  ],
  cacheable: [
    '/api/controls',
    '/api/risks',
    '/api/compliance/frameworks',
    '/api/documents'
  ],
  networkFirst: [
    '/api/ai/',
    '/api/billing/',
    '/api/collaboration/'
  ]
};

// Network timeout settings
const NETWORK_TIMEOUT = 3000; // 3 seconds
const FALLBACK_TIMEOUT = 1000; // 1 second

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Initialize other caches
      caches.open(DYNAMIC_CACHE),
      caches.open(API_CACHE),
      caches.open(IMAGE_CACHE)
    ]).then(() => {
      console.log('[SW] Static assets cached successfully');
      self.skipWaiting(); // Activate immediately
    }).catch((error) => {
      console.error('[SW] Failed to cache static assets:', error);
    })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('riscura-') && 
                     !cacheName.includes(CACHE_VERSION);
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      
      // Clean expired cache entries
      cleanExpiredCaches(),
      
      // Take control of all pages
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Service worker activated successfully');
    })
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Route to appropriate strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else {
    event.respondWith(handlePageRequest(request));
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'upload-data') {
    event.waitUntil(uploadPendingData());
  } else if (event.tag === 'download-updates') {
    event.waitUntil(downloadUpdates());
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push message received');
  
  const options = {
    body: 'You have new updates in Riscura',
    icon: '/logo.svg',
    badge: '/logo.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Updates',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.data = { ...options.data, ...data };
  }
  
  event.waitUntil(
    self.registration.showNotification('Riscura', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      
      case 'CACHE_URLS':
        event.waitUntil(
          cacheUrls(event.data.urls)
        );
        break;
      
      case 'CLEAR_CACHE':
        event.waitUntil(
          clearCache(event.data.cacheName)
        );
        break;
      
      case 'GET_CACHE_STATUS':
        event.waitUntil(
          getCacheStatus().then((status) => {
            event.ports[0].postMessage(status);
          })
        );
        break;
    }
  }
});

// Strategy: Cache First (for static assets)
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Return cached version immediately
      refreshCacheInBackground(request, cache);
      return cachedResponse;
    }
    
    // If not in cache, fetch from network
    const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUT);
    
    // Cache the response for future use
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Static asset fetch failed:', error);
    return createErrorResponse('Static asset unavailable offline');
  }
}

// Strategy: Network First with Cache Fallback (for pages)
async function handlePageRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUT);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    // Fallback to cache
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache, return offline page
    return caches.match('/offline') || createOfflineResponse();
  }
}

// Strategy: Stale While Revalidate (for API requests)
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Critical API routes - Network First
  if (API_ROUTES.critical.some(route => pathname.startsWith(route))) {
    return handleCriticalApiRequest(request);
  }
  
  // Cacheable API routes - Stale While Revalidate
  if (API_ROUTES.cacheable.some(route => pathname.startsWith(route))) {
    return handleCacheableApiRequest(request);
  }
  
  // Network first routes
  if (API_ROUTES.networkFirst.some(route => pathname.startsWith(route))) {
    return handleNetworkFirstApiRequest(request);
  }
  
  // Default: Network only
  return fetch(request);
}

// Critical API requests (user auth, health checks)
async function handleCriticalApiRequest(request) {
  try {
    const networkResponse = await fetchWithTimeout(request, FALLBACK_TIMEOUT);
    
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Quick fallback to cache for critical requests
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Add stale indicator header
      const staleResponse = new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: {
          ...cachedResponse.headers,
          'X-Cached': 'true',
          'X-Cache-Date': new Date().toISOString()
        }
      });
      return staleResponse;
    }
    
    return createApiErrorResponse(request.url);
  }
}

// Cacheable API requests (controls, risks, etc.)
async function handleCacheableApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Return cached version immediately if available
  if (cachedResponse && !isExpired(cachedResponse)) {
    // Update cache in background
    refreshApiCacheInBackground(request, cache);
    return cachedResponse;
  }
  
  try {
    // Fetch fresh data
    const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUT);
    
    if (networkResponse.ok) {
      // Add timestamp for expiry checking
      const responseToCache = new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: {
          ...networkResponse.headers,
          'X-Cache-Timestamp': Date.now().toString()
        }
      });
      
      cache.put(request, responseToCache.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    // Return stale cache if network fails
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return createApiErrorResponse(request.url);
  }
}

// Network first API requests (AI, billing, etc.)
async function handleNetworkFirstApiRequest(request) {
  try {
    return await fetchWithTimeout(request, NETWORK_TIMEOUT);
  } catch (error) {
    // Only cache specific GET requests as fallback
    if (request.method === 'GET') {
      const cache = await caches.open(API_CACHE);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    return createApiErrorResponse(request.url);
  }
}

// Strategy: Cache First with Network Update (for images)
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fetch from network
    const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUT);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Image fetch failed:', error);
    return createPlaceholderImageResponse();
  }
}

// Utility Functions

function fetchWithTimeout(request, timeout) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, timeout);
    
    fetch(request)
      .then((response) => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(request.url);
}

function isStaticAsset(request) {
  return request.url.includes('/_next/static/') ||
         request.url.includes('/static/') ||
         request.url.includes('.js') ||
         request.url.includes('.css') ||
         request.url.includes('/fonts/');
}

function isExpired(response) {
  const timestamp = response.headers.get('X-Cache-Timestamp');
  if (!timestamp) return true;
  
  const cacheTime = parseInt(timestamp, 10);
  const now = Date.now();
  
  return (now - cacheTime) > CACHE_EXPIRY;
}

async function refreshCacheInBackground(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    console.log('[SW] Background cache refresh failed:', error);
  }
}

async function refreshApiCacheInBackground(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseToCache = new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: {
          ...networkResponse.headers,
          'X-Cache-Timestamp': Date.now().toString()
        }
      });
      
      cache.put(request, responseToCache);
    }
  } catch (error) {
    console.log('[SW] Background API cache refresh failed:', error);
  }
}

function createErrorResponse(message) {
  return new Response(
    JSON.stringify({ error: message, offline: true }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

function createApiErrorResponse(url) {
  return new Response(
    JSON.stringify({
      error: 'API unavailable offline',
      url,
      offline: true,
      timestamp: new Date().toISOString()
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

function createOfflineResponse() {
  const offlineHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Riscura - Offline</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: 'Inter', sans-serif;
          text-align: center;
          padding: 2rem;
          background: #f8fafc;
          color: #334155;
        }
        .container {
          max-width: 500px;
          margin: 0 auto;
          padding: 2rem;
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .logo { width: 64px; height: 64px; margin: 0 auto 1rem; }
        h1 { color: #1e293b; margin-bottom: 1rem; }
        p { margin-bottom: 1.5rem; }
        .retry-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.375rem;
          cursor: pointer;
          font-weight: 500;
        }
        .retry-btn:hover { background: #2563eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">📊</div>
        <h1>You're Offline</h1>
        <p>Riscura is currently unavailable. Please check your internet connection and try again.</p>
        <button class="retry-btn" onclick="window.location.reload()">
          Try Again
        </button>
      </div>
    </body>
    </html>
  `;
  
  return new Response(offlineHtml, {
    headers: { 'Content-Type': 'text/html' }
  });
}

function createPlaceholderImageResponse() {
  // Simple 1x1 transparent pixel
  const pixel = new Uint8Array([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 
    0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0x21, 0xF9, 0x04, 0x01, 0x00, 
    0x00, 0x00, 0x00, 0x2C, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 
    0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3B
  ]);
  
  return new Response(pixel, {
    headers: { 'Content-Type': 'image/gif' }
  });
}

async function cleanExpiredCaches() {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    if (cacheName.startsWith('riscura-')) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response && isExpired(response)) {
          await cache.delete(request);
        }
      }
    }
  }
}

async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);
  return cache.addAll(urls);
}

async function clearCache(cacheName) {
  return caches.delete(cacheName);
}

async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const cacheName of cacheNames) {
    if (cacheName.startsWith('riscura-')) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      status[cacheName] = keys.length;
    }
  }
  
  return status;
}

async function uploadPendingData() {
  // Handle background data upload when online
  console.log('[SW] Uploading pending data...');
  // Implementation would depend on specific offline data storage strategy
}

async function downloadUpdates() {
  // Handle background updates download
  console.log('[SW] Downloading updates...');
  // Implementation would fetch latest critical data
}

console.log('[SW] Service worker script loaded'); 