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
    // Listen on the same BroadcastChannel the SW posts to when a push arrives.
    // This lets the page react in real time even if the tab is in the foreground
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

  // Prompt the user for notification permission.
  // The browser only allows one prompt; after 'denied' the button is disabled
  // and the user must reset it manually in browser settings.
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
      <h2>Push Notifications</h2>

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
            no notifications yet
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
    </div>
  )
}
