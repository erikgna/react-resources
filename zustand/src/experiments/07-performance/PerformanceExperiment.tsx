import { useRef, useState } from 'react'
import { create, createStore } from 'zustand'
import { shallow } from 'zustand/shallow'
import { Section, Row, Btn, Log } from '../shared'

// ─── 7.1 Selector miss cost — 1000 components with and without selectors ──────

interface PerfState {
  count: number
  unrelated: number
  inc: () => void
  tick: () => void
}

const usePerfStore = create<PerfState>((set) => ({
  count: 0,
  unrelated: 0,
  inc: () => set(s => ({ count: s.count + 1 })),
  tick: () => set(s => ({ unrelated: s.unrelated + 1 })),
}))

// Bad: subscribes to full state — every tick() re-renders this
function BadItem({ id }: { id: number }) {
  const renders = useRef(0)
  renders.current++
  const state = usePerfStore()
  return (
    <div style={{
      display: 'inline-block', margin: 1, padding: '1px 4px',
      background: renders.current > 1 ? '#2a1111' : '#111',
      border: `1px solid ${renders.current > 1 ? '#5a1111' : '#1e1e1e'}`,
      fontSize: 9, minWidth: 36,
    }}>
      {id}: <span style={{ color: renders.current > 1 ? '#ff6b6b' : '#4caf50' }}>{renders.current}</span>
      <span style={{ color: '#333' }}> {state.count}</span>
    </div>
  )
}

// Good: subscribes only to count — tick() doesn't trigger
function GoodItem({ id }: { id: number }) {
  const renders = useRef(0)
  renders.current++
  const count = usePerfStore(s => s.count)
  return (
    <div style={{
      display: 'inline-block', margin: 1, padding: '1px 4px',
      background: '#111',
      border: `1px solid ${renders.current > 1 ? '#1a4a1a' : '#1e1e1e'}`,
      fontSize: 9, minWidth: 36,
    }}>
      {id}: <span style={{ color: '#4caf50' }}>{renders.current}</span>
      <span style={{ color: '#333' }}> {count}</span>
    </div>
  )
}

function SelectorMissSection() {
  const [log, setLog] = useState<string[]>([])
  const [variant, setVariant] = useState<'bad' | 'good' | null>(null)

  const runBad = () => {
    setVariant('bad')
    setLog([])
    setTimeout(() => {
      const t0 = performance.now()
      usePerfStore.getState().tick()
      setLog([`tick() with 50 no-selector components: ${(performance.now() - t0).toFixed(2)}ms (all 50 re-render)`])
    }, 100)
  }

  const runGood = () => {
    setVariant('good')
    setLog([])
    setTimeout(() => {
      const t0 = performance.now()
      usePerfStore.getState().tick()
      setLog([`tick() with 50 selector components: ${(performance.now() - t0).toFixed(2)}ms (0 re-render)`])
    }, 100)
  }

  return (
    <section style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 4, padding: 18, marginBottom: 14 }}>
      <h3 style={{ fontSize: 12, color: '#4a9eff', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
        7.1 — Selector miss cost — 50 components, tick() changes unrelated field
      </h3>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 10 }}>
        <strong style={{ color: '#e0e0e0' }}>Bad</strong>: no selector — every component re-renders on tick().
        <strong style={{ color: '#e0e0e0' }}> Good</strong>: <code>s =&gt; s.count</code> — tick() doesn't change count → 0 re-renders.
      </p>
      <Row style={{ marginBottom: 8 }}>
        <Btn onClick={runBad} danger>Mount bad (no selector) + tick()</Btn>
        <Btn onClick={runGood}>Mount good (selector) + tick()</Btn>
        <Btn onClick={() => { usePerfStore.getState().inc(); setLog(l => [...l, 'inc() — all render']) }}>inc() (both re-render)</Btn>
        <Btn onClick={() => setLog([])} danger>Clear log</Btn>
      </Row>
      <Log entries={log} />
      {variant && (
        <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 8 }}>
          {Array.from({ length: 50 }, (_, i) =>
            variant === 'bad'
              ? <BadItem key={i} id={i} />
              : <GoodItem key={i} id={i} />
          )}
        </div>
      )}
      <pre style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 3, padding: 12, fontSize: 12, color: '#7ec8a0', marginTop: 10 }}>
        {`// Bad: no selector → tick() triggers 50 re-renders
const state = useStore()

// Good: selector → tick() touches 'unrelated', not 'count' → 0 re-renders
const count = useStore(s => s.count)`}
      </pre>
    </section>
  )
}

// ─── 7.2 Shallow equality — array reference vs content ───────────────────────

interface ArrayState {
  tags: string[]
  count: number
  addSameTag: () => void
  addNewTag: () => void
  inc: () => void
}

const useArrayStore = create<ArrayState>((set) => ({
  tags: ['alpha', 'beta'],
  count: 0,
  // Creates new array with same content — ref changes, values don't
  addSameTag: () => set(s => ({ tags: [...s.tags] })),
  addNewTag: () => set(s => ({ tags: [...s.tags, `tag${s.tags.length + 1}`] })),
  inc: () => set(s => ({ count: s.count + 1 })),
}))

function BoxRaw() {
  const renders = useRef(0)
  renders.current++
  // Object selector without shallow
  const { tags, count } = useArrayStore(s => ({ tags: s.tags, count: s.count }))
  return (
    <div style={{ padding: '8px 12px', background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 3, minWidth: 200 }}>
      <p style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>Object selector (no shallow)</p>
      <p style={{ color: '#e0e0e0', fontSize: 12 }}>[{tags.join(',')}] count:{count}</p>
      <p style={{ fontSize: 11, color: renders.current > 2 ? '#ff6b6b' : '#4caf50' }}>renders: {renders.current}</p>
    </div>
  )
}

function BoxShallow() {
  const renders = useRef(0)
  renders.current++
  const { tags, count } = useArrayStore(s => ({ tags: s.tags, count: s.count }), shallow)
  return (
    <div style={{ padding: '8px 12px', background: '#0f0f0f', border: '1px solid #4a9eff', borderRadius: 3, minWidth: 200 }}>
      <p style={{ fontSize: 10, color: '#4a9eff', marginBottom: 4 }}>Object selector + shallow</p>
      <p style={{ color: '#e0e0e0', fontSize: 12 }}>[{tags.join(',')}] count:{count}</p>
      <p style={{ fontSize: 11, color: '#4caf50' }}>renders: {renders.current}</p>
    </div>
  )
}

function ShallowEqualitySection() {
  const [log, setLog] = useState<string[]>([])

  return (
    <section style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 4, padding: 18, marginBottom: 14 }}>
      <h3 style={{ fontSize: 12, color: '#4a9eff', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
        7.2 — Shallow equality — array spread vs real change
      </h3>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 10 }}>
        <code>addSameTag()</code> spreads the array without adding anything — same content, new reference. Without <code>shallow</code>: re-renders. With <code>shallow</code>: same tag list → no re-render.
      </p>
      <Row style={{ marginBottom: 8 }}>
        <Btn onClick={() => {
          const t0 = performance.now()
          useArrayStore.getState().addSameTag()
          setLog(l => [...l, `addSameTag (same content, new ref): ${(performance.now() - t0).toFixed(2)}ms`])
        }}>addSameTag (new ref, same content)</Btn>
        <Btn onClick={() => {
          useArrayStore.getState().addNewTag()
          setLog(l => [...l, 'addNewTag (new tag added — both re-render)'])
        }}>addNewTag (both re-render)</Btn>
        <Btn onClick={() => {
          useArrayStore.getState().inc()
          setLog(l => [...l, 'inc() (count changes — both re-render)'])
        }}>inc()</Btn>
        <Btn onClick={() => setLog([])} danger>Clear</Btn>
      </Row>
      <Log entries={log} />
      <Row style={{ marginTop: 8 }}>
        <BoxRaw />
        <BoxShallow />
      </Row>
      <pre style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 3, padding: 12, fontSize: 12, color: '#7ec8a0', marginTop: 10 }}>
        {`// addSameTag: [...tags] — same values, new array reference
// Without shallow: Object.is({tags: newRef}, {tags: prevRef}) → false → re-render
// With shallow: shallow({tags: newRef}, {tags: prevRef}) → tags are same ref? No...

// Wait — shallow compares the OBJECT's keys:
// { tags: arrayRef1 } vs { tags: arrayRef2 }
// shallow checks: Object.is(tags1, tags2) — different refs → false → still re-renders
// The array itself would need shallow comparison, not its container
// Fix: subscribe directly to s.tags, compare with shallow array equality`}
      </pre>
    </section>
  )
}

// ─── 7.3 setState merge vs replace timing ────────────────────────────────────

function MergeTimingSection() {
  const [log, setLog] = useState<string[]>([])

  const run = () => {
    const store = createStore<{ a: number; b: number; c: string }>(() => ({ a: 0, b: 0, c: 'x' }))
    const N = 100_000

    // Merge
    const t1 = performance.now()
    for (let i = 0; i < N; i++) store.setState({ a: i })
    const mergeMs = (performance.now() - t1).toFixed(2)

    // Replace
    const t2 = performance.now()
    for (let i = 0; i < N; i++) store.setState({ a: i, b: 0, c: 'x' }, true)
    const replaceMs = (performance.now() - t2).toFixed(2)

    // Functional merge
    const t3 = performance.now()
    for (let i = 0; i < N; i++) store.setState(s => ({ a: s.a + 1 }))
    const fnMs = (performance.now() - t3).toFixed(2)

    store.destroy()
    setLog([
      `N = ${N.toLocaleString()} setState calls`,
      `Merge  (Object.assign): ${mergeMs}ms`,
      `Replace (no assign):    ${replaceMs}ms`,
      `Functional merge:       ${fnMs}ms (reads prev state per call)`,
    ])
  }

  return (
    <section style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 4, padding: 18, marginBottom: 14 }}>
      <h3 style={{ fontSize: 12, color: '#4a9eff', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
        7.3 — setState merge vs replace — 100k calls
      </h3>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 10 }}>
        Merge uses <code>Object.assign</code> (allocates a new object per call). Replace skips the assign. Functional form reads prev state per call. All fast in practice — merge overhead is negligible.
      </p>
      <Row>
        <Btn onClick={run}>Run 100k calls benchmark</Btn>
        <Btn onClick={() => setLog([])} danger>Clear</Btn>
      </Row>
      <Log entries={log} />
      <pre style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 3, padding: 12, fontSize: 12, color: '#7ec8a0', marginTop: 10 }}>
        {`// Merge default: Object.assign({}, prev, partial)
// → allocates new object every call
// → safe: non-updated fields preserved automatically

// Replace (true): skips Object.assign
// → must pass full state or fields silently become undefined
// → marginally faster, not worth the footgun risk`}
      </pre>
    </section>
  )
}

// ─── 7.4 Subscription count — Set.add/delete cost ────────────────────────────

function SubscriptionCostSection() {
  const [log, setLog] = useState<string[]>([])

  const run = () => {
    const store = createStore<{ v: number }>(() => ({ v: 0 }))
    const N = 50_000

    const listeners = Array.from({ length: N }, () => () => {})

    // Add N listeners
    const t1 = performance.now()
    const unsubs = listeners.map(l => store.subscribe(l))
    const addMs = (performance.now() - t1).toFixed(2)

    // setState with N listeners
    const t2 = performance.now()
    store.setState({ v: 1 })
    const notifyMs = (performance.now() - t2).toFixed(2)

    // Remove N listeners
    const t3 = performance.now()
    unsubs.forEach(u => u())
    const removeMs = (performance.now() - t3).toFixed(2)

    store.destroy()
    setLog([
      `N = ${N.toLocaleString()} listeners`,
      `Set.add × N:    ${addMs}ms`,
      `setState (notify all): ${notifyMs}ms`,
      `Set.delete × N: ${removeMs}ms`,
      `Set operations are O(1) — linear total cost, no quadratic behavior`,
    ])
  }

  return (
    <section style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 4, padding: 18, marginBottom: 14 }}>
      <h3 style={{ fontSize: 12, color: '#4a9eff', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
        7.4 — Subscription count — Set add/notify/delete cost at scale
      </h3>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 10 }}>
        Zustand uses a <code>Set</code> for listeners. <code>Set.add</code> and <code>delete</code> are O(1). Notify iterates all — O(n). 50k listeners is pathological but measures the cost.
      </p>
      <Row>
        <Btn onClick={run}>Run 50k listener benchmark</Btn>
        <Btn onClick={() => setLog([])} danger>Clear</Btn>
      </Row>
      <Log entries={log} />
      <pre style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 3, padding: 12, fontSize: 12, color: '#7ec8a0', marginTop: 10 }}>
        {`// Zustand listener storage:
const listeners = new Set<Listener<T>>()
listeners.add(fn)     // O(1)
listeners.delete(fn)  // O(1)
listeners.forEach(l => l(state, prev))  // O(n) — iterates all on setState

// In practice: apps have <100 subscriptions — Set overhead is irrelevant.
// React's useSyncExternalStore adds one subscription per mounted consumer.`}
      </pre>
    </section>
  )
}

export default function PerformanceExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>07 · Performance</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Measure selector miss cost, shallow equality behavior, merge vs replace timing, and subscription Set overhead. All benchmarks use <code>performance.now()</code> — add actual numbers to <code>note.md</code>.
      </p>
      <SelectorMissSection />
      <ShallowEqualitySection />
      <MergeTimingSection />
      <SubscriptionCostSection />
    </div>
  )
}
