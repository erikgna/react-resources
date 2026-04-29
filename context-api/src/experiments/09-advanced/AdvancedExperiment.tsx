import {
  createContext, useContext, useState, useRef, useMemo,
  useCallback, memo, useEffect,
} from 'react'
import { Section, Row, Btn, Info, Pre, Box, ui } from '../shared'
import React from 'react'

// ─── Render counter ───────────────────────────────────────────────────────────

function useRenderCount() {
  const ref = useRef(0)
  ref.current += 1
  return ref.current
}

// ═══════════════════════════════════════════════════════════════════════════════
// 9.1 CONTEXT SELECTOR PATTERN — manual, no libraries
// Problem: useContext subscribes to entire value, no field-level bailout
// Solution: wrap useContext with a selector + ref equality check
// ═══════════════════════════════════════════════════════════════════════════════

type AppState = { a: number; b: number; c: number }
const SelectorCtx = createContext<AppState>({ a: 0, b: 0, c: 0 })

function useSelector<T>(ctx: typeof SelectorCtx, selector: (s: AppState) => T): T {
  const [selected, setSelected] = useState(() => selector(useContext(ctx)))
  const selectorRef = useRef(selector)
  selectorRef.current = selector
  const fullValue = useContext(ctx)
  const prevRef = useRef<T>(selected)

  const next = selectorRef.current(fullValue)
  if (!Object.is(prevRef.current, next)) {
    prevRef.current = next
    // Can't call setState here (render phase) — we need useEffect + external store
    // This naive approach still re-renders on context change, just returns stable value
  }
  return selectorRef.current(fullValue)
}

// Better approach: pub-sub store (see section 9.4)

// Simple version: wrap in memo with explicit prop
const SelectorConsumerA = memo(function SelectorConsumerA({ a }: { a: number }) {
  const renders = useRenderCount()
  return <Box name="selector-A (memo+prop)" renders={renders}>a:{a}</Box>
})

const SelectorConsumerB = memo(function SelectorConsumerB({ b }: { b: number }) {
  const renders = useRenderCount()
  return <Box name="selector-B (memo+prop)" renders={renders}>b:{b}</Box>
})

// Bridge component — subscribes to full ctx, passes field as stable prop
function SelectorBridge() {
  const { a, b } = useContext(SelectorCtx)
  const renders = useRenderCount()
  return (
    <>
      <div style={{ fontSize: 10, color: '#555', marginBottom: 6 }}>Bridge [r:{renders}] — renders on all changes</div>
      <Row>
        <SelectorConsumerA a={a} />
        <SelectorConsumerB b={b} />
      </Row>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 9.2 COMPOUND COMPONENT PATTERN — implicit state via context
// ═══════════════════════════════════════════════════════════════════════════════

type AccordionCtx = { openId: string | null; toggle: (id: string) => void }
const AccordionContext = createContext<AccordionCtx>({ openId: null, toggle: () => {} })

function Accordion({ children }: { children: React.ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const toggle = useCallback((id: string) => {
    setOpenId(prev => prev === id ? null : id)
  }, [])
  const ctx = useMemo(() => ({ openId, toggle }), [openId, toggle])
  return (
    <AccordionContext.Provider value={ctx}>
      <div style={{ border: '1px solid #1e1e1e', borderRadius: 4, overflow: 'hidden' }}>
        {children}
      </div>
    </AccordionContext.Provider>
  )
}

function AccordionItem({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  const { openId, toggle } = useContext(AccordionContext)
  const isOpen = openId === id
  return (
    <div style={{ borderBottom: '1px solid #1e1e1e' }}>
      <button
        onClick={() => toggle(id)}
        style={{
          display: 'block', width: '100%', textAlign: 'left',
          padding: '10px 14px', background: isOpen ? '#1e1e1e' : 'transparent',
          border: 'none', color: isOpen ? '#e0e0e0' : '#888',
          fontSize: 13, borderLeft: `2px solid ${isOpen ? '#4a9eff' : 'transparent'}`,
        }}
      >
        {isOpen ? '▼' : '▶'} {title}
      </button>
      {isOpen && (
        <div style={{ padding: '8px 14px 12px', fontSize: 12, color: '#aaa', borderTop: '1px solid #1a1a1a' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 9.3 DEPENDENCY INJECTION via context
// ═══════════════════════════════════════════════════════════════════════════════

type Logger = { log: (msg: string) => void; logs: string[] }
const LoggerCtx = createContext<Logger>({ log: console.log, logs: [] })

function useLogger() { return useContext(LoggerCtx) }

function ServiceConsumer({ name }: { name: string }) {
  const logger = useLogger()
  return (
    <Btn onClick={() => logger.log(`[${name}] action at ${new Date().toISOString().slice(11, 19)}`)}>
      {name}: log
    </Btn>
  )
}

function LogDisplay() {
  const { logs } = useLogger()
  return (
    <div style={{
      background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 3,
      padding: 10, maxHeight: 140, overflowY: 'auto', fontSize: 12, fontFamily: 'monospace',
    }}>
      {logs.length === 0
        ? <span style={{ color: '#333' }}>— no logs —</span>
        : logs.map((l, i) => <div key={i} style={{ color: '#7ec8a0', lineHeight: 1.5 }}>{l}</div>)
      }
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 9.4 MINIMAL PUB-SUB STORE — context without re-render on every update
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
    setState: (next) => {
      state = { ...state, ...next }
      listeners.forEach(fn => fn())
    },
    subscribe: (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
  }
}

type PubSubState = { x: number; y: number }
const pubSubStore = createStore<PubSubState>({ x: 0, y: 0 })
const PubSubCtx = createContext(pubSubStore)

function usePubSubSelector<T>(selector: (s: PubSubState) => T): T {
  const store = useContext(PubSubCtx)
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

function PubSubX() {
  const x = usePubSubSelector(s => s.x)
  const renders = useRenderCount()
  return <Box name="pubsub-X" renders={renders}>x:{x}</Box>
}

function PubSubY() {
  const y = usePubSubSelector(s => s.y)
  const renders = useRenderCount()
  return <Box name="pubsub-Y" renders={renders}>y:{y}</Box>
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdvancedExperiment() {
  const [selectorState, setSelectorState] = useState<AppState>({ a: 0, b: 0, c: 0 })
  const selectorCtxVal = useMemo(() => selectorState, [selectorState.a, selectorState.b, selectorState.c])

  const [logs, setLogs] = useState<string[]>([])
  const loggerVal = useMemo<Logger>(
    () => ({ log: (msg) => setLogs(l => [...l, msg]), logs }),
    [logs]
  )

  return (
    <div>
      <h2 style={ui.h2}>9 · Advanced Patterns</h2>
      <p style={ui.desc}>
        Context selector (bridge pattern), compound components, dependency injection,
        and a minimal pub-sub store that enables selector-based subscriptions.
      </p>

      <Section title="9.1 Context Selector — Bridge Pattern">
        <Info>
          True context selectors require an external store (see 9.4).
          The bridge pattern: a single "bridge" component subscribes to full context,
          then passes isolated fields as props to <code>React.memo</code> children.
          Bridge re-renders on every context change; memoized children only re-render when their prop changes.
        </Info>
        <Row style={{ marginBottom: 12 }}>
          <Btn onClick={() => setSelectorState(s => ({ ...s, a: s.a + 1 }))}>inc a ({selectorState.a})</Btn>
          <Btn onClick={() => setSelectorState(s => ({ ...s, b: s.b + 1 }))}>inc b ({selectorState.b})</Btn>
          <Btn onClick={() => setSelectorState(s => ({ ...s, c: s.c + 1 }))}>inc c (unwatched: {selectorState.c})</Btn>
        </Row>
        <SelectorCtx.Provider value={selectorCtxVal}>
          <SelectorBridge />
        </SelectorCtx.Provider>
        <Pre>{`// Bridge pattern:
// 1. Bridge subscribes to full context — re-renders on any change
// 2. Bridge passes fields as props to memo'd children
// 3. Memo children only re-render when their specific prop changes

function SelectorBridge() {
  const { a, b } = useContext(SelectorCtx)  // full subscription
  return (
    <>
      <ConsumerA a={a} />   // memo — only re-renders when a changes
      <ConsumerB b={b} />   // memo — only re-renders when b changes
    </>
  )
}

// True selector library (useSyncExternalStore) — see section 9.4`}</Pre>
      </Section>

      <Section title="9.2 Compound Component Pattern">
        <Info>
          <code>Accordion</code> manages open/close state internally via context.
          <code>AccordionItem</code> children communicate with the parent implicitly — no prop drilling.
          Consumer of the Accordion API never sees the internal state.
        </Info>
        <Accordion>
          <AccordionItem id="ctx" title="What is Context?">
            Context provides a way to pass data through the component tree without prop drilling.
            It's designed for data that is "global" for a tree of React components.
          </AccordionItem>
          <AccordionItem id="when" title="When to use Context?">
            Current locale, theme, authenticated user. Avoid for rapidly changing state.
            Split concerns: state that changes together should live in the same context.
          </AccordionItem>
          <AccordionItem id="alternatives" title="Alternatives">
            Zustand, Jotai, or useSyncExternalStore for selector-based subscriptions.
            Context excels at DI and low-frequency global state.
          </AccordionItem>
        </Accordion>
        <Pre>{`// Compound component: Accordion owns state, children access it via context
// Caller never handles open/close state — it's encapsulated
<Accordion>
  <AccordionItem id="a" title="Section A">content</AccordionItem>
  <AccordionItem id="b" title="Section B">content</AccordionItem>
</Accordion>

// Context is the "wire" between Accordion and AccordionItem — implicit coupling by design`}</Pre>
      </Section>

      <Section title="9.3 Dependency Injection via Context">
        <Info>
          Inject a Logger service via context. Swap implementations (real vs test logger)
          by changing the Provider value. Consumers depend on the interface, not the implementation.
          This is the React equivalent of constructor injection.
        </Info>
        <LoggerCtx.Provider value={loggerVal}>
          <Row style={{ marginBottom: 10 }}>
            <ServiceConsumer name="UserService" />
            <ServiceConsumer name="CartService" />
            <ServiceConsumer name="AuthService" />
            <Btn onClick={() => setLogs([])}>clear</Btn>
          </Row>
          <LogDisplay />
        </LoggerCtx.Provider>
        <Pre>{`// Context as DI container
const LoggerCtx = createContext<Logger>(noopLogger)

// In tests: swap with test logger
<LoggerCtx.Provider value={testLogger}>
  <ComponentUnderTest />
</LoggerCtx.Provider>

// Components depend on interface via useContext, not on concrete impl
function useLogger() { return useContext(LoggerCtx) }`}</Pre>
      </Section>

      <Section title="9.4 Pub-Sub Store — True Selector Subscriptions">
        <Info>
          External store + <code>useSyncExternalStore</code> pattern (simplified here).
          Each subscriber provides a selector. Store notifies all subscribers; each compares
          using <code>Object.is</code>. Only components whose selected slice changed re-render.
          This is how Zustand and Jotai work internally.
        </Info>
        <Row style={{ marginBottom: 12 }}>
          <Btn onClick={() => pubSubStore.setState({ x: pubSubStore.getState().x + 1 })}>inc x</Btn>
          <Btn onClick={() => pubSubStore.setState({ y: pubSubStore.getState().y + 1 })}>inc y</Btn>
        </Row>
        <PubSubCtx.Provider value={pubSubStore}>
          <Row>
            <PubSubX />
            <PubSubY />
          </Row>
        </PubSubCtx.Provider>
        <Pre>{`// Minimal pub-sub: store lives outside React, context just passes the reference
// usePubSubSelector subscribes to store directly — bypasses context update mechanism
//
// useEffect subscribes to store.subscribe(listener)
// listener compares selector(newState) with previous via Object.is
// Only calls setValue if the selected slice actually changed
//
// This is the architectural difference between Context and Zustand/Jotai:
// - Context:  update context value → ALL consumers re-render
// - Zustand:  store updates → only selectors whose slice changed re-render
//
// React 18 ships useSyncExternalStore for this pattern:
// const val = useSyncExternalStore(store.subscribe, () => selector(store.getState()))`}</Pre>
      </Section>
    </div>
  )
}
