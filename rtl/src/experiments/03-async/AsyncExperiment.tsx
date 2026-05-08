import { useState, useEffect } from 'react'
import { Section, Info, Pre } from '../shared'

// ─── Components under test ────────────────────────────────────────────────────

export type FetchStatus = 'idle' | 'loading' | 'success' | 'error'

export function DataLoader({ fetcher }: { fetcher: () => Promise<string> }) {
  const [status, setStatus] = useState<FetchStatus>('idle')
  const [data, setData] = useState('')
  const [error, setError] = useState('')

  const load = () => {
    setStatus('loading')
    fetcher()
      .then(d => { setData(d); setStatus('success') })
      .catch((e: Error) => { setError(e.message); setStatus('error') })
  }

  return (
    <div>
      <button onClick={load} disabled={status === 'loading'}>
        {status === 'loading' ? 'Loading...' : 'Load Data'}
      </button>
      {status === 'loading' && <p role="status" aria-label="loading">Loading...</p>}
      {status === 'success' && <p data-testid="result">{data}</p>}
      {status === 'error'   && <p role="alert" data-testid="error">{error}</p>}
    </div>
  )
}

export function AutoLoader({ fetcher }: { fetcher: () => Promise<string[]> }) {
  const [items, setItems] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetcher().then(data => { setItems(data); setLoading(false) })
  }, [fetcher])

  if (loading) return <div aria-label="loading">Loading items...</div>
  return (
    <ul>
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  )
}

export function NotificationToast({ duration = 300 }: { duration?: number }) {
  const [visible, setVisible] = useState(false)

  const show = () => {
    setVisible(true)
    setTimeout(() => setVisible(false), duration)
  }

  return (
    <div>
      <button onClick={show}>Show Toast</button>
      {visible && <div role="alert" data-testid="toast">Saved successfully!</div>}
    </div>
  )
}

export function DebounceSearch({ delay = 300 }: { delay?: number }) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), delay)
    return () => clearTimeout(id)
  }, [query, delay])

  return (
    <div>
      <label htmlFor="search">Search</label>
      <input
        id="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Type to search..."
      />
      {debouncedQuery && (
        <p data-testid="debounced-result">Searching for: {debouncedQuery}</p>
      )}
    </div>
  )
}

// ─── 3.1 waitFor vs findBy ────────────────────────────────────────────────────

function WaitForVsFindBy() {
  return (
    <Section title="3.1 — waitFor vs findBy*">
      <Info>findBy* is sugar for waitFor + getBy*. Use findBy for the common case; waitFor for complex multi-assertion waits.</Info>
      <Pre>{`// findByText — polls until text appears (default timeout: 1000ms)
const result = await screen.findByText('Loaded item')

// Equivalent to:
const result = await waitFor(() => screen.getByText('Loaded item'))

// waitFor — use when you need to assert on multiple things at once
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument()
  expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
})

// Options
await screen.findByText('Item', {}, { timeout: 3000, interval: 100 })
await waitFor(() => ..., { timeout: 5000, interval: 200 })`}</Pre>
    </Section>
  )
}

// ─── 3.2 act() ────────────────────────────────────────────────────────────────

function ActSection() {
  return (
    <Section title="3.2 — act() — when and why">
      <Info>act() ensures React processes all state updates and effects before assertions. RTL wraps render/userEvent in act() automatically.</Info>
      <Pre>{`// RTL automatically wraps these in act():
render(<Component />)           // initial render
userEvent.click(button)         // user events
waitFor(callback)               // async waits

// You need act() manually when:
// 1. Triggering state from OUTSIDE React (timer callbacks, websocket msgs)
// 2. Testing hooks directly with renderHook

import { act } from '@testing-library/react'

// Advancing fake timers requires act() to flush the resulting state updates
act(() => { vi.advanceTimersByTime(500) })

// Without act(), React will warn: "not wrapped in act(...)"
// and your assertions may run before state updates flush.`}</Pre>
    </Section>
  )
}

// ─── 3.3 Live demo ────────────────────────────────────────────────────────────

function LiveDemoSection() {
  const slowFetcher = () => new Promise<string>(resolve => setTimeout(() => resolve('Hello from server'), 400))
  return (
    <Section title="3.3 — DataLoader (live demo)">
      <Info>Click "Load Data" to observe the loading → success transition. The test file verifies this exact flow.</Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14 }}>
        <DataLoader fetcher={slowFetcher} />
      </div>
    </Section>
  )
}

// ─── 3.4 Fake timers ─────────────────────────────────────────────────────────

function FakeTimersSection() {
  return (
    <Section title="3.4 — Fake timers with vi.useFakeTimers()">
      <Pre>{`// Without fake timers: tests are slow (real 300ms delay)
// With fake timers: vi.advanceTimersByTime(300) is instant

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

it('debounce fires after delay', async () => {
  render(<DebounceSearch delay={300} />)
  await userEvent.type(screen.getByLabelText('Search'), 'query')

  // Result not visible yet — debounce hasn't fired
  expect(screen.queryByTestId('debounced-result')).not.toBeInTheDocument()

  // Advance the timer — state update fires, but needs act() to flush
  act(() => { vi.advanceTimersByTime(300) })

  expect(screen.getByTestId('debounced-result')).toHaveTextContent('query')
})`}</Pre>
    </Section>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function AsyncExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>03 · Async</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Async testing is where most RTL mistakes happen. waitFor, findBy, and act() each cover
        a different scenario — understanding the distinction prevents flaky tests.
      </p>
      <WaitForVsFindBy />
      <ActSection />
      <LiveDemoSection />
      <FakeTimersSection />
    </div>
  )
}
