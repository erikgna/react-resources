import { useEffect, useRef, useState } from 'react'

interface PushLogEntry {
  title: string
  body: string
  timestamp: string
}

export function PushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  )
  const [log, setLog] = useState<PushLogEntry[]>([])
  const channelRef = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    const channel = new BroadcastChannel('sw-push')
    channelRef.current = channel
    channel.onmessage = (event) => {
      if (event.data?.type === 'push-received') {
        const { title, body, timestamp } = event.data
        setLog((prev) => [{ title, body, timestamp }, ...prev])
      }
    }
    return () => channel.close()
  }, [])

  async function requestPermission() {
    const result = await Notification.requestPermission()
    setPermission(result)
  }

  const permColor: Record<NotificationPermission, string> = {
    granted: '#2ecc71',
    denied: '#e74c3c',
    default: '#f39c12',
  }

  return (
    <div style={{ marginTop: '3rem', borderTop: '1px solid #333', paddingTop: '2rem' }}>
      <h2>Push Notifications POC</h2>

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: 12, alignItems: 'center' }}>
        <span>
          <strong>Permission: </strong>
          <span style={{ color: permColor[permission], fontWeight: 'bold' }}>{permission}</span>
        </span>
        {permission !== 'granted' && (
          <button onClick={requestPermission} disabled={permission === 'denied'}>
            {permission === 'denied' ? 'Blocked (reset in browser settings)' : 'Request permission'}
          </button>
        )}
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <strong>Received pushes ({log.length})</strong>
        {log.length === 0 ? (
          <p style={{ color: '#888', fontSize: 13 }}>
            no pushes yet — simulate one via DevTools (see instructions below)
          </p>
        ) : (
          <div style={{ marginTop: 8 }}>
            {log.map((entry, i) => (
              <div
                key={i}
                style={{
                  background: '#1a1a1a',
                  padding: '8px 12px',
                  borderRadius: 4,
                  marginBottom: 6,
                  fontSize: 13,
                }}
              >
                <span style={{ color: '#888' }}>{entry.timestamp} </span>
                <strong>{entry.title}</strong>
                {entry.body && <span style={{ color: '#aaa' }}> — {entry.body}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <details open style={{ fontSize: 13, color: '#888' }}>
        <summary style={{ cursor: 'pointer', marginBottom: 8 }}>How to test with DevTools</summary>
        <ol style={{ lineHeight: 2.2 }}>
          <li>Grant notification permission above</li>
          <li>Open DevTools → <strong>Application</strong> tab → <strong>Service Workers</strong></li>
          <li>
            Find the <strong>Push</strong> input field and enter a JSON payload:
            <pre style={{ background: '#111', padding: 8, borderRadius: 4, marginTop: 4 }}>
              {`{"title":"Hello","body":"World","icon":"/vite.svg","url":"/"}`}
            </pre>
          </li>
          <li>Click <strong>Push</strong> — the SW fires the push event and shows a notification</li>
          <li>The notification appears above and in the OS notification tray</li>
          <li>Clicking the notification focuses/opens the app (handled by <code>notificationclick</code>)</li>
        </ol>
        <p style={{ marginTop: 8 }}>
          Plain text also works — the SW falls back to using it as the body.
        </p>
      </details>
    </div>
  )
}
