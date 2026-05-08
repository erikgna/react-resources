import { useRef } from 'react'
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  atom as coreAtom,
  useAtom as coreUseAtom,
} from '../../core/jotai'
import { Section, Row, Btn, Info, Pre } from '../shared'

// ─── Atoms defined at module level — never inside a component ─────────────────
// Identity = object reference. No string key needed.

const counterAtom = atom(0)
const nameAtom    = atom('')
const ageAtom     = atom(25)
const scoreAtom   = atom(0)

const coreCounterAtom = coreAtom(0)

// ─── 1.1 useAtom ─────────────────────────────────────────────────────────────

function BasicAtom() {
  const [count, setCount] = useAtom(counterAtom)
  return (
    <Section title="1.1 — useAtom: read + write">
      <Info>Returns [value, setter]. Setter accepts T or (prev: T) =&gt; T — mirrors useState. No key string required; the atom object itself is the identifier.</Info>
      <Row>
        <Btn onClick={() => setCount(c => c - 1)} danger>−</Btn>
        <span style={{ color: '#e0e0e0', fontSize: 20, minWidth: 40, textAlign: 'center' }}>{count}</span>
        <Btn onClick={() => setCount(c => c + 1)}>+</Btn>
        <Btn onClick={() => setCount(0)} danger>Reset</Btn>
      </Row>
      <Pre>{`const counterAtom = atom(0)   // no key string — identity is the object

function Counter() {
  const [count, setCount] = useAtom(counterAtom)
  // setCount(n)           → set to n
  // setCount(c => c + 1)  → functional update (safe for async)`}</Pre>
    </Section>
  )
}

// ─── 1.2 useAtomValue vs useSetAtom ──────────────────────────────────────────

function ReadOnlyDisplay() {
  const count = useAtomValue(counterAtom)
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
  const set = useSetAtom(counterAtom)
  const renders = useRef(0)
  renders.current++
  return (
    <div>
      <Btn onClick={() => set(c => c + 1)}>
        Increment — writer renders: {renders.current}
      </Btn>
      <Info style={{ marginTop: 8 }}>
        useSetAtom returns only the setter — no subscription, no re-render when the atom changes.
      </Info>
    </div>
  )
}

function SplitReadWrite() {
  return (
    <Section title="1.2 — useAtomValue vs useSetAtom">
      <Info>Split reads and writes to prevent the writer component from re-rendering when the atom changes.</Info>
      <ReadOnlyDisplay />
      <WriteOnlyBtn />
      <Pre>{`// Subscribes — re-renders on every atom change
const count = useAtomValue(counterAtom)

// Setter only — NO subscription, never re-renders
const setCount = useSetAtom(counterAtom)

// Same pattern as Recoil's useRecoilValue / useSetRecoilState,
// but no Provider required — global store by default.`}</Pre>
    </Section>
  )
}

// ─── 1.3 Independent atoms ───────────────────────────────────────────────────

function NameField() {
  const [name, setName] = useAtom(nameAtom)
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
  const [age, setAge] = useAtom(ageAtom)
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
  const [score, setScore] = useAtom(scoreAtom)
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
      <Info>Each component subscribes to exactly one atom. Typing a name does NOT re-render age or score. Watch the render counters.</Info>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <NameField />
        <AgeField />
        <ScoreField />
      </div>
      <Pre>{`// Three atoms → three independent subscriptions
// nameAtom change notifies only NameField's subscriber
// React Context with one shared object would re-render all three

const nameAtom  = atom('')
const ageAtom   = atom(25)
const scoreAtom = atom(0)`}</Pre>
    </Section>
  )
}

// ─── 1.4 Core reimplementation ───────────────────────────────────────────────

function CoreAtomDemo() {
  const [count, setCount] = coreUseAtom(coreCounterAtom as Parameters<typeof coreUseAtom>[0])
  return (
    <Section title="1.4 — core/jotai.ts — hand-rolled Store">
      <Info>Same behavior: atom() returns a plain object. Store uses WeakMap keyed by atom reference — no string registry needed. ~170 lines total.</Info>
      <Row>
        <Btn onClick={() => setCount((c: number) => c - 1)} danger>−</Btn>
        <span style={{ color: '#e0e0e0', fontSize: 20, minWidth: 40, textAlign: 'center' }}>{count as number}</span>
        <Btn onClick={() => setCount((c: number) => c + 1)}>+</Btn>
      </Row>
      <Pre>{`// core/jotai.ts — atom identity = object reference
class Store {
  private states = new WeakMap<object, AtomState>()

  get(atom) {
    // Looks up atom in WeakMap — no string key ever involved
    return this.states.get(atom)?.value ?? atom.init
  }

  set(atom, value) {
    state.value = value
    state.listeners.forEach(l => l())  // notify
  }
}

// Global singleton: const globalStore = new Store()
// No Provider needed — hooks read from globalStore by default`}</Pre>
    </Section>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function AtomsExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>01 · Atoms</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Atoms are Jotai's unit of state. Unlike Recoil, they need no key string — identity is the object
        reference. No Provider required — a global store handles all atoms by default.
      </p>
      <BasicAtom />
      <SplitReadWrite />
      <IndependentAtoms />
      <CoreAtomDemo />
    </div>
  )
}
