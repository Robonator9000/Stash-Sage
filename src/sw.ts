/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute((self as any).__WB_MANIFEST);

// Cache API responses with NetworkFirst, fallback to cache
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/') || url.pathname.startsWith('/graphql'),
  new NetworkFirst({
    cacheName: 'api',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Cache static assets (images, fonts) with CacheFirst
registerRoute(
  ({ request }) => request.destination === 'image' || request.destination === 'font',
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// CSS/JS: NetworkFirst so the user always loads the latest app code (avoids stale
// service-worker bundles that caused the session/consume-modal regression).
registerRoute(
  ({ request }) => request.destination === 'style' || request.destination === 'script',
  new NetworkFirst({
    cacheName: 'static-resources',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Navigation requests: NetworkFirst with offline fallback
registerRoute(
  ({ request, url }) =>
    url.origin === (self as unknown as ServiceWorkerGlobalScope).location.origin &&
    request.mode === 'navigate',
  async ({ request }) => {
    try {
      const networkResponse = await fetch(request);
      return networkResponse;
    } catch {
      const fallback = await caches.match('index.html');
      return fallback || Response.error();
    }
  }
);

// Offline fallback for failed requests
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open('precache');
        const fallback = await cache.match('index.html');
        return fallback || new Response('Offline', { status: 503 });
      })
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = (event as PushEvent).data?.json() as
    | { title?: string; body?: string; icon?: string; badge?: string; data?: unknown }
    | undefined;

  if (!data?.title) return;

  (event as PushEvent).waitUntil(
    (self as unknown as ServiceWorkerGlobalScope).registration.showNotification(data.title, {
      body: data.body || '',
      icon: data.icon || '/icon.svg',
      badge: data.badge || '/icon.svg',
      data: data.data,
      actions: [
        { action: 'open', title: 'Open' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    } as any)
  );
});

self.addEventListener('notificationclick', (event) => {
  (event as NotificationEvent).notification.close();

  if ((event as NotificationEvent).action === 'dismiss') return;

  const urlToOpen = new URL('/', (self as unknown as ServiceWorkerGlobalScope).location.origin).href;

  (event as NotificationEvent).waitUntil(
    (self as unknown as ServiceWorkerGlobalScope).clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return (client as WindowClient).focus();
          }
        }
        return (self as unknown as ServiceWorkerGlobalScope).clients.openWindow(urlToOpen);
      })
  );
});

// Periodic background sync for background updates
self.addEventListener('periodicsync', (event) => {
  if ((event as any).tag === 'sync-posts') {
    (event as any).waitUntil(
      fetch('/api/posts/sync', { method: 'POST' }).catch(() => {})
    );
  }
});

// Skip waiting and claim clients immediately
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());