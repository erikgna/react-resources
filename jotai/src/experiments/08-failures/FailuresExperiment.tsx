import { useState, useRef, Suspense } from 'react'
import { atom, useAtom, useAtomValue, createStore, Provider } from 'jotai'
import { Section, Row, Btn, Info, Pre, ErrorBoundary } from '../shared'

// ─── 8.1 Atom created inside component ───────────────────────────────────────

function BadAtomInComponent() {
  // WRONG: new atom object created every render → new subscription every render
  const freshAtom = atom(Math.random())
  const val = useAtomValue(freshAtom)
  const renders = useRef(0); renders.current++
  return (
    <div style={{ fontSize: 13, color: '#888' }}>
      value: <span style={{ color: '#ff6b6b' }}>{val.toFixed(4)}</span>
      {'  ·  '}renders: <span style={{ color: '#ff6b6b' }}>{renders.current}</span>
    </div>
  )
}

// Correct: atom at module level
const stableAtom = atom(Math.random())

function GoodAtomOutside() {
  const val = useAtomValue(stableAtom)
  const renders = useRef(0); renders.current++
  return (
    <div style={{ fontSize: 13, color: '#888' }}>
      value: <span style={{ color: '#4caf50' }}>{val.toFixed(4)}</span>
      {'  ·  '}renders: <span style={{ color: '#4caf50' }}>{renders.current}</span>
    </div>
  )
}

function AtomInComponent() {
  const [show, setShow] = useState(false)
  return (
    <Section title="8.1 — Atom created inside component (common mistake)">
      <Info>Every render creates a new atom object — a new identity. Jotai sees a new atom each time and creates a new subscription, causing a re-render loop on some versions.</Info>
      <Row style={{ marginBottom: 10 }}>
        <Btn onClick={() => setShow(s => !s)}>{show ? 'Hide' : 'Show'} examples</Btn>
      </Row>
      {show && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, color: '#ff6b6b', marginBottom: 4 }}>WRONG — atom inside component:</div>
            <BadAtomInComponent />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#4caf50', marginBottom: 4 }}>CORRECT — atom at module level:</div>
            <GoodAtomOutside />
          </div>
        </div>
      )}
      <Pre>{`// WRONG: atom() called inside component body
function Component() {
  const myAtom = atom(0)        // new object every render
  const [val] = useAtom(myAtom) // subscribes to a different atom each render
}

// CORRECT: atom defined at module level (or in a stable ref/memo)
const myAtom = atom(0)          // one stable object
function Component() {
  const [val] = useAtom(myAtom) // always the same subscription
}`}</Pre>
    </Section>
  )
}

// ─── 8.2 Circular derived atoms ──────────────────────────────────────────────

// Circular: a reads b, b reads a — infinite recursion during evaluation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let circularA: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let circularB: any = null

function CircularAtoms() {
  const [triggered, setTriggered] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trigger = () => {
    setTriggered(true)
    try {
      // Build circular dependency at call time so it doesn't explode on load
      circularA = atom((get: (a: typeof circularB) => number) => (circularB ? get(circularB) + 1 : 0))
      circularB = atom((get: (a: typeof circularA) => number) => (circularA ? get(circularA) + 1 : 0))
      const store = createStore()
      store.get(circularA) // triggers evaluation → stack overflow
      setError('No error caught — may depend on JS engine stack depth')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <Section title="8.2 — Circular derived atoms → stack overflow">
      <Info>a = atom(get =&gt; get(b) + 1), b = atom(get =&gt; get(a) + 1) — each evaluation triggers the other. JavaScript will throw a Maximum call stack size exceeded error.</Info>
      <Row style={{ marginBottom: 10 }}>
        <Btn onClick={trigger} danger>Trigger circular dep</Btn>
        <Btn onClick={() => { setTriggered(false); setError(null) }}>Reset</Btn>
      </Row>
      {triggered && (
        <div style={{ fontSize: 12, color: error?.includes('call stack') || error?.includes('stack') ? '#ff6b6b' : '#888' }}>
          {error || 'Evaluating...'}
        </div>
      )}
      <Pre>{`const a = atom(get => get(b) + 1)  // reads b
const b = atom(get => get(a) + 1)  // reads a
// store.get(a) → evaluates a → reads b → evaluates b → reads a → ...
// Result: Maximum call stack size exceeded`}</Pre>
    </Section>
  )
}

// ─── 8.3 Writing to a read-only derived atom ─────────────────────────────────

const readOnlyDerived = atom(get => get(atom(10)) * 2)

function WriteToReadOnly() {
  const [show, setShow] = useState(false)
  return (
    <Section title="8.3 — Writing to a read-only derived atom">
      <Info>atom(get =&gt; ...) with no write function is read-only. Calling useSetAtom or set() on it throws at runtime. TypeScript catches this at compile time if types are correct.</Info>
      <Row style={{ marginBottom: 10 }}>
        <Btn onClick={() => setShow(true)} danger>Attempt write</Btn>
        <Btn onClick={() => setShow(false)}>Reset</Btn>
      </Row>
      {show && (
        <ErrorBoundary>
          <WriteAttempt />
        </ErrorBoundary>
      )}
      <Pre>{`const readOnlyAtom = atom(get => get(base) * 2)
// TypeScript type: ReadAtom<number> — no write method
// useSetAtom(readOnlyAtom)  → TS compile error (good)
// store.set(readOnlyAtom, v) → runtime: "Cannot write to a read-only derived atom"

// Fix: add a write fn to make it writable
const writableAtom = atom(
  get => get(base) * 2,
  (_get, set, v) => set(base, v / 2)
)`}</Pre>
    </Section>
  )
}

function WriteAttempt() {
  // Intentionally forcing a runtime error via store.set on a read-only atom
  const store = createStore()
  try {
    store.set(readOnlyDerived as unknown as Parameters<typeof store.set>[0], 99)
  } catch (e) {
    throw new Error(`Runtime error: ${e instanceof Error ? e.message : String(e)}`)
  }
  return null
}

// ─── 8.4 Async atom without Suspense ─────────────────────────────────────────

const slowAtom = atom(async () => {
  await new Promise(r => setTimeout(r, 500))
  return 'loaded!'
})

function AsyncWithoutSuspense() {
  return (
    <Section title="8.4 — Async atom without Suspense boundary">
      <Info>Without a Suspense boundary, the component that reads an async atom renders nothing — the Promise itself is returned as the value. No error, no spinner, just silence.</Info>
      <div style={{ fontSize: 12, marginBottom: 10 }}>
        <div style={{ color: '#ff6b6b', marginBottom: 6 }}>WRONG — no Suspense:</div>
        <MissingBoundary />
      </div>
      <div style={{ fontSize: 12 }}>
        <div style={{ color: '#4caf50', marginBottom: 6 }}>CORRECT — with Suspense:</div>
        <Suspense fallback={<span style={{ color: '#555' }}>Loading...</span>}>
          <ProperAsync />
        </Suspense>
      </div>
      <Pre>{`// WRONG: renders nothing while promise is pending
function MissingBoundary() {
  const val = useAtomValue(slowAtom)
  return <div>{val}</div>  // val is a Promise during loading
}

// CORRECT: Suspense shows fallback until resolved
<Suspense fallback="Loading...">
  <Component />  {/* reads slowAtom — suspends until resolved */}
</Suspense>`}</Pre>
    </Section>
  )
}

function MissingBoundary() {
  try {
    const val = useAtomValue(slowAtom)
    return (
      <div style={{ color: '#888', fontSize: 12 }}>
        {typeof val === 'string' ? val : '(nothing visible — rendering with pending Promise)'}
      </div>
    )
  } catch {
    return <div style={{ color: '#888', fontSize: 12 }}>(suspended — needs Suspense boundary)</div>
  }
}

function ProperAsync() {
  const val = useAtomValue(slowAtom)
  return <div style={{ color: '#4caf50', fontSize: 12 }}>{val}</div>
}

// ─── 8.5 Atom used after store destroy ───────────────────────────────────────

function StaleSubscription() {
  const [log, setLog] = useState<string[]>([])
  const storeRef = useRef<ReturnType<typeof createStore> | null>(null)
  const unsubRef = useRef<(() => void) | null>(null)

  const setupSubscription = () => {
    const s = createStore()
    storeRef.current = s
    const a = atom(0)
    let count = 0
    unsubRef.current = s.sub(a, () => {
      count++
      setLog(prev => [...prev, `listener fired #${count}`])
    })
    s.set(a, 1)
    setLog(prev => [...prev, 'Subscribed and set to 1'])
  }

  const fireAfterUnsub = () => {
    if (!storeRef.current) return
    unsubRef.current?.()
    setLog(prev => [...prev, 'Unsubscribed'])
    // Attempting a set after unsubscribe — listener should NOT fire
    storeRef.current.set(atom(0), 99)
    setLog(prev => [...prev, 'Set after unsub — listener should be silent'])
  }

  return (
    <Section title="8.5 — Stale subscription after unsubscribe">
      <Info>store.subscribe returns an unsubscribe function. Failing to call it (or using a destroyed store) causes the listener to keep firing — a memory and logic leak.</Info>
      <Row style={{ marginBottom: 10 }}>
        <Btn onClick={setupSubscription}>Setup subscription</Btn>
        <Btn onClick={fireAfterUnsub} danger>Unsubscribe then set</Btn>
        <Btn onClick={() => setLog([])}>Clear log</Btn>
      </Row>
      <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 3, padding: 10, maxHeight: 120, overflowY: 'auto', fontSize: 12 }}>
        {log.length === 0
          ? <span style={{ color: '#333' }}>— no actions yet —</span>
          : log.map((l, i) => <div key={i} style={{ color: '#7ec8a0' }}>{l}</div>)
        }
      </div>
      <Pre>{`const unsub = store.sub(atom, listener)  // jotai v2: sub() not subscribe()

// Always clean up in useEffect:
useEffect(() => {
  const unsub = store.sub(myAtom, () => { ... })
  return unsub  // called on unmount
}, [])

// useSyncExternalStore handles this automatically —
// one of the reasons useAtom is safer than manual subscribe()`}</Pre>
    </Section>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function FailuresExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>08 · Failures</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Five common Jotai pitfalls: atoms inside components, circular dependencies, writing to
        read-only atoms, missing Suspense boundaries, and stale subscriptions.
      </p>
      <AtomInComponent />
      <CircularAtoms />
      <WriteToReadOnly />
      <AsyncWithoutSuspense />
      <StaleSubscription />
    </div>
  )
}
