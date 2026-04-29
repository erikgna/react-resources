import { useState, useEffect, useRef } from 'react'
import { createRawStore, combineReducers } from '../../core/rawStore'
import type { Action, Reducer, RawStore } from '../../core/rawStore'
import { Btn, Row, Section, Info, Pre, ui } from '../shared'

// ─── Reducers ────────────────────────────────────────────────────────────────

type CounterState = { count: number }
const counterReducer: Reducer<CounterState> = (state = { count: 0 }, action) => {
  switch (action.type) {
    case 'INC': return { count: state.count + 1 }
    case 'DEC': return { count: state.count - 1 }
    case 'RESET': return { count: 0 }
    default: return state
  }
}

type Todo = { id: number; text: string; done: boolean }
type TodoState = { todos: Todo[]; nextId: number }
const todoReducer: Reducer<TodoState> = (state = { todos: [], nextId: 1 }, action) => {
  switch (action.type) {
    case 'ADD_TODO':
      return {
        todos: [...state.todos, { id: state.nextId, text: action.payload as string, done: false }],
        nextId: state.nextId + 1,
      }
    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: state.todos.map(t =>
          t.id === (action.payload as number) ? { ...t, done: !t.done } : t
        ),
      }
    default: return state
  }
}

type AppState = { counter: CounterState; todos: TodoState }
const rootReducer = combineReducers<AppState>({ counter: counterReducer, todos: todoReducer })

// ─── Large state stress test ──────────────────────────────────────────────────

type LargeState = { nodes: Record<string, number>; tick: number }
const largeReducer: Reducer<LargeState> = (state = { nodes: {}, tick: 0 }, action) => {
  switch (action.type) {
    case 'BUILD': {
      const nodes: Record<string, number> = {}
      for (let i = 0; i < 10_000; i++) nodes[`node_${i}`] = i
      return { ...state, nodes }
    }
    case 'TICK': return { ...state, tick: state.tick + 1 }
    default: return state
  }
}

// ─── Hook: subscribe to a store slice ────────────────────────────────────────
// This is the primitive — no equality check, fires on every dispatch.

function useRawSelector<S, T>(store: RawStore<S>, selector: (s: S) => T): T {
  const sel = useRef(selector)
  sel.current = selector
  const [value, setValue] = useState(() => selector(store.getState()))
  useEffect(
    () => store.subscribe(() => setValue(sel.current(store.getState()))),
    [store]
  )
  return value
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function RawStoreExperiment() {
  const storeRef = useRef(createRawStore(rootReducer))
  const store = storeRef.current
  const count = useRawSelector(store, s => s.counter.count)
  const todos = useRawSelector(store, s => s.todos.todos)
  const [input, setInput] = useState('')

  const largeRef = useRef(createRawStore(largeReducer))
  const large = largeRef.current
  const tick = useRawSelector(large, s => s.tick)
  const nodeCount = useRawSelector(large, s => Object.keys(s.nodes).length)
  const [buildMs, setBuildMs] = useState<number | null>(null)
  const [tickMs, setTickMs] = useState<number | null>(null)

  const dispatch = (a: Action) => store.dispatch(a)

  return (
    <div>
      <h2 style={ui.h2}>1 · Raw Store</h2>
      <p style={ui.desc}>
        Manual <code>createStore</code>, <code>combineReducers</code>, <code>dispatch</code>, <code>subscribe</code> — zero Redux library.
        Read <code>src/core/rawStore.ts</code> for the full implementation.
      </p>

      <Section title="1.1 createRawStore — Counter">
        <Info>State flows: <code>dispatch(action)</code> → <code>reducer(state, action)</code> → new state → notify listeners.</Info>
        <Row>
          <Btn onClick={() => dispatch({ type: 'DEC' })}>−</Btn>
          <span style={{ fontSize: 28, minWidth: 48, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{count}</span>
          <Btn onClick={() => dispatch({ type: 'INC' })}>+</Btn>
          <Btn onClick={() => dispatch({ type: 'RESET' })}>reset</Btn>
        </Row>
        <Pre>{`// Reducer — pure function, no side effects
const counterReducer = (state = { count: 0 }, action) => {
  switch (action.type) {
    case 'INC': return { count: state.count + 1 }
    case 'DEC': return { count: state.count - 1 }
    default:    return state
  }
}

const store = createRawStore(counterReducer)
store.dispatch({ type: 'INC' })
store.getState() // { count: 1 }`}</Pre>
      </Section>

      <Section title="1.2 combineReducers — Two slices, one store">
        <Info>
          Counter and todos share one store instance via <code>combineReducers</code>.
          Each reducer owns its slice. They never see each other's state.
        </Info>
        <Row>
          <input
            style={ui.input} value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="todo text…"
            onKeyDown={e => {
              if (e.key === 'Enter' && input.trim()) {
                dispatch({ type: 'ADD_TODO', payload: input.trim() })
                setInput('')
              }
            }}
          />
          <Btn onClick={() => {
            if (input.trim()) { dispatch({ type: 'ADD_TODO', payload: input.trim() }); setInput('') }
          }}>add</Btn>
          <Btn onClick={() => dispatch({ type: 'INC' })}>inc counter ({count})</Btn>
        </Row>
        <ul style={{ marginTop: 10, listStyle: 'none' }}>
          {todos.map(t => (
            <li
              key={t.id}
              onClick={() => dispatch({ type: 'TOGGLE_TODO', payload: t.id })}
              style={{ padding: '4px 0', cursor: 'pointer', fontSize: 13,
                textDecoration: t.done ? 'line-through' : 'none',
                color: t.done ? '#444' : '#bbb' }}
            >
              [{t.done ? '×' : ' '}] {t.text}
            </li>
          ))}
          {todos.length === 0 && <li style={{ color: '#444', fontSize: 13 }}>no todos yet</li>}
        </ul>
        <Pre>{`const rootReducer = combineReducers({
  counter: counterReducer, // state.counter
  todos:   todoReducer,    // state.todos
})
// combineReducers calls each sub-reducer with its own slice.
// If no slice changed, the reference is preserved (no re-render).`}</Pre>
      </Section>

      <Section title="1.3 Large State Tree — Stress Test">
        <Info>
          Build 10,000 nodes in state. Measure dispatch + spread cost.
          Each <code>TICK</code> dispatch spreads the 10k-node object — reveals copy overhead.
        </Info>
        <Row>
          <Btn onClick={() => {
            const t0 = performance.now()
            large.dispatch({ type: 'BUILD' })
            setBuildMs(performance.now() - t0)
          }}>build 10k nodes</Btn>
          <Btn onClick={() => {
            const t0 = performance.now()
            large.dispatch({ type: 'TICK' })
            setTickMs(performance.now() - t0)
          }}>dispatch tick</Btn>
        </Row>
        <div style={{ marginTop: 10, fontSize: 13, color: '#bbb', display: 'flex', gap: 24 }}>
          <span>nodes: <b style={{ color: '#e0e0e0' }}>{nodeCount.toLocaleString()}</b></span>
          <span>ticks: <b style={{ color: '#e0e0e0' }}>{tick}</b></span>
          {buildMs !== null && <span>build: <b style={{ color: '#f9a825' }}>{buildMs.toFixed(2)}ms</b></span>}
          {tickMs !== null && <span>tick dispatch: <b style={{ color: tickMs > 1 ? '#ff6b6b' : '#4caf50' }}>{tickMs.toFixed(2)}ms</b></span>}
        </div>
        <Info style={{ marginTop: 10, color: '#666' }}>
          Tick uses <code>{'{ ...state, tick: state.tick + 1 }'}</code> — spreads the top-level object.
          The 10k nodes object is NOT copied (same reference). Cost is O(top-level keys), not O(total nodes).
          Nested objects ARE copied on the way down — true for all immutable update patterns.
        </Info>
      </Section>
    </div>
  )
}
