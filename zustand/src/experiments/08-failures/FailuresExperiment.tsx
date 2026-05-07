import { useState, useEffect, useRef } from 'react'
import { create, createStore } from 'zustand'
import { persist } from 'zustand/middleware'
import { Section, Row, Btn, Info, Pre, Log, Box } from '../shared'

// ─── 8.1 Stale closure in action ─────────────────────────────────────────────

interface StaleState { count: number }
const staleStore = createStore<StaleState>(() => ({ count: 0 }))

function StaleClosureSection() {
  const [log, setLog] = useState<string[]>([])

  const badAction = () => {
    // Closes over `state` at time of creation — stale after first increment
    const state = staleStore.getState()
    const badIncrement = () => {
      // Uses stale `state` reference — always increments from the same base
      staleStore.setState({ count: state.count + 1 })
    }
    badIncrement()
    badIncrement()
    badIncrement()
    setLog(l => [...l,
      `[BAD] called 3× badIncrement — expected count=3`,
      `[BAD] actual count=${staleStore.getState().count} (all 3 incremented from same stale base)`,
    ])
  }

  const goodAction = () => {
    staleStore.setState({ count: 0 })  // reset first
    // Functional form reads current state each time
    const goodIncrement = () => {
      staleStore.setState(s => ({ count: s.count + 1 }))
    }
    goodIncrement()
    goodIncrement()
    goodIncrement()
    setLog(l => [...l,
      `[GOOD] called 3× functional increment`,
      `[GOOD] count=${staleStore.getState().count} (each reads fresh state)`,
    ])
  }

  return (
    <Section title="8.1 — Stale closure in action — silent wrong result">
      <Info>
        An action that captures <code>state</code> via closure at creation time will always increment from the same value — all three calls produce count=1. The functional form <code>set(s =&gt; ...)</code> reads current state each call.
      </Info>
      <Row>
        <Btn onClick={badAction} danger>3× bad increment (stale closure)</Btn>
        <Btn onClick={goodAction}>3× good increment (functional)</Btn>
        <Btn onClick={() => setLog([])} danger>Clear</Btn>
      </Row>
      <Log entries={log} />
      <Pre>{`// BAD — closes over state at action-definition time
const state = store.getState()
const badIncrement = () => store.setState({ count: state.count + 1 })
badIncrement()  // count: 0 → 1
badIncrement()  // count: 1, but state.count is still 0 → 1 again
badIncrement()  // same → count stays 1

// GOOD — reads current state on each call
const goodIncrement = () => store.setState(s => ({ count: s.count + 1 }))
goodIncrement()  // count: 0 → 1
goodIncrement()  // count: 1 → 2
goodIncrement()  // count: 2 → 3`}</Pre>
    </Section>
  )
}

// ─── 8.2 No selector — silent over-render ────────────────────────────────────

const useOverStore = create<{
  count: number; unrelated: number
  inc: () => void; tick: () => void
}>((set) => ({
  count: 0,
  unrelated: 0,
  inc: () => set(s => ({ count: s.count + 1 })),
  tick: () => set(s => ({ unrelated: s.unrelated + 1 })),
}))

function OverRenderFailure() {
  const renders = useRef(0)
  renders.current++
  const state = useOverStore()  // no selector
  return (
    <Box name="No selector (BAD)" renders={renders.current}>
      count={state.count}
    </Box>
  )
}

function FixedRenderComponent() {
  const renders = useRef(0)
  renders.current++
  const count = useOverStore(s => s.count)
  return (
    <Box name="s => s.count (GOOD)" renders={renders.current} active>
      count={count}
    </Box>
  )
}

function NoSelectorFailureSection() {
  return (
    <Section title="8.2 — No selector — silent over-rendering">
      <Info>
        No error, no warning. The component with no selector re-renders on every <code>tick()</code> even though it only displays <code>count</code>. The render counter reveals it.
      </Info>
      <Row style={{ marginBottom: 8 }}>
        <Btn onClick={() => useOverStore.getState().inc()}>count++ (both re-render)</Btn>
        <Btn onClick={() => useOverStore.getState().tick()}>tick++ (BAD re-renders, GOOD stays)</Btn>
      </Row>
      <Row>
        <OverRenderFailure />
        <FixedRenderComponent />
      </Row>
      <Pre>{`// FAILURE: subscribes to full state — tick() triggers re-render even though
// count didn't change. No warning. Silently burns CPU in large component trees.
const state = useStore()

// FIX:
const count = useStore(s => s.count)`}</Pre>
    </Section>
  )
}

// ─── 8.3 persist with Map/Set — silent data loss ─────────────────────────────

interface MapState {
  data: Map<string, number>
  set: (k: string, v: number) => void
}

const useMapStore = create<MapState>()(
  persist(
    (set) => ({
      data: new Map(),
      set: (k, v) => set(s => ({ data: new Map(s.data).set(k, v) })),
    }),
    { name: 'zustand-poc-map-fail' }
  )
)

function PersistMapSection() {
  const [log, setLog] = useState<string[]>([])
  const data = useMapStore(s => s.data)

  const addEntry = () => {
    useMapStore.getState().set('key', Math.random())
    const stored = localStorage.getItem('zustand-poc-map-fail')
    const raw = stored ? JSON.parse(stored) : null
    setLog(l => [...l,
      `After set(key, value):`,
      `  In-memory data: Map { ${[...data.entries()].map(([k, v]) => `${k}:${v.toFixed(3)}`).join(', ')} }`,
      `  Stored in localStorage: state.data = ${JSON.stringify(raw?.state?.data)} (Map → {})`,
    ])
  }

  const reloadSim = () => {
    const stored = localStorage.getItem('zustand-poc-map-fail')
    if (!stored) {
      setLog(l => [...l, 'No storage found'])
      return
    }
    const parsed = JSON.parse(stored)
    setLog(l => [...l,
      `Hydrated state.data type: ${typeof parsed.state.data} (not a Map!)`,
      `Value: ${JSON.stringify(parsed.state.data)}`,
      `Map methods (.get, .set, .has) are gone after hydration — runtime error if used`,
    ])
  }

  return (
    <Section title="8.3 — persist with Map/Set — silent serialization failure">
      <Info>
        <code>JSON.stringify</code> converts <code>Map</code> to <code>{'{}'}</code> and <code>Set</code> to <code>[]</code>. After hydration, the state holds a plain object where a Map was expected — methods like <code>.get()</code> will throw.
      </Info>
      <Row>
        <Btn onClick={addEntry}>set(key, value) — then inspect storage</Btn>
        <Btn onClick={reloadSim}>Simulate hydration (what you get back)</Btn>
        <Btn onClick={() => {
          localStorage.removeItem('zustand-poc-map-fail')
          setLog(l => [...l, 'Storage cleared'])
        }} danger>Clear storage</Btn>
        <Btn onClick={() => setLog([])} danger>Clear log</Btn>
      </Row>
      <Log entries={log} />
      <Pre>{`// FAILURE: Map/Set are not JSON-serializable
persist(init, { name: 'store' })
// set({ data: new Map([['k', 1]]) })
// stored: { "data": {} }   ← Map becomes empty object
// hydrated: state.data is {}, calling state.data.get('k') throws TypeError

// FIX: custom serialize/deserialize
persist(init, {
  name: 'store',
  storage: {
    getItem: (k) => {
      const v = localStorage.getItem(k)
      if (!v) return null
      const { state, version } = JSON.parse(v)
      return { state: { ...state, data: new Map(state.data) }, version }
    },
    setItem: (k, v) => {
      const { state, version } = v
      localStorage.setItem(k, JSON.stringify({
        state: { ...state, data: [...state.data.entries()] },
        version,
      }))
    },
    removeItem: (k) => localStorage.removeItem(k),
  },
})`}</Pre>
    </Section>
  )
}

// ─── 8.4 Missing unsub — memory leak ─────────────────────────────────────────

const leakStore = createStore<{ sig: number }>(() => ({ sig: 0 }))

function LeakSection() {
  const [log, setLog] = useState<string[]>([])
  const mountCountRef = useRef(0)

  const BadConsumer = () => {
    useEffect(() => {
      mountCountRef.current++
      const mountId = mountCountRef.current
      // BAD: no unsub stored — listener remains in Set after unmount
      leakStore.subscribe(() => {
        setLog(l => [...l, `[LEAK mount#${mountId}] still alive after unmount`])
      })
    }, [])
    return <div style={{ color: '#ff6b6b', fontSize: 12 }}>bad consumer (mounted)</div>
  }

  const GoodConsumer = () => {
    useEffect(() => {
      return leakStore.subscribe(() => {
        setLog(l => [...l, '[GOOD] fires while mounted, stops on unmount'])
      })
    }, [])
    return <div style={{ color: '#4caf50', fontSize: 12 }}>good consumer (mounted)</div>
  }

  const [badCount, setBadCount] = useState(0)
  const [showGood, setShowGood] = useState(false)

  return (
    <Section title="8.4 — Missing unsub — memory leak (silent)">
      <Info>
        Mount the bad consumer N times, then unmount it. Its listeners remain in the Set. Fire the signal — see N log entries per fire. The good consumer: unmount → cleanup → gone.
      </Info>
      <Row>
        <Btn onClick={() => setBadCount(c => c + 1)} danger>Mount bad (×{badCount + 1})</Btn>
        <Btn onClick={() => setBadCount(0)} danger>Unmount bad (leak persists!)</Btn>
        <Btn onClick={() => setShowGood(b => !b)}>{showGood ? 'Unmount good' : 'Mount good'}</Btn>
        <Btn onClick={() => leakStore.setState(s => ({ sig: s.sig + 1 }))}>Fire signal</Btn>
        <Btn onClick={() => setLog([])} danger>Clear</Btn>
      </Row>
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        {Array.from({ length: badCount }, (_, i) => <BadConsumer key={i} />)}
        {showGood && <GoodConsumer />}
      </div>
      <Log entries={log} />
      <Pre>{`// BAD — no cleanup, listener leaks after unmount
useEffect(() => {
  store.subscribe(() => doSomething())
}, [])

// GOOD — return unsub as cleanup function
useEffect(() => {
  return store.subscribe(() => doSomething())
}, [])

// subscribe returns () => listeners.delete(listener)
// useEffect cleanup calls it on unmount`}</Pre>
    </Section>
  )
}

// ─── 8.5 shallow on nested objects — silently stale ──────────────────────────

interface NestedState {
  user: { name: string; score: number }
  level: number
  updateScore: (n: number) => void
  updateLevel: () => void
}

const useNestedStore = create<NestedState>((set) => ({
  user: { name: 'Alice', score: 0 },
  level: 1,
  // Mutates nested object IN PLACE — shallow won't detect this
  updateScore: (n) => set(s => {
    s.user.score = n  // mutation: same object ref
    return { user: s.user }  // same ref returned
  }),
  updateLevel: () => set(s => ({ level: s.level + 1 })),
}))

function ShallowNestedSection() {
  const [log, setLog] = useState<string[]>([])

  // Uses shallow — but user.score is inside the object, not a top-level key
  const { user, level } = useNestedStore(
    s => ({ user: s.user, level: s.level }),
    (a, b) => a.level === b.level && a.user === b.user  // ref comparison for user
  )

  useEffect(() => {
    return useNestedStore.subscribe((s, p) => {
      setLog(l => [...l,
        `user ref same? ${Object.is(s.user, p.user)} | user.score=${s.user.score} | level=${s.level}`,
      ])
    })
  }, [])

  return (
    <Section title="8.5 — shallow on nested objects — silently stale">
      <Info>
        <code>updateScore</code> mutates <code>user.score</code> in place and returns the same <code>user</code> reference. Equality check (<code>user === prevUser</code>) passes → component not re-rendered → stale display.
      </Info>
      <Row>
        <Btn onClick={() => useNestedStore.getState().updateScore(Math.floor(Math.random() * 100))} danger>
          updateScore (mutate in-place — stale display)
        </Btn>
        <Btn onClick={() => useNestedStore.getState().updateLevel()}>updateLevel (re-renders correctly)</Btn>
        <Btn onClick={() => setLog([])} danger>Clear log</Btn>
      </Row>
      <p style={{ color: '#888', fontSize: 12, marginTop: 8 }}>
        Displayed: user.score={user.score} | level={level}
        <span style={{ color: '#ff6b6b', marginLeft: 8 }}>(score may be stale — check log for actual value)</span>
      </p>
      <Log entries={log} />
      <Pre>{`// FAILURE: mutation returns same object reference
updateScore: (n) => set(s => {
  s.user.score = n        // mutate in-place
  return { user: s.user } // same ref — shallow equality passes → no re-render
})

// FIX: always return new object reference for changed nested state
updateScore: (n) => set(s => ({
  user: { ...s.user, score: n }  // new object → ref changes → re-renders
}))`}</Pre>
    </Section>
  )
}

// ─── 8.6 replace=true without full state ─────────────────────────────────────

interface FullState { a: number; b: number; c: string; label: string }
const replaceStore = createStore<FullState>(() => ({ a: 1, b: 2, c: 'three', label: 'intact' }))

function ReplaceFailureSection() {
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    return replaceStore.subscribe(s => setLog(l => [...l, JSON.stringify(s)]))
  }, [])

  const doSafeMerge = () => replaceStore.setState({ a: replaceStore.getState().a + 1 })

  const doDangerousReplace = () => {
    // @ts-expect-error intentional — partial replace destroys fields
    replaceStore.setState({ a: -1 }, true)
    setLog(l => [...l, `AFTER replace: b=${replaceStore.getState().b} c=${replaceStore.getState().c} (undefined!)`])
  }

  const doSafeReplace = () => {
    replaceStore.setState({ a: 1, b: 2, c: 'three', label: 'replaced safely' }, true)
  }

  return (
    <Section title="8.6 — replace=true without full state — silent field destruction">
      <Info>
        <code>setState(partial, true)</code> replaces the entire state. If you pass only <code>{'{ a: -1 }'}</code>, then <code>b</code>, <code>c</code>, and <code>label</code> become <code>undefined</code>. No error thrown at runtime — only TypeScript catches it.
      </Info>
      <Row>
        <Btn onClick={doSafeMerge}>Safe merge (a++)</Btn>
        <Btn onClick={doDangerousReplace} danger>Dangerous replace (partial state)</Btn>
        <Btn onClick={doSafeReplace}>Safe replace (full state)</Btn>
        <Btn onClick={() => setLog([])} danger>Clear</Btn>
      </Row>
      <Log entries={log} />
      <Pre>{`// FAILURE: replace with partial state — other fields become undefined
// @ts-expect-error — TypeScript catches this if state is typed
store.setState({ a: -1 }, true)
// Result: { a: -1, b: undefined, c: undefined, label: undefined }

// FIX: always pass full state when using replace
store.setState({ a: -1, b: store.getState().b, c: store.getState().c, label: 'reset' }, true)

// Or: don't use replace at all unless you specifically need to remove keys`}</Pre>
    </Section>
  )
}

export default function FailuresExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>08 · Failure Scenarios</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        All Zustand failures are silent — no errors, no warnings. The common thread: wrong equality assumption, leaked subscription, stale reference, or dropped fields. Know each by name before shipping.
      </p>
      <StaleClosureSection />
      <NoSelectorFailureSection />
      <PersistMapSection />
      <LeakSection />
      <ShallowNestedSection />
      <ReplaceFailureSection />
    </div>
  )
}
