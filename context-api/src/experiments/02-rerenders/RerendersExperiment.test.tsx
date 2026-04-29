import { describe, it, expect, vi } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { createContext, useContext, useRef, useState, memo } from 'react'

// ─── Render counter hook ──────────────────────────────────────────────────────

function useRenderCount() {
  const ref = useRef(0)
  ref.current++
  return ref.current
}

// ─── Contexts ─────────────────────────────────────────────────────────────────

const CountCtx = createContext(0)
const ObjCtx = createContext<{ a: number; b: number }>({ a: 0, b: 0 })

// ─── Helpers ──────────────────────────────────────────────────────────────────

function CountConsumer({ id }: { id: string }) {
  const count = useContext(CountCtx)
  const renders = useRenderCount()
  return <div data-testid={id} data-renders={renders}>{count}</div>
}

function NoCtxSibling({ id }: { id: string }) {
  const renders = useRenderCount()
  return <div data-testid={id} data-renders={renders}>static</div>
}

const MemoNoCtx = memo(function MemoNoCtx({ id }: { id: string }) {
  const renders = useRenderCount()
  return <div data-testid={id} data-renders={renders}>memoized</div>
})

function ObjConsumerA({ id }: { id: string }) {
  const { a } = useContext(ObjCtx)
  const renders = useRenderCount()
  return <div data-testid={id} data-renders={renders}>{a}</div>
}

function ObjConsumerB({ id }: { id: string }) {
  const { b } = useContext(ObjCtx)
  const renders = useRenderCount()
  return <div data-testid={id} data-renders={renders}>{b}</div>
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('02 · Re-renders — context subscription behavior', () => {
  it('consumer re-renders when context value changes', () => {
    function Parent() {
      const [count, setCount] = useState(0)
      return (
        <CountCtx.Provider value={count}>
          <CountConsumer id="c" />
          <button onClick={() => setCount(n => n + 1)}>inc</button>
        </CountCtx.Provider>
      )
    }
    render(<Parent />)
    const el = screen.getByTestId('c')
    expect(el).toHaveTextContent('0')
    expect(el.getAttribute('data-renders')).toBe('1')
    fireEvent.click(screen.getByText('inc'))
    expect(el).toHaveTextContent('1')
    expect(el.getAttribute('data-renders')).toBe('2')
  })

  it('two consumers both re-render when shared context changes', () => {
    function Parent() {
      const [count, setCount] = useState(0)
      return (
        <CountCtx.Provider value={count}>
          <CountConsumer id="c1" />
          <CountConsumer id="c2" />
          <button onClick={() => setCount(n => n + 1)}>inc</button>
        </CountCtx.Provider>
      )
    }
    render(<Parent />)
    fireEvent.click(screen.getByText('inc'))
    fireEvent.click(screen.getByText('inc'))
    expect(screen.getByTestId('c1').getAttribute('data-renders')).toBe('3')
    expect(screen.getByTestId('c2').getAttribute('data-renders')).toBe('3')
  })

  it('component without useContext does not re-render due to context change', () => {
    // NoCtxSibling re-renders only because parent re-renders (same parent),
    // but when wrapped in memo it is shielded from parent re-renders
    function Parent() {
      const [count, setCount] = useState(0)
      return (
        <CountCtx.Provider value={count}>
          <MemoNoCtx id="m" />
          <button onClick={() => setCount(n => n + 1)}>inc</button>
        </CountCtx.Provider>
      )
    }
    render(<Parent />)
    fireEvent.click(screen.getByText('inc'))
    fireEvent.click(screen.getByText('inc'))
    // MemoNoCtx has no useContext + React.memo → only renders once (initial)
    expect(screen.getByTestId('m').getAttribute('data-renders')).toBe('1')
  })

  it('React.memo does NOT block context-triggered re-renders', () => {
    const MemoWithCtx = memo(function MemoWithCtx({ id }: { id: string }) {
      const count = useContext(CountCtx)
      const renders = useRenderCount()
      return <div data-testid={id} data-renders={renders}>{count}</div>
    })

    function Parent() {
      const [count, setCount] = useState(0)
      return (
        <CountCtx.Provider value={count}>
          <MemoWithCtx id="mwc" />
          <button onClick={() => setCount(n => n + 1)}>inc</button>
        </CountCtx.Provider>
      )
    }
    render(<Parent />)
    fireEvent.click(screen.getByText('inc'))
    fireEvent.click(screen.getByText('inc'))
    // memo + useContext → re-renders on every context change (3 total: mount + 2 updates)
    expect(screen.getByTestId('mwc').getAttribute('data-renders')).toBe('3')
  })

  it('unstable object ref causes re-render even when values are identical', () => {
    function Parent() {
      const [, tick] = useState(0)
      // New object every render even if values same
      const val = { a: 1, b: 2 }
      return (
        <ObjCtx.Provider value={val}>
          <ObjConsumerA id="a" />
          <ObjConsumerB id="b" />
          <button onClick={() => tick(n => n + 1)}>tick</button>
        </ObjCtx.Provider>
      )
    }
    render(<Parent />)
    fireEvent.click(screen.getByText('tick'))
    fireEvent.click(screen.getByText('tick'))
    // Inline object = new ref every render → all consumers re-render
    expect(Number(screen.getByTestId('a').getAttribute('data-renders'))).toBeGreaterThanOrEqual(3)
    expect(Number(screen.getByTestId('b').getAttribute('data-renders'))).toBeGreaterThanOrEqual(3)
  })

  it('consumer does NOT re-render when context value reference is stable', () => {
    const stableVal = { a: 1, b: 2 }
    // memo required: without it consumer re-renders because parent re-renders.
    // This tests ONLY the context-triggered re-render path — memo blocks parent cascade.
    const MemoConsumerA = memo(ObjConsumerA)
    function Parent() {
      const [, tick] = useState(0)
      return (
        <ObjCtx.Provider value={stableVal}>
          <MemoConsumerA id="a" />
          <button onClick={() => tick(n => n + 1)}>tick</button>
        </ObjCtx.Provider>
      )
    }
    render(<Parent />)
    fireEvent.click(screen.getByText('tick'))
    fireEvent.click(screen.getByText('tick'))
    // Same object ref → ObjCtx value unchanged → no context-triggered re-render.
    // memo blocks parent-triggered re-render → stays at 1.
    expect(screen.getByTestId('a').getAttribute('data-renders')).toBe('1')
  })
})
