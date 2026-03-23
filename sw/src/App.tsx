import { useEffect, useState } from 'react'
import { BackgroundSync } from './BackgroundSync'
import { PushNotifications } from './PushNotifications'
import { SharedSensorData } from './SharedSensorData'

type SwState = 'unsupported' | 'registering' | 'active' | 'no-controller'

interface FetchResult {
  data: unknown
  cacheHeader: string | null
  timestamp: string
}

// Read all request keys from the api-v1 cache and return their URLs.
// Used to show which endpoints the SW has cached for offline use.
async function getCachedUrls(): Promise<string[]> {
  if (!('caches' in window)) return []
  const cache = await caches.open('api-v1')
  const keys = await cache.keys()
  return keys.map((r) => r.url)
}

// Delete the entire api-v1 cache bucket.
// Forces the next fetch to go to the network and get a fresh MISS response.
async function clearApiCache(): Promise<void> {
  if (!('caches' in window)) return
  await caches.delete('api-v1')
}

function App() {
  const [swState, setSwState] = useState<SwState>('registering')
  const [result, setResult] = useState<FetchResult | null>(null)
  const [cachedUrls, setCachedUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [postId, setPostId] = useState(1)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setSwState('unsupported')
      return
    }
    // ready resolves once the SW is active. Check controller to distinguish
    // "SW active but not yet controlling this page" (first load) from "active
    // and controlling" (subsequent loads or after clients.claim()).
    navigator.serviceWorker.ready.then(() => {
      setSwState(navigator.serviceWorker.controller ? 'active' : 'no-controller')
    })
    // controllerchange fires when clients.claim() completes in the SW,
    // updating the state without requiring a page reload.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      setSwState('active')
    })
  }, [])

  // Fetch a post through the SW. The X-SW-Cache response header injected by
  // the SW indicates whether the response came from the network (MISS) or
  // the cache (HIT, when offline).
  async function fetchPost() {
    setLoading(true)
    try {
      const response = await fetch(
        `https://jsonplaceholder.typicode.com/posts/${postId}`
      )
      const data = await response.json()
      setResult({
        data,
        cacheHeader: response.headers.get('X-SW-Cache'),
        timestamp: new Date().toLocaleTimeString(),
      })
      setCachedUrls(await getCachedUrls())
    } finally {
      setLoading(false)
    }
  }

  async function handleClearCache() {
    await clearApiCache()
    setCachedUrls([])
    setResult(null)
  }

  // Re-read the cache keys without triggering a fetch — useful after the SW
  // has cached something in the background that the UI hasn't reflected yet.
  async function refreshCacheList() {
    setCachedUrls(await getCachedUrls())
  }

  const swStateColor: Record<SwState, string> = {
    unsupported: '#e74c3c',
    registering: '#f39c12',
    active: '#2ecc71',
    'no-controller': '#e67e22',
  }

  return (
    <div style={{ fontFamily: 'monospace', maxWidth: 700, margin: '2rem auto', padding: '0 1rem' }}>
      <h2>Service Worker Caching POC</h2>

      <div style={{ marginBottom: '1.5rem' }}>
        <strong>SW Status: </strong>
        <span
          style={{
            background: swStateColor[swState],
            color: '#fff',
            padding: '2px 8px',
            borderRadius: 4,
          }}
        >
          {swState}
        </span>
        {swState === 'no-controller' && (
          <span style={{ marginLeft: 8, color: '#888', fontSize: 12 }}>
            (reload the page to activate)
          </span>
        )}
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: 8, alignItems: 'center' }}>
        <label>
          Post ID:{' '}
          <input
            type="number"
            min={1}
            max={100}
            value={postId}
            onChange={(e) => setPostId(Number(e.target.value))}
            style={{ width: 60, fontFamily: 'monospace' }}
          />
        </label>
        <button onClick={fetchPost} disabled={loading}>
          {loading ? 'Fetching…' : 'Fetch post'}
        </button>
        <button onClick={handleClearCache}>Clear API cache</button>
        <button onClick={refreshCacheList}>Refresh cache list</button>
      </div>

      {result && (
        <div
          style={{
            background: '#1a1a1a',
            color: '#ccc',
            padding: '1rem',
            borderRadius: 6,
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <strong>X-SW-Cache: </strong>
            <span
              style={{
                color: result.cacheHeader === 'HIT' ? '#2ecc71' : '#e74c3c',
                fontWeight: 'bold',
              }}
            >
              {result.cacheHeader ?? 'header not present (SW not yet controlling)'}
            </span>
            <span style={{ marginLeft: 16, color: '#666', fontSize: 12 }}>
              @ {result.timestamp}
            </span>
          </div>
          <pre style={{ margin: 0, fontSize: 12, overflow: 'auto' }}>
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}

      <div>
        <strong>Cached API URLs ({cachedUrls.length})</strong>
        {cachedUrls.length === 0 ? (
          <p style={{ color: '#888', fontSize: 13 }}>empty — fetch something first</p>
        ) : (
          <ul style={{ fontSize: 13, paddingLeft: '1.2rem' }}>
            {cachedUrls.map((url) => (
              <li key={url}>{url}</li>
            ))}
          </ul>
        )}
      </div>

      <BackgroundSync />
      <PushNotifications />
      <SharedSensorData />
    </div>
  )
}

export default App
