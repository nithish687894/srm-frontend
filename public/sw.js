const CACHE_NAME = 'srm-nexus-v6';
const ASSETS = [
  '/site.webmanifest?v=4',
  '/nexus-logo.png'
];

// Only these paths get cached as offline fallbacks — everything else is network-only.
const CACHEABLE_PATHS = [
  '/nexus-logo.png',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/site.webmanifest',
  '/srmx-icon-192.png',
  '/srmx-icon-512.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache API calls or non-GET requests
  if (url.pathname.startsWith('/api/') || event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-only for navigation, JS, and CSS — prevents stale pages on Android WebView
  if (
    event.request.mode === 'navigate' ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css')
  ) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'SRM Nexus', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/nexus-logo.png',
    badge: '/favicon-32x32.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/notifications'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

