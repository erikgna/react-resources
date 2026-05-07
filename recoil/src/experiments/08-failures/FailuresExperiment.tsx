import { useState } from 'react'
import { atom, selector, useRecoilState, useRecoilValue, RecoilRoot } from 'recoil'
import {
  atom as coreAtom,
  selector as coreSelector,
  useRecoilValue as coreUseValue,
  RecoilRoot as CoreRoot,
} from '../../core/recoil'
import { Section, Row, Btn, Info, Pre, ErrorBoundary, Log } from '../shared'

// ─── Atoms for failure scenarios ──────────────────────────────────────────────

const missingRootAtom = atom({ key: '08/missingRoot', default: 42 })
const dupKeyAtom1 = atom({ key: '08/dupKey', default: 'first' })

// Intentional dupe — Recoil logs a warning in dev, does not throw at definition
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const dupKeyAtom2 = atom({ key: '08/dupKey', default: 'second' })

// Circular selectors using var to allow mutual reference before definition
// eslint-disable-next-line no-var
var circSelectorA: ReturnType<typeof selector<number>>
// eslint-disable-next-line no-var
var circSelectorB: ReturnType<typeof selector<number>>

circSelectorA = selector<number>({
  key: '08/circA',
  get: ({ get }) => get(circSelectorB) + 1,
})
circSelectorB = selector<number>({
  key: '08/circB',
  get: ({ get }) => get(circSelectorA) + 1,
})

// Async selector that always rejects — for error boundary demo
const asyncFailSelector = selector<string>({
  key: '08/asyncFail',
  get: async () => {
    await new Promise(r => setTimeout(r, 400))
    throw new Error('Async selector rejected — missing ErrorBoundary above')
  },
})

// Core circular selectors
const coreCircA: ReturnType<typeof coreSelector<number>> = coreSelector({
  key: 'core-08/circA',
  get: ({ get }) => get(coreCircB) + 1,
})
const coreCircB: ReturnType<typeof coreSelector<number>> = coreSelector({
  key: 'core-08/circB',
  get: ({ get }) => get(coreCircA) + 1,
})

// ─── 8.1 Missing RecoilRoot ───────────────────────────────────────────────────

function ComponentNeedingRoot() {
  const [val] = useRecoilState(missingRootAtom)
  return <div style={{ color: '#4caf50', fontSize: 13 }}>value: {val}</div>
}

function MissingRootDemo() {
  const [mounted, setMounted] = useState(false)
  return (
    <Section title="8.1 — Missing RecoilRoot">
      <Info>
        useRecoilState calls useContext(RecoilRoot.Context) which returns null outside any
        RecoilRoot. Recoil throws immediately — caught here by ErrorBoundary.
      </Info>
      <ErrorBoundary>
        {mounted && <ComponentNeedingRoot />}
      </ErrorBoundary>
      <Row style={{ marginTop: 8 }}>
        <Btn onClick={() => setMounted(true)} danger={mounted}>
          {mounted ? 'mounted (error above)' : 'Mount without RecoilRoot'}
        </Btn>
        <Btn onClick={() => setMounted(false)}>Reset</Btn>
      </Row>
      <Pre>{`// This component uses useRecoilState but has no ancestor <RecoilRoot>
function ComponentNeedingRoot() {
  const [val] = useRecoilState(counterAtom)  // ← throws
  return <div>{val}</div>
}

// Recoil error: "This component must be used inside a <RecoilRoot>."
// Fix: wrap the component tree in <RecoilRoot> at or above the usage site`}</Pre>
    </Section>
  )
}

// ─── 8.2 Duplicate atom key ───────────────────────────────────────────────────

function DupKeyDemo() {
  const [log] = useState([
    'atom({ key: "08/dupKey", default: "first" })  → registered',
    'atom({ key: "08/dupKey", default: "second" }) → Recoil: duplicate key warning',
    'Second atom silently wins in dev — first atom is overwritten in the registry',
    'In strict mode Recoil throws. In prod it silently overwrites.',
    'Both references point to the same atom key — unexpected behavior follows.',
  ])
  return (
    <Section title="8.2 — Duplicate atom key (silent corruption)">
      <RecoilRoot>
        <DupKeyDisplay />
      </RecoilRoot>
      <Log entries={log} />
      <Pre>{`// Both defined at module level with the SAME key string
const dupKeyAtom1 = atom({ key: 'myAtom', default: 'first'  })
const dupKeyAtom2 = atom({ key: 'myAtom', default: 'second' })

// No TypeScript error. No runtime throw. Only a dev console warning.
// dupKeyAtom1 and dupKeyAtom2 now reference the SAME Recoil state.
// This is a common footgun when copy-pasting atom definitions.

// FIX: Use a naming convention or a key generator:
// const atom = (key, def) => recoilAtom({ key: \`ns/\${key}\`, default: def })`}</Pre>
    </Section>
  )
}

function DupKeyDisplay() {
  const val1 = useRecoilValue(dupKeyAtom1)
  return (
    <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>
      dupKeyAtom1 value: <span style={{ color: '#f5a623' }}>{val1}</span>
      <span style={{ color: '#555', fontSize: 11, marginLeft: 8 }}>(second definition won — default "second" not "first")</span>
    </div>
  )
}

// ─── 8.3 Circular selector ────────────────────────────────────────────────────

function CircularSelectorDisplay() {
  const val = useRecoilValue(circSelectorA)
  return <div style={{ color: '#4caf50', fontSize: 13 }}>value: {val}</div>
}

function CircularDemo() {
  const [show, setShow] = useState(false)
  return (
    <Section title="8.3 — Circular selector dependency">
      <Info>circSelectorA reads circSelectorB which reads circSelectorA. Recoil detects cycles at evaluation time and throws. ErrorBoundary catches the circular dep error.</Info>
      <ErrorBoundary>
        <RecoilRoot>
          {show && <CircularSelectorDisplay />}
        </RecoilRoot>
      </ErrorBoundary>
      <Row style={{ marginTop: 8 }}>
        <Btn onClick={() => setShow(true)} danger>Trigger circular selector read</Btn>
        <Btn onClick={() => setShow(false)}>Reset</Btn>
      </Row>
      <Pre>{`// A reads B, B reads A → cycle
const selectorA = selector({ key: 'A', get: ({ get }) => get(selectorB) + 1 })
const selectorB = selector({ key: 'B', get: ({ get }) => get(selectorA) + 1 })

// Recoil: throws "Recoil: Detected a cycle in Recoil async dependencies"
//         at the point selectorA is first read by a component.

// Core reimplementation: Maximum call stack size exceeded (stack overflow)
//   because getSelectorValue recurses without a cycle guard.`}</Pre>
    </Section>
  )
}

// ─── 8.4 Core circular selector — stack overflow ──────────────────────────────

function CoreCircularDisplay() {
  const val = coreUseValue(coreCircA)
  return <div style={{ color: '#4caf50', fontSize: 13 }}>value: {val}</div>
}

function CoreCircularDemo() {
  const [show, setShow] = useState(false)
  return (
    <Section title="8.4 — Core reimplementation: circular → stack overflow">
      <Info>Our core/recoil.ts has no cycle detection. Reading a circular selector causes infinite recursion — Maximum call stack size exceeded. Caught by ErrorBoundary but harder to diagnose than Recoil's explicit error.</Info>
      <ErrorBoundary>
        <CoreRoot>
          {show && <CoreCircularDisplay />}
        </CoreRoot>
      </ErrorBoundary>
      <Row style={{ marginTop: 8 }}>
        <Btn onClick={() => setShow(true)} danger>Trigger core circular read</Btn>
        <Btn onClick={() => setShow(false)}>Reset</Btn>
      </Row>
      <Pre>{`// core/recoil.ts: getSelectorValue has no cycle guard
getSelectorValue(A) {
  getFn({ get: dep => getSelectorValue(dep) })  // calls A again
  //                    ^^^^^^^^^^^^^^^^^^^^^^^^^
  //                    → Maximum call stack size exceeded
}

// Real Recoil: tracks evaluating selectors in a Set
// If selectorKey is already in the Set, throw before recursing
// Our core has 0 lines for this — a real gap in the reimplementation`}</Pre>
    </Section>
  )
}

// ─── 8.5 Async selector without ErrorBoundary ────────────────────────────────

import { Suspense } from 'react'

function AsyncFailComponent() {
  const val = useRecoilValue(asyncFailSelector)
  return <div>{val}</div>
}

function AsyncWithoutBoundaryDemo() {
  const [show, setShow] = useState(false)
  const [withBoundary, setWithBoundary] = useState(true)
  return (
    <Section title="8.5 — Async selector rejection: with vs without ErrorBoundary">
      <Info>Without an ErrorBoundary, a rejected async selector propagates up and crashes the nearest React tree boundary. Toggle to compare behavior.</Info>
      <Row style={{ marginBottom: 10 }}>
        <Btn onClick={() => setWithBoundary(b => !b)}>
          ErrorBoundary: {withBoundary ? 'ON' : 'OFF'}
        </Btn>
        <Btn onClick={() => setShow(s => !s)} danger={show}>
          {show ? 'Hide failing component' : 'Mount failing component'}
        </Btn>
      </Row>
      <RecoilRoot>
        {show && withBoundary && (
          <ErrorBoundary>
            <Suspense fallback={<div style={{ color: '#555', fontSize: 13 }}>loading (will fail in 400ms)...</div>}>
              <AsyncFailComponent />
            </Suspense>
          </ErrorBoundary>
        )}
        {show && !withBoundary && (
          <Suspense fallback={<div style={{ color: '#555', fontSize: 13 }}>loading (will fail in 400ms)...</div>}>
            <AsyncFailComponent />
          </Suspense>
        )}
      </RecoilRoot>
      <Pre>{`// Without ErrorBoundary: rejection crashes the tree
<Suspense fallback={<Spinner />}>
  <ComponentThatReadsFailingSelector />
  {/* After rejection: React throws, no recovery possible without ErrorBoundary */}
</Suspense>

// With ErrorBoundary: graceful degradation
<ErrorBoundary fallback={err => <Alert>{err.message}</Alert>}>
  <Suspense fallback={<Spinner />}>
    <ComponentThatReadsFailingSelector />
  </Suspense>
</ErrorBoundary>`}</Pre>
    </Section>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function FailuresExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>08 · Failures</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Recoil failure modes: missing root (loud), duplicate key (silent), circular selectors (loud at read time),
        async rejection without boundary (crash). Know which are silent — those are the dangerous ones.
      </p>
      <MissingRootDemo />
      <DupKeyDemo />
      <CircularDemo />
      <CoreCircularDemo />
      <AsyncWithoutBoundaryDemo />
    </div>
  )
}
