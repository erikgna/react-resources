import { createContext, useContext, useRef, useState, memo } from 'react'
import { Section, Row, Btn, Info, Pre, Box, ui } from '../shared'

// ─── Context setup ────────────────────────────────────────────────────────────

type AppState = { count: number; name: string }
const AppCtx = createContext<AppState>({ count: 0, name: '' })

// ─── Render counter hook ──────────────────────────────────────────────────────

function useRenderCount() {
  const ref = useRef(0)
  ref.current += 1
  return ref.current
}

// ─── Consumers at different tree depths ──────────────────────────────────────

function ShallowConsumer() {
  const { count } = useContext(AppCtx)
  const renders = useRenderCount()
  return <Box name="shallow consumer" renders={renders}>count: {count}</Box>
}

function DeepWrapper({ depth }: { depth: number }) {
  if (depth <= 0) return <DeepConsumer />
  return <DeepWrapper depth={depth - 1} />
}

function DeepConsumer() {
  const { count } = useContext(AppCtx)
  const renders = useRenderCount()
  return <Box name="deep consumer (5 levels)" renders={renders}>count: {count}</Box>
}

// ─── Context-independent sibling ─────────────────────────────────────────────

function IndependentSibling() {
  const renders = useRenderCount()
  return (
    <Box name="no useContext" renders={renders}>
      <span style={{ color: '#555' }}>static</span>
    </Box>
  )
}

// Memoized version — will it help?
const MemoizedIndependent = memo(function MemoizedIndependent() {
  const renders = useRenderCount()
  return (
    <Box name="React.memo (no ctx)" renders={renders}>
      <span style={{ color: '#7ec8a0' }}>memoized</span>
    </Box>
  )
})

// ─── Name-only consumer ───────────────────────────────────────────────────────

function NameConsumer() {
  const { name } = useContext(AppCtx)
  const renders = useRenderCount()
  return <Box name="name consumer" renders={renders}>name: {name}</Box>
}

// ─── Unstable value stress ────────────────────────────────────────────────────

const UnstableCtx = createContext<{ value: number }>({ value: 0 })

function UnstableConsumer({ id }: { id: number }) {
  const { value } = useContext(UnstableCtx)
  const renders = useRenderCount()
  return <Box name={`unstable-${id}`} renders={renders}>v: {value}</Box>
}

export default function RerendersExperiment() {
  const [count, setCount] = useState(0)
  const [name, setName] = useState('alice')
  const [unstableTick, setUnstableTick] = useState(0)
  const [sameValueTick, setSameValueTick] = useState(0)

  // This inline object is a NEW reference on every render — the root of context re-render bugs
  const ctxValue: AppState = { count, name }

  return (
    <div>
      <h2 style={ui.h2}>2 · Re-render Granularity</h2>
      <p style={ui.desc}>
        Who re-renders when context changes? Observe sibling isolation, depth independence,
        and the render cost of unstable value references. No memoization yet.
      </p>

      <Section title="2.1 Context Update — Who Re-renders?">
        <Info>
          All consumers of the same context re-render when the value changes — regardless of depth.
          Siblings with no <code>useContext</code> call do NOT re-render... unless their parent does.
        </Info>
        <Row style={{ marginBottom: 14 }}>
          <Btn onClick={() => setCount(c => c + 1)}>inc count</Btn>
          <Btn onClick={() => setName(n => n === 'alice' ? 'bob' : 'alice')}>toggle name</Btn>
        </Row>
        <AppCtx.Provider value={ctxValue}>
          <Row>
            <ShallowConsumer />
            <DeepWrapper depth={4} />
            <NameConsumer />
            <IndependentSibling />
            <MemoizedIndependent />
          </Row>
        </AppCtx.Provider>
        <Pre>{`// IndependentSibling does NOT call useContext.
// But it still re-renders here because its PARENT re-renders (this component).
// React.memo breaks the parent-child re-render chain.

// Key insight: context propagation bypasses React.memo.
// If a component is memoized BUT calls useContext(ChangedCtx) → it still re-renders.
// React.memo only blocks the parent-triggered re-renders, not context-triggered ones.`}</Pre>
      </Section>

      <Section title="2.2 Selective Reads — Name vs Count">
        <Info>
          Both <code>ShallowConsumer</code> (reads count) and <code>NameConsumer</code> (reads name) share one context.
          Updating count re-renders BOTH — because the context object is new. There is no selector built into <code>useContext</code>.
          This is the fundamental limitation of Context API for fine-grained subscriptions.
        </Info>
        <Row style={{ marginBottom: 14 }}>
          <Btn onClick={() => setCount(c => c + 1)}>inc count only</Btn>
          <Btn onClick={() => setName(n => n === 'alice' ? 'bob' : 'alice')}>toggle name only</Btn>
        </Row>
        <AppCtx.Provider value={ctxValue}>
          <Row>
            <ShallowConsumer />
            <NameConsumer />
          </Row>
        </AppCtx.Provider>
        <Pre>{`// Both consumers re-render on EVERY context update, even if their slice didn't change.
// useContext(AppCtx) subscribes to the ENTIRE context value.
// Fix: split into CountCtx + NameCtx (Experiment 3) or implement a selector (Experiment 9).`}</Pre>
      </Section>

      <Section title="2.3 Unstable Value Reference — The Silent Killer">
        <Info>
          Provider value is <code>{'{ value: unstableTick }'}</code> — a NEW object on every render.
          Even "set same value" creates a new object ref → every consumer re-renders.
          Watch the render counts spike.
        </Info>
        <Row style={{ marginBottom: 14 }}>
          <Btn onClick={() => setUnstableTick(t => t + 1)}>change value</Btn>
          <Btn danger onClick={() => setSameValueTick(t => t + 1)}>
            trigger re-render (same value, new object)
          </Btn>
        </Row>
        {/* Inline object = new ref every render */}
        <UnstableCtx.Provider value={{ value: unstableTick }}>
          <Row>
            <UnstableConsumer id={1} />
            <UnstableConsumer id={2} />
            <UnstableConsumer id={3} />
          </Row>
          <div style={{ fontSize: 11, color: '#555', marginTop: 8 }}>
            parent render trigger (for "same value" button): {sameValueTick}
          </div>
        </UnstableCtx.Provider>
        <Pre>{`// BAD — inline object is a new reference on every render
<UnstableCtx.Provider value={{ value: unstableTick }}>
  <Consumer />   // re-renders every time parent re-renders, even if unstableTick unchanged
</UnstableCtx.Provider>

// Fix: useMemo (Experiment 3)
const ctxVal = useMemo(() => ({ value: unstableTick }), [unstableTick])`}</Pre>
      </Section>
    </div>
  )
}
