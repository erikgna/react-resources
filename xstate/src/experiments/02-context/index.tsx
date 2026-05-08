import { useState } from 'react'
import { useMachine } from '@xstate/react'
import { createMachine, assign } from 'xstate'
import { Section, Row, Btn, Info, Pre, Log } from '../shared'

// ─── Counter with context ─────────────────────────────────────────────────────
const counterMachine = createMachine({
  id: 'counter',
  initial: 'active',
  context: { count: 0, min: -5, max: 10 },
  states: {
    active: {
      on: {
        INC: {
          guard: ({ context }) => context.count < context.max,
          actions: assign({ count: ({ context }) => context.count + 1 }),
        },
        DEC: {
          guard: ({ context }) => context.count > context.min,
          actions: assign({ count: ({ context }) => context.count - 1 }),
        },
        RESET: {
          actions: assign({ count: 0 }),
        },
        SET_BOUNDS: {
          actions: assign({
            min: ({ event }) => (event as { type: string; min: number }).min,
            max: ({ event }) => (event as { type: string; max: number }).max,
          }),
        },
      },
    },
  },
})

function Counter() {
  const [state, send] = useMachine(counterMachine)
  const { count, min, max } = state.context
  const pct = ((count - min) / (max - min)) * 100

  return (
    <div>
      <Row style={{ marginBottom: 12 }}>
        <Btn onClick={() => send({ type: 'DEC' })} danger>−</Btn>
        <div style={{
          width: 200, height: 8, background: '#111', borderRadius: 4, border: '1px solid #222',
        }}>
          <div style={{
            width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%',
            background: '#4a9eff', borderRadius: 4, transition: 'width 0.15s',
          }} />
        </div>
        <Btn onClick={() => send({ type: 'INC' })}>+</Btn>
        <span style={{ fontSize: 16, color: '#e0e0e0', minWidth: 40, textAlign: 'center' }}>{count}</span>
        <Btn onClick={() => send({ type: 'RESET' })}>Reset</Btn>
      </Row>
      <div style={{ fontSize: 12, color: '#555' }}>
        bounds [{min}, {max}] &nbsp;·&nbsp;
        can(INC): <span style={{ color: state.can({ type: 'INC' }) ? '#4caf50' : '#555' }}>
          {String(state.can({ type: 'INC' }))}
        </span> &nbsp;·&nbsp;
        can(DEC): <span style={{ color: state.can({ type: 'DEC' }) ? '#4caf50' : '#555' }}>
          {String(state.can({ type: 'DEC' }))}
        </span>
      </div>
    </div>
  )
}

// ─── assign() object form vs function form ────────────────────────────────────
const formMachine = createMachine({
  id: 'form',
  initial: 'editing',
  context: { name: '', email: '', dirty: false },
  states: {
    editing: {
      on: {
        SET_NAME: {
          // Function form — reads both context and event
          actions: assign({
            name: ({ event }) => (event as { type: string; value: string }).value,
            dirty: true,
          }),
        },
        SET_EMAIL: {
          actions: assign({
            email: ({ event }) => (event as { type: string; value: string }).value,
            dirty: true,
          }),
        },
        RESET: {
          // Object form with literal values
          actions: assign({ name: '', email: '', dirty: false }),
        },
      },
    },
  },
})

function FormDemo() {
  const [state, send] = useMachine(formMachine)
  const { name, email, dirty } = state.context
  return (
    <div>
      <Row style={{ marginBottom: 8 }}>
        <input
          style={{ background: '#111', border: '1px solid #2a2a2a', color: '#e0e0e0', padding: '5px 9px', borderRadius: 3, fontSize: 13 }}
          placeholder="name"
          value={name}
          onChange={e => send({ type: 'SET_NAME', value: e.target.value })}
        />
        <input
          style={{ background: '#111', border: '1px solid #2a2a2a', color: '#e0e0e0', padding: '5px 9px', borderRadius: 3, fontSize: 13 }}
          placeholder="email"
          value={email}
          onChange={e => send({ type: 'SET_EMAIL', value: e.target.value })}
        />
        <Btn onClick={() => send({ type: 'RESET' })} danger>Reset</Btn>
      </Row>
      <div style={{ fontSize: 12, color: '#555' }}>
        context: <code>{JSON.stringify(state.context)}</code> &nbsp; dirty: {String(dirty)}
      </div>
    </div>
  )
}

// ─── Direct mutation footgun ──────────────────────────────────────────────────
const simpleMachine = createMachine({
  id: 'simple',
  initial: 'idle',
  context: { value: 0 },
  states: {
    idle: {
      on: {
        INC: { actions: assign({ value: ({ context }) => context.value + 1 }) },
      },
    },
  },
})

function MutationDemo() {
  const [state, send] = useMachine(simpleMachine)
  const [log, setLog] = useState<string[]>([])

  function mutateDirectly() {
    // XState context is frozen in v5 — this throws in dev
    try {
      (state.context as { value: number }).value = 999
      setLog(l => [...l, `[direct mutation] No error thrown — value now: ${state.context.value} (React won't re-render)`])
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setLog(l => [...l, `[direct mutation] Error: ${msg}`])
    }
  }

  return (
    <div>
      <Row style={{ marginBottom: 8 }}>
        <Btn onClick={() => send({ type: 'INC' })}>assign INC</Btn>
        <Btn onClick={mutateDirectly} danger>mutate directly</Btn>
        <span style={{ fontSize: 13, color: '#e0e0e0' }}>value: {state.context.value}</span>
      </Row>
      <Log entries={log} />
    </div>
  )
}

export default function ContextExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>02 · Context</h2>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
        Context is extended state — data that lives alongside the state value.
        It is updated exclusively via <code>assign()</code> actions, never by mutation.
        Guards can read context to gate transitions.
      </p>

      <Section title="Counter with Bounded Context">
        <Info>
          Context holds <code>{'{ count, min, max }'}</code>. Guards read context to block
          transitions at the bounds. <code>state.can()</code> reflects guard results live.
        </Info>
        <Counter />
        <Pre>{`const counterMachine = createMachine({
  context: { count: 0, min: -5, max: 10 },
  states: {
    active: {
      on: {
        INC: {
          guard: ({ context }) => context.count < context.max,
          actions: assign({ count: ({ context }) => context.count + 1 }),
        },
      },
    },
  },
})`}</Pre>
      </Section>

      <Section title="assign() — Object Form vs Function Form">
        <Info>
          Object form: <code>{'assign({ field: value })'}</code> — literal or derived per-key.
          Function form: <code>{'assign(({ context, event }) => ({...}))'}</code> — full snapshot.
          Both produce immutable context updates; XState merges the patch.
        </Info>
        <FormDemo />
      </Section>

      <Section title="Direct Mutation — What Happens">
        <Info>
          XState v5 freezes context in development. Direct mutation either throws or silently
          diverges from React's render cycle. Always use <code>assign()</code>.
        </Info>
        <MutationDemo />
      </Section>
    </div>
  )
}
