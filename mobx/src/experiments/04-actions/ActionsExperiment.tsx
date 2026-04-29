import { useState, useEffect, useRef } from 'react'
import { makeAutoObservable, observable, autorun, action, runInAction, configure } from 'mobx'
import { batch as coreBatch, ObservableBox } from '../../core/observable'
import { Section, Row, Btn, Info, Pre, Log } from '../shared'

// ─── 4.1 Strict mode — mutation outside action ────────────────────────────────

// We use a local observable for strict mode tests to avoid polluting global state
function StrictModeSection() {
  const [error, setError] = useState<string | null>(null)
  const [fixed, setFixed] = useState(false)
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

  const tryMutateDirect = () => {
    setError(null)
    setFixed(false)
    try {
      storeRef.current.count++
    } catch (e) {
      setError(String(e))
    }
  }

  const fixWithAction = () => {
    setError(null)
    setFixed(true)
    action(() => { storeRef.current.count++ })()
  }

  return (
    <Section title="4.1 — Strict mode — mutation outside action throws">
      <Info>
        <code>configure({'{ enforceActions: "always" }'})</code> makes MobX throw when you mutate outside an action. Fails loudly rather than silently.
      </Info>
      <Row>
        <Btn onClick={tryMutateDirect} danger>Mutate directly (throws)</Btn>
        <Btn onClick={fixWithAction}>Wrap in action() (fixed)</Btn>
      </Row>
      {error && (
        <div style={{ background: '#2a1111', border: '1px solid #5a1111', borderRadius: 3, padding: 10, marginTop: 10, fontSize: 12, color: '#ff6b6b' }}>
          {error}
        </div>
      )}
      {fixed && <p style={{ color: '#4caf50', fontSize: 12, marginTop: 8 }}>✓ Fixed: action() wraps the mutation</p>}
      <Log entries={log} />
      <Pre>{`configure({ enforceActions: 'always' })

store.count++               // throws: "Since strict-mode is enabled,
                            // changing observed observable values outside
                            // actions is not allowed"

action(() => { store.count++ })()  // OK
// or: runInAction(() => { store.count++ })`}</Pre>
    </Section>
  )
}

// ─── 4.2 Named vs anonymous action ────────────────────────────────────────────

class NamedStore {
  count = 0
  constructor() { makeAutoObservable(this) }

  // auto-wrapped by makeAutoObservable
  increment() { this.count++ }

  // manually named for devtools
  decrement = action('decrement', () => { this.count-- })
}

const namedStore = new NamedStore()

function NamedActions() {
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    return autorun(() => setLog(p => [...p, `count = ${namedStore.count}`]))
  }, [])

  return (
    <Section title="4.2 — Named vs anonymous action">
      <Info>
        <code>action('name', fn)</code> attaches a debug label visible in MobX spy/devtools. <code>makeAutoObservable</code> auto-wraps methods as actions (anonymous).
      </Info>
      <Row>
        <Btn onClick={() => namedStore.increment()}>increment (auto-action)</Btn>
        <Btn onClick={() => namedStore.decrement()} danger>decrement (named action)</Btn>
      </Row>
      <Log entries={log} />
      <Pre>{`class NamedStore {
  constructor() { makeAutoObservable(this) }
  increment() { this.count++ }          // auto-wrapped, anonymous
  decrement = action('decrement', () => { this.count-- })  // named
}
// Named actions appear in MobX spy() output with their label`}</Pre>
    </Section>
  )
}

// ─── 4.3 Batching — multiple mutations = one notification ──────────────────────

class BatchStore {
  a = 0
  b = 0
  reactionCount = 0

  constructor() { makeAutoObservable(this) }
  setA(v: number) { this.a = v }
  setB(v: number) { this.b = v }
  setBoth(va: number, vb: number) { this.a = va; this.b = vb }
}

const batchStore = new BatchStore()

function BatchingSection() {
  const [log, setLog] = useState<string[]>([])
  const reactionCountRef = useRef(0)

  useEffect(() => {
    return autorun(() => {
      reactionCountRef.current++
      setLog(p => [...p, `[reaction #${reactionCountRef.current}] a=${batchStore.a} b=${batchStore.b}`])
    })
  }, [])

  const unbatched = () => {
    // Two separate mutations = two reactions
    batchStore.setA(batchStore.a + 1)
    batchStore.setB(batchStore.b + 1)
  }

  const batched = () => {
    // action auto-batches — one reaction
    batchStore.setBoth(batchStore.a + 1, batchStore.b + 1)
  }

  // Core batch demo
  const [coreLog, setCoreLog] = useState<string[]>([])
  const [boxes] = useState(() => ({ a: new ObservableBox(0), b: new ObservableBox(0) }))
  const coreReactionCount = useRef(0)

  useEffect(() => {
    const dispose = (() => {
      const run = () => {
        // simple subscription without our autorun to show raw notifications
        coreReactionCount.current++
        setCoreLog(p => [...p, `[core reaction #${coreReactionCount.current}] a=${boxes.a.get()} b=${boxes.b.get()}`])
      }
      const d1 = boxes.a._subscribe(run)
      const d2 = boxes.b._subscribe(run)
      return () => { d1(); d2() }
    })()
    return dispose
  }, [boxes])

  return (
    <Section title="4.3 — Batching — action groups multiple mutations into one notification">
      <Info>
        Two mutations outside a single action fire two reactions. Inside an action (or <code>runInAction</code>), MobX batches them into one notification.
      </Info>
      <Row>
        <Btn onClick={unbatched} danger>Unbatched (2 reactions)</Btn>
        <Btn onClick={batched}>Batched via action (1 reaction)</Btn>
      </Row>
      <p style={{ color: '#555', fontSize: 11, marginTop: 8 }}>MobX reaction log:</p>
      <Log entries={log} />
      <Row style={{ marginTop: 14 }}>
        <Btn onClick={() => { boxes.a.set(boxes.a.get() + 1); boxes.b.set(boxes.b.get() + 1) }} danger>Core: 2 separate sets</Btn>
        <Btn onClick={() => coreBatch(() => { boxes.a.set(boxes.a.get() + 1); boxes.b.set(boxes.b.get() + 1) })}>Core: batch()</Btn>
      </Row>
      <p style={{ color: '#555', fontSize: 11, marginTop: 8 }}>core/observable.ts reaction log:</p>
      <Log entries={coreLog} />
      <Pre>{`// Two separate mutations = two reactions
store.a++; store.b++

// action batches them → one reaction
action(() => { store.a++; store.b++ })()
// makeAutoObservable methods are auto-batched

// Same in core/observable.ts:
batch(() => { boxA.set(1); boxB.set(2) })  // one flush`}</Pre>
    </Section>
  )
}

// ─── 4.4 runInAction — async mutations ────────────────────────────────────────

class AsyncStore {
  data: string | null = null
  loading = false
  error: string | null = null

  constructor() { makeAutoObservable(this) }

  async fetchData() {
    runInAction(() => { this.loading = true; this.error = null })
    try {
      // Simulate async fetch
      await new Promise(r => setTimeout(r, 800))
      const result = `data fetched at ${new Date().toLocaleTimeString()}`
      runInAction(() => { this.data = result; this.loading = false })
    } catch (e) {
      runInAction(() => { this.error = String(e); this.loading = false })
    }
  }
}

const asyncStore = new AsyncStore()

function RunInActionSection() {
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    return autorun(() => {
      setLog(p => [...p, `loading=${asyncStore.loading} data=${asyncStore.data ?? 'null'} error=${asyncStore.error ?? 'null'}`])
    })
  }, [])

  return (
    <Section title="4.4 — runInAction — async mutation pattern">
      <Info>
        After <code>await</code>, you're no longer inside MobX's action context. Wrap post-await mutations in <code>runInAction</code> (or a new <code>action</code>). Without it, strict mode throws.
      </Info>
      <Row>
        <Btn onClick={() => asyncStore.fetchData()}>Fetch (async)</Btn>
      </Row>
      <Log entries={log} />
      <Pre>{`async fetchData() {
  runInAction(() => { this.loading = true })   // sync — OK
  const result = await fetch('/api/data')       // await → leaves action context
  runInAction(() => {                           // must re-enter
    this.data = result
    this.loading = false
  })
}
// Without runInAction after await → throws in strict mode:
// "Cannot modify 'data' outside an action"`}</Pre>
    </Section>
  )
}

export default function ActionsExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>04 · Actions</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Actions are the mutation boundary in MobX. They batch notifications, enable strict mode enforcement, and provide the audit label for devtools. <code>runInAction</code> solves the async mutation problem.
      </p>
      <StrictModeSection />
      <NamedActions />
      <BatchingSection />
      <RunInActionSection />
    </div>
  )
}
