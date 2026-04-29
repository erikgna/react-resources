import { useRef } from 'react'
import { makeAutoObservable, observable, computed, autorun, action, IComputedValue } from 'mobx'
import { observer } from 'mobx-react-lite'
import { Section, Row, Btn, Info, Pre, Log } from '../shared'
import { useState } from 'react'

// ─── 7.1 Reaction graph depth — chain of 100 computeds ────────────────────────

function GraphDepthSection() {
  const [log, setLog] = useState<string[]>([])

  const runDepthTest = () => {
    const root = observable.box(0)

    // Build a chain: c[0] = root+1, c[1] = c[0]+1, ..., c[99] = c[98]+1
    const chain: IComputedValue<number>[] = []
    chain.push(computed(() => root.get() + 1))
    for (let i = 1; i < 100; i++) {
      const prev = chain[i - 1]
      chain.push(computed(() => prev.get() + 1))
    }

    const last = chain[99]

    // Warm up — access the end to build the dependency graph
    const initial = last.get()

    const t0 = performance.now()
    for (let run = 0; run < 100; run++) {
      action(() => root.set(root.get() + 1))()
      last.get() // force recompute
    }
    const elapsed = (performance.now() - t0).toFixed(2)

    setLog(p => [...p,
      `chain depth=100, 100 updates: ${elapsed}ms`,
      `final value = ${last.get()} (expected = ${initial + 100})`,
      `topological sort: each computed recomputes exactly once per update`,
    ])
  }

  return (
    <Section title="7.1 — Reaction graph depth — chain of 100 computeds">
      <Info>
        100 chained computeds. Each update propagates from root to leaf. MobX's topological scheduler ensures each computed recomputes exactly once per change — no redundant recomputation.
      </Info>
      <Row>
        <Btn onClick={runDepthTest}>Run depth test (100 updates)</Btn>
      </Row>
      <Log entries={log} />
      <Pre>{`const root = observable.box(0)
const chain = [computed(() => root.get() + 1)]
for (let i = 1; i < 100; i++) {
  chain.push(computed(() => chain[i-1].get() + 1))
}
// change root → propagates through 100 computeds
// topological sort prevents diamond problem (each node computed once)`}</Pre>
    </Section>
  )
}

// ─── 7.2 Wide graph — 1000 observables, one autorun ──────────────────────────

function WideGraphSection() {
  const [log, setLog] = useState<string[]>([])

  const runWideTest = () => {
    const boxes = Array.from({ length: 1000 }, (_, i) => observable.box(i))

    let reactionCount = 0
    const dispose = autorun(() => {
      boxes.forEach(b => b.get()) // read all 1000
      reactionCount++
    })

    // Update one box
    const t1 = performance.now()
    action(() => boxes[0].set(999))()
    const oneElapsed = (performance.now() - t1).toFixed(3)

    // Batch update all 1000
    const t2 = performance.now()
    action(() => boxes.forEach((b, i) => b.set(i + 1000)))()
    const allElapsed = (performance.now() - t2).toFixed(3)

    dispose()

    setLog(p => [...p,
      `1000 observables, 1 autorun reading all`,
      `update 1 box: ${oneElapsed}ms (1 autorun re-run)`,
      `update all 1000 in action: ${allElapsed}ms (1 autorun re-run, batched)`,
      `total autorun runs: ${reactionCount} (warm-up=1 + 2 updates = 3)`,
    ])
  }

  return (
    <Section title="7.2 — Wide graph — 1000 observables, one autorun">
      <Info>
        1000 separate observables, one autorun that reads all. Updating all 1000 inside one <code>action</code> triggers the autorun exactly once (batch). Without action: 1000 separate re-runs.
      </Info>
      <Row>
        <Btn onClick={runWideTest}>Run wide graph test</Btn>
      </Row>
      <Log entries={log} />
      <Pre>{`const boxes = Array.from({ length: 1000 }, (_, i) => observable.box(i))
const dispose = autorun(() => boxes.forEach(b => b.get()))

// Update all in action = 1 autorun re-run (batched)
action(() => boxes.forEach(b => b.set(b.get() + 1)))()

// Without action: 1000 separate re-runs → 1000x slower`}</Pre>
    </Section>
  )
}

// ─── 7.3 Observer render profiling — 200-item list ────────────────────────────

const perfList = observable({
  items: Array.from({ length: 200 }, (_, i) => ({ id: i, value: 0 })),
})

const PerfItem = observer(function PerfItem({ idx }: { idx: number }) {
  const renders = useRef(0)
  renders.current++
  const item = perfList.items[idx]
  return (
    <div style={{
      display: 'inline-block', margin: 1, padding: '2px 5px',
      background: renders.current > 1 ? '#1a1111' : '#111',
      border: `1px solid ${renders.current > 1 ? '#5a1111' : '#1e1e1e'}`,
      fontSize: 10, minWidth: 50,
    }}>
      {idx}: {item.value} <span style={{ color: renders.current > 1 ? '#ff6b6b' : '#4caf50' }}>r{renders.current}</span>
    </div>
  )
})

const PerfList = observer(function PerfList() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {perfList.items.map((_, i) => <PerfItem key={i} idx={i} />)}
    </div>
  )
})

function RenderProfilingSection() {
  const [log, setLog] = useState<string[]>([])

  const updateOne = () => {
    const t0 = performance.now()
    action(() => { perfList.items[0].value++ })()
    const elapsed = (performance.now() - t0).toFixed(3)
    setLog(p => [...p, `update items[0]: ${elapsed}ms — only 1 item should re-render`])
  }

  const updateAll = () => {
    const t0 = performance.now()
    action(() => { perfList.items.forEach(item => { item.value++ }) })()
    const elapsed = (performance.now() - t0).toFixed(3)
    setLog(p => [...p, `update all 200: ${elapsed}ms — all items re-render`])
  }

  return (
    <Section title="7.3 — Observer render profiling — 200-item list">
      <Info>
        Update one item → only that item re-renders (red border). Update all → all re-render. The r-counter and border color prove fine-grained update boundaries.
      </Info>
      <Row style={{ marginBottom: 8 }}>
        <Btn onClick={updateOne}>Update items[0] only</Btn>
        <Btn onClick={updateAll}>Update all 200</Btn>
      </Row>
      <Log entries={log} />
      <PerfList />
    </Section>
  )
}

// ─── 7.4 Computed with side effects — anti-pattern ────────────────────────────

class SideEffectStore {
  a = 1
  b = 2
  sideEffectCount = 0
  computeCount = 0

  constructor() { makeAutoObservable(this) }

  get badComputed() {
    this.computeCount++
    this.sideEffectCount++ // WRONG: side effect in computed
    return this.a + this.b
  }

  setA(v: number) { this.a = v }
  setB(v: number) { this.b = v }
}

const sideEffectStore = new SideEffectStore()

function SideEffectSection() {
  const [log, setLog] = useState<string[]>([])

  const trigger = () => {
    // Reading a computed with side effects from multiple places may surprise you
    const v1 = sideEffectStore.badComputed
    const v2 = sideEffectStore.badComputed
    const v3 = sideEffectStore.badComputed
    setLog(p => [...p,
      `read 3x: v1=${v1} v2=${v2} v3=${v3}`,
      `computeCount=${sideEffectStore.computeCount} sideEffectCount=${sideEffectStore.sideEffectCount}`,
      `(computed cached — ran once per dep change, not once per read)`,
    ])
  }

  return (
    <Section title="7.4 — Computed with side effects — anti-pattern">
      <Info>
        Computeds should be pure. A side effect in a computed runs whenever MobX decides to re-evaluate it — which may be more or fewer times than expected. Side effects belong in reactions (<code>autorun</code>/<code>reaction</code>).
      </Info>
      <Row>
        <Btn onClick={trigger}>Read badComputed 3×</Btn>
        <Btn onClick={() => sideEffectStore.setA(sideEffectStore.a + 1)}>Change a (triggers recompute)</Btn>
      </Row>
      <Log entries={log} />
      <Pre>{`// WRONG — side effect in computed
get badComputed() {
  this.sideEffectCount++    // fires at MobX's discretion, not your schedule
  return this.a + this.b
}

// RIGHT — side effect in reaction
autorun(() => {
  const value = this.a + this.b  // pure read
  this.sideEffectCount++          // effect in reaction, predictable
})`}</Pre>
    </Section>
  )
}

export default function PerformanceExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>07 · Performance</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Stress the reaction graph: deep chains, wide fans, render granularity at scale, and the computed side-effect anti-pattern. All timing measured with <code>performance.now()</code>.
      </p>
      <GraphDepthSection />
      <WideGraphSection />
      <RenderProfilingSection />
      <SideEffectSection />
    </div>
  )
}
