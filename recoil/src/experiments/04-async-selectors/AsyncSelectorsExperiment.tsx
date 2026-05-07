import { Suspense, useState } from 'react'
import { atom, selector, useRecoilState, useRecoilValue, useRecoilValueLoadable, RecoilRoot } from 'recoil'
import { Section, Row, Btn, Info, Pre, ErrorBoundary, Badge } from '../shared'

// eslint-disable-next-line @typescript-eslint/no-unused-vars

// ─── Mock fetch ───────────────────────────────────────────────────────────────

interface User { id: number; name: string; email: string; role: string }

function mockFetch(id: number, delayMs = 900): Promise<User> {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      if (id === 13) reject(new Error(`User 13 not found (404)`))
      else resolve({ id, name: `User ${id}`, email: `user${id}@poc.dev`, role: id % 2 === 0 ? 'admin' : 'member' })
    }, delayMs)
  )
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

const userIdAtom = atom({ key: '04/userId', default: 1 })
const searchAtom = atom({ key: '04/search', default: '' })

const userSelector = selector<User>({
  key: '04/user',
  get: async ({ get }) => {
    const id = get(userIdAtom)
    return await mockFetch(id)
  },
})

const searchResultsSelector = selector<User[]>({
  key: '04/searchResults',
  get: async ({ get }) => {
    const query = get(searchAtom)
    if (!query) return []
    await new Promise(r => setTimeout(r, 600))
    return [1, 2, 3, 4, 5]
      .filter(id => `User ${id}`.toLowerCase().includes(query.toLowerCase()))
      .map(id => ({ id, name: `User ${id}`, email: `user${id}@poc.dev`, role: id % 2 === 0 ? 'admin' : 'member' }))
  },
})

// ─── 4.1 Async selector with Suspense ────────────────────────────────────────

function UserCard() {
  const user = useRecoilValue(userSelector)
  return (
    <div style={{ background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 4, padding: 12 }}>
      <div style={{ fontSize: 14, color: '#e0e0e0', marginBottom: 4 }}>{user.name}</div>
      <div style={{ fontSize: 12, color: '#666' }}>{user.email}</div>
      <div style={{ fontSize: 11, color: user.role === 'admin' ? '#4a9eff' : '#7ec8a0', marginTop: 4 }}>{user.role}</div>
    </div>
  )
}

function AsyncSuspenseDemo() {
  const [id, setId] = useRecoilState(userIdAtom)
  return (
    <Section title="4.1 — Async selector + Suspense">
      <Info>When a selector returns a Promise, Recoil throws it (Suspense protocol). React catches the throw and shows the fallback until the Promise resolves. Try ID 13 for a 404 error.</Info>
      <Row style={{ marginBottom: 12 }}>
        <Btn onClick={() => setId(i => Math.max(1, i - 1))} danger>prev id</Btn>
        <span style={{ color: '#888', fontSize: 13 }}>id: <span style={{ color: '#e0e0e0' }}>{id}</span></span>
        <Btn onClick={() => setId(i => i + 1)}>next id</Btn>
        <Btn onClick={() => setId(13)} danger>id 13 (error)</Btn>
      </Row>
      <ErrorBoundary>
        <Suspense fallback={<div style={{ color: '#555', fontSize: 13, padding: 8 }}>loading user {id}...</div>}>
          <UserCard />
        </Suspense>
      </ErrorBoundary>
      <Pre>{`const userSelector = selector({
  key: 'user',
  get: async ({ get }) => {
    const id = get(userIdAtom)   // reactive dep
    return await fetch(\`/api/users/\${id}\`).then(r => r.json())
  }
})
// When id changes → selector invalidated → throws new Promise
// Suspense catches the throw → shows fallback → resolves → renders
// ErrorBoundary catches rejected Promises (non-200 etc.)`}</Pre>
    </Section>
  )
}

// ─── 4.2 useRecoilValueLoadable ───────────────────────────────────────────────

function LoadableDemo() {
  const [id] = useRecoilState(userIdAtom)
  const loadable = useRecoilValueLoadable(userSelector)
  return (
    <Section title="4.2 — useRecoilValueLoadable: avoid Suspense">
      <Info>Returns a Loadable instead of throwing. Lets you handle loading/error states inline without wrapping in Suspense + ErrorBoundary.</Info>
      <div style={{ fontSize: 13, lineHeight: 1.8 }}>
        state: {' '}
        {loadable.state === 'loading'  && <Badge color="#f5a623">loading</Badge>}
        {loadable.state === 'hasValue' && <Badge color="#4caf50">hasValue</Badge>}
        {loadable.state === 'hasError' && <Badge color="#ff6b6b">hasError</Badge>}
      </div>
      {loadable.state === 'hasValue' && (
        <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>
          contents.name: <span style={{ color: '#e0e0e0' }}>{(loadable.contents as User).name}</span>
        </div>
      )}
      {loadable.state === 'hasError' && (
        <div style={{ fontSize: 13, color: '#ff6b6b', marginTop: 8 }}>
          error: {(loadable.contents as Error).message}
        </div>
      )}
      {loadable.state === 'loading' && (
        <div style={{ fontSize: 13, color: '#555', marginTop: 8 }}>waiting for id {id}...</div>
      )}
      <Pre>{`const loadable = useRecoilValueLoadable(userSelector)

switch (loadable.state) {
  case 'hasValue':
    return <UserCard user={loadable.contents} />
  case 'loading':
    return <Spinner />
  case 'hasError':
    return <ErrorMsg err={loadable.contents} />
}
// No Suspense or ErrorBoundary needed — all states handled inline`}</Pre>
    </Section>
  )
}

// ─── 4.3 Async selector with search ──────────────────────────────────────────

function SearchResult({ user }: { user: User }) {
  return (
    <span style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#79c0ff', borderRadius: 3, padding: '3px 10px', fontSize: 12 }}>
      {user.name}
    </span>
  )
}

function SearchResults() {
  const results = useRecoilValue(searchResultsSelector)
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
      {results.length === 0
        ? <span style={{ color: '#444', fontSize: 12 }}>no results</span>
        : results.map(u => <SearchResult key={u.id} user={u} />)
      }
    </div>
  )
}

function SearchDemo() {
  const [query, setQuery] = useRecoilState(searchAtom)
  return (
    <Section title="4.3 — Async selector as reactive search">
      <Info>The selector re-evaluates every time searchAtom changes. It's debounced by the async delay itself — rapid changes cancel pending evaluations (Recoil handles this via request cancellation).</Info>
      <input
        value={query} onChange={e => setQuery(e.target.value)}
        style={{ background: '#111', border: '1px solid #2a2a2a', color: '#e0e0e0', padding: '4px 8px', borderRadius: 3, fontSize: 13, width: '100%' }}
        placeholder="search users... (try 'user 1', 'user 3')"
      />
      <Suspense fallback={<div style={{ color: '#555', fontSize: 12, marginTop: 8 }}>searching...</div>}>
        <SearchResults />
      </Suspense>
      <Pre>{`const searchSelector = selector({
  get: async ({ get }) => {
    const query = get(searchAtom)
    if (!query) return []
    await delay(400)  // simulated network
    return await api.search(query)
  }
})
// Rapid typing → selector re-evaluates each time
// Recoil cancels stale evaluations — only latest resolves`}</Pre>
    </Section>
  )
}

// ─── 4.4 Error handling anatomy ──────────────────────────────────────────────

const alwaysFailSelector = selector<User>({
  key: '04/alwaysFail',
  get: async () => {
    await new Promise(r => setTimeout(r, 500))
    throw new Error('Simulated server failure (500)')
  },
})

function AlwaysFailCard() {
  const user = useRecoilValue(alwaysFailSelector)
  return <div>{user.name}</div>
}

function ErrorHandlingGuide() {
  const [showError, setShowError] = useState(false)
  return (
    <Section title="4.4 — Async error handling anatomy">
      <Info>Three layers: selector rejects → React throws the error → ErrorBoundary catches it. Without ErrorBoundary, the error propagates up and crashes the tree.</Info>
      {showError && (
        <ErrorBoundary>
          <Suspense fallback={<div style={{ color: '#555', fontSize: 13, padding: 8 }}>fetching (will fail)...</div>}>
            <AlwaysFailCard />
          </Suspense>
        </ErrorBoundary>
      )}
      <Row style={{ marginTop: 8 }}>
        <Btn onClick={() => setShowError(s => !s)} danger={showError}>
          {showError ? 'Hide error demo' : 'Show error demo (always fails)'}
        </Btn>
      </Row>
      <Pre>{`// Layer 1: selector rejects
const userSelector = selector({
  get: async ({ get }) => {
    const id = get(idAtom)
    const res = await fetch(\`/users/\${id}\`)
    if (!res.ok) throw new Error(\`\${res.status}\`)  // ← rejection
    return res.json()
  }
})

// Layer 2: Suspense + ErrorBoundary wrap the subtree
<ErrorBoundary fallback={err => <p>{err.message}</p>}>
  <Suspense fallback={<Spinner />}>
    <UserCard />   {/* useRecoilValue throws Promise → then Error */}
  </Suspense>
</ErrorBoundary>`}</Pre>
    </Section>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function AsyncSelectorsExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>04 · Async Selectors</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Async selectors integrate with React Suspense natively. Return a Promise from{' '}
        <code>get()</code> — Recoil throws it until resolved. Change a dep atom → selector
        re-evaluates → new loading state. No <code>useEffect</code>, no manual loading flags.
      </p>
      <RecoilRoot>
        <AsyncSuspenseDemo />
        <LoadableDemo />
        <SearchDemo />
        <ErrorHandlingGuide />
      </RecoilRoot>
    </div>
  )
}
