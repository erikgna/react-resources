import { useEffect, useRef, useState } from 'react'
import { addToOutbox, clearOutbox, getAllOutbox, type OutboxItem } from './db'

const SYNC_TAG = 'sync-outbox'

interface SyncLogEntry {
  message: string
  timestamp: string
  type: 'info' | 'success' | 'error'
}

const supported = 'serviceWorker' in navigator && 'SyncManager' in window

export function BackgroundSync() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [outbox, setOutbox] = useState<OutboxItem[]>([])
  const [online, setOnline] = useState(navigator.onLine)
  const [log, setLog] = useState<SyncLogEntry[]>([])
  const channelRef = useRef<BroadcastChannel | null>(null)

  // Prepend a timestamped entry so the most recent event stays at the top.
  function appendLog(message: string, type: SyncLogEntry['type'] = 'info') {
    setLog((prev) => [
      { message, type, timestamp: new Date().toLocaleTimeString() },
      ...prev,
    ])
  }

  // Pull the latest outbox state from IndexedDB and sync it into React state.
  // Called after any write (add, clear) and after each SW sync event.
  async function refreshOutbox() {
    setOutbox(await getAllOutbox())
  }

  useEffect(() => {
    refreshOutbox()

    const onOnline = () => {
      setOnline(true)
      appendLog('Connection restored', 'info')
    }
    const onOffline = () => {
      setOnline(false)
      appendLog('Connection lost — items will queue', 'info')
    }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    // Receive status updates broadcast by the SW during a sync run.
    // The SW sends granular per-item events so the log reflects real progress.
    const channel = new BroadcastChannel('sw-sync')
    channelRef.current = channel
    channel.onmessage = (event) => {
      const { type, count, synced, failed } = event.data
      if (type === 'sync-start') {
        appendLog(`Sync started — ${count} item(s) pending`, 'info')
      } else if (type === 'sync-complete') {
        appendLog(`Sync complete — ${synced} sent, ${failed} failed`, synced > 0 ? 'success' : 'error')
      } else if (type === 'sync-item-done') {
        appendLog(`Item #${event.data.id} → server assigned id ${event.data.responseId}`, 'success')
      } else if (type === 'sync-item-failed') {
        appendLog(`Item #${event.data.id} failed: ${event.data.error}`, 'error')
      }
      refreshOutbox()
    }

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      channel.close()
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    // Write to IndexedDB first so the item is safe even if the tab closes
    // before the SW gets a chance to sync it.
    const id = await addToOutbox({
      title,
      body,
      status: 'pending',
      createdAt: new Date().toISOString(),
    })
    appendLog(`Item #${id} queued: "${title}"`, 'info')
    setTitle('')
    setBody('')
    await refreshOutbox()

    if (!supported) {
      // BackgroundSync API unavailable (e.g. Firefox, Safari).
      // Fall back to a direct in-tab fetch so the item still goes through.
      appendLog('BackgroundSync not supported — falling back to immediate fetch', 'info')
      await immediateSync()
      return
    }

    try {
      const worker = await navigator.serviceWorker.ready as ServiceWorkerRegistration & { sync: { register(tag: string): Promise<void> } };
      // Registering the tag hands control to the browser — it will fire the SW
      // 'sync' event when online, even if this tab is closed before that happens.
      await worker.sync.register(SYNC_TAG)
      appendLog(`Sync tag "${SYNC_TAG}" registered`, 'info')
    } catch (err) {
      appendLog(`sync.register failed: ${String(err)}`, 'error')
    }
  }

  // Fallback sync used when the BackgroundSync API is unavailable.
  // Reads pending items directly from IndexedDB and POSTs them in-tab.
  async function immediateSync() {
    const items = (await getAllOutbox()).filter((i) => i.status === 'pending')
    appendLog(`Immediate sync: ${items.length} item(s)`, 'info')
    for (const item of items) {
      try {
        const res = await fetch('https://jsonplaceholder.typicode.com/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: item.title, body: item.body, userId: 1 }),
        })
        const data = await res.json()
        appendLog(`Item #${item.id} → server id ${data.id}`, 'success')
      } catch {
        appendLog(`Item #${item.id} failed`, 'error')
      }
    }
    await refreshOutbox()
  }

  async function handleClear() {
    await clearOutbox()
    await refreshOutbox()
    appendLog('Outbox cleared', 'info')
  }

  const statusColor = online ? '#2ecc71' : '#e74c3c'
  const logColor: Record<SyncLogEntry['type'], string> = {
    info: '#aaa',
    success: '#2ecc71',
    error: '#e74c3c',
  }

  return (
    <div style={{ marginTop: '3rem', borderTop: '1px solid #333', paddingTop: '2rem' }}>
      <h2>Background Sync POC</h2>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: 12, alignItems: 'center' }}>
        <span>
          <strong>Network: </strong>
          <span style={{ color: statusColor, fontWeight: 'bold' }}>
            {online ? 'online' : 'offline'}
          </span>
        </span>
        <span style={{ color: '#666', fontSize: 12 }}>
          BackgroundSync API: {supported ? 'supported' : 'not supported (using immediate fallback)'}
        </span>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1.5rem', maxWidth: 400 }}>
        <input
          placeholder="Post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ fontFamily: 'monospace', padding: '4px 8px' }}
        />
        <textarea
          placeholder="Post body (optional)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          style={{ fontFamily: 'monospace', padding: '4px 8px', resize: 'vertical' }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit">Queue &amp; Sync</button>
          <button type="button" onClick={handleClear}>Clear outbox</button>
        </div>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <strong>Outbox ({outbox.length})</strong>
          {outbox.length === 0 ? (
            <p style={{ color: '#888', fontSize: 13 }}>empty</p>
          ) : (
            <table style={{ fontSize: 12, borderCollapse: 'collapse', width: '100%', marginTop: 8 }}>
              <thead>
                <tr style={{ color: '#888' }}>
                  <th style={{ textAlign: 'left', paddingRight: 8 }}>#</th>
                  <th style={{ textAlign: 'left', paddingRight: 8 }}>title</th>
                  <th style={{ textAlign: 'left' }}>status</th>
                </tr>
              </thead>
              <tbody>
                {outbox.map((item) => (
                  <tr key={item.id}>
                    <td style={{ paddingRight: 8, color: '#666' }}>{item.id}</td>
                    <td style={{ paddingRight: 8 }}>{item.title}</td>
                    <td style={{
                      color: item.status === 'done' ? '#2ecc71' : item.status === 'failed' ? '#e74c3c' : '#f39c12',
                      fontWeight: 'bold',
                    }}>
                      {item.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div>
          <strong>Sync log</strong>
          {log.length === 0 ? (
            <p style={{ color: '#888', fontSize: 13 }}>no events yet</p>
          ) : (
            <div style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto', fontSize: 12 }}>
              {log.map((entry, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  <span style={{ color: '#555' }}>{entry.timestamp} </span>
                  <span style={{ color: logColor[entry.type] }}>{entry.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
