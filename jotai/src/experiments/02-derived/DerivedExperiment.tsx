import { useRef } from 'react'
import { atom, useAtom, useAtomValue } from 'jotai'
import { Section, Row, Btn, Info, Pre } from '../shared'

// ─── Base atoms ───────────────────────────────────────────────────────────────

const baseAtom    = atom(4)
const aAtom       = atom(10)
const bAtom       = atom(5)

// ─── Derived atoms ────────────────────────────────────────────────────────────
// atom(get => ...) — read-only. No separate selector() function needed.

const doubledAtom = atom(get => get(baseAtom) * 2)
const squaredAtom = atom(get => get(baseAtom) ** 2)

// Chained: derived-from-derived
const quadrupledAtom = atom(get => get(doubledAtom) * 2)

// Multi-dep: fires only when EITHER a or b changes
const sumAtom  = atom(get => get(aAtom) + get(bAtom))
const diffAtom = atom(get => get(aAtom) - get(bAtom))

// ─── 2.1 Read-only derived ───────────────────────────────────────────────────

function SimpleDerivation() {
  const [base, setBase] = useAtom(baseAtom)
  const doubled  = useAtomValue(doubledAtom)
  const squared  = useAtomValue(squaredAtom)
  return (
    <Section title="2.1 — Read-only derived atoms">
      <Info>atom(get =&gt; get(base) * 2) — the same syntax as a primitive atom but with a function. No selector() factory needed — Jotai unifies primitives and derived under one API.</Info>
      <Row>
        <Btn onClick={() => setBase(b => b - 1)} danger>−</Btn>
        <span style={{ color: '#e0e0e0', fontSize: 20, minWidth: 36, textAlign: 'center' }}>{base}</span>
        <Btn onClick={() => setBase(b => b + 1)}>+</Btn>
        <span style={{ color: '#555', fontSize: 12 }}>doubled: <span style={{ color: '#79c0ff' }}>{doubled}</span></span>
        <span style={{ color: '#555', fontSize: 12 }}>squared: <span style={{ color: '#79c0ff' }}>{squared}</span></span>
      </Row>
      <Pre>{`const baseAtom    = atom(4)
const doubledAtom = atom(get => get(baseAtom) * 2)
const squaredAtom = atom(get => get(baseAtom) ** 2)

// Same atom() function — Jotai detects the function argument
// and treats it as a derived (read-only) atom`}</Pre>
    </Section>
  )
}

// ─── 2.2 Chained derivation ───────────────────────────────────────────────────

function ChainedDerivation() {
  const base       = useAtomValue(baseAtom)
  const doubled    = useAtomValue(doubledAtom)
  const quadrupled = useAtomValue(quadrupledAtom)
  const renders    = useRef(0); renders.current++
  return (
    <Section title="2.2 — Chained derivation">
      <Info>Derived atoms can depend on other derived atoms. The dependency chain propagates invalidation: base → doubled → quadrupled. Only one re-render per base change.</Info>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>
        base: <span style={{ color: '#e0e0e0' }}>{base}</span>
        {'  →  '}doubled: <span style={{ color: '#79c0ff' }}>{doubled}</span>
        {'  →  '}quadrupled: <span style={{ color: '#79c0ff' }}>{quadrupled}</span>
        {'  ·  '}renders: <span style={{ color: '#4caf50' }}>{renders.current}</span>
      </div>
      <Info>Change base via 2.1 above — this component re-renders once per change even though it reads three atoms.</Info>
      <Pre>{`const doubledAtom    = atom(get => get(baseAtom) * 2)
const quadrupledAtom = atom(get => get(doubledAtom) * 2)
// quadrupled depends on doubled depends on base
// Jotai evaluates lazily — only when a subscriber reads the value`}</Pre>
    </Section>
  )
}

// ─── 2.3 Multi-dependency ────────────────────────────────────────────────────

function MultiDep() {
  const [a, setA] = useAtom(aAtom)
  const [b, setB] = useAtom(bAtom)
  const sum  = useAtomValue(sumAtom)
  const diff = useAtomValue(diffAtom)
  const sumRenders  = useRef(0); sumRenders.current++
  const diffRenders = useRef(0); diffRenders.current++
  return (
    <Section title="2.3 — Multiple dependencies">
      <Info>sumAtom = a + b depends on both aAtom and bAtom. Changing either one triggers a re-evaluation. The dep graph is discovered automatically during first read.</Info>
      <Row style={{ marginBottom: 12 }}>
        <span style={{ color: '#555', fontSize: 11, width: 12 }}>a</span>
        <Btn onClick={() => setA(v => v - 1)} danger>−</Btn>
        <span style={{ color: '#e0e0e0', minWidth: 24, textAlign: 'center' }}>{a}</span>
        <Btn onClick={() => setA(v => v + 1)}>+</Btn>
        <span style={{ color: '#555', fontSize: 11, width: 12, marginLeft: 16 }}>b</span>
        <Btn onClick={() => setB(v => v - 1)} danger>−</Btn>
        <span style={{ color: '#e0e0e0', minWidth: 24, textAlign: 'center' }}>{b}</span>
        <Btn onClick={() => setB(v => v + 1)}>+</Btn>
      </Row>
      <div style={{ fontSize: 13, color: '#888' }}>
        sum ({a}+{b}): <span style={{ color: '#79c0ff' }}>{sum}</span>
        {'  ·  '}renders: <span style={{ color: '#4caf50' }}>{sumRenders.current}</span>
      </div>
      <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
        diff ({a}−{b}): <span style={{ color: '#79c0ff' }}>{diff}</span>
        {'  ·  '}renders: <span style={{ color: '#4caf50' }}>{diffRenders.current}</span>
      </div>
      <Pre>{`const sumAtom  = atom(get => get(aAtom) + get(bAtom))
const diffAtom = atom(get => get(aAtom) - get(bAtom))

// Dep graph: sumAtom depends on {aAtom, bAtom}
// Set aAtom → both sumAtom and diffAtom invalidate and notify
// Set bAtom → same
// Jotai tracks deps by recording which atoms get() was called on`}</Pre>
    </Section>
  )
}

// ─── 2.4 Dep tracking mechanism ──────────────────────────────────────────────

function DepTracking() {
  return (
    <Section title="2.4 — How dependency tracking works">
      <Info>No global tracker variable (unlike MobX). Jotai's Store evaluates the read fn with a capturing getter. Every atom passed to get() during evaluation is registered as a dependency.</Info>
      <Pre>{`// core/jotai.ts — Store.evaluate()
private evaluate(atom: ReadAtom) {
  const deps = new Set<AnyAtom>()

  const getter = (dep) => {
    deps.add(dep)         // record the dependency
    return this.get(dep)  // read current value
  }

  const value = atom.read(getter)  // run with capturing getter

  // Subscribe to each dep — invalidate this atom when any dep changes
  state.depUnsubs = [...deps].map(dep =>
    this.subscribe(dep, () => this.invalidate(atom))
  )
  return value
}

// vs MobX: uses a global currentTracker variable
// vs Recoil: same capturing getter approach, but no key string registry`}</Pre>
    </Section>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function DerivedExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>02 · Derived Atoms</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Derived atoms are created with atom(get =&gt; ...). No separate selector() function — the same
        atom() factory handles both primitives and derivations. Deps are discovered automatically.
      </p>
      <SimpleDerivation />
      <ChainedDerivation />
      <MultiDep />
      <DepTracking />
    </div>
  )
}
