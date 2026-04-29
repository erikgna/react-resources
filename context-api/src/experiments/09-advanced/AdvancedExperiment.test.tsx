import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  createContext, useContext, useState, useRef, useMemo,
  useCallback, memo, useEffect,
} from 'react'
import React from 'react'

// ═══════════════════════════════════════════════════════════════════════════════
// Pub-Sub Store (extracted from 09-advanced — pure logic)
// ═══════════════════════════════════════════════════════════════════════════════

type Listener = () => void
type Store<S> = {
  getState: () => S
  setState: (next: Partial<S>) => void
  subscribe: (fn: Listener) => () => void
}

function createStore<S>(initial: S): Store<S> {
  let state = initial
  const listeners = new Set<Listener>()
  return {
    getState: () => state,
    setState: (next) => { state = { ...state, ...next }; listeners.forEach(fn => fn()) },
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn) },
  }
}

// ─── Accordion (Compound Component) ──────────────────────────────────────────

type AccordionVal = { openId: string | null; toggle: (id: string) => void }
const AccordionCtx = createContext<AccordionVal>({ openId: null, toggle: () => {} })

function Accordion({ children }: { children: React.ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const toggle = useCallback((id: string) => setOpenId(prev => prev === id ? null : id), [])
  const ctx = useMemo(() => ({ openId, toggle }), [openId, toggle])
  return <AccordionCtx.Provider value={ctx}><div>{children}</div></AccordionCtx.Provider>
}

function AccordionItem({ id, title }: { id: string; title: string }) {
  const { openId, toggle } = useContext(AccordionCtx)
  const isOpen = openId === id
  return (
    <div>
      <button onClick={() => toggle(id)} data-testid={`btn-${id}`}>{title}</button>
      {isOpen && <div data-testid={`content-${id}`}>{title}-content</div>}
    </div>
  )
}

// ─── Dependency Injection (Logger) ───────────────────────────────────────────

type Logger = { log: (msg: string) => void; logs: string[] }
const LoggerCtx = createContext<Logger>({ log: () => {}, logs: [] })

function ServiceComponent({ name }: { name: string }) {
  const { log } = useContext(LoggerCtx)
  return <button data-testid={`log-${name}`} onClick={() => log(`${name}-action`)}>log</button>
}

function LogDisplay() {
  const { logs } = useContext(LoggerCtx)
  return <div data-testid="logs">{logs.join(',')}</div>
}

// ─── Selector Hook ────────────────────────────────────────────────────────────

type PubSubState = { x: number; y: number }

const PubSubCtx = createContext<Store<PubSubState> | null>(null)

function usePubSubSelector<T>(selector: (s: PubSubState) => T): T {
  const store = useContext(PubSubCtx)!
  const [value, setValue] = useState(() => selector(store.getState()))
  const selectorRef = useRef(selector)
  selectorRef.current = selector
  useEffect(() => {
    return store.subscribe(() => {
      const next = selectorRef.current(store.getState())
      setValue(prev => Object.is(prev, next) ? prev : next)
    })
  }, [store])
  return value
}

function useRenderCount() {
  const ref = useRef(0)
  ref.current++
  return ref.current
}

function PubSubX({ id }: { id: string }) {
  const x = usePubSubSelector(s => s.x)
  const renders = useRenderCount()
  return <div data-testid={id} data-renders={renders}>{x}</div>
}

function PubSubY({ id }: { id: string }) {
  const y = usePubSubSelector(s => s.y)
  const renders = useRenderCount()
  return <div data-testid={id} data-renders={renders}>{y}</div>
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('09 · Advanced — pub-sub store, compound component, DI', () => {
  // ── Pure pub-sub store unit tests ─────────────────────────────────────────

  it('store: getState returns initial state', () => {
    const store = createStore({ x: 5, y: 10 })
    expect(store.getState()).toEqual({ x: 5, y: 10 })
  })

  it('store: setState merges partial update', () => {
    const store = createStore({ x: 0, y: 0 })
    store.setState({ x: 42 })
    expect(store.getState()).toEqual({ x: 42, y: 0 })
  })

  it('store: setState fires all listeners', () => {
    const store = createStore({ x: 0, y: 0 })
    const l1 = vi.fn()
    const l2 = vi.fn()
    store.subscribe(l1)
    store.subscribe(l2)
    store.setState({ x: 1 })
    expect(l1).toHaveBeenCalledOnce()
    expect(l2).toHaveBeenCalledOnce()
  })

  it('store: unsubscribe removes listener', () => {
    const store = createStore({ x: 0, y: 0 })
    const listener = vi.fn()
    const unsub = store.subscribe(listener)
    unsub()
    store.setState({ x: 1 })
    expect(listener).not.toHaveBeenCalled()
  })

  it('store: multiple setState calls accumulate', () => {
    const store = createStore({ x: 0, y: 0 })
    store.setState({ x: 1 })
    store.setState({ x: 2 })
    store.setState({ y: 7 })
    expect(store.getState()).toEqual({ x: 2, y: 7 })
  })

  it('store: setState does not mutate previous state', () => {
    const store = createStore({ x: 0, y: 0 })
    const prev = store.getState()
    store.setState({ x: 1 })
    expect(prev.x).toBe(0)
    expect(store.getState().x).toBe(1)
    expect(prev).not.toBe(store.getState())
  })

  // ── Selector subscription tests ───────────────────────────────────────────

  it('selector: X consumer re-renders only when x changes', () => {
    const store = createStore<PubSubState>({ x: 0, y: 0 })
    render(
      <PubSubCtx.Provider value={store}>
        <PubSubX id="x" />
        <PubSubY id="y" />
      </PubSubCtx.Provider>
    )
    act(() => { store.setState({ x: 1 }) })
    act(() => { store.setState({ x: 2 }) })
    expect(screen.getByTestId('x').getAttribute('data-renders')).toBe('3')
    // Y selector returns same value (y=0 unchanged) → no re-render
    expect(screen.getByTestId('y').getAttribute('data-renders')).toBe('1')
  })

  it('selector: Y consumer re-renders only when y changes', () => {
    const store = createStore<PubSubState>({ x: 0, y: 0 })
    render(
      <PubSubCtx.Provider value={store}>
        <PubSubX id="x" />
        <PubSubY id="y" />
      </PubSubCtx.Provider>
    )
    act(() => { store.setState({ y: 5 }) })
    act(() => { store.setState({ y: 6 }) })
    expect(screen.getByTestId('x').getAttribute('data-renders')).toBe('1')
    expect(screen.getByTestId('y').getAttribute('data-renders')).toBe('3')
  })

  it('selector: both consumers re-render when both slices change', () => {
    const store = createStore<PubSubState>({ x: 0, y: 0 })
    render(
      <PubSubCtx.Provider value={store}>
        <PubSubX id="x" />
        <PubSubY id="y" />
      </PubSubCtx.Provider>
    )
    act(() => { store.setState({ x: 1, y: 1 }) })
    expect(screen.getByTestId('x').getAttribute('data-renders')).toBe('2')
    expect(screen.getByTestId('y').getAttribute('data-renders')).toBe('2')
  })

  // ── Compound component (Accordion) tests ─────────────────────────────────

  it('accordion: first item closed by default', () => {
    render(
      <Accordion>
        <AccordionItem id="a" title="Section A" />
        <AccordionItem id="b" title="Section B" />
      </Accordion>
    )
    expect(screen.queryByTestId('content-a')).toBeNull()
    expect(screen.queryByTestId('content-b')).toBeNull()
  })

  it('accordion: clicking item opens it', async () => {
    render(
      <Accordion>
        <AccordionItem id="a" title="Section A" />
      </Accordion>
    )
    await userEvent.click(screen.getByTestId('btn-a'))
    expect(screen.getByTestId('content-a')).toBeInTheDocument()
  })

  it('accordion: clicking same item twice closes it', async () => {
    render(
      <Accordion>
        <AccordionItem id="a" title="Section A" />
      </Accordion>
    )
    await userEvent.click(screen.getByTestId('btn-a'))
    await userEvent.click(screen.getByTestId('btn-a'))
    expect(screen.queryByTestId('content-a')).toBeNull()
  })

  it('accordion: only one item open at a time', async () => {
    render(
      <Accordion>
        <AccordionItem id="a" title="A" />
        <AccordionItem id="b" title="B" />
        <AccordionItem id="c" title="C" />
      </Accordion>
    )
    await userEvent.click(screen.getByTestId('btn-a'))
    expect(screen.getByTestId('content-a')).toBeInTheDocument()

    await userEvent.click(screen.getByTestId('btn-b'))
    expect(screen.queryByTestId('content-a')).toBeNull()
    expect(screen.getByTestId('content-b')).toBeInTheDocument()
  })

  // ── Dependency Injection tests ────────────────────────────────────────────

  it('DI: component uses injected logger', async () => {
    const logs: string[] = []
    const logger: Logger = { log: (msg) => logs.push(msg), logs }

    render(
      <LoggerCtx.Provider value={logger}>
        <ServiceComponent name="Auth" />
      </LoggerCtx.Provider>
    )
    await userEvent.click(screen.getByTestId('log-Auth'))
    expect(logs).toContain('Auth-action')
  })

  it('DI: swap logger implementation — test logger captures calls', async () => {
    function Parent() {
      const [logs, setLogs] = useState<string[]>([])
      const logger = useMemo<Logger>(
        () => ({ log: (msg) => setLogs(l => [...l, msg]), logs }),
        [logs]
      )
      return (
        <LoggerCtx.Provider value={logger}>
          <ServiceComponent name="Cart" />
          <LogDisplay />
        </LoggerCtx.Provider>
      )
    }

    render(<Parent />)
    await userEvent.click(screen.getByTestId('log-Cart'))
    await userEvent.click(screen.getByTestId('log-Cart'))
    expect(screen.getByTestId('logs')).toHaveTextContent('Cart-action,Cart-action')
  })

  it('DI: noop logger (default ctx) receives calls without error', async () => {
    render(<ServiceComponent name="Noop" />)
    // No Provider — uses default noop logger. Should not throw.
    await userEvent.click(screen.getByTestId('log-Noop'))
    // No assertion needed — just confirming no throw
  })
})
