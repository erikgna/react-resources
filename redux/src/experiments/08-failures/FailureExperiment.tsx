import { useRef, useState } from 'react'
import { createRawStore } from '../../core/rawStore'
import type { Reducer } from '../../core/rawStore'
import { Btn, Row, Section, Info, Pre, Log, ui } from '../shared'

// ─── Failure 1: State mutation inside reducer ─────────────────────────────────
// Mutations are SILENT failures in Redux — no error thrown, but:
// a) time-travel debugging breaks (old state snapshot = same reference as new)
// b) React may not re-render (reference equality check passes → no diff)
// c) Middleware logging shows identical before/after objects

type MutState = { items: string[]; tick: number }

const mutatingReducer: Reducer<MutState> = (
  state = { items: [], tick: 0 },
  action
) => {
  if (action.type === 'ADD_ITEM_BAD') {
    state.items.push(action.payload as string) // MUTATION — same array reference
    return state                                // same object reference returned
  }
  if (action.type === 'ADD_ITEM_GOOD') {
    return { ...state, items: [...state.items, action.payload as string] }
  }
  if (action.type === 'TICK') {
    return { ...state, tick: state.tick + 1 }
  }
  return state
}

// ─── Failure 2: Dispatch inside reducer ───────────────────────────────────────
// Redux sets `isDispatching = true` during reducer execution.
// Any dispatch call during this window throws immediately.

type DispatchState = { count: number }

const dispatchInReducerReducer: Reducer<DispatchState> = (
  state = { count: 0 },
  action
) => {
  if (action.type === 'EVIL') {
    // This will throw: "Reducers may not dispatch actions."
    // We can't call store.dispatch here because we only have state+action.
    // Attempting it would infinite loop anyway.
    throw new Error('EVIL action intentionally throws in reducer')
  }
  if (action.type === 'INC') return { count: state.count + 1 }
  return state
}

// ─── Failure 3: Infinite dispatch loop ───────────────────────────────────────
// A reducer dispatches, which triggers the reducer again, which dispatches, …
// Not possible with raw Redux (throws on nested dispatch), but achievable
// via middleware or subscription side effects.

type LoopState = { count: number; stopped: boolean }

const loopReducer: Reducer<LoopState> = (
  state = { count: 0, stopped: false },
  action
) => {
  if (action.type === 'LOOP_INC') return { ...state, count: state.count + 1 }
  if (action.type === 'STOP_LOOP') return { ...state, stopped: true }
  return state
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FailureExperiment() {
  // ── Mutation store
  const mutStoreRef = useRef(createRawStore(mutatingReducer))
  const mutStore = mutStoreRef.current
  const [mutState, setMutState] = useState(() => mutStore.getState())
  const [snapshots, setSnapshots] = useState<string[]>([])
  useRef(mutStore.subscribe(() => setMutState({ ...mutStore.getState() })))

  const addItemBad = () => {
    const before = JSON.stringify(mutStore.getState().items)
    mutStore.dispatch({ type: 'ADD_ITEM_BAD', payload: `item-${Date.now() % 1000}` })
    const after = JSON.stringify(mutStore.getState().items)
    setSnapshots(p => [...p, `before ref: ${before} | after ref: ${after} | same? ${before === after}`])
  }

  // ── Dispatch-in-reducer store
  const dispStoreRef = useRef(createRawStore(dispatchInReducerReducer))
  const dispStore = dispStoreRef.current
  const [dispState, setDispState] = useState(() => dispStore.getState())
  const [dispError, setDispError] = useState<string | null>(null)
  useRef(dispStore.subscribe(() => setDispState(dispStore.getState())))

  // ── Loop store
  const loopStoreRef = useRef(createRawStore(loopReducer))
  const loopStore = loopStoreRef.current
  const [loopState, setLoopState] = useState(() => loopStore.getState())
  const [loopLog, setLoopLog] = useState<string[]>([])
  useRef(loopStore.subscribe(() => setLoopState({ ...loopStore.getState() })))

  const startLoop = () => {
    let iterations = 0
    const MAX = 50
    const unsubscribe = loopStore.subscribe(() => {
      if (loopStore.getState().stopped) { unsubscribe(); return }
      iterations++
      setLoopLog(p => [...p, `iteration ${iterations}`])
      if (iterations >= MAX) {
        loopStore.dispatch({ type: 'STOP_LOOP' })
        setLoopLog(p => [...p, `stopped at ${MAX} (safeguard)`])
        unsubscribe()
        return
      }
      loopStore.dispatch({ type: 'LOOP_INC' })
    })
    loopStore.dispatch({ type: 'LOOP_INC' })
  }

  return (
    <div>
      <h2 style={ui.h2}>8 · Failure Scenarios</h2>
      <p style={ui.desc}>
        Intentional breakage. Observe how Redux responds — some fail loudly, some fail silently.
        Silent failures are the dangerous ones.
      </p>

      <Section title="8.1 State mutation in reducer — silent failure">
        <Info>
          "ADD_ITEM_BAD" uses <code>state.items.push()</code> and returns the same state reference.
          Redux does NOT detect this. The store notifies subscribers (count increments), but:
        </Info>
        <ul style={{ fontSize: 13, color: '#888', marginBottom: 10, paddingLeft: 20, lineHeight: 1.8 }}>
          <li>Time-travel in Redux DevTools breaks — "previous" state shows current data</li>
          <li>Any memoization using reference equality silently misses the update</li>
          <li>Logger middleware logs same object for before/after</li>
        </ul>
        <Row>
          <Btn onClick={addItemBad} danger>add item (MUTATION)</Btn>
          <Btn onClick={() => mutStore.dispatch({ type: 'ADD_ITEM_GOOD', payload: `item-${Date.now() % 1000}` })}>
            add item (immutable)
          </Btn>
          <Btn onClick={() => setSnapshots([])}>clear log</Btn>
        </Row>
        <div style={{ marginTop: 8, fontSize: 13 }}>
          items.length: <b>{mutState.items.length}</b>
        </div>
        <Log entries={snapshots} />
        <Pre>{`// Bad — mutation silently corrupts Redux guarantees:
if (action.type === 'ADD') {
  state.items.push(action.payload) // ← mutates existing array
  return state                     // ← same reference! subscribers notified but
}                                  //   old snapshot === new snapshot

// Good — new reference signals change:
if (action.type === 'ADD') {
  return { ...state, items: [...state.items, action.payload] }
}`}</Pre>
      </Section>

      <Section title="8.2 Dispatch inside reducer — explicit throw">
        <Info>
          Redux sets an <code>isDispatching</code> flag during reducer execution.
          Any dispatch call during this window throws immediately to prevent infinite loops and state corruption.
        </Info>
        <Row>
          <Btn onClick={() => {
            try {
              dispStore.dispatch({ type: 'EVIL' })
            } catch (err) {
              setDispError(String(err))
            }
          }} danger>dispatch EVIL (throws in reducer)</Btn>
          <Btn onClick={() => { dispStore.dispatch({ type: 'INC' }); setDispError(null) }}>dispatch INC (safe)</Btn>
        </Row>
        <div style={{ marginTop: 8, fontSize: 13 }}>
          count: <b>{dispState.count}</b>
        </div>
        {dispError && (
          <div style={{ marginTop: 8, padding: '8px 12px', background: '#1a0000', border: '1px solid #5a0000', borderRadius: 3, fontSize: 12, color: '#ff6b6b' }}>
            {dispError}
          </div>
        )}
        <Pre>{`// createRawStore guards against nested dispatch:
dispatch(action: Action): Action {
  if (isDispatching) throw new Error('Reducers may not dispatch actions.')
  try {
    isDispatching = true
    state = reducer(state, action) // ← if reducer calls dispatch, it throws here
  } finally {
    isDispatching = false
  }
  // ...
}`}</Pre>
      </Section>

      <Section title="8.3 Infinite dispatch loop — via subscription side effect">
        <Info>
          A reducer can't dispatch (protected by the flag), but a subscriber CAN cause infinite loops.
          Pattern: subscribe → handler dispatches → subscriber fires again → repeat.
          The loop below is intentionally capped at 50 iterations via a safeguard.
        </Info>
        <Row>
          <Btn onClick={startLoop} danger>start loop (capped at 50)</Btn>
          <Btn onClick={() => { loopStore.dispatch({ type: 'STOP_LOOP' }); setLoopLog([]) }}>reset</Btn>
        </Row>
        <div style={{ marginTop: 8, fontSize: 13 }}>
          count: <b>{loopState.count}</b> | stopped: <b>{String(loopState.stopped)}</b>
        </div>
        <Log entries={loopLog} />
        <Pre>{`// Infinite loop via subscriber — NOT caught by Redux:
store.subscribe(() => {
  store.dispatch({ type: 'LOOP_INC' }) // ← fires → subscription fires → fires → ...
})
store.dispatch({ type: 'LOOP_INC' })   // ← trigger

// Detection/prevention:
// 1. Never dispatch from subscriptions unconditionally
// 2. Check a stopping condition (state.stopped) before dispatching
// 3. Unsubscribe after N iterations as a safeguard
// 4. Redux middleware can count dispatches and throw after a threshold`}</Pre>
      </Section>
    </div>
  )
}
