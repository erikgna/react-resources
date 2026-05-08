import { Suspense, useState, useRef } from 'react'
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'
import { loadable } from 'jotai/utils'
import { Section, Row, Btn, Info, Pre, ErrorBoundary } from '../shared'

// ─── Async atoms ─────────────────────────────────────────────────────────────

// Version counter drives refetch — incrementing it makes the async atom re-run
const versionAtom = atom(0)

const userIdAtom = atom(1)

// Async atom: Jotai suspends the component until the promise resolves
const userAtom = atom(async (get) => {
  const id = get(userIdAtom)
  const _version = get(versionAtom) // dependency on version triggers refresh
  const res = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<{ id: number; name: string; email: string; website: string }>
})

// Derived async: depends on another async atom — also suspends
const userTaglineAtom = atom(async (get) => {
  const user = await get(userAtom)
  return `${user.name} — ${user.website}`
})

// Loadable: wraps async atom, returns { state, data/error } — no Suspense needed
const userLoadable = loadable(userAtom)

// Failing atom — for error boundary demo
const failingAtom = atom(async () => {
  await new Promise(r => setTimeout(r, 200))
  throw new Error('Simulated fetch failure')
})

// ─── 4.1 Suspense-based async atom ───────────────────────────────────────────

function UserCard() {
  const user = useAtomValue(userAtom)
  return (
    <div style={{ fontSize: 13, color: '#e0e0e0' }}>
      <div>#{user.id} — <strong>{user.name}</strong></div>
      <div style={{ color: '#888', fontSize: 12 }}>{user.email}</div>
    </div>
  )
}

function UserIdControls() {
  const [id, setId] = useAtom(userIdAtom)
  const refresh = useSetAtom(versionAtom)
  return (
    <Row style={{ marginBottom: 12 }}>
      <span style={{ color: '#555', fontSize: 11 }}>User ID:</span>
      {[1, 2, 3, 4, 5].map(n => (
        <Btn key={n} onClick={() => setId(n)} danger={id === n}>{n}</Btn>
      ))}
      <Btn onClick={() => refresh(v => v + 1)}>Refresh</Btn>
    </Row>
  )
}

function SuspenseAsync() {
  return (
    <Section title="4.1 — Async atom + Suspense">
      <Info>atom(async get =&gt; ...) — Jotai suspends the reading component until the promise resolves. The Suspense boundary renders the fallback in the meantime.</Info>
      <UserIdControls />
      <Suspense fallback={<div style={{ color: '#555', fontSize: 13 }}>Loading user...</div>}>
        <UserCard />
      </Suspense>
      <Pre>{`const userAtom = atom(async (get) => {
  const id = get(userIdAtom)
  const res = await fetch(\`/users/\${id}\`)
  return res.json()
})

// Component reading userAtom suspends until promise resolves.
// React renders the <Suspense> fallback in the meantime.
// On userIdAtom change: atom re-evaluates, component suspends again.`}</Pre>
    </Section>
  )
}

// ─── 4.2 Async derived ───────────────────────────────────────────────────────

function TaglineDisplay() {
  const tagline = useAtomValue(userTaglineAtom)
  return <div style={{ color: '#79c0ff', fontSize: 13 }}>{tagline}</div>
}

function AsyncDerived() {
  return (
    <Section title="4.2 — Async derived atom">
      <Info>userTaglineAtom awaits the result of userAtom. Jotai handles the cascade — the tagline component also suspends until the base async atom resolves.</Info>
      <Suspense fallback={<div style={{ color: '#555', fontSize: 13 }}>Computing tagline...</div>}>
        <TaglineDisplay />
      </Suspense>
      <Pre>{`const userTaglineAtom = atom(async (get) => {
  const user = await get(userAtom)  // awaits the async base atom
  return \`\${user.name} — \${user.website}\`
})
// If userAtom suspends, userTaglineAtom also suspends`}</Pre>
    </Section>
  )
}

// ─── 4.3 Error boundary ──────────────────────────────────────────────────────

function FailingCard() {
  useAtomValue(failingAtom)
  return <div>Should not render</div>
}

function AsyncErrors() {
  const [show, setShow] = useState(false)
  return (
    <Section title="4.3 — Error boundary for rejected async atoms">
      <Info>When an async atom's promise rejects, the Suspense boundary propagates the error to the nearest ErrorBoundary. Without one, the error is uncaught.</Info>
      <Row style={{ marginBottom: 10 }}>
        <Btn onClick={() => setShow(true)}>Trigger failing atom</Btn>
        <Btn onClick={() => setShow(false)} danger>Reset</Btn>
      </Row>
      {show && (
        <ErrorBoundary>
          <Suspense fallback={<div style={{ color: '#555', fontSize: 13 }}>Loading (will fail)...</div>}>
            <FailingCard />
          </Suspense>
        </ErrorBoundary>
      )}
      <Pre>{`const failingAtom = atom(async () => {
  throw new Error('Simulated failure')
})

// Wrap in both Suspense (loading state) and ErrorBoundary (rejection)
<ErrorBoundary>
  <Suspense fallback="Loading...">
    <ComponentThatReadsFailingAtom />
  </Suspense>
</ErrorBoundary>`}</Pre>
    </Section>
  )
}

// ─── 4.4 Loadable: async without Suspense ────────────────────────────────────

function LoadableDemo() {
  const result = useAtomValue(userLoadable)
  const renders = useRef(0); renders.current++
  return (
    <Section title="4.4 — loadable(): async without Suspense">
      <Info>loadable(asyncAtom) wraps the async atom and returns a value with state: 'loading' | 'hasData' | 'hasError'. No Suspense boundary needed — component handles all states explicitly.</Info>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>
        state: <span style={{ color: '#79c0ff' }}>{result.state}</span>
        {'  ·  '}renders: <span style={{ color: '#4caf50' }}>{renders.current}</span>
      </div>
      {result.state === 'loading' && <div style={{ color: '#555' }}>Loading...</div>}
      {result.state === 'hasData' && (
        <div style={{ color: '#e0e0e0', fontSize: 13 }}>{result.data.name}</div>
      )}
      {result.state === 'hasError' && (
        <div style={{ color: '#ff6b6b', fontSize: 13 }}>{String(result.error)}</div>
      )}
      <Pre>{`import { loadable } from 'jotai/utils'

const userLoadable = loadable(userAtom)

function Component() {
  const result = useAtomValue(userLoadable)
  // result.state === 'loading'  → show spinner
  // result.state === 'hasData'  → result.data is available
  // result.state === 'hasError' → result.error is set
}
// No <Suspense> or ErrorBoundary required`}</Pre>
    </Section>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function AsyncExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>04 · Async Atoms</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Jotai treats async atoms as first-class. atom(async get =&gt; ...) integrates with React Suspense
        automatically. loadable() provides a non-Suspense alternative for components that need explicit
        loading/error state.
      </p>
      <SuspenseAsync />
      <AsyncDerived />
      <AsyncErrors />
      <LoadableDemo />
    </div>
  )
}
