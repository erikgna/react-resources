import { createContext, useContext, useReducer, useCallback, useRef, memo } from 'react'
import { Section, Row, Btn, Info, Pre, Box, Log, ui } from '../shared'

// ─── State shape ──────────────────────────────────────────────────────────────

type Todo = { id: number; text: string; done: boolean }
type State = {
  count: number
  todos: Todo[]
  nextId: number
}
type Action =
  | { type: 'INC' }
  | { type: 'DEC' }
  | { type: 'RESET' }
  | { type: 'ADD_TODO'; text: string }
  | { type: 'TOGGLE_TODO'; id: number }
  | { type: 'REMOVE_TODO'; id: number }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INC':    return { ...state, count: state.count + 1 }
    case 'DEC':    return { ...state, count: state.count - 1 }
    case 'RESET':  return { ...state, count: 0 }
    case 'ADD_TODO':
      return {
        ...state,
        todos: [...state.todos, { id: state.nextId, text: action.text, done: false }],
        nextId: state.nextId + 1,
      }
    case 'TOGGLE_TODO':
      return { ...state, todos: state.todos.map(t => t.id === action.id ? { ...t, done: !t.done } : t) }
    case 'REMOVE_TODO':
      return { ...state, todos: state.todos.filter(t => t.id !== action.id) }
    default: return state
  }
}

const initialState: State = { count: 0, todos: [], nextId: 1 }

// ─── Split contexts ───────────────────────────────────────────────────────────

const StateCtx = createContext<State>(initialState)
const DispatchCtx = createContext<React.Dispatch<Action>>(() => {})

// ─── Render counter ───────────────────────────────────────────────────────────

function useRenderCount() {
  const ref = useRef(0)
  ref.current += 1
  return ref.current
}

// ─── Consumers ────────────────────────────────────────────────────────────────

function CountDisplay() {
  const { count } = useContext(StateCtx)
  const renders = useRenderCount()
  return <Box name="CountDisplay" renders={renders}>count: {count}</Box>
}

// Memoized — reads from dispatch only (stable) → never re-renders
const CountControls = memo(function CountControls() {
  const dispatch = useContext(DispatchCtx)
  const renders = useRenderCount()
  return (
    <Box name="CountControls (memo)" renders={renders}>
      <Row>
        <Btn onClick={() => dispatch({ type: 'DEC' })}>−</Btn>
        <Btn onClick={() => dispatch({ type: 'INC' })}>+</Btn>
        <Btn onClick={() => dispatch({ type: 'RESET' })}>R</Btn>
      </Row>
    </Box>
  )
})

function TodoList() {
  const { todos } = useContext(StateCtx)
  const dispatch = useContext(DispatchCtx)
  const renders = useRenderCount()
  return (
    <Box name="TodoList" renders={renders}>
      <ul style={{ listStyle: 'none', minWidth: 200 }}>
        {todos.map(t => (
          <li key={t.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '2px 0', fontSize: 12,
          }}>
            <span
              onClick={() => dispatch({ type: 'TOGGLE_TODO', id: t.id })}
              style={{
                cursor: 'pointer',
                textDecoration: t.done ? 'line-through' : 'none',
                color: t.done ? '#444' : '#bbb',
              }}
            >
              {t.text}
            </span>
            <Btn danger onClick={() => dispatch({ type: 'REMOVE_TODO', id: t.id })}>×</Btn>
          </li>
        ))}
        {todos.length === 0 && <li style={{ color: '#444', fontSize: 12 }}>empty</li>}
      </ul>
    </Box>
  )
}

// Memoized add form — only needs dispatch
const TodoAddForm = memo(function TodoAddForm() {
  const dispatch = useContext(DispatchCtx)
  const renders = useRenderCount()
  const [text, setText] = React.useState('')

  return (
    <Box name="TodoAddForm (memo)" renders={renders}>
      <Row>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && text.trim()) {
              dispatch({ type: 'ADD_TODO', text: text.trim() })
              setText('')
            }
          }}
          placeholder="add todo…"
          style={{
            background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#e0e0e0',
            padding: '4px 8px', borderRadius: 3, fontSize: 12, outline: 'none', width: 120,
          }}
        />
        <Btn onClick={() => {
          if (text.trim()) { dispatch({ type: 'ADD_TODO', text: text.trim() }); setText('') }
        }}>add</Btn>
      </Row>
    </Box>
  )
})

// ─── Custom hook encapsulating both contexts ──────────────────────────────────

function useApp() {
  return {
    state: useContext(StateCtx),
    dispatch: useContext(DispatchCtx),
  }
}

function HookConsumer() {
  const { state, dispatch } = useApp()
  const renders = useRenderCount()
  return (
    <Box name="useApp() hook" renders={renders}>
      count: {state.count} | todos: {state.todos.length}
      <Btn onClick={() => dispatch({ type: 'INC' })} active>+</Btn>
    </Box>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

import React from 'react'

export default function ReducerExperiment() {
  const [state, dispatch] = useReducer(reducer, initialState)

  return (
    <div>
      <h2 style={ui.h2}>4 · Context + useReducer</h2>
      <p style={ui.desc}>
        State context (read-only) + dispatch context (stable ref). Custom hook encapsulation.
        Observe which components re-render: only state consumers, never dispatch-only consumers.
      </p>

      <Section title="4.1 State + Dispatch Split">
        <Info>
          <code>CountControls</code> and <code>TodoAddForm</code> are memoized and only consume dispatch.
          Dispatch ref is stable — they never re-render on state changes.
          <code>CountDisplay</code> and <code>TodoList</code> consume state — re-render on changes.
        </Info>
        <StateCtx.Provider value={state}>
          <DispatchCtx.Provider value={dispatch}>
            <Row style={{ flexWrap: 'wrap', gap: 10 }}>
              <CountDisplay />
              <CountControls />
              <TodoList />
              <TodoAddForm />
              <HookConsumer />
            </Row>
          </DispatchCtx.Provider>
        </StateCtx.Provider>
        <Pre>{`const StateCtx    = createContext(initialState)
const DispatchCtx = createContext(() => {})

const [state, dispatch] = useReducer(reducer, initialState)

// dispatch is stable — same reference across all renders (guaranteed by useReducer)
// StateCtx changes on every state update → state consumers re-render
// DispatchCtx never changes → dispatch consumers never re-render

<StateCtx.Provider value={state}>
  <DispatchCtx.Provider value={dispatch}>
    <CountDisplay />       // reads state → re-renders on count change
    <CountControls />      // memo + reads dispatch only → never re-renders
    <TodoAddForm />        // memo + reads dispatch only → never re-renders
  </DispatchCtx.Provider>
</StateCtx.Provider>`}</Pre>
      </Section>

      <Section title="4.2 Dispatch Reference Stability">
        <Info>
          <code>useReducer</code> dispatch is guaranteed stable — same function reference forever.
          This is the critical property that makes dispatch context free of re-render cost.
          Unlike <code>useState</code> setter (also stable), <code>useReducer</code> handles complex action shapes.
        </Info>
        <Pre>{`// useReducer dispatch is referentially stable (React guarantee)
const [state, dispatch] = useReducer(reducer, initial)
// dispatch === dispatch  (across all renders, always true)

// vs. manual handler:
const handleInc = () => dispatch({ type: 'INC' })
// handleInc is NEW every render — needs useCallback to stabilize
const stableHandleInc = useCallback(
  () => dispatch({ type: 'INC' }), []
)

// Custom hook pattern — DX improvement
function useApp() {
  return {
    state: useContext(StateCtx),       // may change
    dispatch: useContext(DispatchCtx), // never changes
  }
}`}</Pre>
      </Section>
    </div>
  )
}
