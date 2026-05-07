import { useState, useEffect, useRef, createContext, useContext, type ReactNode } from 'react'
import { create, createStore, useStore } from 'zustand'
import { Section, Row, Btn, Info, Pre, Log, Box } from '../shared'

// ─── 5.1 useSyncExternalStore — what Zustand passes ──────────────────────────

interface BaseState { count: number; name: string; tick: number }
const baseStore = createStore<BaseState & { inc: () => void; setName: (n: string) => void; tock: () => void }>((set) => ({
  count: 0, name: 'Alice', tick: 0,
  inc: () => set(s => ({ count: s.count + 1 })),
  setName: (name) => set({ name }),
  tock: () => set(s => ({ tick: s.tick + 1 })),
}))

function SyncExternalStoreSection() {
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    setLog([
      'useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)',
      '  subscribe      = store.subscribe (calls listener on every setState)',
      '  getSnapshot    = store.getState  (returns current state object)',
      '  getServerSnapshot = store.getInitialState (SSR: consistent initial value)',
      '',
      'Without selector:',
      '  getSnapshot = () => store.getState()',
      '  Every setState → new object → Object.is fails → re-render',
      '',
      'With selector:',
      '  getSnapshot = () => selector(store.getState())',
      '  Re-render only when selector output changes (by Object.is or equalityFn)',
    ])
  }, [])

  return (
    <Section title="5.1 — useSyncExternalStore — what Zustand actually passes">
      <Info>
        Zustand's React hook is 3 lines: <code>useSyncExternalStore(api.subscribe, api.getState, api.getInitialState)</code>. The "tearing" prevention comes from React reading a consistent snapshot mid-concurrent-render.
      </Info>
      <Log entries={log} />
      <Pre>{`// zustand/react.js — actual source (simplified)
function useStore(api, selector = identity, equalityFn?) {
  return useSyncExternalStoreWithSelector(
    api.subscribe,
    api.getState,
    api.getInitialState,
    selector,
    equalityFn,
  )
}

// Our core/zustand.ts — equivalent:
useSyncExternalStore(
  store.subscribe,     // notify React when state changes
  () => selector(store.getState()),  // snapshot for this render
  () => selector(store.getInitialState()),  // SSR snapshot
)`}</Pre>
    </Section>
  )
}

// ─── 5.2 No selector over-renders — render counter proof ─────────────────────

const useOverRenderStore = create<{
  count: number; name: string; tick: number
  inc: () => void; setName: (n: string) => void; tock: () => void
}>((set) => ({
  count: 0, name: 'Alice', tick: 0,
  inc: () => set(s => ({ count: s.count + 1 })),
  setName: (name) => set({ name }),
  tock: () => set(s => ({ tick: s.tick + 1 })),
}))

function NoSelectorOverRender() {
  const renders = useRef(0)
  renders.current++
  const state = useOverRenderStore()  // no selector
  return (
    <Box name="No selector (full state)" renders={renders.current}>
      count={state.count}
    </Box>
  )
}

function WithSelectorNoOverRender() {
  const renders = useRef(0)
  renders.current++
  const count = useOverRenderStore(s => s.count)  // only count
  return (
    <Box name="s => s.count" renders={renders.current} active>
      count={count}
    </Box>
  )
}

function OverRenderSection() {
  return (
    <Section title="5.2 — No selector vs targeted selector — render counter proof">
      <Info>
        Click <em>tick++</em> — it changes a field neither box displays. Without selector: over-renders anyway. With <code>s =&gt; s.count</code>: tick change doesn't touch count → stays.
      </Info>
      <Row style={{ marginBottom: 8 }}>
        <Btn onClick={() => useOverRenderStore.getState().inc()}>count++</Btn>
        <Btn onClick={() => useOverRenderStore.getState().tock()}>tick++ (only left box re-renders)</Btn>
      </Row>
      <Row>
        <NoSelectorOverRender />
        <WithSelectorNoOverRender />
      </Row>
      <Pre>{`// Left: subscribes to entire state object
const state = useStore()  // tick++ → new state object → re-render

// Right: subscribes to count only
const count = useStore(s => s.count)  // tick++ → count unchanged → no re-render`}</Pre>
    </Section>
  )
}

// ─── 5.3 Granularity demo — 50-item list, update one item ────────────────────

interface ListItem { id: number; value: number }

const useListStore = create<{ items: ListItem[]; updateOne: (id: number) => void; updateAll: () => void }>((set) => ({
  items: Array.from({ length: 50 }, (_, i) => ({ id: i, value: 0 })),
  updateOne: (id) => set(s => ({
    items: s.items.map(item => item.id === id ? { ...item, value: item.value + 1 } : item),
  })),
  updateAll: () => set(s => ({
    items: s.items.map(item => ({ ...item, value: item.value + 1 })),
  })),
}))

function ListItemBox({ id }: { id: number }) {
  const renders = useRef(0)
  renders.current++
  const value = useListStore(s => s.items[id].value)
  return (
    <div style={{
      display: 'inline-block', margin: 1, padding: '2px 5px',
      background: renders.current > 1 ? '#1a1111' : '#111',
      border: `1px solid ${renders.current > 1 ? '#5a1111' : '#1e1e1e'}`,
      fontSize: 10, minWidth: 50,
    }}>
      {id}: {value} <span style={{ color: renders.current > 1 ? '#ff6b6b' : '#4caf50' }}>r{renders.current}</span>
    </div>
  )
}

function GranularitySection() {
  const [log, setLog] = useState<string[]>([])

  return (
    <Section title="5.3 — Render granularity — 50-item list, update one item">
      <Info>
        Each item subscribes to <code>s =&gt; s.items[id].value</code>. Updating item 0 re-renders only item 0 (goes red). All others stay green. This works because each selector returns a primitive.
      </Info>
      <Row style={{ marginBottom: 8 }}>
        <Btn onClick={() => {
          const t0 = performance.now()
          useListStore.getState().updateOne(0)
          setLog(l => [...l, `updateOne(0): ${(performance.now() - t0).toFixed(2)}ms — only item[0] re-renders`])
        }}>Update item[0] only</Btn>
        <Btn onClick={() => {
          const t0 = performance.now()
          useListStore.getState().updateAll()
          setLog(l => [...l, `updateAll: ${(performance.now() - t0).toFixed(2)}ms — all 50 re-render`])
        }}>Update all 50</Btn>
        <Btn onClick={() => setLog([])} danger>Clear log</Btn>
      </Row>
      <Log entries={log} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 1, marginTop: 8 }}>
        {Array.from({ length: 50 }, (_, i) => <ListItemBox key={i} id={i} />)}
      </div>
      <Pre>{`// Each item component subscribes to exactly its own value
function ListItem({ id }) {
  const value = useListStore(s => s.items[id].value)  // primitive selector
  // ...
}
// updateOne(0) → items[0].value changes → only ListItem(0) re-renders`}</Pre>
    </Section>
  )
}

// ─── 5.4 useEffect + subscribe cleanup — the correct pattern ─────────────────

const useExternalStore = create<{ signal: number; fire: () => void }>((set) => ({
  signal: 0,
  fire: () => set(s => ({ signal: s.signal + 1 })),
}))

function SubscribeCleanupSection() {
  const [log, setLog] = useState<string[]>([])
  const mountCountRef = useRef(0)

  const BadConsumer = () => {
    const renders = useRef(0)
    renders.current++
    useEffect(() => {
      mountCountRef.current++
      const mountId = mountCountRef.current
      // BAD: subscribe without storing the unsub — listener stays in Set forever
      useExternalStore.subscribe(() => {
        setLog(l => [...l, `[LEAK mount#${mountId}] signal fired`])
      })
    }, [])
    return (
      <div style={{ padding: '6px 10px', background: '#2a1111', border: '1px solid #5a1111', borderRadius: 3, fontSize: 12, color: '#ff6b6b' }}>
        BAD: no cleanup (renders: {renders.current})
      </div>
    )
  }

  const GoodConsumer = () => {
    const renders = useRef(0)
    renders.current++
    useEffect(() => {
      // GOOD: subscribe returns unsub, return it as cleanup
      return useExternalStore.subscribe(() => {
        setLog(l => [...l, `[GOOD] signal fired — will stop if unmounted`])
      })
    }, [])
    return (
      <div style={{ padding: '6px 10px', background: '#0a1a0a', border: '1px solid #1a5a1a', borderRadius: 3, fontSize: 12, color: '#4caf50' }}>
        GOOD: cleanup on unmount (renders: {renders.current})
      </div>
    )
  }

  const [showBad, setShowBad] = useState(false)
  const [showGood, setShowGood] = useState(false)

  return (
    <Section title="5.4 — useEffect + subscribe cleanup — correct pattern">
      <Info>
        Mount bad N times, fire signal — N entries appear per fire (all leaked listeners still active). Good consumer: mounts once, fires once, unmounts → cleanup called → no more entries.
      </Info>
      <Row>
        <Btn onClick={() => setShowBad(true)} danger>Mount bad (leak)</Btn>
        <Btn onClick={() => setShowBad(false)} danger>Unmount bad (leak persists!)</Btn>
        <Btn onClick={() => setShowGood(b => !b)}>{showGood ? 'Unmount good' : 'Mount good'}</Btn>
        <Btn onClick={() => useExternalStore.getState().fire()}>Fire signal</Btn>
        <Btn onClick={() => setLog([])} danger>Clear</Btn>
      </Row>
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        {showBad && <BadConsumer />}
        {showGood && <GoodConsumer />}
      </div>
      <Log entries={log} />
      <Pre>{`// BAD — listener leaks after unmount
useEffect(() => {
  store.subscribe(() => doSomething())  // no return → no cleanup
}, [])

// GOOD — cleanup on unmount
useEffect(() => {
  return store.subscribe(() => doSomething())  // unsub is the cleanup fn
}, [])

// Also fine outside React:
const unsub = store.subscribe(handler)
// later: unsub()`}</Pre>
    </Section>
  )
}

// ─── 5.5 Context-based multi-instance ────────────────────────────────────────

interface BearState { bears: number; inc: () => void }

function makeBearStore() {
  return createStore<BearState>((set) => ({
    bears: 0,
    inc: () => set(s => ({ bears: s.bears + 1 })),
  }))
}

type BearStore = ReturnType<typeof makeBearStore>
const BearContext = createContext<BearStore | null>(null)

function BearProvider({ children }: { children: ReactNode }) {
  // Create a new store instance per Provider — not shared globally
  const [store] = useState(() => makeBearStore())
  return <BearContext.Provider value={store}>{children}</BearContext.Provider>
}

function useBearStore<T>(selector: (s: BearState) => T): T {
  const store = useContext(BearContext)
  if (!store) throw new Error('useBearStore used outside BearProvider')
  return useStore(store, selector)
}

function BearCounter({ label }: { label: string }) {
  const bears = useBearStore(s => s.bears)
  const inc = useBearStore(s => s.inc)
  return (
    <div style={{ padding: '10px 14px', background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 3 }}>
      <p style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>{label}</p>
      <p style={{ color: '#e0e0e0', fontSize: 14, marginBottom: 6 }}>bears: {bears}</p>
      <Btn onClick={inc}>inc (this tree only)</Btn>
    </div>
  )
}

function ContextSection() {
  return (
    <Section title="5.5 — Context-based multi-instance — per-tree store isolation">
      <Info>
        A global <code>create()</code> store is shared across the entire app. To isolate state per component tree (e.g. two independent counters), create the store inside a Provider and pass it via Context.
      </Info>
      <Row style={{ alignItems: 'flex-start', gap: 16, marginTop: 8 }}>
        <BearProvider>
          <BearCounter label="Tree A (isolated store)" />
        </BearProvider>
        <BearProvider>
          <BearCounter label="Tree B (isolated store)" />
        </BearProvider>
      </Row>
      <Pre>{`function makeBearStore() {
  return createStore<State>((set) => ({ bears: 0, inc: ... }))
}

const BearContext = createContext<BearStore | null>(null)

function BearProvider({ children }) {
  const [store] = useState(() => makeBearStore())  // one store per Provider
  return <BearContext.Provider value={store}>{children}</BearContext.Provider>
}

// Tree A and Tree B have completely separate state — incrementing one doesn't affect the other`}</Pre>
    </Section>
  )
}

export default function ReactExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>05 · React Integration</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Zustand's React hook is <code>useSyncExternalStore</code> with a selector wrapper. Understand what triggers re-renders, how to prevent over-rendering, and how to safely subscribe and clean up outside the hook.
      </p>
      <SyncExternalStoreSection />
      <OverRenderSection />
      <GranularitySection />
      <SubscribeCleanupSection />
      <ContextSection />
    </div>
  )
}
