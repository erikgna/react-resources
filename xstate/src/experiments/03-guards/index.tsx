import { useState } from 'react'
import { useMachine } from '@xstate/react'
import { createMachine, assign } from 'xstate'
import { Section, Row, Btn, Info, Pre, Log, StateChip } from '../shared'

// ─── Basic guard ──────────────────────────────────────────────────────────────
const vaultMachine = createMachine({
  id: 'vault',
  initial: 'locked',
  context: { attempts: 0, pin: 1234 },
  states: {
    locked: {
      on: {
        UNLOCK: [
          {
            guard: ({ context, event }) =>
              (event as { type: string; code: number }).code === context.pin,
            target: 'unlocked',
            actions: assign({ attempts: 0 }),
          },
          {
            // No guard — fallback transition, always fires when first fails
            target: 'locked',
            actions: assign({ attempts: ({ context }) => context.attempts + 1 }),
          },
        ],
      },
    },
    unlocked: {
      on: { LOCK: 'locked' },
    },
  },
})

function Vault() {
  const [state, send] = useMachine(vaultMachine)
  const [input, setInput] = useState('')
  const [log, setLog] = useState<string[]>([])

  function tryUnlock() {
    const code = parseInt(input, 10)
    setLog(l => [...l, `[UNLOCK] code=${code} pin=${state.context.pin} → ${code === state.context.pin ? 'match' : 'fail'}`])
    send({ type: 'UNLOCK', code })
    setInput('')
  }

  return (
    <div>
      <Row style={{ marginBottom: 10 }}>
        <StateChip value="locked" active={state.matches('locked')} />
        <StateChip value="unlocked" active={state.matches('unlocked')} />
        <span style={{ fontSize: 12, color: '#555' }}>attempts: {state.context.attempts}</span>
      </Row>
      {state.matches('locked') ? (
        <Row style={{ marginBottom: 8 }}>
          <input
            style={{ background: '#111', border: '1px solid #2a2a2a', color: '#e0e0e0', padding: '5px 9px', borderRadius: 3, fontSize: 13, width: 100 }}
            placeholder="PIN"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && tryUnlock()}
          />
          <Btn onClick={tryUnlock}>Unlock</Btn>
        </Row>
      ) : (
        <Btn onClick={() => send({ type: 'LOCK' })} danger>Lock</Btn>
      )}
      <Log entries={log} />
    </div>
  )
}

// ─── Multiple guards, first match wins ───────────────────────────────────────
const pricingMachine = createMachine({
  id: 'pricing',
  initial: 'evaluating',
  context: { score: 0 },
  states: {
    evaluating: {
      on: {
        EVALUATE: [
          { guard: ({ context }) => context.score >= 90, target: 'premium' },
          { guard: ({ context }) => context.score >= 60, target: 'standard' },
          { guard: ({ context }) => context.score >= 30, target: 'basic' },
          { target: 'rejected' },
        ],
        SET_SCORE: {
          actions: assign({ score: ({ event }) => (event as { type: string; score: number }).score }),
        },
        RESET: { target: 'evaluating', actions: assign({ score: 0 }) },
      },
    },
    premium:  { on: { RESET: { target: 'evaluating', actions: assign({ score: 0 }) } } },
    standard: { on: { RESET: { target: 'evaluating', actions: assign({ score: 0 }) } } },
    basic:    { on: { RESET: { target: 'evaluating', actions: assign({ score: 0 }) } } },
    rejected: { on: { RESET: { target: 'evaluating', actions: assign({ score: 0 }) } } },
  },
})

function PricingTier() {
  const [state, send] = useMachine(pricingMachine)
  const tiers = ['evaluating', 'premium', 'standard', 'basic', 'rejected']
  const colors: Record<string, string> = {
    premium: '#f0c040', standard: '#4a9eff', basic: '#7ec8a0', rejected: '#ff6b6b', evaluating: '#555',
  }

  return (
    <div>
      <Row style={{ marginBottom: 10 }}>
        {tiers.map(t => <StateChip key={t} value={t} active={state.matches(t)} />)}
      </Row>
      <Row style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: '#888' }}>score: {state.context.score}</span>
        {[0, 20, 40, 65, 95].map(s => (
          <Btn key={s} onClick={() => send({ type: 'SET_SCORE', score: s })}>{s}</Btn>
        ))}
      </Row>
      <Row>
        <Btn onClick={() => send({ type: 'EVALUATE' })}>EVALUATE</Btn>
        <Btn onClick={() => send({ type: 'RESET' })} danger>Reset</Btn>
        {!state.matches('evaluating') && (
          <span style={{ color: colors[state.value as string], fontSize: 13, fontWeight: 600 }}>
            → {state.value as string}
          </span>
        )}
      </Row>
    </div>
  )
}

// ─── Guard that always fails — silent discard ─────────────────────────────────
const strictMachine = createMachine({
  id: 'strict',
  initial: 'idle',
  context: { level: 0 },
  states: {
    idle: {
      on: {
        ADVANCE: {
          // Guard never passes
          guard: () => false,
          target: 'done',
        },
      },
    },
    done: {},
  },
})

function SilentDiscard() {
  const [state, send] = useMachine(strictMachine)
  const [clickCount, setClickCount] = useState(0)

  return (
    <div>
      <Row style={{ marginBottom: 8 }}>
        <StateChip value="idle" active={state.matches('idle')} />
        <StateChip value="done" active={state.matches('done')} />
        <Btn onClick={() => { setClickCount(c => c + 1); send({ type: 'ADVANCE' }) }}>
          ADVANCE (guard: always false)
        </Btn>
        <span style={{ fontSize: 12, color: '#555' }}>clicks: {clickCount}, state: {state.value as string}</span>
      </Row>
      <Info>
        No error, no warning. The event is silently discarded.
        This is the correct behavior — machines reject invalid transitions without throwing.
        But it means bugs where a guard is wrong go unnoticed at runtime.
        Use <code>state.can()</code> to detect this before sending.
      </Info>
    </div>
  )
}

export default function GuardsExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>03 · Guards</h2>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
        Guards are predicates on <code>{'({ context, event })'}</code> that gate transitions.
        When multiple transitions share an event type, the first passing guard wins.
        A failed guard silently discards the event — no throw, no log.
      </p>

      <Section title="Vault — Guard on Context + Event">
        <Info>
          PIN must match. Two transitions on UNLOCK: first has a guard, second is the fallback
          (no guard = always matches). XState evaluates top-to-bottom, first match wins.
          Hint: PIN is 1234.
        </Info>
        <Vault />
        <Pre>{`UNLOCK: [
  { guard: ({ context, event }) => event.code === context.pin, target: 'unlocked' },
  { target: 'locked', actions: assign({ attempts: ({ context }) => context.attempts + 1 }) },
]`}</Pre>
      </Section>

      <Section title="Pricing Tier — First Match Wins">
        <Info>
          Four guards evaluated in order. Set a score then click EVALUATE.
          The machine lands in the first tier whose guard passes.
        </Info>
        <PricingTier />
        <Pre>{`EVALUATE: [
  { guard: ({ context }) => context.score >= 90, target: 'premium' },
  { guard: ({ context }) => context.score >= 60, target: 'standard' },
  { guard: ({ context }) => context.score >= 30, target: 'basic' },
  { target: 'rejected' },   // fallback: no guard
]`}</Pre>
      </Section>

      <Section title="Guard Always False — Silent Discard">
        <Info>
          When a guard never passes, sending the event does nothing. No error thrown.
          Check with <code>state.can()</code> proactively to surface this in the UI.
        </Info>
        <SilentDiscard />
      </Section>
    </div>
  )
}
