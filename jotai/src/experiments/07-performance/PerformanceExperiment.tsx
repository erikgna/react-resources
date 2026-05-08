import { useRef } from 'react'
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { Section, Row, Btn, Info, Pre, Box } from '../shared'

// ─── Atom-per-field vs single object atom ────────────────────────────────────

// Approach A: single object atom
type Profile = { name: string; age: number; score: number }
const profileAtom = atom<Profile>({ name: 'Alice', age: 30, score: 0 })

// Approach B: separate atom per field — granular subscriptions
const nameAtom  = atom('Alice')
const ageAtom   = atom(30)
const scoreAtom = atom(0)

// selectAtom: memoized partial reads from a compound atom
const nameSelectAtom  = selectAtom(profileAtom, p => p.name)
const ageSelectAtom   = selectAtom(profileAtom, p => p.age)
const scoreSelectAtom = selectAtom(profileAtom, p => p.score)

// ─── 7.1 Object atom vs atom-per-field ───────────────────────────────────────

function ObjectNameDisplay() {
  const profile = useAtomValue(profileAtom)
  const renders = useRef(0); renders.current++
  return <Box name="Object.name" renders={renders.current}>{profile.name}</Box>
}

function ObjectAgeDisplay() {
  const profile = useAtomValue(profileAtom)
  const renders = useRef(0); renders.current++
  return <Box name="Object.age" renders={renders.current}>{profile.age}</Box>
}

function ObjectScoreDisplay() {
  const profile = useAtomValue(profileAtom)
  const renders = useRef(0); renders.current++
  return <Box name="Object.score" renders={renders.current}>{profile.score}</Box>
}

function GranularNameDisplay() {
  const name = useAtomValue(nameAtom)
  const renders = useRef(0); renders.current++
  return <Box name="Atom.name" renders={renders.current}>{name}</Box>
}

function GranularAgeDisplay() {
  const age = useAtomValue(ageAtom)
  const renders = useRef(0); renders.current++
  return <Box name="Atom.age" renders={renders.current}>{age}</Box>
}

function GranularScoreDisplay() {
  const score = useAtomValue(scoreAtom)
  const renders = useRef(0); renders.current++
  return <Box name="Atom.score" renders={renders.current}>{score}</Box>
}

function AtomComparison() {
  const [profile, setProfile] = useAtom(profileAtom)
  const setScore = useSetAtom(scoreAtom)

  return (
    <Section title="7.1 — Object atom vs atom-per-field render comparison">
      <Info>Updating score in a single object atom re-renders ALL three object-reading components. Updating the dedicated scoreAtom re-renders ONLY the score component.</Info>
      <Row style={{ marginBottom: 10 }}>
        <Btn onClick={() => setProfile(p => ({ ...p, score: p.score + 1 }))}>
          Object: score++
        </Btn>
        <Btn onClick={() => setScore(s => s + 1)}>
          Atom: score++
        </Btn>
        <Btn onClick={() => {
          setProfile({ name: 'Alice', age: 30, score: 0 })
          setScore(0)
        }} danger>Reset</Btn>
      </Row>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>Single object atom — all 3 re-render on any field change:</div>
        <Row>
          <ObjectNameDisplay />
          <ObjectAgeDisplay />
          <ObjectScoreDisplay />
        </Row>
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>Separate atoms — only the changed field's component re-renders:</div>
        <Row>
          <GranularNameDisplay />
          <GranularAgeDisplay />
          <GranularScoreDisplay />
        </Row>
      </div>
      <Pre>{`// Object atom: ALL readers re-render when ANY field changes
const profileAtom = atom<Profile>({ name, age, score })

// Separate atoms: ONLY the changed field's subscriber re-renders
const nameAtom  = atom('Alice')
const scoreAtom = atom(0)

// Rule: if fields update independently, model them as separate atoms`}</Pre>
    </Section>
  )
}

// ─── 7.2 selectAtom ──────────────────────────────────────────────────────────

function SelectNameDisplay() {
  const name = useAtomValue(nameSelectAtom)
  const renders = useRef(0); renders.current++
  return <Box name="select.name" renders={renders.current}>{name}</Box>
}

function SelectAgeDisplay() {
  const age = useAtomValue(ageSelectAtom)
  const renders = useRef(0); renders.current++
  return <Box name="select.age" renders={renders.current}>{age}</Box>
}

function SelectScoreDisplay() {
  const score = useAtomValue(scoreSelectAtom)
  const renders = useRef(0); renders.current++
  return <Box name="select.score" renders={renders.current}>{score}</Box>
}

function SelectAtomDemo() {
  const [profile, setProfile] = useAtom(profileAtom)
  return (
    <Section title="7.2 — selectAtom: granular reads from a compound atom">
      <Info>selectAtom(baseAtom, selector) creates a derived atom that only notifies if the selected slice actually changed. Best of both worlds: one object atom, field-level re-renders.</Info>
      <Row style={{ marginBottom: 10 }}>
        <Btn onClick={() => setProfile(p => ({ ...p, score: p.score + 1 }))}>score++</Btn>
        <Btn onClick={() => setProfile(p => ({ ...p, age: p.age + 1 }))}>age++</Btn>
        <Btn onClick={() => setProfile({ name: 'Alice', age: 30, score: 0 })} danger>Reset</Btn>
      </Row>
      <Row>
        <SelectNameDisplay />
        <SelectAgeDisplay />
        <SelectScoreDisplay />
      </Row>
      <Pre>{`import { selectAtom } from 'jotai/utils'

const nameSelectAtom = selectAtom(profileAtom, p => p.name)
// Only notifies when p.name changes — uses Object.is comparison by default
// Custom equality: selectAtom(atom, selector, (a, b) => deepEqual(a, b))`}</Pre>
    </Section>
  )
}

// ─── 7.3 Write-only — zero re-renders in the writer ──────────────────────────

const bigCounterAtom = atom(0)

function CounterDisplay() {
  const count = useAtomValue(bigCounterAtom)
  const renders = useRef(0); renders.current++
  return (
    <div style={{ fontSize: 13, color: '#888' }}>
      value: <span style={{ color: '#e0e0e0', fontSize: 20 }}>{count}</span>
      {'  ·  '}reader renders: <span style={{ color: '#4caf50' }}>{renders.current}</span>
    </div>
  )
}

function ZeroRenderWriter() {
  const setCount = useSetAtom(bigCounterAtom)
  const renders = useRef(0); renders.current++
  return (
    <div>
      <Btn onClick={() => setCount(c => c + 1)}>
        Increment — writer renders: {renders.current}
      </Btn>
    </div>
  )
}

function WriteOnlyDemo() {
  return (
    <Section title="7.3 — useSetAtom: writer component never re-renders">
      <Info>useSetAtom subscribes only to the setter — no re-render when the atom changes. For large lists of action buttons, this is a meaningful optimization.</Info>
      <div style={{ marginBottom: 8 }}>
        <CounterDisplay />
      </div>
      <ZeroRenderWriter />
      <Pre>{`// Reader: subscribes, re-renders on every change
const count = useAtomValue(bigCounterAtom)

// Writer: NO subscription — renders exactly once (mount)
const setCount = useSetAtom(bigCounterAtom)

// Equivalent to Recoil's useSetRecoilState, MobX write-only observer`}</Pre>
    </Section>
  )
}

// ─── 7.4 Render count summary ────────────────────────────────────────────────

function RenderSummary() {
  return (
    <Section title="7.4 — Summary: render optimization strategies">
      <Info>Three complementary approaches — choose based on data shape and update frequency.</Info>
      <Pre>{`// Strategy 1: Separate atoms (best for independent fields)
const xAtom = atom(0)
const yAtom = atom(0)
// Changing x never re-renders y's subscriber

// Strategy 2: selectAtom (for existing compound atoms)
const xSelect = selectAtom(pointAtom, p => p.x)
// Object.is comparison — notifies only when x actually changed

// Strategy 3: useSetAtom for pure writers
const setX = useSetAtom(xAtom)
// No subscription at all — zero re-renders in the writer

// Anti-pattern: reading the whole atom when only a field is needed
const { x } = useAtomValue(pointAtom)  // re-renders on y change too`}</Pre>
    </Section>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function PerformanceExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>07 · Performance</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Jotai's atom-level subscriptions make render optimization explicit and measurable.
        Separate atoms, selectAtom, and useSetAtom cover the full spectrum from granular state
        to write-only components.
      </p>
      <AtomComparison />
      <SelectAtomDemo />
      <WriteOnlyDemo />
      <RenderSummary />
    </div>
  )
}
