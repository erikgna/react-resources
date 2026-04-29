import { createContext, useContext, useState, useRef, Component } from 'react'
import { Section, Row, Btn, Info, Pre, Box, Log, ui } from '../shared'
import React from 'react'

// ─── Render counter ───────────────────────────────────────────────────────────

function useRenderCount() {
  const ref = useRef(0)
  ref.current += 1
  return ref.current
}

// ─── 1. Mutation stale — object property change without new ref ───────────────

type MutableState = { count: number; label: string }
const MutableCtx = createContext<MutableState>({ count: 0, label: 'init' })

function MutableConsumer() {
  const state = useContext(MutableCtx)
  const renders = useRenderCount()
  return (
    <Box name="mutable consumer" renders={renders}>
      count: {state.count} | {state.label}
    </Box>
  )
}

// ─── 2. Context outside Provider ─────────────────────────────────────────────

const RequiredCtx = createContext<{ value: string } | null>(null)

function SafeConsumer() {
  const ctx = useContext(RequiredCtx)
  if (!ctx) return (
    <Box name="safe consumer" renders={0}>
      <span style={{ color: '#f9a825' }}>no Provider!</span>
    </Box>
  )
  return <Box name="safe consumer" renders={1}>{ctx.value}</Box>
}

// ─── 3. Stale closure trap ────────────────────────────────────────────────────

const StaleCtx = createContext(0)

// ─── 4. Context update inside render ─────────────────────────────────────────

const TriggerCtx = createContext<{ count: number; trigger: () => void }>({
  count: 0, trigger: () => {},
})

// ─── 5. Error boundary + context ─────────────────────────────────────────────

const ErrorCtx = createContext({ shouldThrow: false })

function MaybeThrower() {
  const { shouldThrow } = useContext(ErrorCtx)
  if (shouldThrow) throw new Error('Context-triggered render error')
  return <Box name="MaybeThrower" renders={useRenderCount()}>ok</Box>
}

class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: string | null }
> {
  state = { error: null }
  static getDerivedStateFromError(e: Error) { return { error: e.message } }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 10, background: '#1a0a0a', border: '1px solid #5a1111', borderRadius: 3 }}>
        <span style={{ color: '#ff6b6b', fontSize: 12 }}>Caught: {this.state.error}</span>
        <Btn onClick={() => this.setState({ error: null })} danger>reset</Btn>
      </div>
    )
    return this.props.children
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FailureExperiment() {
  // Failure 1: Mutation without new ref
  const mutRef = useRef<MutableState>({ count: 0, label: 'original' })
  const [, forceUpdate] = useState(0)
  const [mutLog, setMutLog] = useState<string[]>([])

  // Failure 2: Toggle provider
  const [showProvider, setShowProvider] = useState(false)

  // Failure 3: Stale closure
  const [staleCount, setStaleCount] = useState(0)
  const [staleLogs, setStaleLogs] = useState<string[]>([])

  // Failure 4: Render-time update
  const [renderUpdateLog, setRenderUpdateLog] = useState<string[]>([])

  // Failure 5: Error boundary
  const [shouldThrow, setShouldThrow] = useState(false)

  // Stale closure — captures old value at effect registration time
  const capturedRef = useRef(staleCount)
  function captureAndLog() {
    const captured = staleCount  // captured at call time — this is fine
    setTimeout(() => {
      setStaleLogs(l => [...l, `after 1s: staleCount captured=${captured}, current would be ?`])
    }, 1000)
  }

  return (
    <div>
      <h2 style={ui.h2}>8 · Failure Scenarios</h2>
      <p style={ui.desc}>
        Intentional breakage. Silent staleness, missing Providers, stale closures,
        render-time updates, error boundary interaction. Understand what React does and doesn't catch.
      </p>

      <Section title="8.1 Mutation Without New Ref — Silent Staleness">
        <Info>
          Mutating the context object in place does NOT trigger re-renders.
          React uses <code>Object.is(prev, next)</code> — same reference = no update.
          Consumers show stale values with no error or warning.
        </Info>
        <Row style={{ marginBottom: 10 }}>
          <Btn danger onClick={() => {
            mutRef.current.count++    // WRONG: mutating in place
            mutRef.current.label = `mutated-${mutRef.current.count}`
            setMutLog(l => [...l, `mutated count to ${mutRef.current.count} — same ref → NO re-render`])
            // No forceUpdate → consumer stays stale forever
          }}>mutate (wrong — no re-render)</Btn>
          <Btn onClick={() => {
            mutRef.current = { ...mutRef.current, count: mutRef.current.count + 1, label: 'new ref' }
            setMutLog(l => [...l, `new ref count=${mutRef.current.count} — triggers re-render`])
            forceUpdate(n => n + 1)   // force parent re-render to propagate new ref
          }}>new ref (correct)</Btn>
          <Btn onClick={() => setMutLog([])}>clear log</Btn>
        </Row>
        <MutableCtx.Provider value={mutRef.current}>
          <MutableConsumer />
        </MutableCtx.Provider>
        <Log entries={mutLog} />
        <Pre>{`// WRONG — mutation, same ref, Object.is passes → no re-render
state.count++
state.label = 'new'

// CORRECT — new object, Object.is fails → re-render
setState(prev => ({ ...prev, count: prev.count + 1 }))`}</Pre>
      </Section>

      <Section title="8.2 Consumer Without Provider — Default Value Trap">
        <Info>
          Using <code>null</code> as default value forces consumers to handle the missing-Provider case explicitly.
          Avoid using a "real" default that silently hides the missing Provider — it creates subtle bugs.
        </Info>
        <Row style={{ marginBottom: 10 }}>
          <Btn onClick={() => setShowProvider(s => !s)}>
            {showProvider ? 'remove Provider' : 'add Provider'}
          </Btn>
        </Row>
        {showProvider
          ? <RequiredCtx.Provider value={{ value: 'from provider' }}><SafeConsumer /></RequiredCtx.Provider>
          : <SafeConsumer />
        }
        <Pre>{`// Pattern: use null default to force explicit null-check in consumers
const RequiredCtx = createContext<{ value: string } | null>(null)

function SafeConsumer() {
  const ctx = useContext(RequiredCtx)
  if (!ctx) throw new Error('RequiredCtx used outside Provider')  // fail-fast
  return <div>{ctx.value}</div>
}

// Avoid: createContext({ value: '' })  — silently uses default, hides missing Provider`}</Pre>
      </Section>

      <Section title="8.3 Stale Closure Trap">
        <Info>
          Closures over context values capture the value at creation time.
          <code>setTimeout</code>, event handlers, and callbacks created inside render can hold stale values.
          Note the captured vs current mismatch after 1 second delay.
        </Info>
        <Row style={{ marginBottom: 10 }}>
          <Btn onClick={() => setStaleCount(c => c + 1)}>
            inc count ({staleCount})
          </Btn>
          <Btn onClick={captureAndLog}>
            capture current + wait 1s
          </Btn>
          <Btn onClick={() => setStaleLogs([])}>clear</Btn>
        </Row>
        <StaleCtx.Provider value={staleCount}>
          <div style={{ fontSize: 13, color: '#bbb', marginBottom: 8 }}>
            current ctx value: <b style={{ color: '#e0e0e0' }}>{staleCount}</b>
          </div>
        </StaleCtx.Provider>
        <Log entries={staleLogs} />
        <Pre>{`// The captured variable is fine IF you read at call time.
// The dangerous pattern is capturing in useEffect with missing deps:
useEffect(() => {
  const id = setInterval(() => {
    console.log(count)  // stale! count captured at effect registration
  }, 1000)
  return () => clearInterval(id)
}, [])  // MISSING dep: count

// Fix: include deps, or use a ref for the current value:
const countRef = useRef(count)
countRef.current = count  // always current — update on every render`}</Pre>
      </Section>

      <Section title="8.4 Error Boundary + Context">
        <Info>
          Context update triggers a render that throws — Error Boundary catches it.
          The Error Boundary is outside the Provider, so it can reset state without context involvement.
          Context doesn't affect Error Boundary behavior — it only catches render errors.
        </Info>
        <Row style={{ marginBottom: 10 }}>
          <Btn danger onClick={() => setShouldThrow(true)}>trigger throw via context</Btn>
          <Btn onClick={() => setShouldThrow(false)}>reset (fix context)</Btn>
        </Row>
        <ErrorCtx.Provider value={{ shouldThrow }}>
          <ErrorBoundary>
            <MaybeThrower />
          </ErrorBoundary>
        </ErrorCtx.Provider>
        <Pre>{`// Context value changes → consumer re-renders → throws → Error Boundary catches
// Error Boundary state is independent of context — resetting it works normally
//
// Note: Error Boundaries don't catch:
// - Async errors (event handlers, setTimeout, Promises)
// - Errors in the Error Boundary itself
// - Server-side rendering errors`}</Pre>
      </Section>
    </div>
  )
}
