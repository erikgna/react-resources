import { createContext, useContext, useMemo, useState, useRef, memo } from 'react'
import { Section, Row, Btn, Info, Pre, Box, ui } from '../shared'

// ─── Render counter ───────────────────────────────────────────────────────────

function useRenderCount() {
  const ref = useRef(0)
  ref.current += 1
  return ref.current
}

// ─── Benchmark: 1 large context vs 5 split contexts ──────────────────────────

type FatState = { a: number; b: number; c: number; d: number; e: number }
const FatCtx = createContext<FatState>({ a: 0, b: 0, c: 0, d: 0, e: 0 })

const ACtx = createContext(0)
const BCtx = createContext(0)
const CCtx = createContext(0)
const DCtx = createContext(0)
const ECtx = createContext(0)

// Fat consumers — all read from one large context
function FatA() { const { a } = useContext(FatCtx); const r = useRenderCount(); return <Box name="fat-A" renders={r}>a:{a}</Box> }
function FatB() { const { b } = useContext(FatCtx); const r = useRenderCount(); return <Box name="fat-B" renders={r}>b:{b}</Box> }
function FatC() { const { c } = useContext(FatCtx); const r = useRenderCount(); return <Box name="fat-C" renders={r}>c:{c}</Box> }
function FatD() { const { d } = useContext(FatCtx); const r = useRenderCount(); return <Box name="fat-D" renders={r}>d:{d}</Box> }
function FatE() { const { e } = useContext(FatCtx); const r = useRenderCount(); return <Box name="fat-E" renders={r}>e:{e}</Box> }

// Split consumers — each reads from its own context
function SplitA() { const a = useContext(ACtx); const r = useRenderCount(); return <Box name="split-A" renders={r}>a:{a}</Box> }
function SplitB() { const b = useContext(BCtx); const r = useRenderCount(); return <Box name="split-B" renders={r}>b:{b}</Box> }
function SplitC() { const c = useContext(CCtx); const r = useRenderCount(); return <Box name="split-C" renders={r}>c:{c}</Box> }
function SplitD() { const d = useContext(DCtx); const r = useRenderCount(); return <Box name="split-D" renders={r}>d:{d}</Box> }
function SplitE() { const e = useContext(ECtx); const r = useRenderCount(); return <Box name="split-E" renders={r}>e:{e}</Box> }

// ─── Deep tree benchmark (10 levels) ─────────────────────────────────────────

const DeepCtx = createContext(0)

function DeepLeaf() {
  const val = useContext(DeepCtx)
  const renders = useRenderCount()
  return <Box name="leaf (depth 10)" renders={renders}>val:{val}</Box>
}

function DeepTree({ depth, children }: { depth: number; children: React.ReactNode }) {
  if (depth <= 0) return <>{children}</>
  return (
    <div style={{ paddingLeft: 8, borderLeft: '1px solid #1a1a1a' }}>
      <DeepTree depth={depth - 1}>{children}</DeepTree>
    </div>
  )
}

// ─── Render benchmark ────────────────────────────────────────────────────────

import React from 'react'

export default function PerformanceExperiment() {
  const [fat, setFat] = useState<FatState>({ a: 0, b: 0, c: 0, d: 0, e: 0 })
  const [split, setSplit] = useState({ a: 0, b: 0, c: 0, d: 0, e: 0 })
  const [deepVal, setDeepVal] = useState(0)

  // Memoized fat value — won't help with re-renders if only A changes (all re-render anyway)
  const fatMemo = useMemo(() => fat, [fat.a, fat.b, fat.c, fat.d, fat.e])

  const [lastMs, setLastMs] = useState<Record<string, number>>({})

  function bench(label: string, fn: () => void) {
    const t0 = performance.now()
    fn()
    setLastMs(prev => ({ ...prev, [label]: performance.now() - t0 }))
  }

  return (
    <div>
      <h2 style={ui.h2}>7 · Performance Analysis</h2>
      <p style={ui.desc}>
        1 fat context vs 5 split contexts. Deep tree propagation cost.
        Measure re-render counts and timing. Open React Profiler in DevTools for flamegraph.
      </p>

      <Section title="7.1 Fat Context — All Consumers Re-render on Any Field Change">
        <Info>
          One context with 5 fields. Change field A — ALL 5 consumers re-render because the context object is new.
          This is the core problem with large contexts: no field-level subscription.
        </Info>
        <Row style={{ marginBottom: 12, gap: 6 }}>
          {(['a','b','c','d','e'] as const).map(k => (
            <Btn key={k} onClick={() => bench(`fat-${k}`, () =>
              setFat(prev => ({ ...prev, [k]: prev[k] + 1 }))
            )}>
              inc {k} {lastMs[`fat-${k}`] !== undefined ? `(${lastMs[`fat-${k}`].toFixed(2)}ms)` : ''}
            </Btn>
          ))}
        </Row>
        <FatCtx.Provider value={fatMemo}>
          <Row>
            <FatA /><FatB /><FatC /><FatD /><FatE />
          </Row>
        </FatCtx.Provider>
        <Pre>{`// Increment A → fatMemo is new (dep fat.a changed) → ALL consumers re-render
// Render cost: O(n_consumers) per ANY field change
// 5 consumers × every update = 5x renders regardless of which field changed`}</Pre>
      </Section>

      <Section title="7.2 Split Contexts — Surgical Re-renders">
        <Info>
          Five separate contexts. Change A — only <code>SplitA</code> re-renders.
          B, C, D, E contexts unchanged → their consumers bail out.
          Render cost is O(1) per field change regardless of total consumers.
        </Info>
        <Row style={{ marginBottom: 12, gap: 6 }}>
          {(['a','b','c','d','e'] as const).map(k => (
            <Btn key={k} onClick={() => bench(`split-${k}`, () =>
              setSplit(prev => ({ ...prev, [k]: prev[k] + 1 }))
            )}>
              inc {k} {lastMs[`split-${k}`] !== undefined ? `(${lastMs[`split-${k}`].toFixed(2)}ms)` : ''}
            </Btn>
          ))}
        </Row>
        <ACtx.Provider value={split.a}>
          <BCtx.Provider value={split.b}>
            <CCtx.Provider value={split.c}>
              <DCtx.Provider value={split.d}>
                <ECtx.Provider value={split.e}>
                  <Row>
                    <SplitA /><SplitB /><SplitC /><SplitD /><SplitE />
                  </Row>
                </ECtx.Provider>
              </DCtx.Provider>
            </CCtx.Provider>
          </BCtx.Provider>
        </ACtx.Provider>
        <Pre>{`// Split: ACtx is a primitive number → Object.is works perfectly
// Increment A → only ACtx changes → only SplitA re-renders
// B/C/D/E ctx values unchanged → React bails out on their consumers
//
// Trade-off: more Provider nesting boilerplate vs. surgical re-renders
// For 2-3 fields: fat ctx is fine. For 10+ with independent updates: split.`}</Pre>
      </Section>

      <Section title="7.3 Deep Tree — Propagation Cost">
        <Info>
          Context consumer at depth 10. Propagation to a deep leaf costs nothing extra —
          React walks the fiber tree during reconciliation regardless.
          Depth itself is not the performance bottleneck; number of re-rendering components is.
        </Info>
        <Btn onClick={() => setDeepVal(v => v + 1)}>update deep ctx ({deepVal})</Btn>
        <DeepCtx.Provider value={deepVal}>
          <DeepTree depth={10}>
            <DeepLeaf />
          </DeepTree>
        </DeepCtx.Provider>
        <Pre>{`// Context propagation is O(1) regardless of depth.
// React's fiber reconciler marks consumers during commit, not by tree traversal.
// The slow part is re-rendering components between Provider and consumer
// if those intermediate components don't bail out.
//
// React.memo on intermediate components prevents their re-render.
// The consumer WILL still re-render — no way to stop context-triggered renders
// without splitting the context or using a selector pattern (Experiment 9).`}</Pre>
      </Section>

      <Section title="7.4 Measurement Guide">
        <Info>Open DevTools → Profiler tab → Record → click buttons above → Stop → examine flamegraph.</Info>
        <Pre>{`// Tools for measuring Context performance:
//
// 1. React Profiler (DevTools)
//    - Flamegraph: shows which components rendered and why
//    - Ranked: sorts components by render time
//    - "Highlight updates" checkbox: flashes re-rendering components
//
// 2. console.count in render body:
//    function MyConsumer() {
//      console.count('MyConsumer render')
//      return ...
//    }
//
// 3. Custom render counter hook (see useRenderCount above)
//
// 4. why-did-you-render library (attach to React.Component prototype)
//
// 5. React.Profiler component (programmatic):
//    <Profiler id="ctx-tree" onRender={(id, phase, actualDuration) => {
//      console.log(id, phase, actualDuration)
//    }}>
//      <ConsumerSubtree />
//    </Profiler>`}</Pre>
      </Section>
    </div>
  )
}
