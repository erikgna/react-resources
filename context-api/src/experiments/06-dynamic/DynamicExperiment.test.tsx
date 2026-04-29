import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { createContext, useContext, useState, useRef, useEffect, memo } from 'react'

// ─── Contexts ─────────────────────────────────────────────────────────────────

const TickCtx  = createContext(0)
const InputCtx = createContext('')

function useRenderCount() {
  const ref = useRef(0)
  ref.current++
  return ref.current
}

function TickConsumer({ id }: { id: string }) {
  const tick = useContext(TickCtx)
  const renders = useRenderCount()
  return <div data-testid={id} data-renders={renders} data-tick={tick}>{tick}</div>
}

function InputMirror({ id }: { id: string }) {
  const val = useContext(InputCtx)
  const renders = useRenderCount()
  return <div data-testid={id} data-renders={renders}>{val}</div>
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('06 · Dynamic — high-frequency updates + keystroke context', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('TickConsumer re-renders on every tick', () => {
    function Parent() {
      const [tick, setTick] = useState(0)
      return (
        <TickCtx.Provider value={tick}>
          <TickConsumer id="t" />
          <button onClick={() => setTick(n => n + 1)}>inc</button>
        </TickCtx.Provider>
      )
    }
    render(<Parent />)
    fireEvent.click(screen.getByText('inc'))
    fireEvent.click(screen.getByText('inc'))
    fireEvent.click(screen.getByText('inc'))
    const el = screen.getByTestId('t')
    expect(el).toHaveTextContent('3')
    expect(el.getAttribute('data-renders')).toBe('4') // mount + 3 updates
  })

  it('multiple TickConsumers each re-render per tick', () => {
    function Parent() {
      const [tick, setTick] = useState(0)
      return (
        <TickCtx.Provider value={tick}>
          <TickConsumer id="t1" />
          <TickConsumer id="t2" />
          <TickConsumer id="t3" />
          <button onClick={() => setTick(n => n + 1)}>inc</button>
        </TickCtx.Provider>
      )
    }
    render(<Parent />)
    fireEvent.click(screen.getByText('inc'))
    fireEvent.click(screen.getByText('inc'))
    ;['t1', 't2', 't3'].forEach(id => {
      expect(screen.getByTestId(id).getAttribute('data-renders')).toBe('3')
    })
  })

  it('auto-tick via setInterval: consumers update on each interval fire', () => {
    function Parent() {
      const [tick, setTick] = useState(0)
      const [running, setRunning] = useState(false)

      useEffect(() => {
        if (!running) return
        const id = setInterval(() => setTick(t => t + 1), 100)
        return () => clearInterval(id)
      }, [running])

      return (
        <TickCtx.Provider value={tick}>
          <TickConsumer id="t" />
          <button onClick={() => setRunning(true)}>start</button>
        </TickCtx.Provider>
      )
    }
    render(<Parent />)
    fireEvent.click(screen.getByText('start'))
    act(() => { vi.advanceTimersByTime(500) })
    const el = screen.getByTestId('t')
    expect(Number(el.getAttribute('data-tick'))).toBeGreaterThanOrEqual(4)
  })

  it('InputMirror re-renders on every character change', () => {
    function Parent() {
      const [val, setVal] = useState('')
      return (
        <InputCtx.Provider value={val}>
          <InputMirror id="m" />
          <input data-testid="inp" onChange={e => setVal(e.target.value)} />
        </InputCtx.Provider>
      )
    }
    render(<Parent />)
    // fireEvent.change avoids userEvent + fake-timers conflicts
    fireEvent.change(screen.getByTestId('inp'), { target: { value: 'a' } })
    fireEvent.change(screen.getByTestId('inp'), { target: { value: 'ab' } })
    fireEvent.change(screen.getByTestId('inp'), { target: { value: 'abc' } })
    const mirror = screen.getByTestId('m')
    expect(mirror).toHaveTextContent('abc')
    expect(Number(mirror.getAttribute('data-renders'))).toBeGreaterThanOrEqual(4)
  })

  it('multiple InputMirrors multiply render cost per keystroke', () => {
    function Parent() {
      const [val, setVal] = useState('')
      return (
        <InputCtx.Provider value={val}>
          <InputMirror id="m1" />
          <InputMirror id="m2" />
          <input data-testid="inp" onChange={e => setVal(e.target.value)} />
        </InputCtx.Provider>
      )
    }
    render(<Parent />)
    fireEvent.change(screen.getByTestId('inp'), { target: { value: 'h' } })
    fireEvent.change(screen.getByTestId('inp'), { target: { value: 'hi' } })
    ;['m1', 'm2'].forEach(id => {
      expect(Number(screen.getByTestId(id).getAttribute('data-renders'))).toBeGreaterThanOrEqual(3)
    })
  })

  it('InputMirror does not re-render when unrelated state changes', () => {
    const stableInput = 'hello'
    // memo required: blocks parent-cascade re-renders so only context-triggered ones count
    const MemoMirror = memo(InputMirror)
    function Parent() {
      const [, setOther] = useState(0)
      return (
        <InputCtx.Provider value={stableInput}>
          <MemoMirror id="m" />
          <button onClick={() => setOther(n => n + 1)}>tick</button>
        </InputCtx.Provider>
      )
    }
    render(<Parent />)
    fireEvent.click(screen.getByText('tick'))
    fireEvent.click(screen.getByText('tick'))
    // InputCtx is a stable string → no context-triggered re-render; memo blocks parent cascade
    expect(screen.getByTestId('m').getAttribute('data-renders')).toBe('1')
  })
})
