const STATIC_CACHE = 'static-v1';
const API_CACHE = 'api-v1';
const STATIC_ASSETS = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const valid = new Set([STATIC_CACHE, API_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !valid.has(k)).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

function cloneWithHeader(response, headerName, headerValue) {
  const headers = new Headers(response.headers);
  headers.set(headerName, headerValue);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const DB_NAME = 'sw-poc';
const OUTBOX_STORE = 'outbox';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(OUTBOX_STORE, { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getAllPending(db) {
  return new Promise((resolve, reject) => {
    const req = db.transaction(OUTBOX_STORE, 'readonly').objectStore(OUTBOX_STORE).getAll();
    req.onsuccess = () => resolve(req.result.filter((i) => i.status === 'pending'));
    req.onerror = () => reject(req.error);
  });
}

function updateItem(db, id, updates) {
  return new Promise((resolve, reject) => {
    const store = db.transaction(OUTBOX_STORE, 'readwrite').objectStore(OUTBOX_STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const putReq = store.put({ ...getReq.result, ...updates });
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-outbox') {
    event.waitUntil(syncOutbox());
  }
});

async function syncOutbox() {
  const channel = new BroadcastChannel('sw-sync');
  const db = await openDB();
  const items = await getAllPending(db);

  channel.postMessage({ type: 'sync-start', count: items.length });

  let synced = 0;
  let failed = 0;

  await Promise.allSettled(
    items.map(async (item) => {
      try {
        const res = await fetch('https://jsonplaceholder.typicode.com/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: item.title, body: item.body, userId: 1 }),
        });
        const data = await res.json();
        await updateItem(db, item.id, {
          status: 'done',
          syncedAt: new Date().toISOString(),
          responseId: data.id,
        });
        channel.postMessage({ type: 'sync-item-done', id: item.id, responseId: data.id });
        synced++;
      } catch (err) {
        await updateItem(db, item.id, { status: 'failed' });
        channel.postMessage({ type: 'sync-item-failed', id: item.id, error: String(err) });
        failed++;
      }
    })
  );

  channel.postMessage({ type: 'sync-complete', synced, failed });
  channel.close();
}

self.addEventListener('push', (event) => {
  const defaults = { title: 'Push Notification', body: 'No payload', icon: '/vite.svg', url: '/' };
  let data = defaults;

  if (event.data) {
    try {
      data = { ...defaults, ...event.data.json() };
    } catch {
      data = { ...defaults, body: event.data.text() };
    }
  }

  const channel = new BroadcastChannel('sw-push');
  channel.postMessage({ type: 'push-received', ...data, timestamp: new Date().toISOString() });
  channel.close();

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      data: { url: data.url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        const match = list.find((c) => c.url.includes(url));
        return match ? match.focus() : clients.openWindow(url);
      })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.hostname === 'jsonplaceholder.typicode.com') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const toCache = networkResponse.clone();
          caches.open(API_CACHE).then((cache) => cache.put(event.request, toCache));
          return cloneWithHeader(networkResponse.clone(), 'X-SW-Cache', 'MISS');
        })
        .catch(() =>
          caches.match(event.request).then((cached) => {
            if (cached) return cloneWithHeader(cached, 'X-SW-Cache', 'HIT');
            return new Response(JSON.stringify({ error: 'offline, not in cache' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json', 'X-SW-Cache': 'MISS' },
            });
          })
        )
    );
    return;
  }

  event.respondWith(
    caches
      .match(event.request)
      .then((cached) => cached || fetch(event.request))
  );
});
