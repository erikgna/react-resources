import { useRef, useState } from 'react'
import { create } from 'zustand'
import { shallow } from 'zustand/shallow'
import { Section, Row, Btn, Info, Pre, Log, Box } from '../shared'

// ─── Shared store — module level ─────────────────────────────────────────────

interface State {
  count: number
  name: string
  items: string[]
  tick: number
  inc: () => void
  setName: (n: string) => void
  addItem: (s: string) => void
  tock: () => void
}

const useStore = create<State>((set) => ({
  count: 0,
  name: 'Alice',
  items: [],
  tick: 0,
  inc: () => set(s => ({ count: s.count + 1 })),
  setName: (name) => set({ name }),
  addItem: (item) => set(s => ({ items: [...s.items, item] })),
  tock: () => set(s => ({ tick: s.tick + 1 })),
}))

// ─── 2.1 No selector — entire state, re-renders on everything ────────────────

function NoSelectorBox() {
  const renders = useRef(0)
  renders.current++
  const state = useStore()  // entire state object
  return (
    <Box name="No selector" renders={renders.current}>
      count={state.count} / tick={state.tick}
    </Box>
  )
}

function NoSelectorSection() {
  return (
    <Section title="2.1 — No selector — re-renders on every setState">
      <Info>
        <code>useStore()</code> with no selector subscribes to the full state object. Any <code>setState</code> returns a new object — <code>Object.is</code> fails — re-render fires. Watch renders increment on <em>tick</em> even though tick isn't displayed.
      </Info>
      <Row style={{ marginBottom: 8 }}>
        <Btn onClick={() => useStore.getState().inc()}>count++</Btn>
        <Btn onClick={() => useStore.getState().tock()}>tick++ (not displayed, still re-renders)</Btn>
        <Btn onClick={() => useStore.getState().setName(useStore.getState().name === 'Alice' ? 'Bob' : 'Alice')}>toggle name</Btn>
      </Row>
      <NoSelectorBox />
      <Pre>{`// BAD — subscribes to entire state
const state = useStore()
// Every setState → new state object → Object.is fails → re-render

// tick++ re-renders NoSelectorBox even though it doesn't show tick.`}</Pre>
    </Section>
  )
}

// ─── 2.2 Targeted selector — renders only on relevant change ─────────────────

function CountBox() {
  const renders = useRef(0)
  renders.current++
  const count = useStore(s => s.count)
  return <Box name="count selector" renders={renders.current} active>{count}</Box>
}

function NameBox() {
  const renders = useRef(0)
  renders.current++
  const name = useStore(s => s.name)
  return <Box name="name selector" renders={renders.current} active>{name}</Box>
}

function TargetedSelectorSection() {
  return (
    <Section title="2.2 — Targeted selector — renders only when selected value changes">
      <Info>
        Each box subscribes to a single field. <code>count++</code> only re-renders <code>CountBox</code>. <code>tick++</code> re-renders neither. The selector output is compared with <code>Object.is</code>.
      </Info>
      <Row style={{ marginBottom: 8 }}>
        <Btn onClick={() => useStore.getState().inc()}>count++</Btn>
        <Btn onClick={() => useStore.getState().setName(useStore.getState().name === 'Alice' ? 'Bob' : 'Alice')}>toggle name</Btn>
        <Btn onClick={() => useStore.getState().tock()}>tick++ (neither box re-renders)</Btn>
      </Row>
      <Row>
        <CountBox />
        <NameBox />
      </Row>
      <Pre>{`const count = useStore(s => s.count)  // re-renders only when count changes
const name  = useStore(s => s.name)   // re-renders only when name changes

// tick++ → selector outputs unchanged → Object.is(prev, next) passes → no re-render`}</Pre>
    </Section>
  )
}

// ─── 2.3 Derived value selector ───────────────────────────────────────────────

function LengthBox() {
  const renders = useRef(0)
  renders.current++
  const len = useStore(s => s.items.length)
  return <Box name="items.length" renders={renders.current} active>{len}</Box>
}

let itemCounter = 0

function DerivedSelectorSection() {
  return (
    <Section title="2.3 — Derived selector — renders only when derived value changes">
      <Info>
        Selector <code>s =&gt; s.items.length</code> returns a number. Adding an item changes length → re-render. <code>count++</code> leaves length unchanged → no re-render.
      </Info>
      <Row style={{ marginBottom: 8 }}>
        <Btn onClick={() => useStore.getState().addItem(`item${++itemCounter}`)}>Add item (length changes)</Btn>
        <Btn onClick={() => useStore.getState().inc()}>count++ (length unchanged — no render)</Btn>
        <Btn onClick={() => useStore.getState().tock()}>tick++ (no render)</Btn>
      </Row>
      <LengthBox />
      <Pre>{`const len = useStore(s => s.items.length)
// Selector returns a number. Zustand compares with Object.is (same as ===).
// addItem() → length 0→1 → re-render ✓
// count++   → length unchanged → no re-render ✓`}</Pre>
    </Section>
  )
}

// ─── 2.4 Object selector: without shallow vs with shallow ─────────────────────

function ObjectBoxBad() {
  const renders = useRef(0)
  renders.current++
  // New object on every call → Object.is always false → re-renders on any setState
  const { count, name } = useStore(s => ({ count: s.count, name: s.name }))
  return (
    <Box name="object (no shallow)" renders={renders.current}>
      {count} / {name}
    </Box>
  )
}

function ObjectBoxGood() {
  const renders = useRef(0)
  renders.current++
  // shallow equality → same values, different refs → no re-render
  const { count, name } = useStore(s => ({ count: s.count, name: s.name }), shallow)
  return (
    <Box name="object + shallow" renders={renders.current} active>
      {count} / {name}
    </Box>
  )
}

function ObjectSelectorSection() {
  return (
    <Section title="2.4 — Object selector without vs with shallow">
      <Info>
        Without <code>shallow</code>: selector returns a new object every render → <code>Object.is</code> always false → re-renders on every <code>setState</code>, even for <code>tick</code>. With <code>shallow</code>: compares each key — stable when values haven't changed.
      </Info>
      <Row style={{ marginBottom: 8 }}>
        <Btn onClick={() => useStore.getState().inc()}>count++ (both re-render)</Btn>
        <Btn onClick={() => useStore.getState().tock()}>tick++ (bad re-renders, good stays)</Btn>
      </Row>
      <Row>
        <ObjectBoxBad />
        <ObjectBoxGood />
      </Row>
      <Pre>{`// BAD — new object every render → always re-renders
const { count, name } = useStore(s => ({ count: s.count, name: s.name }))

// FIX — shallow compares each key with Object.is
import { shallow } from 'zustand/shallow'
const { count, name } = useStore(
  s => ({ count: s.count, name: s.name }),
  shallow,
)
// tick++ → count and name unchanged → shallow returns true → no re-render`}</Pre>
    </Section>
  )
}

// ─── 2.5 shallow internals ────────────────────────────────────────────────────

function shallowDemo<T extends object>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true
  const keysA = Object.keys(a as object)
  if (keysA.length !== Object.keys(b as object).length) return false
  return keysA.every(k =>
    Object.is((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])
  )
}

function ShallowSection() {
  const [log, setLog] = useState<string[]>([])

  const runTests = () => {
    const a1 = { x: 1, y: 2 }
    const a2 = { x: 1, y: 2 }
    const a3 = { x: 1, y: 3 }
    const nested1 = { x: { deep: 1 } }
    const nested2 = { x: { deep: 1 } }

    setLog([
      `shallow(a1, a2)       = ${shallowDemo(a1, a2)}   — same values, different refs`,
      `shallow(a1, a3)       = ${shallowDemo(a1, a3)}   — y differs`,
      `Object.is(a1, a2)     = ${Object.is(a1, a2)}  — strict ref equality`,
      `shallow(nested1, nested2) = ${shallowDemo(nested1, nested2)}  — nested is different ref (NOT recursive)`,
      `shallow([1,2], [1,2]) = ${shallowDemo([1, 2] as unknown as object, [1, 2] as unknown as object)}  — arrays too (index-by-index)`,
    ])
  }

  return (
    <Section title="2.5 — shallow internals — one level, Object.is per key">
      <Info>
        <code>shallow(a, b)</code> iterates own keys and calls <code>Object.is(a[k], b[k])</code> for each. It is NOT recursive. Nested objects are still compared by reference.
      </Info>
      <Row>
        <Btn onClick={runTests}>Run tests</Btn>
        <Btn onClick={() => setLog([])} danger>Clear</Btn>
      </Row>
      <Log entries={log} />
      <Pre>{`// shallow algorithm (from zustand/shallow source):
function shallow(a, b) {
  if (Object.is(a, b)) return true
  const keysA = Object.keys(a)
  if (keysA.length !== Object.keys(b).length) return false
  return keysA.every(k => Object.is(a[k], b[k]))
}

// NOT deep-equal:
shallow({ x: { n: 1 } }, { x: { n: 1 } })  // false — x is different ref
// Fix: restructure state to keep nested refs stable, or use a deep-equal fn`}</Pre>
    </Section>
  )
}

export default function SelectorsExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>02 · Selectors</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Selectors control what triggers a re-render. Without one, every setState fires. With one, only changes to the selector's output fire. Object selectors need <code>shallow</code> to prevent over-rendering.
      </p>
      <NoSelectorSection />
      <TargetedSelectorSection />
      <DerivedSelectorSection />
      <ObjectSelectorSection />
      <ShallowSection />
    </div>
  )
}
