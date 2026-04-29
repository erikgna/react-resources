import { createContext, useContext, useEffect, useReducer, useRef, useState } from 'react'
import { createRawStore } from '../../core/rawStore'
import type { Action, Reducer, RawStore } from '../../core/rawStore'
import { Btn, Row, Section, Info, Pre, Box, ui } from '../shared'

// ─── State ───────────────────────────────────────────────────────────────────

type State = { counter: number; name: string; unrelated: number }
const reducer: Reducer<State> = (state = { counter: 0, name: 'redux', unrelated: 0 }, action) => {
  switch (action.type) {
    case 'INC':            return { ...state, counter: state.counter + 1 }
    case 'SET_NAME':       return { ...state, name: action.payload as string }
    case 'TICK_UNRELATED': return { ...state, unrelated: state.unrelated + 1 }
    default: return state
  }
}

// ─── Context + hooks ──────────────────────────────────────────────────────────

const StoreCtx = createContext<RawStore<State> | null>(null)

function StoreProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef(createRawStore(reducer))
  return <StoreCtx.Provider value={ref.current}>{children}</StoreCtx.Provider>
}

// Bad version — no equality check.
// Every dispatch calls setState on every subscribed component regardless of whether
// the selected value actually changed.
function useRawSelectorNoEq<T>(selector: (s: State) => T): T {
  const store = useContext(StoreCtx)!
  const sel = useRef(selector)
  sel.current = selector
  const [value, setValue] = useState(() => selector(store.getState()))
  useEffect(() => store.subscribe(() => setValue(sel.current(store.getState()))), [store])
  return value
}

// Fixed version — equality check before setState.
// This is exactly what react-redux useSelector does internally.
function useRawSelectorWithEq<T>(selector: (s: State) => T, eq = Object.is): T {
  const store = useContext(StoreCtx)!
  const sel = useRef(selector)
  sel.current = selector
  const [, forceRender] = useReducer(c => c + 1, 0)
  const valRef = useRef<T>(selector(store.getState()))

  useEffect(() => store.subscribe(() => {
    const next = sel.current(store.getState())
    if (!eq(valRef.current, next)) {
      valRef.current = next
      forceRender()
    }
  }), [store, eq])

  return valRef.current
}

function useRawDispatch() {
  return useContext(StoreCtx)!.dispatch
}

// ─── Child components (version A — no eq check) ───────────────────────────────

function CounterA() {
  const r = useRef(0); r.current++
  const v = useRawSelectorNoEq(s => s.counter)
  return <Box name="CounterA (no eq)" renders={r.current} active>counter = {v}</Box>
}

function NameA() {
  const r = useRef(0); r.current++
  const v = useRawSelectorNoEq(s => s.name)
  return <Box name="NameA (no eq)" renders={r.current}>name = "{v}"</Box>
}

function UnrelatedA() {
  const r = useRef(0); r.current++
  const v = useRawSelectorNoEq(s => s.unrelated)
  return <Box name="UnrelatedA (no eq)" renders={r.current}>unrelated = {v}</Box>
}

// ─── Child components (version B — with eq check) ─────────────────────────────

function CounterB() {
  const r = useRef(0); r.current++
  const v = useRawSelectorWithEq(s => s.counter)
  return <Box name="CounterB (eq ✓)" renders={r.current} active>counter = {v}</Box>
}

function NameB() {
  const r = useRef(0); r.current++
  const v = useRawSelectorWithEq(s => s.name)
  return <Box name="NameB (eq ✓)" renders={r.current}>name = "{v}"</Box>
}

function UnrelatedB() {
  const r = useRef(0); r.current++
  const v = useRawSelectorWithEq(s => s.unrelated)
  return <Box name="UnrelatedB (eq ✓)" renders={r.current}>unrelated = {v}</Box>
}

// ─── Controls ─────────────────────────────────────────────────────────────────

function Controls() {
  const dispatch = useRawDispatch()
  const [name, setName] = useState('')
  return (
    <div style={{ marginBottom: 14 }}>
      <Row>
        <Btn onClick={() => dispatch({ type: 'INC' })}>increment counter</Btn>
        <Btn onClick={() => dispatch({ type: 'TICK_UNRELATED' })}>tick unrelated</Btn>
      </Row>
      <Row style={{ marginTop: 8 }}>
        <input style={ui.input} value={name} onChange={e => setName(e.target.value)} placeholder="new name…" />
        <Btn onClick={() => { if (name) dispatch({ type: 'SET_NAME', payload: name } as Action) }}>
          set name
        </Btn>
      </Row>
    </div>
  )
}

// ─── Experiment ───────────────────────────────────────────────────────────────

export default function ManualReactExperiment() {
  return (
    <div>
      <h2 style={ui.h2}>2 · Manual React Integration</h2>
      <p style={ui.desc}>
        Custom context provider + manual subscription hook. No react-redux.
        Two versions: with and without equality check. Compare render counts.
      </p>

      <StoreProvider>
        <Section title="2.1 No equality check — every dispatch re-renders all subscribers">
          <Info>
            Dispatch "increment counter" — only <code>counter</code> changed, but NameA and UnrelatedA still re-render.
            <br />Reason: <code>subscribe</code> fires → <code>setState</code> called unconditionally → React re-renders.
          </Info>
          <Controls />
          <Row>
            <CounterA />
            <NameA />
            <UnrelatedA />
          </Row>
        </Section>

        <Section title="2.2 With equality check — only changed slice re-renders">
          <Info>
            Same store, same Controls. But the hook compares old vs new value with <code>Object.is</code> before calling setState.
            Dispatch "increment counter" → only CounterB re-renders. NameB and UnrelatedB stay.
          </Info>
          <Row>
            <CounterB />
            <NameB />
            <UnrelatedB />
          </Row>
          <Pre>{`// The critical fix inside useRawSelectorWithEq:
store.subscribe(() => {
  const next = selector(store.getState())
  if (!Object.is(prevValue, next)) { // ← equality gate
    prevValue = next
    forceRender()                    // ← only fires when value actually changed
  }
})

// react-redux useSelector does exactly this, but also:
// - handles selector identity changes between renders
// - supports custom equality functions (shallowEqual)
// - batches notifications via React 18 useSyncExternalStore`}</Pre>
        </Section>
      </StoreProvider>
    </div>
  )
}
