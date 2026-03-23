import { useEffect, useRef, useState } from 'react'

interface GeoPayload {
  lat: number
  lng: number
  accuracy: number
  timestamp: number
  fromTabId: string
}

const TAB_ID = Math.random().toString(36).slice(2, 8)

export function SharedSensorData() {
  const [role, setRole] = useState<'idle' | 'provider' | 'receiver'>('idle')
  const [geo, setGeo] = useState<GeoPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    // Listen for geo-broadcast messages posted by the SW to all clients.
    // Both the provider tab and receiver tabs go through this same handler.
    const onMessage = (event: MessageEvent) => {
      if (event.data.type === 'geo-broadcast') {
        setGeo(event.data.payload)
      }
    }
    navigator.serviceWorker.addEventListener('message', onMessage)

    // Ask the SW for the last known value on mount so a freshly opened tab
    // doesn't have to wait for the next watchPosition tick to show data.
    navigator.serviceWorker.ready.then((reg) => {
      reg.active?.postMessage({ type: 'geo-request' })
    })

    return () => {
      navigator.serviceWorker.removeEventListener('message', onMessage)
    }
  }, [])

  // Start a continuous geolocation watch and forward each position update to
  // the SW. The SW fans it out to all clients, so only this tab calls the
  // Geolocation API regardless of how many tabs are open.
  function startProviding() {
    if (!('geolocation' in navigator)) {
      setError('Geolocation not supported')
      return
    }
    setRole('provider')
    setError(null)
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const payload: GeoPayload = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
          // Tag the payload with this tab's ID so receivers can tell
          // whether the data came from themselves or another tab.
          fromTabId: TAB_ID,
        }
        navigator.serviceWorker.controller?.postMessage({ type: 'geo-update', payload })
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true }
    )
  }

  // Cancel the watchPosition subscription and return to idle.
  // The SW retains the last known value in memory until overwritten or restarted.
  function stopProviding() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setRole('idle')
  }

  const isProvider = role === 'provider'
  const receivingFromOtherTab = geo && geo.fromTabId !== TAB_ID

  return (
    <div style={{ marginTop: '3rem', borderTop: '1px solid #333', paddingTop: '2rem' }}>
      <h2>Shared Sensor Data POC</h2>
      <p style={{ color: '#888', fontSize: 13, marginTop: 0 }}>
        One tab watches geolocation. The SW caches and broadcasts it. All other tabs receive
        live updates without requesting geolocation themselves.
      </p>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: 12, alignItems: 'center' }}>
        <strong>This tab: </strong>
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#aaa' }}>{TAB_ID}</span>
        <span style={{
          background: isProvider ? '#2ecc71' : geo ? '#3498db' : '#555',
          color: '#fff',
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 12,
        }}>
          {isProvider ? 'provider' : geo ? 'receiver' : 'idle'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem' }}>
        <button onClick={startProviding} disabled={isProvider}>
          Start providing
        </button>
        <button onClick={stopProviding} disabled={!isProvider}>
          Stop providing
        </button>
      </div>

      {error && (
        <div style={{ color: '#e74c3c', fontSize: 13, marginBottom: '1rem' }}>{error}</div>
      )}

      {geo ? (
        <div style={{
          background: '#1a1a1a',
          color: '#ccc',
          padding: '1rem',
          borderRadius: 6,
          fontSize: 13,
          fontFamily: 'monospace',
        }}>
          <div style={{ marginBottom: 6, color: receivingFromOtherTab ? '#3498db' : '#2ecc71', fontSize: 12 }}>
            {receivingFromOtherTab
              ? `received from tab ${geo.fromTabId} via SW`
              : 'provided by this tab (also received via SW broadcast)'}
          </div>
          <div>lat: {geo.lat.toFixed(6)}</div>
          <div>lng: {geo.lng.toFixed(6)}</div>
          <div>accuracy: ±{geo.accuracy.toFixed(0)}m</div>
          <div style={{ color: '#555', marginTop: 6 }}>
            {new Date(geo.timestamp).toLocaleTimeString()}
          </div>
        </div>
      ) : (
        <p style={{ color: '#888', fontSize: 13 }}>
          No data yet — open a second tab and click "Start providing" there, or start here.
        </p>
      )}
    </div>
  )
}
