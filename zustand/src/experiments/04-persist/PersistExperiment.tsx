import { useState, useEffect } from 'react'
import { create } from 'zustand'
import { persist, type StateStorage } from 'zustand/middleware'
import { Section, Row, Btn, Info, Pre, Log } from '../shared'

// ─── 4.1 Basic persist to localStorage ───────────────────────────────────────

interface BasicState {
  count: number
  label: string
  inc: () => void
  setLabel: (l: string) => void
  reset: () => void
}

const useBasicPersist = create<BasicState>()(
  persist(
    (set) => ({
      count: 0,
      label: 'persisted',
      inc: () => set(s => ({ count: s.count + 1 })),
      setLabel: (label) => set({ label }),
      reset: () => set({ count: 0, label: 'persisted' }),
    }),
    { name: 'zustand-poc-basic' }
  )
)

function BasicPersistSection() {
  const { count, label } = useBasicPersist(s => ({ count: s.count, label: s.label }))

  return (
    <Section title="4.1 — Basic persist — localStorage read on mount, write on setState">
      <Info>
        <code>persist</code> wraps store init to hydrate from <code>localStorage</code> on first render, and wraps <code>setState</code> to write back on every change. Increment, then reload the page — count survives.
      </Info>
      <Row>
        <Btn onClick={() => useBasicPersist.getState().inc()}>inc() — persists to localStorage</Btn>
        <Btn onClick={() => useBasicPersist.getState().setLabel('modified')}>setLabel</Btn>
        <Btn onClick={() => useBasicPersist.getState().reset()} danger>reset</Btn>
        <Btn onClick={() => {
          localStorage.removeItem('zustand-poc-basic')
          window.location.reload()
        }} danger>Clear storage + reload</Btn>
      </Row>
      <p style={{ color: '#888', fontSize: 12, marginTop: 8 }}>count: {count} | label: {label}</p>
      <Pre>{`const useStore = create<State>()(
  persist(
    (set) => ({
      count: 0,
      inc: () => set(s => ({ count: s.count + 1 })),
    }),
    { name: 'my-store' }  // localStorage key
  )
)
// On mount: reads localStorage['my-store'] and merges into initial state
// On setState: writes entire state to localStorage['my-store']`}</Pre>
    </Section>
  )
}

// ─── 4.2 partialize — persist only selected fields ───────────────────────────

interface PartialState {
  count: number
  sessionOnly: string
  inc: () => void
  setSession: (s: string) => void
}

const usePartialPersist = create<PartialState>()(
  persist(
    (set) => ({
      count: 0,
      sessionOnly: 'not saved',
      inc: () => set(s => ({ count: s.count + 1 })),
      setSession: (sessionOnly) => set({ sessionOnly }),
    }),
    {
      name: 'zustand-poc-partial',
      partialize: (s) => ({ count: s.count }),  // only persist count
    }
  )
)

function PartializeSection() {
  const { count, sessionOnly } = usePartialPersist(s => ({ count: s.count, sessionOnly: s.sessionOnly }))

  return (
    <Section title="4.2 — partialize — persist only selected fields">
      <Info>
        <code>partialize</code> filters what gets written to storage. <code>sessionOnly</code> is lost on reload. <code>count</code> survives.
      </Info>
      <Row>
        <Btn onClick={() => usePartialPersist.getState().inc()}>inc() (persisted)</Btn>
        <Btn onClick={() => usePartialPersist.getState().setSession('changed')}>setSession (NOT persisted)</Btn>
        <Btn onClick={() => {
          localStorage.removeItem('zustand-poc-partial')
          window.location.reload()
        }} danger>Clear + reload</Btn>
      </Row>
      <p style={{ color: '#888', fontSize: 12, marginTop: 8 }}>
        count: {count} (persisted) | sessionOnly: {sessionOnly} (lost on reload)
      </p>
      <Pre>{`persist(initializer, {
  name: 'my-store',
  partialize: (state) => ({ count: state.count }),
  // sessionOnly is excluded → not written to localStorage → resets on reload
})`}</Pre>
    </Section>
  )
}

// ─── 4.3 Custom storage adapter ───────────────────────────────────────────────

const inMemoryStorage = new Map<string, string>()

const memoryAdapter: StateStorage = {
  getItem: (key) => inMemoryStorage.get(key) ?? null,
  setItem: (key, value) => { inMemoryStorage.set(key, value) },
  removeItem: (key) => { inMemoryStorage.delete(key) },
}

interface AdapterState {
  data: string
  set: (d: string) => void
}

const useAdapterStore = create<AdapterState>()(
  persist(
    (set) => ({
      data: 'initial',
      set: (data) => set({ data }),
    }),
    {
      name: 'memory-store',
      storage: {
        getItem: (key) => {
          const val = memoryAdapter.getItem(key)
          return val ? JSON.parse(val) : null
        },
        setItem: (key, value) => memoryAdapter.setItem(key, JSON.stringify(value)),
        removeItem: (key) => memoryAdapter.removeItem(key),
      },
    }
  )
)

function CustomStorageSection() {
  const [log, setLog] = useState<string[]>([])
  const data = useAdapterStore(s => s.data)

  const inspect = () => {
    const stored = inMemoryStorage.get('memory-store')
    setLog(l => [...l, `In-memory storage: ${stored ?? '(empty)'}`])
  }

  return (
    <Section title="4.3 — Custom storage adapter — implement StateStorage interface">
      <Info>
        Any object with <code>getItem / setItem / removeItem</code> works as a storage adapter. This in-memory adapter is useful for testing or environments without <code>localStorage</code> (e.g. Node, SSR).
      </Info>
      <Row>
        <Btn onClick={() => {
          useAdapterStore.getState().set(`val-${Date.now()}`)
          setLog(l => [...l, 'setState called → writes to in-memory Map'])
        }}>Set data</Btn>
        <Btn onClick={inspect}>Inspect in-memory storage</Btn>
        <Btn onClick={() => setLog([])} danger>Clear log</Btn>
      </Row>
      <p style={{ color: '#888', fontSize: 12, marginTop: 8 }}>data: {data}</p>
      <Log entries={log} />
      <Pre>{`const memoryAdapter: StateStorage = {
  getItem: (key) => inMemoryStorage.get(key) ?? null,
  setItem: (key, value) => { inMemoryStorage.set(key, value) },
  removeItem: (key) => { inMemoryStorage.delete(key) },
}

persist(initializer, {
  name: 'store',
  storage: {
    getItem: (key) => {
      const v = memoryAdapter.getItem(key)
      return v ? JSON.parse(v) : null
    },
    setItem: (key, val) => memoryAdapter.setItem(key, JSON.stringify(val)),
    removeItem: (key) => memoryAdapter.removeItem(key),
  },
})`}</Pre>
    </Section>
  )
}

// ─── 4.4 Hydration timing — onRehydrateStorage ───────────────────────────────

interface HydrationState {
  value: number
  inc: () => void
}

const useHydrationStore = create<HydrationState>()(
  persist(
    (set) => ({
      value: 0,
      inc: () => set(s => ({ value: s.value + 1 })),
    }),
    {
      name: 'zustand-poc-hydration',
      onRehydrateStorage: () => {
        console.log('[persist] hydration started — state may still be initial')
        return (state, error) => {
          if (error) {
            console.error('[persist] hydration error:', error)
          } else {
            console.log('[persist] hydration complete — state:', state)
          }
        }
      },
    }
  )
)

function HydrationSection() {
  const [log, setLog] = useState<string[]>([])
  const value = useHydrationStore(s => s.value)

  useEffect(() => {
    const api = useHydrationStore
    setLog(l => [...l, `[mount] value at mount = ${api.getState().value} (may be initial before hydration)`])
    // persist.onFinishHydration fires after storage has been read
    const unsub = api.persist.onFinishHydration((state) => {
      setLog(l => [...l, `[hydrated] value after hydration = ${state.value}`])
    })
    return unsub
  }, [])

  return (
    <Section title="4.4 — Hydration timing — onRehydrateStorage callback">
      <Info>
        <code>persist</code> hydrates asynchronously on mount. State may be the initial value until hydration completes. <code>onFinishHydration</code> tells you when storage has been applied. Check the console for the hydration lifecycle logs.
      </Info>
      <Row>
        <Btn onClick={() => useHydrationStore.getState().inc()}>inc()</Btn>
        <Btn onClick={() => setLog([])} danger>Clear</Btn>
      </Row>
      <p style={{ color: '#888', fontSize: 12, marginTop: 8 }}>value: {value}</p>
      <Log entries={log} />
      <Pre>{`persist(initializer, {
  name: 'store',
  onRehydrateStorage: () => {
    // called before hydration
    return (state, error) => {
      // called after hydration completes (or fails)
      console.log('hydrated:', state)
    }
  },
})

// In component:
useEffect(() => {
  return useStore.persist.onFinishHydration((state) => {
    console.log('hydration done', state)
  })
}, [])`}</Pre>
    </Section>
  )
}

// ─── 4.5 Corrupt storage — silent failure ────────────────────────────────────

interface CorruptState {
  important: string
  reset: () => void
}

const CORRUPT_KEY = 'zustand-poc-corrupt'

const useCorruptStore = create<CorruptState>()(
  persist(
    (set) => ({
      important: 'safe value',
      reset: () => set({ important: 'safe value' }),
    }),
    {
      name: CORRUPT_KEY,
      onRehydrateStorage: () => (_, error) => {
        if (error) console.error('[corrupt] hydration error:', error)
      },
    }
  )
)

function CorruptStorageSection() {
  const [log, setLog] = useState<string[]>([])
  const important = useCorruptStore(s => s.important)

  const writeCorrupt = () => {
    localStorage.setItem(CORRUPT_KEY, '{ not valid json {{')
    setLog(l => [...l, `Wrote invalid JSON to "${CORRUPT_KEY}" — reload to see what persist does`])
  }

  const writeNonJSON = () => {
    localStorage.setItem(CORRUPT_KEY, JSON.stringify({
      state: { important: 'normal value', extra: undefined },
      version: 0,
    }))
    setLog(l => [...l, 'Wrote state with undefined value (JSON.stringify drops it)'])
  }

  const inspect = () => {
    const raw = localStorage.getItem(CORRUPT_KEY)
    setLog(l => [...l, `localStorage["${CORRUPT_KEY}"] = ${raw}`])
  }

  return (
    <Section title="4.5 — Corrupt storage — silent failure on bad JSON">
      <Info>
        If <code>localStorage</code> contains invalid JSON, <code>persist</code> calls <code>onRehydrateStorage</code> with an error and falls back to initial state. Non-JSON-serializable values (<code>Map</code>, <code>Set</code>, <code>undefined</code>) are silently dropped by <code>JSON.stringify</code>.
      </Info>
      <Row>
        <Btn onClick={writeCorrupt} danger>Write invalid JSON to storage</Btn>
        <Btn onClick={writeNonJSON} danger>Write state with undefined value</Btn>
        <Btn onClick={inspect}>Inspect storage</Btn>
        <Btn onClick={() => {
          localStorage.removeItem(CORRUPT_KEY)
          setLog(l => [...l, 'Storage cleared'])
        }}>Clear storage</Btn>
        <Btn onClick={() => setLog([])} danger>Clear log</Btn>
      </Row>
      <p style={{ color: '#888', fontSize: 12, marginTop: 8 }}>important: {important}</p>
      <Log entries={log} />
      <Pre>{`// After writing corrupt JSON and reloading:
// → persist catches JSON.parse error
// → calls onRehydrateStorage(state=undefined, error=SyntaxError)
// → store stays at initial state — silent recovery

// Map and Set are NOT JSON-serializable:
set({ data: new Map([['k', 1]]) })
// stored as: { "data": {} }  — Map becomes empty object
// on hydrate: data is {}, not a Map — silent data loss

// Fix: custom serialize/deserialize in persist options:
persist(init, {
  serialize: (state) => JSON.stringify(state, replacer),
  deserialize: (str) => JSON.parse(str, reviver),
})`}</Pre>
    </Section>
  )
}

export default function PersistExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>04 · Persist</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        <code>persist</code> middleware wraps store initialization and setState to sync with a storage adapter. Understand hydration timing, partial persistence, custom adapters, and what happens when storage is corrupt.
      </p>
      <BasicPersistSection />
      <PartializeSection />
      <CustomStorageSection />
      <HydrationSection />
      <CorruptStorageSection />
    </div>
  )
}
