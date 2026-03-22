/**
 * Service Worker BafaConnect
 * Gère les notifications push et le cache PWA
 */

const CACHE_NAME = 'bafaconnect-v1';

// Installation du SW
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activation
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Réception d'une notification push
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'BafaConnect', body: event.data.text() };
  }

  const options = {
    body: data.body || '',
    icon: '/logo-bafaconnect.png',
    badge: '/logo-bafaconnect.png',
    tag: data.tag || 'bafaconnect-notif',
    data: { url: data.url || '/' },
    vibrate: [100, 50, 100],
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'BafaConnect', options)
  );
});

// Clic sur une notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si un onglet est déjà ouvert, le mettre en focus
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Sinon, ouvrir un nouvel onglet
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
