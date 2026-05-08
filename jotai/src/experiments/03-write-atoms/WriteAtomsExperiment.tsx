import { useRef } from 'react'
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'
import { Section, Row, Btn, Info, Pre } from '../shared'

// ─── Base atoms ───────────────────────────────────────────────────────────────

const kmAtom      = atom(1)
const counterAtom = atom(0)
const firstAtom   = atom('Alice')
const lastAtom    = atom('Smith')

// ─── Write atoms ──────────────────────────────────────────────────────────────
// atom(readFn, writeFn) — bidirectional derived state

const milesAtom = atom(
  get  => +(get(kmAtom) * 0.621371).toFixed(3),
  (_get, set, miles: number) => set(kmAtom, +(miles / 0.621371).toFixed(3)),
)

// Action atom — read value is null (no state of its own), write performs side effects
const resetCounterAtom = atom(
  null,
  (_get, set) => set(counterAtom, 0),
)

const incrementByAtom = atom(
  null,
  (_get, set, amount: number) => set(counterAtom, c => c + amount),
)

// Multi-atom write — one action atom updates several atoms atomically
const fullNameAtom = atom(
  get  => `${get(firstAtom)} ${get(lastAtom)}`,
  (_get, set, full: string) => {
    const [first = '', ...rest] = full.split(' ')
    set(firstAtom, first)
    set(lastAtom, rest.join(' '))
  },
)

// ─── 3.1 Bidirectional conversion ────────────────────────────────────────────

function UnitConversion() {
  const [km, setKm]   = useAtom(kmAtom)
  const [mi, setMi]   = useAtom(milesAtom)
  return (
    <Section title="3.1 — Read-write derived: bidirectional km ↔ miles">
      <Info>atom(readFn, writeFn) — reading returns a derived value, writing transforms the input and sets the base atom. Either field drives the other.</Info>
      <Row>
        <span style={{ color: '#555', fontSize: 11 }}>km</span>
        <input
          type="number" value={km}
          onChange={e => setKm(+e.target.value)}
          style={{ background: '#111', border: '1px solid #2a2a2a', color: '#e0e0e0', padding: '4px 8px', borderRadius: 3, fontSize: 13, width: 80 }}
        />
        <span style={{ color: '#555', fontSize: 12 }}>=</span>
        <input
          type="number" value={mi}
          onChange={e => setMi(+e.target.value)}
          style={{ background: '#111', border: '1px solid #2a2a2a', color: '#e0e0e0', padding: '4px 8px', borderRadius: 3, fontSize: 13, width: 80 }}
        />
        <span style={{ color: '#555', fontSize: 11 }}>miles</span>
      </Row>
      <Pre>{`const kmAtom = atom(1)
const milesAtom = atom(
  get  => +(get(kmAtom) * 0.621371).toFixed(3),   // read: km → miles
  (_get, set, miles) => set(kmAtom, +(miles / 0.621371).toFixed(3))  // write: miles → km
)

// Edit miles → milesAtom.write sets kmAtom → kmAtom notifies → milesAtom recomputes`}</Pre>
    </Section>
  )
}

// ─── 3.2 Action atoms ────────────────────────────────────────────────────────

function ActionAtoms() {
  const [count, setCount] = useAtom(counterAtom)
  const reset        = useSetAtom(resetCounterAtom)
  const incrementBy  = useSetAtom(incrementByAtom)
  const renders      = useRef(0); renders.current++
  return (
    <Section title="3.2 — Action atoms: pure commands with no state">
      <Info>atom(null, writeFn) — the read value is null (no state). The atom is a reusable action. Components that hold only the setter never re-render when counter changes.</Info>
      <Row style={{ marginBottom: 8 }}>
        <span style={{ color: '#e0e0e0', fontSize: 20, minWidth: 36, textAlign: 'center' }}>{count}</span>
        <Btn onClick={() => setCount(c => c + 1)}>+1</Btn>
        <Btn onClick={() => incrementBy(5)}>+5</Btn>
        <Btn onClick={() => incrementBy(10)}>+10</Btn>
        <Btn onClick={reset} danger>Reset</Btn>
      </Row>
      <div style={{ fontSize: 11, color: '#555' }}>
        renders (this component): <span style={{ color: '#4caf50' }}>{renders.current}</span>
      </div>
      <Pre>{`// Action atom — read = null, no stored value
const resetCounterAtom = atom(null, (_get, set) => set(counterAtom, 0))
const incrementByAtom  = atom(null, (_get, set, n: number) => set(counterAtom, c => c + n))

const reset      = useSetAtom(resetCounterAtom)  // never re-renders
const incrementBy = useSetAtom(incrementByAtom)   // never re-renders

reset()          // → counterAtom = 0
incrementBy(5)   // → counterAtom += 5`}</Pre>
    </Section>
  )
}

// ─── 3.3 Multi-atom write ────────────────────────────────────────────────────

function MultiAtomWrite() {
  const [first, setFirst] = useAtom(firstAtom)
  const [last, setLast]   = useAtom(lastAtom)
  const [full, setFull]   = useAtom(fullNameAtom)
  return (
    <Section title="3.3 — Multi-atom write: one setter updates many atoms">
      <Info>fullNameAtom's write fn splits the string and calls set() on two separate atoms in one go. Both update synchronously before any re-render.</Info>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Row>
          <span style={{ color: '#555', fontSize: 11, width: 36 }}>first</span>
          <input value={first} onChange={e => setFirst(e.target.value)}
            style={{ background: '#111', border: '1px solid #2a2a2a', color: '#e0e0e0', padding: '4px 8px', borderRadius: 3, fontSize: 13, width: 120 }} />
          <span style={{ color: '#555', fontSize: 11, width: 30 }}>last</span>
          <input value={last} onChange={e => setLast(e.target.value)}
            style={{ background: '#111', border: '1px solid #2a2a2a', color: '#e0e0e0', padding: '4px 8px', borderRadius: 3, fontSize: 13, width: 120 }} />
        </Row>
        <Row>
          <span style={{ color: '#555', fontSize: 11, width: 36 }}>full</span>
          <input value={full} onChange={e => setFull(e.target.value)}
            style={{ background: '#111', border: '1px solid #2a2a2a', color: '#e0e0e0', padding: '4px 8px', borderRadius: 3, fontSize: 13, width: 240 }}
            placeholder="First Last" />
        </Row>
      </div>
      <Pre>{`const fullNameAtom = atom(
  get => \`\${get(firstAtom)} \${get(lastAtom)}\`,
  (_get, set, full: string) => {
    const [first, ...rest] = full.split(' ')
    set(firstAtom, first)          // update atom 1
    set(lastAtom, rest.join(' '))  // update atom 2
    // Both updates flush before the next render
  }
)`}</Pre>
    </Section>
  )
}

// ─── 3.4 Write atom anatomy ──────────────────────────────────────────────────

function WriteAtomAnatomy() {
  return (
    <Section title="3.4 — Write atom anatomy">
      <Info>atom(readFn, writeFn) — the writeFn receives get (read any atom), set (write any writable atom), and any args passed by the caller. This makes write atoms composable command objects.</Info>
      <Pre>{`atom(
  readFn,   // (get) => T  — derives current value
  writeFn   // (get, set, ...args) => void  — handles writes
)

// readFn  : get(otherAtom) registers dep, returns value
// writeFn : set(otherAtom, newValue) — can set ANY writable atom
//           get(otherAtom) — read without subscribing (snapshot)
//           ...args — caller-supplied arguments

// Comparison:
// Recoil : useRecoilCallback for imperative multi-atom writes
// MobX   : action() method on a store class
// Zustand: one setState that merges the whole store slice
// Jotai  : write atom is the unit of composition — no store class needed`}</Pre>
    </Section>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function WriteAtomsExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>03 · Write Atoms</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        atom(readFn, writeFn) creates a writable derived atom. The write function receives get, set,
        and caller arguments — enabling bidirectional transformations, pure action atoms, and multi-atom
        transactions, all without a store class.
      </p>
      <UnitConversion />
      <ActionAtoms />
      <MultiAtomWrite />
      <WriteAtomAnatomy />
    </div>
  )
}
