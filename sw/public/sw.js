const STATIC_CACHE = 'static-v1';
const API_CACHE = 'api-v1';
// Assets to pre-cache on install so the shell loads offline immediately
const STATIC_ASSETS = ['/', '/index.html'];

// install: pre-cache static shell, then force this SW to become active
// without waiting for existing tabs to close (skipWaiting)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  // Skip the "waiting" phase — take over immediately on update
  self.skipWaiting();
});

// activate: clean up stale caches from previous SW versions, then claim
// all open clients so this SW controls them without a page reload
self.addEventListener('activate', (event) => {
  const valid = new Set([STATIC_CACHE, API_CACHE]);
  event.waitUntil(
    caches
      .keys()
      // Delete any cache whose name isn't in the valid set (old versions)
      .then((keys) =>
        Promise.all(keys.filter((k) => !valid.has(k)).map((k) => caches.delete(k)))
      )
      // claim() makes this SW the controller for all open tabs immediately.
      // Chained inside waitUntil so activation doesn't complete until claim
      // resolves — otherwise navigator.serviceWorker.controller can still be
      // null when the page checks it right after ready resolves.
      .then(() => self.clients.claim())
  );
});

// Utility: clone a response and inject/overwrite a single header.
// Responses from the Cache API and fetch() are immutable, so we must
// reconstruct them to add custom headers like X-SW-Cache.
function cloneWithHeader(response, headerName, headerValue) {
  const headers = new Headers(response.headers);
  headers.set(headerName, headerValue);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// ── IndexedDB helpers for Background Sync outbox ─────────────────────────────

const DB_NAME = 'sw-poc';
const OUTBOX_STORE = 'outbox';

// Open (or create) the IndexedDB database.
// onupgradeneeded runs only when the DB is first created or version bumps.
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      // Create the outbox object store with an auto-incrementing numeric key
      req.result.createObjectStore(OUTBOX_STORE, { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Read all records from the outbox store and return only the pending ones
function getAllPending(db) {
  return new Promise((resolve, reject) => {
    const req = db.transaction(OUTBOX_STORE, 'readonly').objectStore(OUTBOX_STORE).getAll();
    req.onsuccess = () => resolve(req.result.filter((i) => i.status === 'pending'));
    req.onerror = () => reject(req.error);
  });
}

// Merge `updates` into an existing record identified by `id`
function updateItem(db, id, updates) {
  return new Promise((resolve, reject) => {
    const store = db.transaction(OUTBOX_STORE, 'readwrite').objectStore(OUTBOX_STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      // Spread existing fields then overwrite with updates (e.g. status, syncedAt)
      const putReq = store.put({ ...getReq.result, ...updates });
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

// ── Background Sync ───────────────────────────────────────────────────────────

// The browser fires this event when connectivity is restored and a sync tag
// was previously registered via registration.sync.register()
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-outbox') {
    // waitUntil keeps the SW alive until all pending items are flushed
    event.waitUntil(syncOutbox());
  }
});

async function syncOutbox() {
  // BroadcastChannel lets us push status updates to all open tabs
  const channel = new BroadcastChannel('sw-sync');
  const db = await openDB();
  const items = await getAllPending(db);

  channel.postMessage({ type: 'sync-start', count: items.length });

  let synced = 0;
  let failed = 0;

  // allSettled so one failed request doesn't abort the rest
  await Promise.allSettled(
    items.map(async (item) => {
      try {
        const res = await fetch('https://jsonplaceholder.typicode.com/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: item.title, body: item.body, userId: 1 }),
        });
        const data = await res.json();
        // Mark as done and store the server-assigned ID for display in the UI
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

// ── Push Notifications ────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  const defaults = { title: 'Push Notification', body: 'No payload', icon: '/vite.svg', url: '/' };
  let data = defaults;

  if (event.data) {
    try {
      // Prefer JSON payload so callers can set title, body, icon, url
      data = { ...defaults, ...event.data.json() };
    } catch {
      // Fall back to plain text if the payload isn't valid JSON
      data = { ...defaults, body: event.data.text() };
    }
  }

  // Notify open tabs via BroadcastChannel before showing the OS notification
  const channel = new BroadcastChannel('sw-push');
  channel.postMessage({ type: 'push-received', ...data, timestamp: new Date().toISOString() });
  channel.close();

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      // Store the target URL in notification data so notificationclick can use it
      data: { url: data.url },
    })
  );
});

// When the user clicks the OS notification, focus an existing tab on the
// target URL or open a new one if none is found
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

// ── Shared Sensor Data ────────────────────────────────────────────────────────

// In-memory cache of the most recent geolocation payload.
// Lives as long as the SW is alive; survives tab closes but resets on SW restart.
let latestGeoData = null;

self.addEventListener('message', (event) => {
  if (event.data.type === 'geo-update') {
    // A "provider" tab sent fresh geolocation data.
    // Cache it so late-joining tabs can request it, then fan-out to all clients.
    latestGeoData = event.data.payload;
    self.clients.matchAll().then((clients) => {
      // Broadcast to every controlled tab — including the provider itself,
      // so all tabs go through the same single code path to update their UI
      clients.forEach((client) => {
        client.postMessage({ type: 'geo-broadcast', payload: latestGeoData });
      });
    });
  } else if (event.data.type === 'geo-request') {
    // A tab just loaded and is asking for the last known value.
    // Reply only to the requesting client, not all clients.
    if (latestGeoData) {
      event.source.postMessage({ type: 'geo-broadcast', payload: latestGeoData });
    }
  }
});

// ── Fetch / Caching Strategy ──────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-first strategy for API calls:
  // Try the network, cache the response for offline use, tag with X-SW-Cache: MISS.
  // On network failure, serve from cache tagged X-SW-Cache: HIT.
  // If neither is available, return a 503 JSON error body.
  if (url.hostname === 'jsonplaceholder.typicode.com') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Clone before consuming — a response body can only be read once
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

  // Cache-first strategy for static assets:
  // Serve from cache if available, otherwise fetch from network.
  event.respondWith(
    caches
      .match(event.request)
      .then((cached) => cached || fetch(event.request))
  );
});
