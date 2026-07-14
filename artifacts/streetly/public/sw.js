/* Streetly Service Worker — push notification handler */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "Streetly", body: event.data.text() };
  }

  const title = data.title || "Streetly";
  const options = {
    body: data.body || "",
    icon: self.registration.scope + "icons/icon-192x192.png",
    badge: self.registration.scope + "icons/badge-96x96.png",
    image: data.image || undefined,
    data: { url: data.url || self.registration.scope },
    tag: data.tag || "streetly",
    renotify: true,
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || self.registration.scope;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
