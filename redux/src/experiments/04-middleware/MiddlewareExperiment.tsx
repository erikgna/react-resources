import { useRef, useState } from 'react'
import { createRawStore, applyMiddleware } from '../../core/rawStore'
import type { Action, Reducer, Middleware } from '../../core/rawStore'
import { Btn, Row, Section, Info, Pre, Log, ui } from '../shared'

// ─── Middleware definitions ───────────────────────────────────────────────────
// Each middleware: store => next => action => result
// "store" has getState + dispatch (the final composed dispatch, for re-dispatching)
// "next" is the next middleware in the chain (or the real store.dispatch at the end)
// "action" is what was passed to dispatch

// 1. Logger — captures before/after state.
function makeLogger(addLog: (s: string) => void): Middleware {
  return store => next => action => {
    const prev = JSON.stringify(store.getState())
    addLog(`→ dispatch: ${JSON.stringify(action)}`)
    addLog(`  before:   ${prev}`)
    const result = next(action) // pass to next in chain
    addLog(`  after:    ${JSON.stringify(store.getState())}`)
    return result
  }
}

// 2. Thunk — if action is a function, call it with (dispatch, getState).
//    Otherwise pass through. This is the entire redux-thunk implementation.
const thunk: Middleware = store => next => action => {
  if (typeof action === 'function') {
    return (action as (d: typeof store.dispatch, g: typeof store.getState) => unknown)(
      store.dispatch,
      store.getState
    )
  }
  return next(action)
}

// 3. Error interceptor — wraps the reducer call in try/catch.
function makeErrorInterceptor(addLog: (s: string) => void): Middleware {
  return _store => next => action => {
    try {
      return next(action)
    } catch (err) {
      addLog(`✗ ERROR dispatching ${JSON.stringify(action)}: ${err}`)
      throw err
    }
  }
}

// ─── Store state ──────────────────────────────────────────────────────────────

type State = { counter: number; loading: boolean; data: string | null }
const reducer: Reducer<State> = (
  state = { counter: 0, loading: false, data: null },
  action
) => {
  switch (action.type) {
    case 'INC':          return { ...state, counter: state.counter + 1 }
    case 'FETCH_START':  return { ...state, loading: true, data: null }
    case 'FETCH_END':    return { ...state, loading: false, data: action.payload as string }
    default: return state
  }
}

// ─── Thunk action creator ─────────────────────────────────────────────────────

function fetchData(id: number) {
  // Returns a function instead of a plain action object.
  // The thunk middleware intercepts it and calls it with (dispatch, getState).
  return async (dispatch: (a: Action) => void, getState: () => State) => {
    dispatch({ type: 'FETCH_START' })
    await new Promise(r => setTimeout(r, 800))
    const counterAtDispatchTime = getState().counter
    dispatch({ type: 'FETCH_END', payload: `result-${id} (counter was ${counterAtDispatchTime})` })
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MiddlewareExperiment() {
  const [logs, setLogs] = useState<string[]>([])
  const addLog = (s: string) => setLogs(prev => [...prev.slice(-30), s])

  const storeRef = useRef(
    createRawStore(
      reducer,
      applyMiddleware(
        makeLogger(addLog),   // outermost — runs first on dispatch, last on return
        thunk,                // second — intercepts function actions
        makeErrorInterceptor(addLog) // innermost — closest to reducer
      )
    )
  )
  const store = storeRef.current

  const [state, setState] = useState(() => store.getState())
  useRef(store.subscribe(() => setState(store.getState())))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dispatch = (a: any) => store.dispatch(a)

  return (
    <div>
      <h2 style={ui.h2}>4 · Middleware Pipeline</h2>
      <p style={ui.desc}>
        Middleware composes around <code>dispatch</code>. Each layer wraps the next.
        Pipeline order: <code>logger → thunk → errorInterceptor → reducer</code>.
      </p>

      <Section title="4.1 Middleware pipeline — how compose wires it">
        <Pre>{`applyMiddleware(logger, thunk, errorInterceptor)

// Produces:
dispatch = logger(thunk(errorInterceptor(store.dispatch)))

// Action flow (left to right):
// dispatch(action)
//   → logger.before
//     → thunk (passes through plain actions)
//       → errorInterceptor (try/catch)
//         → store.dispatch (reducer runs, state updates)
//       ← errorInterceptor returns
//     ← thunk returns
//   → logger.after (reads new state)
// ← result

// Return flow is right to left (stack unwinds).`}</Pre>
      </Section>

      <Section title="4.2 Logger + plain dispatch">
        <Info>State: counter={state.counter} | data={state.data ?? 'null'} | loading={String(state.loading)}</Info>
        <Row>
          <Btn onClick={() => dispatch({ type: 'INC' })}>dispatch INC</Btn>
          <Btn onClick={() => setLogs([])}>clear log</Btn>
        </Row>
        <Log entries={logs} />
      </Section>

      <Section title="4.3 Thunk middleware — async action creators">
        <Info>
          A thunk is a function dispatched instead of a plain action.
          The thunk middleware detects <code>typeof action === 'function'</code>
          and calls it with <code>(dispatch, getState)</code> instead of forwarding to <code>next</code>.
        </Info>
        <Row>
          <Btn onClick={() => dispatch(fetchData(Date.now()))}>
            dispatch async thunk
          </Btn>
          {state.loading && <span style={{ fontSize: 12, color: '#f9a825' }}>fetching…</span>}
          {state.data && <span style={{ fontSize: 12, color: '#4caf50' }}>{state.data}</span>}
        </Row>
        <Log entries={logs} />
        <Pre>{`// The entire redux-thunk implementation:
const thunk = store => next => action => {
  if (typeof action === 'function') {
    return action(store.dispatch, store.getState) // call the thunk
  }
  return next(action) // plain action — pass through
}

// Usage:
dispatch(fetchData(42)) // dispatches a function, not an object`}</Pre>
      </Section>

      <Section title="4.4 Middleware signature anatomy">
        <Pre>{`type Middleware =
  (store: { getState, dispatch }) =>  // 1. curried store API
  (next: Dispatch) =>                 // 2. curried next in chain
  (action: Action) =>                 // 3. called on each dispatch
  unknown                             // 4. return value (usually next(action))

// Why curried? applyMiddleware calls each middleware once with the store API
// during setup (step 1+2), building the chain. Step 3 runs on every dispatch.
// This lets middleware close over getState/dispatch without re-binding per call.`}</Pre>
      </Section>
    </div>
  )
}
