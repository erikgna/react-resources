import { useState, useEffect, useRef } from 'react'
import { makeAutoObservable, observable, autorun, action, computed, configure } from 'mobx'
import { observer } from 'mobx-react-lite'
import { ObservableBox, ComputedBox, autorun as coreAutorun } from '../../core/observable'
import { Section, Row, Btn, Info, Pre, Log } from '../shared'

// ─── 8.1 Mutation outside action in strict mode ────────────────────────────────

function StrictModeFailure() {
  const [error, setError] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>([])
  const storeRef = useRef(observable({ count: 0 }))

  useEffect(() => {
    configure({ enforceActions: 'always' })
    const dispose = autorun(() => setLog(p => [...p, `count = ${storeRef.current.count}`]))
    return () => {
      configure({ enforceActions: 'never' })
      dispose()
    }
  }, [])

  const tryDirect = () => {
    setError(null)
    try {
      storeRef.current.count++
    } catch (e) {
      setError(String(e))
    }
  }

  return (
    <Section title="8.1 — Strict mode: mutation outside action — explicit throw">
      <Info>
        With <code>enforceActions: 'always'</code>, direct mutation outside an action throws immediately. This is the most informative MobX failure — loud and specific.
      </Info>
      <Row>
        <Btn onClick={tryDirect} danger>Mutate directly (throws)</Btn>
        <Btn onClick={() => action(() => { storeRef.current.count++ })()}>Fix: wrap in action()</Btn>
      </Row>
      {error && (
        <div style={{ background: '#2a1111', border: '1px solid #5a1111', borderRadius: 3, padding: 10, marginTop: 10, fontSize: 11, color: '#ff6b6b', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          {error}
        </div>
      )}
      <Log entries={log} />
      <Pre>{`configure({ enforceActions: 'always' })

// THROWS: "Since strict-mode is enabled, changing observed
// observable values outside actions is not allowed"
store.count++

// FIX:
action(() => { store.count++ })()
// or: runInAction(() => { store.count++ })`}</Pre>
    </Section>
  )
}

// ─── 8.2 Undisposed reaction — memory leak ────────────────────────────────────

const leakTemp = observable.box(20)

function LeakDemo() {
  const [log, setLog] = useState<string[]>([])
  const mountCount = useRef(0)
  const [mounted, setMounted] = useState(false)

  const mountBad = () => {
    mountCount.current++
    // No disposer stored — autorun leaks
    autorun(() => {
      setLog(p => [...p, `[LEAK mount#${mountCount.current}] temp=${leakTemp.get()}`])
    })
    setLog(p => [...p, `[mount#${mountCount.current}] bad autorun started — no disposer`])
    setMounted(true)
  }

  const [goodDispose, setGoodDispose] = useState<(() => void) | null>(null)

  const mountGood = () => {
    mountCount.current++
    const dispose = autorun(() => {
      setLog(p => [...p, `[GOOD mount#${mountCount.current}] temp=${leakTemp.get()}`])
    })
    setGoodDispose(() => dispose)
    setLog(p => [...p, `[mount#${mountCount.current}] good autorun started — disposer stored`])
    setMounted(true)
  }

  const unmountGood = () => {
    goodDispose?.()
    setGoodDispose(null)
    setMounted(false)
    setLog(p => [...p, `[unmount] disposed — good autorun stops`])
  }

  return (
    <Section title="8.2 — Undisposed reaction — memory leak (silent)">
      <Info>
        Reactions without disposal keep running forever. Mount the bad version multiple times, then trigger a change — see all leaked autoruns still firing.
      </Info>
      <Row>
        <Btn onClick={mountBad} danger>Mount bad autorun (×{mountCount.current + 1})</Btn>
        <Btn onClick={mountGood}>Mount good autorun</Btn>
        <Btn onClick={unmountGood} danger>Unmount good</Btn>
        <Btn onClick={() => action(() => leakTemp.set(leakTemp.get() + 1))()}>temp +1 (trigger)</Btn>
      </Row>
      <Log entries={log} />
      <Pre>{`// BAD — reaction lives forever (leak)
autorun(() => console.log(store.val))

// GOOD — store and call disposer
const dispose = autorun(() => console.log(store.val))
// cleanup: dispose()

// In React:
useEffect(() => {
  return autorun(() => ...)  // return disposer as cleanup function
}, [])`}</Pre>
    </Section>
  )
}

// ─── 8.3 Circular computed — detected, throws ─────────────────────────────────

function CircularComputedDemo() {
  const [error, setError] = useState<string | null>(null)
  const [fixed, setFixed] = useState(false)

  const tryCircular = () => {
    setError(null)
    setFixed(false)
    try {
      class CircularStore {
        base = 1
        constructor() { makeAutoObservable(this) }
        // A reads B, B reads A — circular
        get a(): number { return this.b + 1 }
        get b(): number { return this.a + 1 }
      }
      const s = new CircularStore()
      s.a // trigger the cycle
    } catch (e) {
      setError(String(e))
    }
  }

  const tryFixed = () => {
    setError(null)
    setFixed(true)
    // Non-circular: break the dependency by using a base value
    class FixedStore {
      base = 1
      constructor() { makeAutoObservable(this) }
      get doubled() { return this.base * 2 }
      get tripled() { return this.base * 3 }
    }
    const s = new FixedStore()
    console.log('fixed: doubled=', s.doubled, 'tripled=', s.tripled)
  }

  return (
    <Section title="8.3 — Circular computed — MobX detects and throws">
      <Info>
        MobX detects circular computed dependencies and throws. Some reactive systems silently produce wrong results — MobX fails loudly.
      </Info>
      <Row>
        <Btn onClick={tryCircular} danger>Create circular computed (throws)</Btn>
        <Btn onClick={tryFixed}>Fixed version (no cycle)</Btn>
      </Row>
      {error && (
        <div style={{ background: '#2a1111', border: '1px solid #5a1111', borderRadius: 3, padding: 10, marginTop: 10, fontSize: 11, color: '#ff6b6b', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          {error}
        </div>
      )}
      {fixed && <p style={{ color: '#4caf50', fontSize: 12, marginTop: 8 }}>✓ Fixed: both computeds derive independently from base</p>}
      <Pre>{`// CIRCULAR — A depends on B, B depends on A
get a(): number { return this.b + 1 }
get b(): number { return this.a + 1 }
// throws: "Cycle detected in computation"

// FIX — break the cycle, both derive from a shared base
get doubled() { return this.base * 2 }
get tripled() { return this.base * 3 }`}</Pre>
    </Section>
  )
}

// ─── 8.4 Reading observable outside reactive context — silent issue ────────────

const silentStore = observable({ count: 0 })

// NOT an observer component — reads observable but won't update
function SilentComponent({ label }: { label: string }) {
  const renders = useRef(0)
  renders.current++
  return (
    <div style={{ padding: '8px 12px', background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 3 }}>
      <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>{label}</div>
      <div style={{ color: '#e0e0e0', fontSize: 14 }}>count: {silentStore.count}</div>
      <div style={{ fontSize: 11, color: '#ff6b6b' }}>renders: {renders.current}</div>
    </div>
  )
}

const ReactiveSilent = observer(function ReactiveSilent() {
  const renders = useRef(0)
  renders.current++
  return (
    <div style={{ padding: '8px 12px', background: '#0f0f0f', border: '1px solid #4a9eff', borderRadius: 3 }}>
      <div style={{ fontSize: 10, color: '#4a9eff', marginBottom: 4 }}>WITH observer</div>
      <div style={{ color: '#e0e0e0', fontSize: 14 }}>count: {silentStore.count}</div>
      <div style={{ fontSize: 11, color: '#4caf50' }}>renders: {renders.current}</div>
    </div>
  )
})

function SilentReadSection() {
  return (
    <Section title="8.4 — Read outside reactive context — silent stale value">
      <Info>
        A component that reads an observable without being wrapped in <code>observer</code> displays a snapshot that never updates. No error, no warning. The most common MobX React bug.
      </Info>
      <Row style={{ marginBottom: 8 }}>
        <Btn onClick={() => action(() => { silentStore.count++ })()}>Increment count</Btn>
      </Row>
      <Row>
        <SilentComponent label="NO observer (stale)" />
        <ReactiveSilent />
      </Row>
      <Pre>{`// Reads observable count — but renders once, then freezes
function SilentComponent() {
  return <div>{store.count}</div>  // snapshot, not live
}

// Fix: wrap in observer
const ReactiveComponent = observer(() => (
  <div>{store.count}</div>  // now tracks reads, re-renders on change
))`}</Pre>
    </Section>
  )
}

// ─── 8.5 Stale lazy computed — correct but surprising ─────────────────────────

function StaleComputedSection() {
  const [log, setLog] = useState<string[]>([])

  const runTest = () => {
    const source = new ObservableBox(1)
    const derived = new ComputedBox(() => source.get() * 2)

    // Read initial value — triggers first computation
    const v1 = derived.get()
    setLog(p => [...p, `initial derived.get() = ${v1} (computes now)`])

    // Change source — but no one is observing derived
    source.set(5)
    setLog(p => [...p, `source set to 5 — derived has no active observer`])
    setLog(p => [...p, `derived is now dirty but has NOT recomputed yet (lazy)`])

    // Read again — recomputes on demand
    const v2 = derived.get()
    setLog(p => [...p, `derived.get() after change = ${v2} (recomputed on read)`])

    derived.dispose()
  }

  const runMobxTest = () => {
    const s = observable.box(1)
    const d = computed(() => s.get() * 2)

    const v1 = d.get()
    setLog(p => [...p, `[MobX] initial computed = ${v1}`])
    action(() => s.set(5))()
    setLog(p => [...p, `[MobX] source set to 5 — computed is lazy, no active observer`])
    const v2 = d.get()
    setLog(p => [...p, `[MobX] computed.get() = ${v2} (recomputed on access)`])
  }

  return (
    <Section title="8.5 — Stale lazy computed — correct behavior that surprises">
      <Info>
        A computed with no active observer does not recompute when its dependencies change. It recomputes on next <code>.get()</code>. This is correct (lazy) but surprises developers expecting push-based updates everywhere.
      </Info>
      <Row>
        <Btn onClick={runTest}>Run core ComputedBox test</Btn>
        <Btn onClick={runMobxTest}>Run MobX computed test</Btn>
        <Btn onClick={() => setLog([])} danger>Clear log</Btn>
      </Row>
      <Log entries={log} />
      <Pre>{`const source = observable.box(1)
const derived = computed(() => source.get() * 2)

derived.get()         // = 2 — computes now
source.set(5)         // derived is now dirty...
                      // ...but no observer → does NOT recompute
derived.get()         // = 10 — recomputes on demand (lazy)

// Surprise: if you expect "reactive" to mean "always up to date",
// a lazy computed with no observer will look stale until read.
// Fix: add an autorun or use observer() to create an active observer.`}</Pre>
    </Section>
  )
}

export default function FailuresExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>08 · Failure Scenarios</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Intentional breakage. MobX has two classes of failure: loud (strict mode throws, circular computed throws) and silent (no observer, stale lazy computed, undisposed reaction). Know which is which.
      </p>
      <StrictModeFailure />
      <LeakDemo />
      <CircularComputedDemo />
      <SilentReadSection />
      <StaleComputedSection />
    </div>
  )
}
