import { useState } from 'react'
import { useMachine, useActorRef } from '@xstate/react'
import { createMachine, assign, fromPromise, fromCallback, sendTo, stopChild } from 'xstate'
import { Section, Row, Btn, Info, Pre, Log, StateChip } from '../shared'

// ─── invoke Promise ───────────────────────────────────────────────────────────
function fakeApiCall(shouldFail: boolean): Promise<{ data: string }> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      shouldFail ? reject(new Error('Network error')) : resolve({ data: 'loaded payload' })
    }, 1000)
  })
}

const fetchMachine = createMachine({
  id: 'fetch',
  initial: 'idle',
  context: { result: null as string | null, error: null as string | null, shouldFail: false },
  states: {
    idle: {
      on: {
        FETCH: { target: 'loading' },
        TOGGLE_FAIL: { actions: assign({ shouldFail: ({ context }) => !context.shouldFail }) },
      },
    },
    loading: {
      invoke: {
        id: 'fetchActor',
        src: fromPromise(({ input }: { input: { shouldFail: boolean } }) => fakeApiCall(input.shouldFail)),
        input: ({ context }) => ({ shouldFail: context.shouldFail }),
        onDone: {
          target: 'success',
          actions: assign({ result: ({ event }) => (event.output as { data: string }).data }),
        },
        onError: {
          target: 'error',
          actions: assign({ error: ({ event }) => (event.error as Error).message }),
        },
      },
    },
    success: { on: { RESET: { target: 'idle', actions: assign({ result: null, error: null }) } } },
    error:   { on: { RESET: { target: 'idle', actions: assign({ result: null, error: null }) } } },
  },
})

function FetchDemo() {
  const [state, send] = useMachine(fetchMachine)
  const { result, error, shouldFail } = state.context

  return (
    <div>
      <Row style={{ marginBottom: 10 }}>
        {['idle', 'loading', 'success', 'error'].map(s => (
          <StateChip key={s} value={s} active={state.matches(s)} />
        ))}
      </Row>
      <Row style={{ marginBottom: 8 }}>
        {state.matches('idle') && (
          <>
            <Btn onClick={() => send({ type: 'FETCH' })}>FETCH</Btn>
            <Btn onClick={() => send({ type: 'TOGGLE_FAIL' })} danger={shouldFail}>
              {shouldFail ? 'Will fail' : 'Will succeed'}
            </Btn>
          </>
        )}
        {state.matches('loading') && <span style={{ color: '#888', fontSize: 13 }}>Loading…</span>}
        {(state.matches('success') || state.matches('error')) && (
          <Btn onClick={() => send({ type: 'RESET' })}>Reset</Btn>
        )}
      </Row>
      {result && <div style={{ color: '#4caf50', fontSize: 13 }}>result: {result}</div>}
      {error  && <div style={{ color: '#ff6b6b', fontSize: 13 }}>error: {error}</div>}
    </div>
  )
}

// ─── invoke Callback (bidirectional) ─────────────────────────────────────────
const timerMachine = createMachine({
  id: 'timer',
  initial: 'stopped',
  context: { elapsed: 0 },
  states: {
    stopped: {
      on: { START: 'running' },
    },
    running: {
      invoke: {
        id: 'ticker',
        src: fromCallback(({ sendBack }) => {
          const id = setInterval(() => sendBack({ type: 'TICK' }), 200)
          return () => clearInterval(id)
        }),
      },
      on: {
        TICK: { actions: assign({ elapsed: ({ context }) => context.elapsed + 200 }) },
        STOP: 'stopped',
        RESET: { actions: assign({ elapsed: 0 }) },
      },
    },
  },
})

function TimerDemo() {
  const [state, send] = useMachine(timerMachine)
  const secs = (state.context.elapsed / 1000).toFixed(1)

  return (
    <div>
      <Row style={{ marginBottom: 10 }}>
        <StateChip value="stopped" active={state.matches('stopped')} />
        <StateChip value="running" active={state.matches('running')} />
        <span style={{ fontSize: 20, color: '#e0e0e0', minWidth: 70 }}>{secs}s</span>
      </Row>
      <Row>
        {state.matches('stopped') && <Btn onClick={() => send({ type: 'START' })}>Start</Btn>}
        {state.matches('running') && (
          <>
            <Btn onClick={() => send({ type: 'STOP' })} danger>Stop</Btn>
            <Btn onClick={() => send({ type: 'RESET' })}>Reset</Btn>
          </>
        )}
      </Row>
      <Info style={{ marginTop: 10 }}>
        <code>fromCallback</code> receives <code>sendBack</code> — a channel to push events
        back into the machine. The returned cleanup function runs when the actor is stopped
        (on state exit). Interval cleared automatically.
      </Info>
    </div>
  )
}

// ─── spawn + parent-child ─────────────────────────────────────────────────────
const childMachine = createMachine({
  id: 'child',
  initial: 'idle',
  context: { pings: 0 },
  states: {
    idle: {
      on: {
        PING: { actions: assign({ pings: ({ context }) => context.pings + 1 }) },
        DONE: 'finished',
      },
    },
    finished: {},
  },
})

const parentMachine = createMachine({
  id: 'parent',
  initial: 'active',
  context: { childRef: null as unknown },
  states: {
    active: {
      entry: assign({
        childRef: ({ spawn }) => spawn(childMachine, { id: 'child1' }),
      }),
      on: {
        PING_CHILD: {
          actions: sendTo('child1', { type: 'PING' }),
        },
        STOP_CHILD: {
          actions: stopChild('child1'),
        },
        DONE_CHILD: {
          actions: sendTo('child1', { type: 'DONE' }),
        },
      },
    },
  },
})

function SpawnDemo() {
  const actorRef = useActorRef(parentMachine)
  const [log, setLog] = useState<string[]>([])

  function doAction(type: string) {
    actorRef.send({ type })
    setLog(l => [...l, `[parent] sent ${type} to child`])
  }

  return (
    <div>
      <Row style={{ marginBottom: 8 }}>
        <Btn onClick={() => doAction('PING_CHILD')}>PING child</Btn>
        <Btn onClick={() => doAction('DONE_CHILD')}>DONE child</Btn>
        <Btn onClick={() => doAction('STOP_CHILD')} danger>STOP child</Btn>
      </Row>
      <Log entries={log} />
      <Info style={{ marginTop: 10 }}>
        Parent spawns child via <code>spawn()</code> in entry action. Parent sends events
        to child via <code>sendTo(id, event)</code>. Child has its own state and context.
        <code>stopChild()</code> terminates the actor and cleans up its subscriptions.
      </Info>
    </div>
  )
}

export default function ActorsExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>05 · Actors</h2>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
        Actors are independent running units. A machine can invoke them (<code>invoke</code>)
        or spawn them (<code>spawn</code>). Invoked actors are tied to state lifetime —
        they start on entry and stop on exit. Spawned actors persist until explicitly stopped.
      </p>

      <Section title="invoke Promise — idle → loading → success/error">
        <Info>
          <code>fromPromise</code> wraps an async function. XState handles the pending state
          automatically. <code>onDone</code> and <code>onError</code> are transitions, not
          callbacks. The actor is discarded when the machine leaves <em>loading</em>.
        </Info>
        <FetchDemo />
        <Pre>{`loading: {
  invoke: {
    src: fromPromise(({ input }) => fakeApiCall(input.shouldFail)),
    input: ({ context }) => ({ shouldFail: context.shouldFail }),
    onDone:  { target: 'success', actions: assign({ result: ({ event }) => event.output.data }) },
    onError: { target: 'error',   actions: assign({ error: ({ event }) => event.error.message }) },
  },
}`}</Pre>
      </Section>

      <Section title="invoke Callback — Bidirectional Channel">
        <Info>
          <code>fromCallback</code> receives <code>sendBack</code> — push events back to parent.
          Return a cleanup function (like <code>useEffect</code>). The interval is cleared
          automatically when leaving <em>running</em>.
        </Info>
        <TimerDemo />
        <Pre>{`fromCallback(({ sendBack }) => {
  const id = setInterval(() => sendBack({ type: 'TICK' }), 200)
  return () => clearInterval(id)
})`}</Pre>
      </Section>

      <Section title="spawn — Parent Sends to Child Actor">
        <Info>
          <code>spawn()</code> creates a persistent child actor. Parent sends events via
          <code>sendTo(id, event)</code>. Child has its own lifecycle — it does not stop
          when parent transitions unless you call <code>stopChild()</code>.
        </Info>
        <SpawnDemo />
      </Section>
    </div>
  )
}
