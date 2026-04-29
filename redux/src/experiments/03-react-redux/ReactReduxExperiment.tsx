import { useRef, useState } from 'react'
// react-redux Provider accepts any store with { getState, dispatch, subscribe }.
// We use our own createRawStore instead of Redux's createStore to prove
// that react-redux is purely a binding layer.
import { Provider, useSelector, useDispatch, shallowEqual } from 'react-redux'
import { createRawStore } from '../../core/rawStore'
import type { Reducer } from '../../core/rawStore'
import { Btn, Row, Section, Info, Pre, Box, ui } from '../shared'

// ─── State ───────────────────────────────────────────────────────────────────

type State = { counter: number; name: string }
const reducer: Reducer<State> = (state = { counter: 0, name: 'redux' }, action) => {
  switch (action.type) {
    case 'INC':      return { ...state, counter: state.counter + 1 }
    case 'SET_NAME': return { ...state, name: action.payload as string }
    default: return state
  }
}

// Single store instance — we reuse it across renders.
// react-redux Provider wraps components and provides it via context.
const store = createRawStore(reducer)

// ─── Components with render counters ─────────────────────────────────────────

// Primitive selector — returns a number (or string).
// Object.is check passes when counter hasn't changed → no re-render.
function PrimitiveSelector() {
  const r = useRef(0); r.current++
  const counter = useSelector((s: State) => s.counter)
  return <Box name="primitive selector" renders={r.current} active>counter = {counter}</Box>
}

// Object selector — returns a NEW object every time the selector runs.
// Object.is({count:1}, {count:1}) === false → re-renders on EVERY dispatch.
function ObjectSelectorBad() {
  const r = useRef(0); r.current++
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const state = useSelector((s: State) => ({ count: s.counter })) as any
  return <Box name="object selector (bad)" renders={r.current}>count = {state.count}</Box>
}

// shallowEqual compares object keys with ===.
// { count: 1 } shallowEquals { count: 1 } → no re-render if counter unchanged.
function ObjectSelectorFixed() {
  const r = useRef(0); r.current++
  const state = useSelector((s: State) => ({ count: s.counter }), shallowEqual)
  return <Box name="object selector (shallowEqual)" renders={r.current}>count = {state.count}</Box>
}

// Watches a different slice — should not re-render when counter changes.
function NameSelector() {
  const r = useRef(0); r.current++
  const name = useSelector((s: State) => s.name)
  return <Box name="name selector" renders={r.current}>name = "{name}"</Box>
}

// ─── Controls ─────────────────────────────────────────────────────────────────

function Controls() {
  const dispatch = useDispatch()
  const [name, setName] = useState('')
  return (
    <Row style={{ marginBottom: 14 }}>
      <Btn onClick={() => dispatch({ type: 'INC' })}>increment counter</Btn>
      <input style={ui.input} value={name} onChange={e => setName(e.target.value)} placeholder="new name…" />
      <Btn onClick={() => { if (name) dispatch({ type: 'SET_NAME', payload: name }) }}>set name</Btn>
    </Row>
  )
}

// ─── Experiment ───────────────────────────────────────────────────────────────

export default function ReactReduxExperiment() {
  return (
    <div>
      <h2 style={ui.h2}>3 · React-Redux Internals</h2>
      <p style={ui.desc}>
        react-redux is a binding layer — Provider + useSelector + useDispatch.
        Notice: we pass our own <code>createRawStore</code> to Provider, not Redux's.
        The store interface is all that matters: <code>{'{ getState, dispatch, subscribe }'}</code>.
      </p>

      <Provider store={store as unknown as Parameters<typeof Provider>[0]['store']}>
        <Section title="3.1 Selector equality — the root cause of unnecessary re-renders">
          <Info>
            Dispatch "increment counter". Watch render counts carefully:
            <br />• <b>primitive selector</b> — re-renders (counter changed)
            <br />• <b>object selector (bad)</b> — re-renders even when dispatching SET_NAME (new object ref every time)
            <br />• <b>object selector (shallowEqual)</b> — only re-renders when counter actually changes
            <br />• <b>name selector</b> — should NOT re-render when incrementing counter
          </Info>
          <Controls />
          <Row>
            <PrimitiveSelector />
            <ObjectSelectorBad />
            <ObjectSelectorFixed />
            <NameSelector />
          </Row>
        </Section>

        <Section title="3.2 How useSelector works internally">
          <Pre>{`// Simplified useSelector implementation:
function useSelector(selector, equalityFn = Object.is) {
  const store = useContext(ReactReduxContext)
  const [, forceRender] = useReducer(c => c + 1, 0)
  const latestSelector = useRef(selector)
  const latestResult   = useRef(selector(store.getState()))

  // React 18+: useSyncExternalStore for concurrent mode safety
  // (prevents "tearing" — different components seeing different state snapshots)
  return useSyncExternalStore(
    store.subscribe,
    () => {
      const newResult = latestSelector.current(store.getState())
      if (equalityFn(latestResult.current, newResult)) return latestResult.current
      latestResult.current = newResult
      return newResult
    }
  )
}

// Key insight: the equality function is the only thing preventing
// unnecessary re-renders when selecting derived objects.`}</Pre>
        </Section>

        <Section title="3.3 useDispatch">
          <Pre>{`// useDispatch is trivial — just returns store.dispatch from context.
// The reference is stable (same function) across renders.
function useDispatch() {
  return useContext(ReactReduxContext).dispatch
}

// This means you can safely include dispatch in useCallback deps
// without causing effect re-runs. It never changes.`}</Pre>
        </Section>
      </Provider>
    </div>
  )
}
