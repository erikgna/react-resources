import { useState, useEffect, useCallback, useReducer } from 'react'
import { Section, Info, Pre } from '../shared'

// ─── Custom hooks under test ──────────────────────────────────────────────────

export function useCounter(initial = 0) {
  const [count, setCount] = useState(initial)
  return {
    count,
    increment: () => setCount(c => c + 1),
    decrement: () => setCount(c => c - 1),
    reset: () => setCount(initial),
  }
}

export function useToggle(initial = false) {
  const [on, setOn] = useState(initial)
  return {
    on,
    toggle: () => setOn(v => !v),
    setOn: () => setOn(true),
    setOff: () => setOn(false),
  }
}

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored !== null ? (JSON.parse(stored) as T) : defaultValue
    } catch {
      return defaultValue
    }
  })

  const set = useCallback((next: T) => {
    setValue(next)
    localStorage.setItem(key, JSON.stringify(next))
  }, [key])

  const remove = useCallback(() => {
    setValue(defaultValue)
    localStorage.removeItem(key)
  }, [key, defaultValue])

  return { value, set, remove }
}

type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }

type FetchAction<T> =
  | { type: 'start' }
  | { type: 'success'; data: T }
  | { type: 'error'; error: string }
  | { type: 'reset' }

function fetchReducer<T>(state: FetchState<T>, action: FetchAction<T>): FetchState<T> {
  switch (action.type) {
    case 'start':   return { status: 'loading' }
    case 'success': return { status: 'success', data: action.data }
    case 'error':   return { status: 'error', error: action.error }
    case 'reset':   return { status: 'idle' }
  }
}

export function useFetch<T>(fetcher: (() => Promise<T>) | null) {
  const [state, dispatch] = useReducer(fetchReducer<T>, { status: 'idle' })

  useEffect(() => {
    if (!fetcher) return
    let cancelled = false
    dispatch({ type: 'start' })
    fetcher()
      .then(data => { if (!cancelled) dispatch({ type: 'success', data }) })
      .catch((e: Error) => { if (!cancelled) dispatch({ type: 'error', error: e.message }) })
    return () => { cancelled = true }
  }, [fetcher])

  return state
}

// ─── Demo components that use the hooks ──────────────────────────────────────

export function CounterDemo() {
  const { count, increment, decrement, reset } = useCounter(0)
  return (
    <div>
      <button onClick={decrement} aria-label="decrement">−</button>
      <span data-testid="counter-value">{count}</span>
      <button onClick={increment} aria-label="increment">+</button>
      <button onClick={reset}>Reset</button>
    </div>
  )
}

export function ToggleDemo() {
  const { on, toggle, setOn, setOff } = useToggle(false)
  return (
    <div>
      <span data-testid="toggle-state">{on ? 'ON' : 'OFF'}</span>
      <button onClick={toggle}>Toggle</button>
      <button onClick={setOn}>Force On</button>
      <button onClick={setOff}>Force Off</button>
    </div>
  )
}

// ─── 4.1 renderHook ──────────────────────────────────────────────────────────

function RenderHookSection() {
  return (
    <Section title="4.1 — renderHook — testing hooks in isolation">
      <Info>renderHook mounts a minimal component just to run the hook. No UI needed — directly inspect and manipulate hook state.</Info>
      <Pre>{`import { renderHook, act } from '@testing-library/react'

const { result } = renderHook(() => useCounter(10))

// result.current holds the hook's current return value
expect(result.current.count).toBe(10)

// State updates inside act() — guarantees React processes effects
act(() => { result.current.increment() })
expect(result.current.count).toBe(11)

// Re-render with new props via rerender()
const { result, rerender } = renderHook(
  ({ initial }) => useCounter(initial),
  { initialProps: { initial: 0 } }
)
rerender({ initial: 5 })   // triggers re-render with new prop`}</Pre>
    </Section>
  )
}

// ─── 4.2 Hooks with effects ───────────────────────────────────────────────────

function HooksWithEffectsSection() {
  return (
    <Section title="4.2 — Hooks with useEffect (useFetch)">
      <Info>Effects fire after render. In tests they run synchronously in jsdom — but async effects still need waitFor.</Info>
      <Pre>{`const { result } = renderHook(() =>
  useFetch(() => Promise.resolve('data'))
)

// After mount: status is 'loading' (effect hasn't resolved)
expect(result.current.status).toBe('loading')

// Wait for the async effect to resolve
await waitFor(() => {
  expect(result.current.status).toBe('success')
})
expect((result.current as { status: 'success'; data: string }).data).toBe('data')

// Cleanup: cancelled flag prevents setState after unmount
// → no "Can't update unmounted component" warning`}</Pre>
    </Section>
  )
}

// ─── 4.3 Mocking in hooks ────────────────────────────────────────────────────

function MockingInHooksSection() {
  return (
    <Section title="4.3 — Mocking external dependencies (localStorage)">
      <Pre>{`describe('useLocalStorage', () => {
  beforeEach(() => localStorage.clear())

  it('initializes from localStorage', () => {
    localStorage.setItem('theme', JSON.stringify('dark'))
    const { result } = renderHook(() => useLocalStorage('theme', 'light'))
    expect(result.current.value).toBe('dark')
  })

  it('writes to localStorage on set', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0))
    act(() => { result.current.set(42) })
    expect(localStorage.getItem('count')).toBe('42')
  })
})

// For API calls: inject the fetcher as a parameter (dependency injection)
// rather than mocking module internals. Much more testable.`}</Pre>
    </Section>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function HooksExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>04 · Custom Hooks</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        renderHook lets you test hooks in isolation without building a UI around them.
        Combined with act() and waitFor, it covers the full lifecycle of stateful hooks.
      </p>
      <RenderHookSection />
      <HooksWithEffectsSection />
      <MockingInHooksSection />
      <Section title="4.4 — Live hook demos">
        <Info>Components using the hooks under test. Try them interactively.</Info>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14 }}>
            <div style={{ color: '#555', fontSize: 10, marginBottom: 8 }}>useCounter</div>
            <CounterDemo />
          </div>
          <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14 }}>
            <div style={{ color: '#555', fontSize: 10, marginBottom: 8 }}>useToggle</div>
            <ToggleDemo />
          </div>
        </div>
      </Section>
    </div>
  )
}
