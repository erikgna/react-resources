import { createContext, useContext, useMemo, useCallback, useRef, useState, memo } from 'react'
import { Section, Row, Btn, Info, Pre, Box, ui } from '../shared'

// ─── Render counter ───────────────────────────────────────────────────────────

function useRenderCount() {
  const ref = useRef(0)
  ref.current += 1
  return ref.current
}

// ─── Split context pattern ────────────────────────────────────────────────────

const CountCtx = createContext(0)
const NameCtx = createContext('')

function CountOnly() {
  const count = useContext(CountCtx)
  const renders = useRenderCount()
  return <Box name="count-only ctx" renders={renders}>count: {count}</Box>
}

function NameOnly() {
  const name = useContext(NameCtx)
  const renders = useRenderCount()
  return <Box name="name-only ctx" renders={renders}>name: {name}</Box>
}

// ─── useMemo on Provider value ────────────────────────────────────────────────

type BigVal = { count: number; name: string; unrelated: number }
const BigCtx = createContext<BigVal>({ count: 0, name: '', unrelated: 0 })

function BigConsumer() {
  const val = useContext(BigCtx)
  const renders = useRenderCount()
  return <Box name="big ctx consumer" renders={renders}>count: {val.count}</Box>
}

// ─── React.memo + context: the trap ──────────────────────────────────────────

const MemoConsumer = memo(function MemoConsumer() {
  const count = useContext(CountCtx)
  const renders = useRenderCount()
  return <Box name="memo + useContext" renders={renders}>count: {count}</Box>
})

const MemoNoCtx = memo(function MemoNoCtx() {
  const renders = useRenderCount()
  return <Box name="memo, no ctx" renders={renders}><span style={{ color: '#7ec8a0' }}>static</span></Box>
})

// ─── Dispatch isolation pattern ───────────────────────────────────────────────

type State = { count: number }
type Action = { type: 'INC' | 'DEC' | 'RESET' }

const StateCtx2 = createContext<State>({ count: 0 })
const DispatchCtx = createContext<(a: Action) => void>(() => {})

function DispatchConsumer() {
  const dispatch = useContext(DispatchCtx)
  const renders = useRenderCount()
  return (
    <Box name="dispatch consumer" renders={renders}>
      <Row>
        <Btn onClick={() => dispatch({ type: 'DEC' })}>−</Btn>
        <Btn onClick={() => dispatch({ type: 'INC' })}>+</Btn>
        <Btn onClick={() => dispatch({ type: 'RESET' })}>R</Btn>
      </Row>
    </Box>
  )
}

function StateConsumer2() {
  const { count } = useContext(StateCtx2)
  const renders = useRenderCount()
  return <Box name="state consumer" renders={renders}>count: {count}</Box>
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OptimizationExperiment() {
  const [count, setCount] = useState(0)
  const [name, setName] = useState('alice')
  const [unrelated, setUnrelated] = useState(0)

  // useMemo — stable object reference when deps unchanged
  const bigVal = useMemo<BigVal>(
    () => ({ count, name, unrelated }),
    [count, name, unrelated]
  )

  // useReducer pattern — stable dispatch
  const [state2, dispatch2Raw] = useState<State>({ count: 0 })
  const dispatch2 = useCallback((action: Action) => {
    setState2(s => {
      switch (action.type) {
        case 'INC': return { count: s.count + 1 }
        case 'DEC': return { count: s.count - 1 }
        case 'RESET': return { count: 0 }
      }
    })
  }, [])

  function setState2(updater: (s: State) => State) {
    dispatch2Raw(updater)
  }

  return (
    <div>
      <h2 style={ui.h2}>3 · Optimization Techniques</h2>
      <p style={ui.desc}>
        <code>useMemo</code> on Provider value, split contexts, <code>React.memo</code> + context interaction,
        stable dispatch via <code>useCallback</code>. Understand the bailout mechanics.
      </p>

      <Section title="3.1 Split Context — Surgical Subscriptions">
        <Info>
          One context per concern. <code>CountOnly</code> subscribes to count, <code>NameOnly</code> to name.
          Updating count does NOT re-render NameOnly. No memo needed.
          This is the primary tool for preventing unwanted re-renders.
        </Info>
        <Row style={{ marginBottom: 12 }}>
          <Btn onClick={() => setCount(c => c + 1)}>inc count</Btn>
          <Btn onClick={() => setName(n => n === 'alice' ? 'bob' : 'alice')}>toggle name</Btn>
        </Row>
        <CountCtx.Provider value={count}>
          <NameCtx.Provider value={name}>
            <Row>
              <CountOnly />
              <NameOnly />
            </Row>
          </NameCtx.Provider>
        </CountCtx.Provider>
        <Pre>{`// Split: each context is its own primitive
const CountCtx = createContext(0)  // primitive → Object.is works perfectly
const NameCtx  = createContext('')

<CountCtx.Provider value={count}>
  <NameCtx.Provider value={name}>
    <CountOnly />   // only re-renders when count changes
    <NameOnly />    // only re-renders when name changes
  </NameCtx.Provider>
</CountCtx.Provider>`}</Pre>
      </Section>

      <Section title="3.2 useMemo on Provider Value — Object Stability">
        <Info>
          <code>useMemo</code> keeps same object reference when deps unchanged.
          Click "inc unrelated" — BigCtx consumers DON'T re-render because bigVal ref is stable.
          But note: "inc unrelated" still re-renders the parent component itself.
        </Info>
        <Row style={{ marginBottom: 12 }}>
          <Btn onClick={() => setCount(c => c + 1)}>inc count (triggers re-render)</Btn>
          <Btn onClick={() => setName(n => n === 'alice' ? 'bob' : 'alice')}>toggle name (triggers re-render)</Btn>
          <Btn danger onClick={() => setUnrelated(u => u + 1)}>inc unrelated ({unrelated})</Btn>
        </Row>
        <BigCtx.Provider value={bigVal}>
          <Row>
            <BigConsumer />
            <BigConsumer />
          </Row>
        </BigCtx.Provider>
        <Pre>{`// Without memo:
const bigVal = { count, name, unrelated }  // new ref every render → always re-renders consumers

// With useMemo:
const bigVal = useMemo(
  () => ({ count, name, unrelated }),
  [count, name, unrelated]  // only new ref when these change
)
// React.is(prev, next) → same ref → consumers bail out`}</Pre>
      </Section>

      <Section title="3.3 React.memo + Context — The Trap">
        <Info>
          <code>React.memo</code> blocks parent-triggered re-renders.
          But if the memoized component calls <code>useContext</code> on a context that changed → it STILL re-renders.
          Memo and context subscriptions are independent mechanisms.
        </Info>
        <Row style={{ marginBottom: 12 }}>
          <Btn onClick={() => setCount(c => c + 1)}>inc count (changes CountCtx)</Btn>
        </Row>
        <CountCtx.Provider value={count}>
          <Row>
            <MemoConsumer />
            <MemoNoCtx />
          </Row>
        </CountCtx.Provider>
        <Pre>{`// memo + useContext → STILL re-renders on context change
const MemoConsumer = memo(() => {
  const count = useContext(CountCtx)  // subscribed → re-renders when CountCtx changes
})

// memo + no useContext → blocks parent re-renders correctly
const MemoNoCtx = memo(() => {
  // no context subscription → truly memoized
})`}</Pre>
      </Section>

      <Section title="3.4 Stable Dispatch — useCallback Isolation">
        <Info>
          Split state and dispatch into separate contexts.
          <code>useCallback</code> keeps dispatch reference stable (never changes).
          <code>DispatchConsumer</code> never re-renders even when state changes — it only holds dispatch.
        </Info>
        <StateCtx2.Provider value={state2}>
          <DispatchCtx.Provider value={dispatch2}>
            <Row>
              <StateConsumer2 />
              <DispatchConsumer />
            </Row>
          </DispatchCtx.Provider>
        </StateCtx2.Provider>
        <Pre>{`// dispatch never changes — useCallback with no deps
const dispatch = useCallback((action) => {
  setState(prev => reducer(prev, action))
}, [])  // [] = stable forever

// StateCtx changes on every count update → StateConsumer re-renders
// DispatchCtx never changes → DispatchConsumer never re-renders
// This is the foundation of the Context + useReducer pattern (Experiment 4)`}</Pre>
      </Section>
    </div>
  )
}
