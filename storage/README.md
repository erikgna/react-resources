# Frontend Storage Comparison

This document compares **localStorage**, **sessionStorage**, **cookies**, and **IndexedDB** in terms of use cases, features, pros, cons, and deeper implementation details.

---

## 1. Overview Table

| Feature              | localStorage     | sessionStorage   | Cookies         | IndexedDB                             |
| -------------------- | ---------------- | ---------------- | --------------- | ------------------------------------- |
| Capacity             | ~5–10MB          | ~5–10MB          | ~4KB            | Hundreds of MBs+ (quota-based)        |
| Expiration           | Persistent       | Until tab closes | Configurable    | Persistent                            |
| Scope                | Per origin       | Per origin + tab | Per domain/path | Per origin                            |
| API Type             | Synchronous      | Synchronous      | String-based    | Asynchronous                          |
| Data Format          | Strings only     | Strings only     | Strings only    | Structured objects (structured clone) |
| Accessible by Server | No               | No               | Yes             | No                                    |
| Transactions         | No               | No               | No              | Yes                                   |
| Indexing             | No               | No               | No              | Yes                                   |
| Threading            | Main thread only | Main thread only | N/A             | Works with Web Workers                |
| Events               | storage event    | storage event    | None            | Versioning + events                   |

---

## 2. localStorage

### Use Cases

* Persisting user preferences (theme, language)
* Feature flags
* Small client-side caching

### Advanced Features

* `storage` event for cross-tab sync
* Per-origin isolation

### Pros

* Extremely simple API
* Persistent across sessions
* Works across tabs (shared)

### Cons

* Synchronous (blocks main thread)
* String-only (manual serialization)
* No expiration or TTL
* No indexing or querying
* Vulnerable to XSS
* Can be cleared by user or browser policies

---

## 3. sessionStorage

### Use Cases

* Multi-step forms
* Temporary UI state
* Per-tab isolation data

### Advanced Features

* Isolated per browsing context (tab/window)
* `storage` event (limited usefulness due to isolation)

### Pros

* Auto-cleared on tab close
* No cross-tab leakage
* Simple API

### Cons

* Same limitations as localStorage
* Not shared across tabs
* Not suitable for persistence

---

## 4. Cookies

### Use Cases

* Authentication (session cookies, refresh tokens)
* Server-side rendering context
* Tracking and personalization

### Advanced Features

* Attributes:

  * `HttpOnly` (not accessible via JS)
  * `Secure` (HTTPS only)
  * `SameSite` (CSRF protection)
  * `Domain` / `Path` scoping
  * `Expires` / `Max-Age`
  * Partitioned cookies (modern browsers)

### Pros

* Automatically sent with HTTP requests
* Strong security controls (HttpOnly)
* Required for many auth flows

### Cons

* Very small size
* Sent on every request (performance overhead)
* String-only
* Manual parsing/serialization
* Increasing browser restrictions (third-party cookies)

---

## 5. IndexedDB

### Use Cases

* Offline-first apps
* Large caches (API responses, assets)
* Complex relational-like data
* PWAs and sync engines

### Advanced Features

* Object stores (tables)
* Indexes for fast queries
* Transactions (ACID-like behavior)
* Versioning and migrations
* Cursors for iteration
* Structured clone (supports objects, arrays, blobs, files)
* Works in Web Workers
* Background sync patterns

### Pros

* Handles large datasets efficiently
* Non-blocking (async)
* Rich querying capabilities
* Supports binary data

### Cons

* Complex API (steep learning curve)
* Verbose and event-based
* Requires wrapper libraries (Dexie, idb)
* Debugging is harder

---

## 6. Less Obvious Behaviors

### Quota & Eviction

* All storage types (except cookies) are subject to browser quota
* Browsers may evict data under storage pressure (especially IndexedDB)
* Storage persistence can be requested (`navigator.storage.persist()`)

### Private / Incognito Mode

* Data is usually cleared when session ends
* IndexedDB/localStorage may behave differently across browsers

### Security Considerations

* localStorage/sessionStorage: vulnerable to XSS
* Cookies: vulnerable to CSRF (mitigated by SameSite)
* IndexedDB: safer for large data but still JS-accessible

### Performance

* localStorage/sessionStorage: blocking
* Cookies: network overhead
* IndexedDB: best for large/complex data

---

## 7. When to Use Each

### Use localStorage when:

* You need simple persistence
* Data is small and non-sensitive

### Use sessionStorage when:

* Data is temporary and tab-scoped

### Use Cookies when:

* Data must be sent to the server automatically
* You need secure session handling

### Use IndexedDB when:

* You need large, structured, or queryable data
* You need offline capabilities

---

## 8. Key Tradeoffs

* **Simplicity vs Power**: localStorage/sessionStorage are simple; IndexedDB is powerful
* **Sync vs Async**: local/session are blocking; IndexedDB is non-blocking
* **Security**: Cookies (HttpOnly) > others for auth
* **Data Model**: IndexedDB supports real structures; others are string-only

---

## 9. Quick Summary

* **localStorage**: Simple persistent key-value store
* **sessionStorage**: Temporary per-tab storage
* **Cookies**: Server communication + auth
* **IndexedDB**: Full client-side database

---

## 10. Practical Recommendation

Modern stack approach:

* Use **HttpOnly cookies** for auth tokens
* Use **localStorage** for UI preferences
* Use **IndexedDB** for caching and offline
* Use **sessionStorage** sparingly for ephemeral state

---

## 11. Final Verdict

Yes, these four cover almost all browser-native storage needs.

However, in real-world apps, they are often combined with:

* In-memory state (React state, Zustand, Redux)
* Service Worker caches (Cache API)

So while this comparison is complete for *core storage APIs*, a full frontend architecture usually layers multiple storage mechanisms together.
