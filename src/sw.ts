/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';

precacheAndRoute((self as any).__WB_MANIFEST);

registerRoute(
  ({ url }) => url.pathname.startsWith('/') && !url.pathname.startsWith('/api/'),
  new NetworkFirst({ cacheName: 'pages' })
);

self.addEventListener('push', (event) => {
  const data = (event as PushEvent).data?.json() as { title?: string; body?: string; icon?: string; badge?: string; data?: unknown } | undefined;
  if (!data?.title) return;
  (event as PushEvent).waitUntil(
    (self as unknown as ServiceWorkerGlobalScope).registration.showNotification(data.title, {
      body: data.body || '',
      icon: data.icon || '/icon.svg',
      badge: data.badge || '/icon.svg',
      data: data.data,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  (event as NotificationEvent).notification.close();
  const urlToOpen = new URL('/', (self as unknown as ServiceWorkerGlobalScope).location.origin).href;
  (event as NotificationEvent).waitUntil(
    (self as unknown as ServiceWorkerGlobalScope).clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return (client as WindowClient).focus();
        }
      }
      return (self as unknown as ServiceWorkerGlobalScope).clients.openWindow(urlToOpen);
    })
  );
});
