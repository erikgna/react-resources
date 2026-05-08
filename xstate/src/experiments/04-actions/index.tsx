import { useState } from 'react'
import { useMachine } from '@xstate/react'
import { createMachine, assign, raise } from 'xstate'
import { Section, Row, Btn, Info, Pre, Log, StateChip } from '../shared'

// ─── Entry / Exit / Transition actions ───────────────────────────────────────
// Actions fire in order: exit → transition → entry
// We capture the order externally via a shared log array (side effect)

let orderLog: string[] = []

const orderMachine = createMachine({
  id: 'order',
  initial: 'A',
  states: {
    A: {
      entry: [() => orderLog.push('[A] entry')],
      exit:  [() => orderLog.push('[A] exit')],
      on: {
        NEXT: {
          target: 'B',
          actions: [() => orderLog.push('[A→B] transition action')],
        },
      },
    },
    B: {
      entry: [() => orderLog.push('[B] entry')],
      exit:  [() => orderLog.push('[B] exit')],
      on: {
        NEXT: {
          target: 'A',
          actions: [() => orderLog.push('[B→A] transition action')],
        },
      },
    },
  },
})

function ActionOrder() {
  const [state, send] = useMachine(orderMachine)
  const [log, setLog] = useState<string[]>([])

  function step() {
    orderLog = []
    send({ type: 'NEXT' })
    setLog(l => [...l, `→ ${state.value}: ` + orderLog.join(' | ')])
  }

  return (
    <div>
      <Row style={{ marginBottom: 8 }}>
        <StateChip value="A" active={state.matches('A')} />
        <StateChip value="B" active={state.matches('B')} />
        <Btn onClick={step}>NEXT</Btn>
        <Btn onClick={() => setLog([])} danger>Clear log</Btn>
      </Row>
      <Log entries={log} />
    </div>
  )
}

// ─── assign as action (context update in transition) ──────────────────────────
const stepperMachine = createMachine({
  id: 'stepper',
  initial: 'step1',
  context: { completedAt: null as string | null, data: '' },
  states: {
    step1: {
      on: {
        NEXT: {
          target: 'step2',
          actions: assign({ data: ({ event }) => (event as { type: string; value?: string }).value ?? 'step1-done' }),
        },
      },
    },
    step2: {
      on: {
        NEXT: {
          target: 'done',
          actions: assign({ completedAt: () => new Date().toISOString() }),
        },
        BACK: 'step1',
      },
    },
    done: {},
  },
})

function Stepper() {
  const [state, send] = useMachine(stepperMachine)
  const steps = ['step1', 'step2', 'done']

  return (
    <div>
      <Row style={{ marginBottom: 10 }}>
        {steps.map((s, i) => (
          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <StateChip value={`Step ${i + 1}`} active={state.matches(s)} />
            {i < steps.length - 1 && <span style={{ color: '#333' }}>→</span>}
          </span>
        ))}
      </Row>
      <Row style={{ marginBottom: 8 }}>
        {state.matches('step1') && <Btn onClick={() => send({ type: 'NEXT', value: 'from-step-1' })}>Next</Btn>}
        {state.matches('step2') && (
          <>
            <Btn onClick={() => send({ type: 'BACK' })}>Back</Btn>
            <Btn onClick={() => send({ type: 'NEXT' })}>Complete</Btn>
          </>
        )}
        {state.matches('done') && <span style={{ color: '#4caf50', fontSize: 13 }}>Done!</span>}
      </Row>
      <div style={{ fontSize: 12, color: '#555' }}>
        context: <code>{JSON.stringify(state.context)}</code>
      </div>
    </div>
  )
}

// ─── raise() — send event to self ────────────────────────────────────────────
const autoMachine = createMachine({
  id: 'auto',
  initial: 'idle',
  context: { count: 0 },
  states: {
    idle: {
      on: {
        START: {
          target: 'running',
          actions: raise({ type: 'TICK' }),
        },
      },
    },
    running: {
      entry: assign({ count: ({ context }) => context.count + 1 }),
      on: {
        TICK: [
          { guard: ({ context }) => context.count >= 5, target: 'done' },
          {
            target: 'running',
            actions: raise({ type: 'TICK' }),
          },
        ],
        STOP: 'idle',
      },
    },
    done: {
      on: { RESET: { target: 'idle', actions: assign({ count: 0 }) } },
    },
  },
})

function RaiseDemo() {
  const [state, send] = useMachine(autoMachine)

  return (
    <div>
      <Row style={{ marginBottom: 10 }}>
        <StateChip value="idle" active={state.matches('idle')} />
        <StateChip value="running" active={state.matches('running')} />
        <StateChip value="done" active={state.matches('done')} />
        <span style={{ fontSize: 13, color: '#e0e0e0' }}>count: {state.context.count}</span>
      </Row>
      <Row>
        {state.matches('idle') && <Btn onClick={() => send({ type: 'START' })}>START (auto-tick to 5)</Btn>}
        {state.matches('running') && <Btn onClick={() => send({ type: 'STOP' })} danger>STOP</Btn>}
        {state.matches('done') && <Btn onClick={() => send({ type: 'RESET' })}>RESET</Btn>}
      </Row>
      <Info style={{ marginTop: 10 }}>
        <code>raise()</code> enqueues an event back to self — processed in the same microtask.
        Enables self-looping transitions without async timers.
      </Info>
    </div>
  )
}

export default function ActionsExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>04 · Actions</h2>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
        Actions are side effects attached to transitions, entry, or exit.
        They run synchronously and in a fixed order: <strong>exit → transition → entry</strong>.
        <code>assign()</code> is an action that updates context.
        <code>raise()</code> sends an event back to the machine in the same microtask.
      </p>

      <Section title="Execution Order — exit → transition → entry">
        <Info>
          Click NEXT repeatedly. The log shows the exact order actions fire.
          Entry runs after the state switches; exit runs before it.
        </Info>
        <ActionOrder />
        <Pre>{`states: {
  A: {
    entry: [() => log('[A] entry')],
    exit:  [() => log('[A] exit')],
    on: { NEXT: { target: 'B', actions: [() => log('[A→B] transition')] } },
  },
}`}</Pre>
      </Section>

      <Section title="assign() as Transition Action">
        <Info>
          <code>assign()</code> in transition actions runs after exit but before entry.
          Context is updated before the next state's entry actions see it.
        </Info>
        <Stepper />
      </Section>

      <Section title="raise() — Self-Event Loop">
        <Info>
          <code>raise()</code> queues an event back to the machine immediately.
          Here, START raises TICK which re-enters <em>running</em> until count reaches 5.
          All transitions complete synchronously — no setTimeout needed.
        </Info>
        <RaiseDemo />
        <Pre>{`running: {
  entry: assign({ count: ({ context }) => context.count + 1 }),
  on: {
    TICK: [
      { guard: ({ context }) => context.count >= 5, target: 'done' },
      { target: 'running', actions: raise({ type: 'TICK' }) },
    ],
  },
}`}</Pre>
      </Section>
    </div>
  )
}
