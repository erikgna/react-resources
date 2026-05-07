import { useRef } from 'react'
import { atom, useRecoilState, useRecoilValue, useSetRecoilState, RecoilRoot } from 'recoil'
import {
  atom as coreAtom,
  useRecoilState as coreUseState,
  RecoilRoot as CoreRoot,
} from '../../core/recoil'
import { Section, Row, Btn, Info, Pre } from '../shared'

// ─── Atom definitions (module-level — Recoil singleton requirement) ───────────

const counterAtom = atom({ key: '01/counter', default: 0 })
const nameAtom    = atom({ key: '01/name',    default: '' })
const ageAtom     = atom({ key: '01/age',     default: 25 })
const scoreAtom   = atom({ key: '01/score',   default: 0 })

const coreCounterAtom = coreAtom({ key: 'core-01/counter', default: 0 })

// ─── 1.1 useRecoilState ───────────────────────────────────────────────────────

function BasicAtomState() {
  const [count, setCount] = useRecoilState(counterAtom)
  return (
    <Section title="1.1 — useRecoilState: read + write">
      <Info>Returns [value, setter]. Setter accepts T or (prev: T) =&gt; T — mirrors useState. Component subscribes to the atom and re-renders on change.</Info>
      <Row>
        <Btn onClick={() => setCount(c => c - 1)} danger>−</Btn>
        <span style={{ color: '#e0e0e0', fontSize: 20, minWidth: 40, textAlign: 'center' }}>{count}</span>
        <Btn onClick={() => setCount(c => c + 1)}>+</Btn>
        <Btn onClick={() => setCount(0)} danger>Reset</Btn>
      </Row>
      <Pre>{`const counterAtom = atom({ key: 'counter', default: 0 })

function Counter() {
  const [count, setCount] = useRecoilState(counterAtom)
  // setCount(n)           → set to n
  // setCount(c => c + 1)  → functional update (safe for async)
}`}</Pre>
    </Section>
  )
}

// ─── 1.2 useRecoilValue vs useSetRecoilState ──────────────────────────────────

function ReadOnlyDisplay() {
  const count = useRecoilValue(counterAtom)
  const renders = useRef(0)
  renders.current++
  return (
    <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>
      Reader value: <span style={{ color: '#e0e0e0' }}>{count}</span>
      {'  ·  '}renders: <span style={{ color: '#4caf50' }}>{renders.current}</span>
    </div>
  )
}

function WriteOnlyBtn() {
  const set = useSetRecoilState(counterAtom)
  const renders = useRef(0)
  renders.current++
  return (
    <div>
      <Btn onClick={() => set(c => c + 1)}>
        Increment — writer renders: {renders.current}
      </Btn>
      <Info style={{ marginTop: 8 }}>
        Writer holds only the setter function — it does NOT re-subscribe to the atom value, so it never re-renders when the atom changes.
      </Info>
    </div>
  )
}

function SplitReadWrite() {
  return (
    <Section title="1.2 — useRecoilValue vs useSetRecoilState">
      <Info>Split reads and writes to prevent the writer component from re-rendering when the atom changes. Key optimization for form inputs and action buttons.</Info>
      <ReadOnlyDisplay />
      <WriteOnlyBtn />
      <Pre>{`// Subscribes — re-renders on every atom change
const count = useRecoilValue(counterAtom)

// Setter only — NO subscription, never re-renders
const setCount = useSetRecoilState(counterAtom)

// Recoil is the only mainstream solution that makes this split trivial.
// Redux equivalent: mapDispatchToProps vs mapStateToProps`}</Pre>
    </Section>
  )
}

// ─── 1.3 Independent atoms ────────────────────────────────────────────────────

function NameField() {
  const [name, setName] = useRecoilState(nameAtom)
  const renders = useRef(0); renders.current++
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <span style={{ color: '#555', fontSize: 11, width: 40 }}>name</span>
      <input
        value={name} onChange={e => setName(e.target.value)}
        style={{ background: '#111', border: '1px solid #2a2a2a', color: '#e0e0e0', padding: '4px 8px', borderRadius: 3, fontSize: 13 }}
        placeholder="type name..."
      />
      <span style={{ color: '#555', fontSize: 11 }}>renders: <span style={{ color: '#4caf50' }}>{renders.current}</span></span>
    </div>
  )
}

function AgeField() {
  const [age, setAge] = useRecoilState(ageAtom)
  const renders = useRef(0); renders.current++
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <span style={{ color: '#555', fontSize: 11, width: 40 }}>age</span>
      <Btn onClick={() => setAge(a => a - 1)} danger>−</Btn>
      <span style={{ color: '#e0e0e0', fontSize: 13, minWidth: 24, textAlign: 'center' }}>{age}</span>
      <Btn onClick={() => setAge(a => a + 1)}>+</Btn>
      <span style={{ color: '#555', fontSize: 11 }}>renders: <span style={{ color: '#4caf50' }}>{renders.current}</span></span>
    </div>
  )
}

function ScoreField() {
  const [score, setScore] = useRecoilState(scoreAtom)
  const renders = useRef(0); renders.current++
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <span style={{ color: '#555', fontSize: 11, width: 40 }}>score</span>
      <Btn onClick={() => setScore(s => s + 10)}>+10</Btn>
      <span style={{ color: '#e0e0e0', fontSize: 13, minWidth: 32, textAlign: 'center' }}>{score}</span>
      <Btn onClick={() => setScore(0)} danger>reset</Btn>
      <span style={{ color: '#555', fontSize: 11 }}>renders: <span style={{ color: '#4caf50' }}>{renders.current}</span></span>
    </div>
  )
}

function IndependentAtoms() {
  return (
    <Section title="1.3 — Independent atom subscriptions">
      <Info>Each component subscribes to exactly one atom. Typing in name does NOT re-render the age or score components. Watch the render counters.</Info>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <NameField />
        <AgeField />
        <ScoreField />
      </div>
      <Pre>{`// Three atoms → three independent subscriptions
// Changing nameAtom notifies only NameField's subscriber
// React Context with one object would re-render all three

const nameAtom  = atom({ key: 'name',  default: '' })
const ageAtom   = atom({ key: 'age',   default: 25 })
const scoreAtom = atom({ key: 'score', default: 0 })`}</Pre>
    </Section>
  )
}

// ─── 1.4 Core reimplementation ────────────────────────────────────────────────

function CoreAtomDemo() {
  const [count, setCount] = coreUseState(coreCounterAtom)
  return (
    <Section title="1.4 — core/recoil.ts — hand-rolled AtomNode">
      <Info>Same behavior as Recoil: AtomNode descriptor → RecoilStore → useSyncExternalStore. ~155 lines total including selector, families, and useRecoilCallback.</Info>
      <Row>
        <Btn onClick={() => setCount(c => c - 1)} danger>−</Btn>
        <span style={{ color: '#e0e0e0', fontSize: 20, minWidth: 40, textAlign: 'center' }}>{count}</span>
        <Btn onClick={() => setCount(c => c + 1)}>+</Btn>
      </Row>
      <Pre>{`// core/recoil.ts
class RecoilStore {
  setAtomValue(node, value) {
    if (Object.is(state.value, value)) return
    state.value = value
    for (const [, ss] of this.selectorStates)
      if (ss.atomDeps.has(node.key)) ss.dirty = true  // invalidate
    for (const l of state.listeners) l()  // notify
  }
}
// useRecoilState → useSyncExternalStore(subscribe, getSnapshot)
// getSnapshot returns current atom value — React diffs it each render`}</Pre>
    </Section>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function AtomsExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>01 · Atoms</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Atoms are the unit of state in Recoil — shared, keyed values. Components subscribe individually,
        so only the component that reads a changed atom re-renders.
      </p>
      <RecoilRoot>
        <BasicAtomState />
        <SplitReadWrite />
        <IndependentAtoms />
      </RecoilRoot>
      <CoreRoot>
        <CoreAtomDemo />
      </CoreRoot>
    </div>
  )
}
