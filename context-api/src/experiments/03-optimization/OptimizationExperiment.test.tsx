import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createContext, useContext, useMemo, useCallback, useRef, useState, memo, useReducer } from 'react'

// ─── Render counter ───────────────────────────────────────────────────────────

function useRenderCount() {
  const ref = useRef(0)
  ref.current++
  return ref.current
}

// ─── Split contexts ───────────────────────────────────────────────────────────

const CountCtx = createContext(0)
const NameCtx = createContext('')

// memo is required for bailout tests: without it, consumer re-renders because
// parent re-renders when state changes, not because context changed.
// memo blocks parent-cascade re-renders so only context-triggered ones show.
const CountOnly = memo(function CountOnly({ id }: { id: string }) {
  const count = useContext(CountCtx)
  const renders = useRenderCount()
  return <div data-testid={id} data-renders={renders}>{count}</div>
})

const NameOnly = memo(function NameOnly({ id }: { id: string }) {
  const name = useContext(NameCtx)
  const renders = useRenderCount()
  return <div data-testid={id} data-renders={renders}>{name}</div>
})

// ─── Memoized value context ───────────────────────────────────────────────────

type FatVal = { x: number; y: number }
const FatCtx = createContext<FatVal>({ x: 0, y: 0 })

const FatConsumer = memo(function FatConsumer({ id }: { id: string }) {
  const { x } = useContext(FatCtx)
  const renders = useRenderCount()
  return <div data-testid={id} data-renders={renders}>{x}</div>
})

// ─── Stable dispatch ──────────────────────────────────────────────────────────

type Action = { type: 'INC' | 'DEC' }
const DispatchCtx = createContext<(a: Action) => void>(() => {})

const DispatchConsumer = memo(function DispatchConsumer({ id }: { id: string }) {
  useContext(DispatchCtx)  // subscribe but only use dispatch
  const renders = useRenderCount()
  return <div data-testid={id} data-renders={renders}>dispatch-consumer</div>
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('03 · Optimization — useMemo, split contexts, stable dispatch', () => {
  it('split ctx: changing count does NOT re-render name consumer', () => {
    function Parent() {
      const [count, setCount] = useState(0)
      const [name] = useState('alice')
      return (
        <CountCtx.Provider value={count}>
          <NameCtx.Provider value={name}>
            <CountOnly id="count" />
            <NameOnly id="name" />
            <button onClick={() => setCount(n => n + 1)}>inc</button>
          </NameCtx.Provider>
        </CountCtx.Provider>
      )
    }
    render(<Parent />)
    fireEvent.click(screen.getByText('inc'))
    fireEvent.click(screen.getByText('inc'))
    expect(screen.getByTestId('count').getAttribute('data-renders')).toBe('3')
    // NameCtx never changed → NameOnly stays at 1 render
    expect(screen.getByTestId('name').getAttribute('data-renders')).toBe('1')
  })

  it('split ctx: changing name does NOT re-render count consumer', () => {
    function Parent() {
      const [count] = useState(0)
      const [name, setName] = useState('alice')
      return (
        <CountCtx.Provider value={count}>
          <NameCtx.Provider value={name}>
            <CountOnly id="count" />
            <NameOnly id="name" />
            <button onClick={() => setName(n => n === 'alice' ? 'bob' : 'alice')}>toggle</button>
          </NameCtx.Provider>
        </CountCtx.Provider>
      )
    }
    render(<Parent />)
    fireEvent.click(screen.getByText('toggle'))
    fireEvent.click(screen.getByText('toggle'))
    // CountCtx never changed → CountOnly stays at 1 render
    expect(screen.getByTestId('count').getAttribute('data-renders')).toBe('1')
    expect(screen.getByTestId('name').getAttribute('data-renders')).toBe('3')
  })

  it('useMemo: same deps → same object ref → consumer does not re-render', () => {
    function Parent() {
      const [x, setX] = useState(0)
      const [unrelated, setUnrelated] = useState(0)
      const val = useMemo<FatVal>(() => ({ x, y: 0 }), [x])
      return (
        <FatCtx.Provider value={val}>
          <FatConsumer id="f" />
          <button onClick={() => setUnrelated(n => n + 1)}>tick</button>
          <button onClick={() => setX(n => n + 1)}>inc-x</button>
        </FatCtx.Provider>
      )
    }
    render(<Parent />)
    fireEvent.click(screen.getByText('tick'))
    fireEvent.click(screen.getByText('tick'))
    // x unchanged → useMemo returns same ref → FatConsumer stays at 1
    expect(screen.getByTestId('f').getAttribute('data-renders')).toBe('1')
    fireEvent.click(screen.getByText('inc-x'))
    // x changed → new ref → FatConsumer re-renders
    expect(screen.getByTestId('f').getAttribute('data-renders')).toBe('2')
  })

  it('useMemo: different deps → new object ref → consumer re-renders', () => {
    function Parent() {
      const [x, setX] = useState(0)
      const val = useMemo<FatVal>(() => ({ x, y: 0 }), [x])
      return (
        <FatCtx.Provider value={val}>
          <FatConsumer id="f" />
          <button onClick={() => setX(n => n + 1)}>inc</button>
        </FatCtx.Provider>
      )
    }
    render(<Parent />)
    fireEvent.click(screen.getByText('inc'))
    fireEvent.click(screen.getByText('inc'))
    expect(screen.getByTestId('f').getAttribute('data-renders')).toBe('3')
  })

  it('useCallback dispatch: memoized consumer subscribed to dispatch-only ctx never re-renders on state change', () => {
    function Parent() {
      const [, setState] = useState(0)
      const dispatch = useCallback((_a: Action) => {}, [])
      return (
        <DispatchCtx.Provider value={dispatch}>
          <DispatchConsumer id="d" />
          <button onClick={() => setState(n => n + 1)}>tick</button>
        </DispatchCtx.Provider>
      )
    }
    render(<Parent />)
    fireEvent.click(screen.getByText('tick'))
    fireEvent.click(screen.getByText('tick'))
    // DispatchCtx value (dispatch fn) is stable → DispatchConsumer never re-renders
    expect(screen.getByTestId('d').getAttribute('data-renders')).toBe('1')
  })

  it('without useCallback: new dispatch fn each render → memoized consumer re-renders', () => {
    function Parent() {
      const [, setState] = useState(0)
      // No useCallback → new function each render
      const dispatch = (_a: Action) => {}
      return (
        <DispatchCtx.Provider value={dispatch}>
          <DispatchConsumer id="d" />
          <button onClick={() => setState(n => n + 1)}>tick</button>
        </DispatchCtx.Provider>
      )
    }
    render(<Parent />)
    fireEvent.click(screen.getByText('tick'))
    fireEvent.click(screen.getByText('tick'))
    // New function ref = new context value → DispatchConsumer re-renders despite memo
    expect(Number(screen.getByTestId('d').getAttribute('data-renders'))).toBeGreaterThanOrEqual(3)
  })
})
