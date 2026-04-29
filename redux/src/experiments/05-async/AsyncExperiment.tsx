import { useRef, useState } from 'react'
import { createRawStore, applyMiddleware } from '../../core/rawStore'
import type { Action, Reducer, Middleware } from '../../core/rawStore'
import { Btn, Row, Section, Info, Pre, Log, ui } from '../shared'

// ─── Thunk middleware (same as experiment 04) ────────────────────────────────

const thunk: Middleware = store => next => action => {
  if (typeof action === 'function') {
    return (action as (d: typeof store.dispatch, g: typeof store.getState) => unknown)(
      store.dispatch, store.getState
    )
  }
  return next(action)
}

// ─── Simulated API — variable delay to trigger race conditions ────────────────

let callId = 0
function simulateApi(query: string, delay: number): Promise<{ id: number; result: string }> {
  const id = ++callId
  return new Promise(resolve =>
    setTimeout(() => resolve({ id, result: `"${query}" — call #${id}` }), delay)
  )
}

// ─── State ────────────────────────────────────────────────────────────────────

type AsyncState = {
  status: 'idle' | 'loading' | 'done'
  result: string | null
  error: string | null
  log: string[]
}
const initialState: AsyncState = { status: 'idle', result: null, error: null, log: [] }

const asyncReducer: Reducer<AsyncState> = (state = initialState, action) => {
  switch (action.type) {
    case 'FETCH/START':
      return { ...state, status: 'loading', error: null,
        log: [...state.log, `[${now()}] FETCH/START`] }
    case 'FETCH/DONE':
      return { ...state, status: 'done', result: action.payload as string,
        log: [...state.log, `[${now()}] FETCH/DONE → ${action.payload}`] }
    case 'FETCH/ERROR':
      return { ...state, status: 'idle', error: action.payload as string,
        log: [...state.log, `[${now()}] FETCH/ERROR → ${action.payload}`] }
    case 'CLEAR':
      return initialState
    default: return state
  }
}

function now() { return new Date().toISOString().slice(11, 23) }

const store1 = createRawStore(asyncReducer, applyMiddleware(thunk))

// ─── Race condition store ─────────────────────────────────────────────────────

type RaceState = {
  result: string | null
  callCount: number
  latestCallId: number
  log: string[]
}

const raceReducer: Reducer<RaceState> = (
  state = { result: null, callCount: 0, latestCallId: 0, log: [] },
  action
) => {
  switch (action.type) {
    case 'RACE/CALL':
      return { ...state, callCount: state.callCount + 1, latestCallId: action.payload as number,
        log: [...state.log, `[${now()}] call #${action.payload} started`] }
    case 'RACE/RESOLVE':
      return { ...state, result: (action.payload as { result: string }).result,
        log: [...state.log, `[${now()}] call #${(action.payload as { id: number }).id} resolved → "${(action.payload as { result: string }).result}"`] }
    case 'RACE/STALE':
      return { ...state,
        log: [...state.log, `[${now()}] call #${(action.payload as { id: number }).id} DISCARDED (stale)`] }
    case 'RACE/CLEAR':
      return { result: null, callCount: 0, latestCallId: 0, log: [] }
    default: return state
  }
}

const store2 = createRawStore(raceReducer, applyMiddleware(thunk))

// ─── Thunk action creators ────────────────────────────────────────────────────

function fetchWithThunk(query: string) {
  return async (dispatch: (a: Action) => void) => {
    dispatch({ type: 'FETCH/START' })
    try {
      const { result } = await simulateApi(query, 1000)
      dispatch({ type: 'FETCH/DONE', payload: result })
    } catch (err) {
      dispatch({ type: 'FETCH/ERROR', payload: String(err) })
    }
  }
}

// Without cancellation — last STARTED wins (wrong), should be last RESOLVED wins
function fetchWithRace_bad(query: string) {
  return async (dispatch: (a: Action) => void) => {
    const delay = Math.random() * 1500 + 200
    const { id, result } = await simulateApi(query, delay)
    dispatch({ type: 'RACE/CALL', payload: id })
    // Problem: call started after this one may resolve before this one
    setTimeout(async () => {
      dispatch({ type: 'RACE/RESOLVE', payload: { id, result } })
    }, delay)
  }
}

// With cancellation — track latest call ID, discard stale responses
function fetchWithRace_fixed(query: string) {
  return async (dispatch: (a: Action) => void, getState: () => RaceState) => {
    const delay = Math.random() * 1500 + 200
    const id = ++callId
    dispatch({ type: 'RACE/CALL', payload: id })
    await new Promise(r => setTimeout(r, delay))
    // Check if a newer call was started
    if (getState().latestCallId !== id) {
      dispatch({ type: 'RACE/STALE', payload: { id, result: query } })
      return
    }
    dispatch({ type: 'RACE/RESOLVE', payload: { id, result: `${query} (delay: ${delay.toFixed(0)}ms)` } })
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AsyncExperiment() {
  const [s1, setS1] = useState(() => store1.getState())
  useRef(store1.subscribe(() => setS1(store1.getState())))

  const [s2, setS2] = useState(() => store2.getState())
  useRef(store2.subscribe(() => setS2(store2.getState())))

  const [approach, setApproach] = useState<'bad' | 'fixed'>('bad')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d1 = (a: any) => store1.dispatch(a)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d2 = (a: any) => store2.dispatch(a)

  return (
    <div>
      <h2 style={ui.h2}>5 · Async State</h2>
      <p style={ui.desc}>
        Three patterns: manual async in component, thunk action creator, and race condition handling.
        All use the same thunk middleware from experiment 4.
      </p>

      <Section title="5.1 Approach 1 — manual async in component (no thunk)">
        <Info>
          Dispatch START manually, await, then dispatch DONE. Works but couples async logic to the component.
          Cannot be reused, tested, or composed independently.
        </Info>
        <Pre>{`// Async logic lives in the component — NOT in Redux
async function handleFetch() {
  dispatch({ type: 'FETCH/START' })
  try {
    const data = await api.fetch(query)
    dispatch({ type: 'FETCH/DONE', payload: data })
  } catch (err) {
    dispatch({ type: 'FETCH/ERROR', payload: err.message })
  }
}`}</Pre>
      </Section>

      <Section title="5.2 Approach 2 — thunk action creator">
        <Info>
          Async logic lives in a thunk function. Component only calls <code>dispatch(fetchWithThunk(query))</code>.
          Reusable, testable, decoupled from UI.
        </Info>
        <Row>
          <Btn onClick={() => d1(fetchWithThunk('search query'))}>
            {s1.status === 'loading' ? 'loading…' : 'dispatch thunk'}
          </Btn>
          <Btn onClick={() => d1({ type: 'CLEAR' })}>clear</Btn>
        </Row>
        <div style={{ marginTop: 8, fontSize: 13 }}>
          status: <b style={{ color: s1.status === 'loading' ? '#f9a825' : s1.status === 'done' ? '#4caf50' : '#888' }}>
            {s1.status}
          </b>
          {s1.result && <span style={{ color: '#7ec8a0', marginLeft: 12 }}>{s1.result}</span>}
        </div>
        <Log entries={s1.log} />
      </Section>

      <Section title="5.3 Race condition — rapid successive calls">
        <Info>
          Click rapidly. Each call has a random delay (200–1700ms). Without cancellation,
          a slow early call can resolve AFTER a fast later call, overwriting the correct result with stale data.
          The fix: track the latest call ID in state, discard responses from older calls.
        </Info>
        <Row>
          <Btn onClick={() => approach === 'bad'
            ? d2(fetchWithRace_bad(`query-${Date.now()}`) as Parameters<typeof d2>[0])
            : d2(fetchWithRace_fixed(`query-${Date.now()}`) as Parameters<typeof d2>[0])
          }>
            dispatch (random delay)
          </Btn>
          <Btn onClick={() => d2({ type: 'RACE/CLEAR' })}>clear</Btn>
          <label style={{ fontSize: 12, color: '#888', display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="checkbox" checked={approach === 'fixed'}
              onChange={e => { setApproach(e.target.checked ? 'fixed' : 'bad'); d2({ type: 'RACE/CLEAR' }) }} />
            cancellation fix enabled
          </label>
        </Row>
        <div style={{ marginTop: 8, fontSize: 13 }}>
          calls started: <b>{s2.callCount}</b> |
          latest ID: <b>{s2.latestCallId}</b> |
          result: <b style={{ color: '#7ec8a0' }}>{s2.result ?? '—'}</b>
        </div>
        <Log entries={s2.log} />
        <Pre>{`// Race fix — check if still the latest request before committing:
const id = ++requestId
dispatch({ type: 'REQUEST/START', payload: id })
await api.fetch(query)
if (getState().latestRequestId !== id) return // ← discard stale
dispatch({ type: 'REQUEST/DONE', payload: result })

// Redux Toolkit's createAsyncThunk does this automatically via
// a built-in requestId + condition check.`}</Pre>
      </Section>
    </div>
  )
}
