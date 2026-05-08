import { useState } from 'react'
import { useMachine } from '@xstate/react'
import { createMachine, assign, fromPromise } from 'xstate'
import { Section, Row, Btn, Info, Pre, Log, StateChip } from '../shared'

// ─── Silent discard — event with no transition ────────────────────────────────
const silentMachine = createMachine({
  id: 'silent',
  initial: 'idle',
  states: {
    idle: {
      on: { KNOWN: 'done' },
      // UNKNOWN event is not listed — machine silently discards it
    },
    done: {},
  },
})

function SilentDiscard() {
  const [state, send] = useMachine(silentMachine)
  const [log, setLog] = useState<string[]>([])

  function sendEvent(type: string) {
    const canDo = state.can({ type })
    setLog(l => [...l, `[${type}] can: ${canDo} → state before: ${state.value}`])
    send({ type })
  }

  return (
    <div>
      <Row style={{ marginBottom: 8 }}>
        <StateChip value="idle" active={state.matches('idle')} />
        <StateChip value="done" active={state.matches('done')} />
      </Row>
      <Row style={{ marginBottom: 8 }}>
        <Btn onClick={() => sendEvent('KNOWN')}>KNOWN event</Btn>
        <Btn onClick={() => sendEvent('UNKNOWN')} danger>UNKNOWN event (silent)</Btn>
        <Btn onClick={() => sendEvent('ALSO_MISSING')} danger>ALSO_MISSING (silent)</Btn>
        <Btn onClick={() => setLog([])} danger>Clear</Btn>
      </Row>
      <Log entries={log} />
      <Info style={{ marginTop: 8 }}>
        No error, no warning. The event is dropped. This is by design — machines
        reject invalid transitions gracefully. The danger: a typo in an event type
        will fail silently. Always check <code>state.can()</code> before relying
        on an event having an effect.
      </Info>
    </div>
  )
}

// ─── Context mutation outside assign — corruption ─────────────────────────────
const mutMachine = createMachine({
  id: 'mut',
  initial: 'idle',
  context: { items: [] as string[], count: 0 },
  states: {
    idle: {
      on: {
        ADD_CORRECT: {
          actions: assign({
            items: ({ context }) => [...context.items, `item-${context.count + 1}`],
            count: ({ context }) => context.count + 1,
          }),
        },
        ADD_WRONG: {
          // Direct push — bypasses XState's immutability model
          actions: [({ context }) => {
            try {
              context.items.push('MUTATED-DIRECTLY')
            } catch (e: unknown) {
              console.error('Mutation caught:', e)
            }
          }],
        },
      },
    },
  },
})

function MutationFailure() {
  const [state, send] = useMachine(mutMachine)
  const [log, setLog] = useState<string[]>([])

  function addCorrect() {
    const before = JSON.stringify(state.context.items)
    send({ type: 'ADD_CORRECT' })
    setLog(l => [...l, `[assign] before: ${before} → triggers re-render`])
  }

  function addWrong() {
    const before = state.context.items.length
    send({ type: 'ADD_WRONG' })
    // State reference is same — React may or may not re-render
    setLog(l => [...l, `[direct push] items.length was ${before}, now ${state.context.items.length} — React did not re-render`])
  }

  return (
    <div>
      <Row style={{ marginBottom: 8 }}>
        <Btn onClick={addCorrect}>ADD (assign)</Btn>
        <Btn onClick={addWrong} danger>ADD (direct push)</Btn>
        <span style={{ fontSize: 12, color: '#888' }}>
          items: [{state.context.items.join(', ')}]
        </span>
      </Row>
      <Log entries={log} />
      <Info style={{ marginTop: 8 }}>
        XState v5 attempts to freeze context in dev mode.
        Direct array mutation either throws or silently diverges from React state.
        The UI will not re-render because no new context reference was produced.
      </Info>
    </div>
  )
}

// ─── Forgotten actor cleanup — memory leak ────────────────────────────────────
const leakyMachine = createMachine({
  id: 'leaky',
  initial: 'idle',
  states: {
    idle: {
      on: { INVOKE: 'invoking' },
    },
    invoking: {
      invoke: {
        src: fromPromise(() => new Promise<void>(resolve => setTimeout(resolve, 3000))),
        onDone: 'done',
      },
      on: {
        BAIL: 'idle',  // Transition out — invoke is cleaned up automatically by XState
      },
    },
    done: { on: { RESET: 'idle' } },
  },
})

function ActorCleanup() {
  const [state, send] = useMachine(leakyMachine)
  const [log, setLog] = useState<string[]>([])

  function bail() {
    setLog(l => [...l, '[BAIL] Leaving invoking state — XState stops the promise actor automatically'])
    send({ type: 'BAIL' })
  }

  return (
    <div>
      <Row style={{ marginBottom: 8 }}>
        <StateChip value="idle"     active={state.matches('idle')} />
        <StateChip value="invoking" active={state.matches('invoking')} />
        <StateChip value="done"     active={state.matches('done')} />
      </Row>
      <Row style={{ marginBottom: 8 }}>
        {state.matches('idle')     && <Btn onClick={() => send({ type: 'INVOKE' })}>Invoke (3s)</Btn>}
        {state.matches('invoking') && <Btn onClick={bail} danger>Bail early</Btn>}
        {state.matches('done')     && <Btn onClick={() => send({ type: 'RESET' })}>Reset</Btn>}
      </Row>
      <Log entries={log} />
      <Info style={{ marginTop: 8 }}>
        XState v5 invoked actors are automatically stopped when the machine leaves
        their hosting state. The real leak risk is with <code>spawn()</code> — spawned actors
        persist until explicitly <code>stopChild()</code>-ed or the parent machine stops.
      </Info>
    </div>
  )
}

// ─── Infinite raise loop ──────────────────────────────────────────────────────
// This is a known footgun: raise() in an entry action with no exit condition
// will lock up the browser. We demonstrate detection, not the crash.
function InfiniteRaiseWarning() {
  const [log, setLog] = useState<string[]>([])

  function showPattern() {
    setLog([
      'DANGER: entry action that raises the same event without a guard causes infinite loop.',
      'XState does NOT detect or break cycles at createMachine time.',
      'The browser will hang until the call stack overflows.',
      '',
      'Pattern to avoid:',
      '  running: {',
      '    entry: raise({ type: "TICK" }),',
      '    on: { TICK: { target: "running" } },  // infinite loop',
      '  }',
      '',
      'Fix: add a guard that eventually returns false, or use a callback actor instead.',
    ])
  }

  return (
    <div>
      <Btn onClick={showPattern}>Show dangerous pattern</Btn>
      <Log entries={log} />
    </div>
  )
}

export default function FailuresExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>08 · Failures</h2>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
        Most XState failures are silent. The machine stays consistent internally,
        but the expected transition never fires. Pattern: always probe with
        <code>state.can(event)</code> before sending if correctness matters.
      </p>

      <Section title="Silent Discard — Unknown Event Type">
        <Info>
          Events not listed in the current state's <code>on</code> are silently dropped.
          A typo (<code>SUBMT</code> vs <code>SUBMIT</code>) will fail with no feedback.
        </Info>
        <SilentDiscard />
        <Pre>{`// Failure table:
// UNKNOWN → not in 'on' → discarded (silent)
// KNOWN   → in 'on'     → transition fires
// Probe:  state.can({ type }) → false means it will be discarded`}</Pre>
      </Section>

      <Section title="Context Mutation Outside assign()">
        <Info>
          Directly mutating context (e.g. <code>context.items.push()</code>) bypasses XState's
          immutability model. In v5 dev mode, context is frozen — mutation throws.
          In production, the array is mutated but React does not re-render.
        </Info>
        <MutationFailure />
      </Section>

      <Section title="Invoked Actor Cleanup">
        <Info>
          <code>invoke</code> actors are stopped automatically on state exit.
          <code>spawn</code> actors are not — they must be stopped manually.
          The risk: spawned actors holding timers, subscriptions, or open connections
          if the parent machine stops before calling <code>stopChild()</code>.
        </Info>
        <ActorCleanup />
      </Section>

      <Section title="Infinite raise() Loop">
        <Info>
          <code>raise()</code> in an entry action that retargets the same state without
          a terminating guard creates an infinite synchronous loop. XState v5 does not
          detect or break cycles — the browser hangs. Shown here as a pattern description
          only; triggering it is not safe in this POC.
        </Info>
        <InfiniteRaiseWarning />
      </Section>
    </div>
  )
}
