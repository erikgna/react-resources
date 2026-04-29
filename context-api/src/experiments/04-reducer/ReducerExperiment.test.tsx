import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createContext, useContext, useReducer, useCallback, useRef, memo } from 'react'

// ─── Reducer (extracted for pure unit tests) ──────────────────────────────────

type Todo = { id: number; text: string; done: boolean }
type State = { count: number; todos: Todo[]; nextId: number }
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
      return { ...state, todos: [...state.todos, { id: state.nextId, text: action.text, done: false }], nextId: state.nextId + 1 }
    case 'TOGGLE_TODO':
      return { ...state, todos: state.todos.map(t => t.id === action.id ? { ...t, done: !t.done } : t) }
    case 'REMOVE_TODO':
      return { ...state, todos: state.todos.filter(t => t.id !== action.id) }
    default: return state
  }
}

const initial: State = { count: 0, todos: [], nextId: 1 }

// ─── Context setup for integration tests ──────────────────────────────────────

const StateCtx = createContext<State>(initial)
const DispatchCtx = createContext<React.Dispatch<Action>>(() => {})

function useRenderCount() {
  const ref = useRef(0)
  ref.current++
  return ref.current
}

const DispatchOnly = memo(function DispatchOnly({ id }: { id: string }) {
  useContext(DispatchCtx)
  const renders = useRenderCount()
  return <div data-testid={id} data-renders={renders}>dp</div>
})

function StateOnly({ id }: { id: string }) {
  const { count } = useContext(StateCtx)
  const renders = useRenderCount()
  return <div data-testid={id} data-renders={renders}>{count}</div>
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('04 · Reducer — pure reducer + context split', () => {
  // ── Pure reducer tests ───────────────────────────────────────────────────

  it('INC increments count', () => {
    expect(reducer(initial, { type: 'INC' }).count).toBe(1)
  })

  it('DEC decrements count', () => {
    const s = reducer({ ...initial, count: 5 }, { type: 'DEC' })
    expect(s.count).toBe(4)
  })

  it('RESET zeroes count', () => {
    const s = reducer({ ...initial, count: 99 }, { type: 'RESET' })
    expect(s.count).toBe(0)
  })

  it('ADD_TODO appends and increments nextId', () => {
    const s = reducer(initial, { type: 'ADD_TODO', text: 'write tests' })
    expect(s.todos).toHaveLength(1)
    expect(s.todos[0]).toEqual({ id: 1, text: 'write tests', done: false })
    expect(s.nextId).toBe(2)
  })

  it('TOGGLE_TODO flips done flag for matching id', () => {
    const withTodo = reducer(initial, { type: 'ADD_TODO', text: 'test' })
    const toggled = reducer(withTodo, { type: 'TOGGLE_TODO', id: 1 })
    expect(toggled.todos[0].done).toBe(true)
    const untoggled = reducer(toggled, { type: 'TOGGLE_TODO', id: 1 })
    expect(untoggled.todos[0].done).toBe(false)
  })

  it('TOGGLE_TODO does not mutate other todos', () => {
    let s = reducer(initial, { type: 'ADD_TODO', text: 'a' })
    s = reducer(s, { type: 'ADD_TODO', text: 'b' })
    s = reducer(s, { type: 'TOGGLE_TODO', id: 1 })
    expect(s.todos[1].done).toBe(false)
  })

  it('REMOVE_TODO removes only the matching id', () => {
    let s = reducer(initial, { type: 'ADD_TODO', text: 'a' })
    s = reducer(s, { type: 'ADD_TODO', text: 'b' })
    s = reducer(s, { type: 'REMOVE_TODO', id: 1 })
    expect(s.todos).toHaveLength(1)
    expect(s.todos[0].text).toBe('b')
  })

  it('reducer is pure: does not mutate input state', () => {
    const before = { ...initial, count: 5 }
    const after = reducer(before, { type: 'INC' })
    expect(before.count).toBe(5)   // original unchanged
    expect(after.count).toBe(6)
    expect(before).not.toBe(after) // different references
  })

  it('unknown action returns state unchanged', () => {
    const s = reducer(initial, { type: 'UNKNOWN' } as unknown as Action)
    expect(s).toBe(initial)
  })

  // ── Context split integration tests ─────────────────────────────────────

  it('StateOnly re-renders on dispatch; DispatchOnly does not', () => {
    function Root() {
      const [state, dispatch] = useReducer(reducer, initial)
      return (
        <StateCtx.Provider value={state}>
          <DispatchCtx.Provider value={dispatch}>
            <StateOnly id="s" />
            <DispatchOnly id="d" />
            <button onClick={() => dispatch({ type: 'INC' })}>inc</button>
          </DispatchCtx.Provider>
        </StateCtx.Provider>
      )
    }
    render(<Root />)
    fireEvent.click(screen.getByText('inc'))
    fireEvent.click(screen.getByText('inc'))
    expect(screen.getByTestId('s').getAttribute('data-renders')).toBe('3')
    // DispatchCtx value = useReducer dispatch (stable ref) → DispatchOnly never re-renders
    expect(screen.getByTestId('d').getAttribute('data-renders')).toBe('1')
  })

  it('useReducer dispatch ref is stable across state changes', () => {
    const dispatchRefs: unknown[] = []

    function Inspector() {
      const dispatch = useContext(DispatchCtx)
      dispatchRefs.push(dispatch)
      return null
    }

    function Root() {
      const [state, dispatch] = useReducer(reducer, initial)
      return (
        <StateCtx.Provider value={state}>
          <DispatchCtx.Provider value={dispatch}>
            <Inspector />
            <button onClick={() => dispatch({ type: 'INC' })}>inc</button>
          </DispatchCtx.Provider>
        </StateCtx.Provider>
      )
    }
    render(<Root />)
    // Inspector renders because StateCtx changes but DispatchCtx doesn't trigger it
    // Force additional StateCtx changes to verify dispatch ref stability
    fireEvent.click(screen.getByText('inc'))
    fireEvent.click(screen.getByText('inc'))
    // All captured dispatch refs should be the same function reference
    const unique = new Set(dispatchRefs)
    expect(unique.size).toBe(1)
  })
})
