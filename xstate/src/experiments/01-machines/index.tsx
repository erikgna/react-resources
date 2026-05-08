import { useRef, useState, useEffect } from 'react'
import { useMachine } from '@xstate/react'
import { createMachine } from 'xstate'
import { createMachine as coreMachine, interpret } from '../../core/xstate'
import { Section, Row, Btn, Info, Pre, StateChip } from '../shared'

// ─── Traffic Light — real XState ─────────────────────────────────────────────
const trafficMachine = createMachine({
  id: 'traffic',
  initial: 'red',
  states: {
    red:    { on: { NEXT: 'green' } },
    green:  { on: { NEXT: 'yellow' } },
    yellow: { on: { NEXT: 'red' } },
  },
})

function TrafficLight() {
  const [state, send] = useMachine(trafficMachine)
  const colors: Record<string, string> = { red: '#ff6b6b', green: '#4caf50', yellow: '#f0c040' }
  return (
    <Row>
      <div style={{
        width: 60, height: 60, borderRadius: '50%',
        background: colors[state.value as string],
        border: '2px solid #333', transition: 'background 0.2s',
      }} />
      <div>
        <div style={{ fontSize: 13, color: '#e0e0e0', marginBottom: 4 }}>
          state: <code>{state.value as string}</code>
        </div>
        <div style={{ fontSize: 12, color: '#666' }}>
          can(NEXT): {String(state.can({ type: 'NEXT' }))}
        </div>
      </div>
      <Btn onClick={() => send({ type: 'NEXT' })}>NEXT</Btn>
    </Row>
  )
}

// ─── Toggle — real XState ─────────────────────────────────────────────────────
const toggleMachine = createMachine({
  id: 'toggle',
  initial: 'inactive',
  states: {
    inactive: { on: { TOGGLE: 'active' } },
    active:   { on: { TOGGLE: 'inactive' } },
  },
})

function Toggle() {
  const [state, send] = useMachine(toggleMachine)
  return (
    <Row>
      <Btn onClick={() => send({ type: 'TOGGLE' })}>
        {state.matches('active') ? 'ON' : 'OFF'}
      </Btn>
      <span style={{ fontSize: 12, color: '#666' }}>
        state.value = <code>{state.value as string}</code> &nbsp;
        matches('active') = {String(state.matches('active'))}
      </span>
    </Row>
  )
}

// ─── Core reimplementation comparison ────────────────────────────────────────
const coreTraffic = coreMachine<Record<string, never>, { type: string }>({
  id: 'core-traffic',
  initial: 'red',
  context: {},
  states: {
    red:    { on: { NEXT: [{ target: 'green' }] } },
    green:  { on: { NEXT: [{ target: 'yellow' }] } },
    yellow: { on: { NEXT: [{ target: 'red' }] } },
  },
})

function CoreTraffic() {
  const serviceRef = useRef(interpret(coreTraffic).start())
  const [snap, setSnap] = useState(serviceRef.current.getSnapshot())
  useEffect(() => {
    serviceRef.current.subscribe(setSnap)
  }, [])

  const colors: Record<string, string> = { red: '#ff6b6b', green: '#4caf50', yellow: '#f0c040' }
  return (
    <Row>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: colors[snap.value],
        border: '2px solid #333',
      }} />
      <span style={{ fontSize: 12, color: '#888' }}>
        core state: <code>{snap.value}</code>
      </span>
      <Btn onClick={() => serviceRef.current.send({ type: 'NEXT' })}>NEXT</Btn>
    </Row>
  )
}

// ─── state.can() probe ────────────────────────────────────────────────────────
const doorMachine = createMachine({
  id: 'door',
  initial: 'closed',
  states: {
    closed: { on: { OPEN: 'open', LOCK: 'locked' } },
    open:   { on: { CLOSE: 'closed' } },
    locked: { on: { UNLOCK: 'closed' } },
  },
})

function DoorProbe() {
  const [state, send] = useMachine(doorMachine)
  const events = ['OPEN', 'CLOSE', 'LOCK', 'UNLOCK']
  return (
    <div>
      <Row style={{ marginBottom: 10 }}>
        {['closed', 'open', 'locked'].map(s => (
          <StateChip key={s} value={s} active={state.matches(s)} />
        ))}
      </Row>
      <Row style={{ marginBottom: 10 }}>
        {events.map(ev => (
          <Btn key={ev} onClick={() => send({ type: ev })}>{ev}</Btn>
        ))}
      </Row>
      <div style={{ fontSize: 12, color: '#666' }}>
        {events.map(ev => (
          <span key={ev} style={{ marginRight: 14 }}>
            can({ev}): <span style={{ color: state.can({ type: ev }) ? '#4caf50' : '#444' }}>
              {String(state.can({ type: ev }))}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

export default function MachinesExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>01 · Machines</h2>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
        <code>createMachine</code> defines states and transitions declaratively.
        <code>useMachine</code> hooks it into React. The interpreter owns the event loop —
        it is not a reducer; it is a running process.
      </p>

      <Section title="Traffic Light — useMachine">
        <Info>createMachine + useMachine. Three cyclic states. One event type.</Info>
        <TrafficLight />
        <Pre>{`const trafficMachine = createMachine({
  initial: 'red',
  states: {
    red:    { on: { NEXT: 'green' } },
    green:  { on: { NEXT: 'yellow' } },
    yellow: { on: { NEXT: 'red' } },
  },
})`}</Pre>
      </Section>

      <Section title="Toggle — state.matches() and state.value">
        <Info>
          <code>state.value</code> is a string (or nested object for compound states).
          <code>state.matches()</code> is the safe predicate — prefer it over string equality.
        </Info>
        <Toggle />
      </Section>

      <Section title="Core Reimplementation">
        <Info>
          Same traffic light driven by <code>src/core/xstate.ts</code> — ~200 line flat interpreter.
          No guards, no hierarchy. Just: send → find transition → exit → entry → notify.
        </Info>
        <CoreTraffic />
        <Pre>{`// core/xstate.ts: interpret() event loop
function send(event) {
  const trans = stateDef.on[event.type]
  if (!trans) return              // silent discard — no error
  runActions(stateDef.exit, ...)
  runActions(match.actions, ...)
  currentState = match.target
  runActions(nextDef.entry, ...)
  notify()
}`}</Pre>
      </Section>

      <Section title="state.can() — Probe Available Transitions">
        <Info>
          <code>state.can(event)</code> returns true only if the current state has a matching
          transition (and any guard passes). Use it to disable buttons or derive UI state.
        </Info>
        <DoorProbe />
      </Section>
    </div>
  )
}
