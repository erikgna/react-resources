import { useState } from 'react'
import { useMachine } from '@xstate/react'
import { createMachine, assign, createActor } from 'xstate'
import type { SnapshotFrom } from 'xstate'
import { interpret } from '../../core/xstate'
import { Section, Row, Btn, Info, Pre } from '../shared'

// ─── Transition throughput ────────────────────────────────────────────────────
// Measures how many transitions/sec a flat machine handles
const pingMachine = createMachine({
  id: 'ping',
  initial: 'a',
  context: { count: 0 },
  states: {
    a: { on: { TOGGLE: { target: 'b', actions: assign({ count: ({ context }) => context.count + 1 }) } } },
    b: { on: { TOGGLE: { target: 'a', actions: assign({ count: ({ context }) => context.count + 1 }) } } },
  },
})

function ThroughputBench() {
  const [result, setResult] = useState<string | null>(null)
  const [running, setRunning] = useState(false)

  function run(n: number) {
    setRunning(true)
    setResult(null)
    setTimeout(() => {
      const actor = createActor(pingMachine).start()
      const t0 = performance.now()
      for (let i = 0; i < n; i++) actor.send({ type: 'TOGGLE' })
      const t1 = performance.now()
      actor.stop()
      const ms = (t1 - t0).toFixed(2)
      const rate = Math.round(n / ((t1 - t0) / 1000)).toLocaleString()
      setResult(`${n.toLocaleString()} transitions in ${ms}ms → ${rate} transitions/sec`)
      setRunning(false)
    }, 10)
  }

  return (
    <div>
      <Row style={{ marginBottom: 10 }}>
        {[1_000, 10_000, 100_000].map(n => (
          <Btn key={n} onClick={() => run(n)} danger={running}>
            {running ? '…' : `${n.toLocaleString()} sends`}
          </Btn>
        ))}
      </Row>
      {result && (
        <div style={{ fontSize: 13, color: '#4caf50', fontFamily: 'monospace' }}>{result}</div>
      )}
      <Info style={{ marginTop: 8 }}>
        XState v5 uses an internal event queue per actor. Sends from outside React are
        synchronous within the actor but React re-renders are batched separately.
      </Info>
    </div>
  )
}

// ─── Core vs XState throughput ────────────────────────────────────────────────
const coreMachineConfig = {
  id: 'core-ping',
  initial: 'a' as const,
  context: { count: 0 },
  states: {
    a: { on: { TOGGLE: [{ target: 'b' as const }] } },
    b: { on: { TOGGLE: [{ target: 'a' as const }] } },
  },
}

function CoreVsXState() {
  const [result, setResult] = useState<string | null>(null)

  function compare(n: number) {
    // Core
    const coreService = interpret(coreMachineConfig).start()
    const t0 = performance.now()
    for (let i = 0; i < n; i++) coreService.send({ type: 'TOGGLE' })
    const t1 = performance.now()

    // XState
    const actor = createActor(pingMachine).start()
    const t2 = performance.now()
    for (let i = 0; i < n; i++) actor.send({ type: 'TOGGLE' })
    const t3 = performance.now()
    actor.stop()

    setResult(
      `n=${n.toLocaleString()} | Core: ${(t1-t0).toFixed(1)}ms | XState: ${(t3-t2).toFixed(1)}ms`
    )
  }

  return (
    <div>
      <Row style={{ marginBottom: 10 }}>
        {[10_000, 50_000].map(n => (
          <Btn key={n} onClick={() => compare(n)}>{n.toLocaleString()} sends</Btn>
        ))}
      </Row>
      {result && (
        <div style={{ fontSize: 13, color: '#4caf50', fontFamily: 'monospace' }}>{result}</div>
      )}
      <Info style={{ marginTop: 8 }}>
        Core reimplementation (~200 lines) vs the full XState v5 library. XState is slower
        due to features: inspector notifications, action processing, system registration.
      </Info>
    </div>
  )
}

// ─── Selector isolation — only re-render when relevant slice changes ───────────
const multiMachine = createMachine({
  id: 'multi',
  initial: 'idle',
  context: { a: 0, b: 0, c: 0 },
  states: {
    idle: {
      on: {
        INC_A: { actions: assign({ a: ({ context }) => context.a + 1 }) },
        INC_B: { actions: assign({ b: ({ context }) => context.b + 1 }) },
        INC_C: { actions: assign({ c: ({ context }) => context.c + 1 }) },
      },
    },
  },
})

let renderCountA = 0, renderCountB = 0

type MultiSnap = SnapshotFrom<typeof multiMachine>
type MultiSend = (event: { type: string }) => void

function SliceA({ state, send }: { state: MultiSnap; send: MultiSend }) {
  renderCountA++
  return (
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: 3, padding: '8px 12px' }}>
      <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>A — renders: {renderCountA}</div>
      <div style={{ fontSize: 14, color: '#e0e0e0', marginBottom: 6 }}>{state.context.a}</div>
      <Btn onClick={() => send({ type: 'INC_A' })}>INC A</Btn>
    </div>
  )
}

function SliceB({ state, send }: { state: MultiSnap; send: MultiSend }) {
  renderCountB++
  return (
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: 3, padding: '8px 12px' }}>
      <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>B — renders: {renderCountB}</div>
      <div style={{ fontSize: 14, color: '#e0e0e0', marginBottom: 6 }}>{state.context.b}</div>
      <Btn onClick={() => send({ type: 'INC_B' })}>INC B</Btn>
    </div>
  )
}

function RenderIsolation() {
  const [state, send] = useMachine(multiMachine)
  const typedSend: MultiSend = (e) => send(e as Parameters<typeof send>[0])
  return (
    <div>
      <Row style={{ marginBottom: 8 }}>
        <SliceA state={state} send={typedSend} />
        <SliceB state={state} send={typedSend} />
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 3, padding: '8px 12px' }}>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>C (display only)</div>
          <div style={{ fontSize: 14, color: '#e0e0e0', marginBottom: 6 }}>{state.context.c}</div>
          <Btn onClick={() => send({ type: 'INC_C' })}>INC C</Btn>
        </div>
      </Row>
      <Info>
        All three slices share the same <code>useMachine</code> subscription. Every context
        update causes all three components to re-render — unlike Zustand selectors.
        To isolate re-renders, use <code>useSelector(actorRef, selector)</code> from
        <code>@xstate/react</code> with an equality function.
      </Info>
    </div>
  )
}

export default function PerformanceExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>07 · Performance</h2>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
        XState v5 runs on an internal actor system. Each transition is synchronous within
        the actor. React integration via <code>useMachine</code> batches re-renders with React 18.
        The cost model differs from Zustand/MobX: XState prioritizes correctness guarantees
        over raw throughput.
      </p>

      <Section title="Transition Throughput">
        <Info>
          Raw transitions/sec for a minimal 2-state machine.
          XState v5 overhead per transition: inspector dispatch, action processing, system bookkeeping.
        </Info>
        <ThroughputBench />
      </Section>

      <Section title="Core Reimplementation vs XState">
        <Info>
          Compare the ~200-line flat interpreter against the full library on the same workload.
          Difference reflects feature overhead, not algorithmic inefficiency.
        </Info>
        <CoreVsXState />
        <Pre>{`// Same machine, two runtimes:
core: interpret(coreMachineConfig).start()
xstate: createActor(pingMachine).start()`}</Pre>
      </Section>

      <Section title="Re-render Isolation — useMachine vs useSelector">
        <Info>
          <code>useMachine</code> re-renders on every state/context change, regardless of which
          slice changed. For large context objects, split actors or use <code>useSelector</code>.
        </Info>
        <RenderIsolation />
        <Pre>{`// Fine-grained subscription:
import { useSelector } from '@xstate/react'
const a = useSelector(actorRef, s => s.context.a)
// Only re-renders when context.a changes`}</Pre>
      </Section>
    </div>
  )
}
