// Service Worker for ClarityLog - Offline Support and Caching
const CACHE_NAME = 'claritylog-v1';
const OFFLINE_URL = '/offline.html';

// Essential assets to cache
const STATIC_CACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico'
];

// API endpoints that can work offline
const API_CACHE_PATTERNS = [
  '/api/user/profile',
  '/api/entries',
  '/api/insights',
  '/api/dashboard/stats'
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_CACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
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

  // Skip Firebase and Google services - let them handle their own connections
  if (url.hostname.includes('googleapis.com') || 
      url.hostname.includes('google.com') ||
      url.hostname.includes('firebase.com') ||
      url.hostname.includes('gstatic.com') ||
      url.protocol === 'chrome-extension:' ||
      url.protocol === 'wss:') {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests with cache-first strategy for read operations
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const isReadOperation = API_CACHE_PATTERNS.some(pattern => 
    url.pathname.startsWith(pattern)
  );

  if (isReadOperation) {
    try {
      // Try network first for fresh data
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        // Cache successful responses
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
        return networkResponse;
      }
      
      throw new Error('Network request failed');
    } catch (error) {
      // Fall back to cache if network fails
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Return offline message for API failures
      return new Response(
        JSON.stringify({ 
          error: 'Offline', 
          message: 'This feature requires an internet connection',
          cached: false 
        }),
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  // For write operations, always try network
  try {
    return await fetch(request);
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'Cannot perform this action while offline. Please try again when connected.',
        action: 'retry_when_online'
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle navigation requests with network-first strategy
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // Fall back to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return caches.match(OFFLINE_URL);
  }
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // For critical assets, we might have a fallback
    return new Response('Offline', { status: 503 });
  }
}

// Handle background sync for when connection is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineActions());
  }
});

// Sync offline actions when connection is restored
async function syncOfflineActions() {
  try {
    // Check if we have any queued actions in IndexedDB
    const queuedActions = await getQueuedActions();
    
    for (const action of queuedActions) {
      try {
        await fetch(action.url, action.options);
        // Remove successful action from queue
        await removeQueuedAction(action.id);
      } catch (error) {
        console.log('Failed to sync action:', action.id);
      }
    }
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

// Simple IndexedDB helpers for action queue
async function getQueuedActions() {
  // Placeholder - implement IndexedDB logic if needed
  return [];
}

async function removeQueuedAction(id) {
  // Placeholder - implement IndexedDB logic if needed
}