import { createContext, useContext, useRef, useState } from 'react'
import { atom, selector, useRecoilState, useRecoilValue, RecoilRoot } from 'recoil'
import { Section, Row, Btn, Info, Pre, Box } from '../shared'

// ─── N independent Recoil atoms ───────────────────────────────────────────────

const N = 20

const benchAtoms = Array.from({ length: N }, (_, i) =>
  atom({ key: `07/bench/${i}`, default: 0 })
)

// ─── Context comparison ───────────────────────────────────────────────────────

interface ContextState { values: number[]; update: (i: number) => void }
const BenchContext = createContext<ContextState>({ values: Array(N).fill(0), update: () => {} })

function ContextProvider({ children }: { children: React.ReactNode }) {
  const [values, setValues] = useState<number[]>(Array(N).fill(0))
  const update = (i: number) => setValues(v => { const next = [...v]; next[i]++; return next })
  return <BenchContext.Provider value={{ values, update }}>{children}</BenchContext.Provider>
}

// ─── 7.1 Recoil fine-grained subscriptions ────────────────────────────────────

function RecoilBenchCell({ index }: { index: number }) {
  const [value, setValue] = useRecoilState(benchAtoms[index])
  const renders = useRef(0); renders.current++
  return (
    <Box name={`atom[${index}]`} renders={renders.current} active={value > 0}>
      {value}
    </Box>
  )
}

function RecoilBenchTrigger({ index }: { index: number }) {
  const setValue = useRecoilState(benchAtoms[index])[1]
  return <Btn onClick={() => setValue(v => v + 1)}>+[{index}]</Btn>
}

function RecoilBenchSection() {
  const [lastUpdated, setLastUpdated] = useState(-1)

  const handleUpdate = (i: number) => {
    setLastUpdated(i)
  }

  return (
    <Section title="7.1 — Recoil: fine-grained atom subscriptions">
      <Info>Each cell subscribes to exactly one atom. Incrementing atom[i] re-renders ONLY cell i. Watch the render counters — all others stay frozen.</Info>
      <Row style={{ marginBottom: 10, flexWrap: 'wrap' }}>
        {Array.from({ length: N }, (_, i) => (
          <span
            key={i}
            onClick={() => handleUpdate(i)}
            style={{
              padding: '4px 10px', background: lastUpdated === i ? '#1a2a3a' : '#1e1e1e',
              border: `1px solid ${lastUpdated === i ? '#4a9eff' : '#2a2a2a'}`,
              color: lastUpdated === i ? '#4a9eff' : '#666',
              borderRadius: 3, fontSize: 11, cursor: 'pointer',
            }}
          >
            [{i}]
          </span>
        ))}
      </Row>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        {Array.from({ length: N }, (_, i) => (
          <RecoilBenchWrapper key={i} index={i} onUpdate={() => handleUpdate(i)} />
        ))}
      </div>
      <Pre>{`// Each cell: useRecoilState(benchAtoms[index])
// → subscribes ONLY to benchAtoms[index]
// → React only re-renders that one component
// 20 atoms = 20 independent subscriptions`}</Pre>
    </Section>
  )
}

function RecoilBenchWrapper({ index, onUpdate }: { index: number; onUpdate: () => void }) {
  const [value, setValue] = useRecoilState(benchAtoms[index])
  const renders = useRef(0); renders.current++
  return (
    <Box name={`atom[${index}]`} renders={renders.current} active={value > 0}>
      <span
        onClick={() => { setValue(v => v + 1); onUpdate() }}
        style={{ cursor: 'pointer', userSelect: 'none' }}
      >
        {value} ↑
      </span>
    </Box>
  )
}

// ─── 7.2 Context blob comparison ─────────────────────────────────────────────

function ContextCell({ index }: { index: number }) {
  const { values, update } = useContext(BenchContext)
  const renders = useRef(0); renders.current++
  return (
    <Box name={`ctx[${index}]`} renders={renders.current} active={values[index] > 0}>
      <span
        onClick={() => update(index)}
        style={{ cursor: 'pointer', userSelect: 'none' }}
      >
        {values[index]} ↑
      </span>
    </Box>
  )
}

function ContextBenchSection() {
  return (
    <Section title="7.2 — Context blob: ALL components re-render">
      <Info>Single Context object with N values. Clicking any cell increments ONE value but triggers a state update on the Provider — ALL N cells re-render. Compare render counts vs 7.1.</Info>
      <ContextProvider>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {Array.from({ length: N }, (_, i) => <ContextCell key={i} index={i} />)}
        </div>
      </ContextProvider>
      <Pre>{`// Context: one object → one subscription for all consumers
const [values, setValues] = useState(Array(N).fill(0))

// Updating index 3:
setValues(v => { v[3]++; return [...v] })
// ↑ New array reference → Provider re-renders → ALL consumers re-render
// N=20: 20 re-renders per click vs Recoil's 1 re-render per click`}</Pre>
    </Section>
  )
}

// ─── 7.3 Selector memoization benchmark ──────────────────────────────────────

const sumSelector = selector({
  key: '07/sum',
  get: ({ get }) => {
    const sum = benchAtoms.reduce((acc, a) => acc + get(a), 0)
    return sum
  },
})

function SumDisplay() {
  const sum = useRecoilValue(sumSelector)
  const renders = useRef(0); renders.current++
  return (
    <div style={{ fontSize: 13, color: '#888' }}>
      sum of all {N} atoms: <span style={{ color: '#e0e0e0', fontSize: 16 }}>{sum}</span>
      {'  ·  '}selector renders: <span style={{ color: sum > 20 ? '#ff6b6b' : '#4caf50' }}>{renders.current}</span>
    </div>
  )
}

function SelectorMemoSection() {
  return (
    <Section title="7.3 — Selector caching: aggregate without extra renders">
      <Info>sumSelector reads all 20 atoms. It re-renders SumDisplay only when the sum changes. Increment any atom above and watch the sum update — then increment the same atom and watch Object.is() short-circuit.</Info>
      <SumDisplay />
      <Row style={{ marginTop: 10, flexWrap: 'wrap' }}>
        {Array.from({ length: 5 }, (_, i) => (
          <RecoilBenchTrigger key={i} index={i} />
        ))}
        <span style={{ color: '#555', fontSize: 11 }}>increment first 5 atoms</span>
      </Row>
      <Pre>{`// sumSelector subscribes to ALL 20 atoms
// But it only re-renders if the returned VALUE changes
// Click +[0] ten times → selector re-evaluates 10 times, SumDisplay renders 10 times
// Click +[0] with same value as before → Object.is() short-circuits, 0 renders`}</Pre>
    </Section>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function PerformanceExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>07 · Performance</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Recoil's key performance advantage: each component subscribes to individual atoms.
        Click a cell in 7.1 vs 7.2 and compare how many components re-render.
        Red render counter = more than 3 renders.
      </p>
      <RecoilRoot>
        <RecoilBenchSection />
        <ContextBenchSection />
        <SelectorMemoSection />
      </RecoilRoot>
    </div>
  )
}
