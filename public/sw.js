// Riscura PWA Service Worker
const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE = `riscura-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `riscura-dynamic-${CACHE_VERSION}`;
const API_CACHE = `riscura-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `riscura-images-${CACHE_VERSION}`;

// Cache strategies configuration
const CACHE_STRATEGIES = {
  static: {
    name: STATIC_CACHE,
    patterns: [
      /\/_next\/static\//,
      /\/images\/logo\//,
      /\/fonts\//,
      /\.css$/,
      /\.js$/,
      /\.woff2?$/,
      /\.ttf$/,
      /\.eot$/
    ]
  },
  api: {
    name: API_CACHE,
    patterns: [
      /\/api\//,
      /\/graphql/
    ]
  },
  images: {
    name: IMAGE_CACHE,
    patterns: [
      /\.(?:png|jpg|jpeg|svg|gif|webp)$/
    ]
  },
  dynamic: {
    name: DYNAMIC_CACHE,
    patterns: [
      /\//
    ]
  }
};

// Files to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline',
  '/_next/static/css/',
  '/_next/static/js/',
  '/images/logo/icon-192x192.png',
  '/images/logo/icon-512x512.png'
];

// Maximum cache sizes
const MAX_CACHE_SIZES = {
  [STATIC_CACHE]: 50,
  [DYNAMIC_CACHE]: 100,
  [API_CACHE]: 50,
  [IMAGE_CACHE]: 60
};

// Cache expiration times (in milliseconds)
const CACHE_EXPIRATION = {
  [STATIC_CACHE]: 30 * 24 * 60 * 60 * 1000, // 30 days
  [DYNAMIC_CACHE]: 7 * 24 * 60 * 60 * 1000,  // 7 days
  [API_CACHE]: 1 * 60 * 60 * 1000,           // 1 hour
  [IMAGE_CACHE]: 14 * 24 * 60 * 60 * 1000    // 14 days
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        const validCaches = Object.values(CACHE_STRATEGIES).map(strategy => strategy.name);
        
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!validCaches.includes(cacheName)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Old caches cleaned up');
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('Failed to clean up caches:', error);
      })
  );
});

// Fetch event - handle network requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(handleFetch(request));
});

// Handle fetch requests with appropriate caching strategy
async function handleFetch(request) {
  const url = new URL(request.url);
  
  try {
    // Determine cache strategy
    const strategy = getCacheStrategy(request);
    
    switch (strategy.name) {
      case STATIC_CACHE:
        return await cacheFirst(request, strategy.name);
      
      case API_CACHE:
        return await networkFirst(request, strategy.name);
      
      case IMAGE_CACHE:
        return await cacheFirst(request, strategy.name);
      
      case DYNAMIC_CACHE:
        return await staleWhileRevalidate(request, strategy.name);
      
      default:
        return await networkFirst(request, strategy.name);
    }
  } catch (error) {
    console.error('Fetch failed:', error);
    return await handleOfflineFallback(request);
  }
}

// Determine which cache strategy to use
function getCacheStrategy(request) {
  const url = request.url;
  
  for (const [key, strategy] of Object.entries(CACHE_STRATEGIES)) {
    if (strategy.patterns.some(pattern => pattern.test(url))) {
      return strategy;
    }
  }
  
  return CACHE_STRATEGIES.dynamic;
}

// Cache-first strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse && !isExpired(cachedResponse, cacheName)) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
      await limitCacheSize(cacheName);
    }
    
    return networkResponse;
  } catch (error) {
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Network-first strategy
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
      await limitCacheSize(cacheName);
    }
    
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Start network request in background
  const networkPromise = fetch(request)
    .then(async (networkResponse) => {
      if (networkResponse.ok) {
        await cache.put(request, networkResponse.clone());
        await limitCacheSize(cacheName);
      }
      return networkResponse;
    })
    .catch(() => null);
  
  // Return cached response immediately if available
  if (cachedResponse && !isExpired(cachedResponse, cacheName)) {
    // Update cache in background
    networkPromise.catch(() => {});
    return cachedResponse;
  }
  
  // Wait for network response if no cache or expired
  return await networkPromise || cachedResponse || handleOfflineFallback(request);
}

// Check if cached response is expired
function isExpired(response, cacheName) {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;
  
  const responseDate = new Date(dateHeader);
  const now = new Date();
  const expiration = CACHE_EXPIRATION[cacheName] || CACHE_EXPIRATION[DYNAMIC_CACHE];
  
  return (now - responseDate) > expiration;
}

// Limit cache size
async function limitCacheSize(cacheName) {
  const maxSize = MAX_CACHE_SIZES[cacheName];
  if (!maxSize) return;
  
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    // Remove oldest entries
    const keysToDelete = keys.slice(0, keys.length - maxSize);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
  }
}

// Handle offline fallback
async function handleOfflineFallback(request) {
  const url = new URL(request.url);
  
  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    const cache = await caches.open(DYNAMIC_CACHE);
    const offlinePage = await cache.match('/offline');
    
    if (offlinePage) {
      return offlinePage;
    }
  }
  
  // Return placeholder for images
  if (request.destination === 'image') {
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" dy=".3em" fill="#6b7280">Image unavailable</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
  
  // Return error response
  return new Response(
    JSON.stringify({ error: 'Network unavailable', offline: true }),
    { 
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Background sync
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

// Handle background sync
async function handleBackgroundSync() {
  try {
    // Get sync data from IndexedDB or other storage
    const syncData = await getSyncData();
    
    for (const item of syncData) {
      try {
        await syncItem(item);
        await removeSyncItem(item.id);
      } catch (error) {
        console.error('Sync failed for item:', item.id, error);
      }
    }
    
    // Notify clients about sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC',
        payload: { completed: true }
      });
    });
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Sync individual item
async function syncItem(item) {
  const response = await fetch('/api/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(item.data)
  });
  
  if (!response.ok) {
    throw new Error(`Sync failed: ${response.statusText}`);
  }
  
  return response.json();
}

// Get sync data (placeholder - implement with IndexedDB)
async function getSyncData() {
  // This would typically read from IndexedDB
  return [];
}

// Remove sync item (placeholder - implement with IndexedDB)
async function removeSyncItem(id) {
  // This would typically remove from IndexedDB
  console.log('Removing sync item:', id);
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  const options = {
    body: 'New notification from Riscura',
    icon: '/images/logo/icon-192x192.png',
    badge: '/images/logo/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {},
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/images/icons/view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/images/icons/dismiss.png'
      }
    ]
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      Object.assign(options, payload);
    } catch (error) {
      console.error('Failed to parse push payload:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('Riscura', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      handleClearCache(payload.cacheName);
      break;
      
    case 'GET_CACHE_SIZE':
      handleGetCacheSize(event);
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
});

// Handle cache clearing
async function handleClearCache(cacheName) {
  try {
    if (cacheName) {
      await caches.delete(cacheName);
    } else {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    console.log('Cache cleared:', cacheName || 'all');
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}

// Handle cache size request
async function handleGetCacheSize(event) {
  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      totalSize += keys.length;
    }
    
    event.ports[0].postMessage({ size: totalSize });
  } catch (error) {
    console.error('Failed to get cache size:', error);
    event.ports[0].postMessage({ size: 0 });
  }
}

console.log('Service Worker loaded successfully'); 