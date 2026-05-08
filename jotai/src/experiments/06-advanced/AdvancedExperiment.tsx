import { useRef } from 'react'
import { atom, useAtom, useAtomValue, useSetAtom, useStore, createStore, Provider } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { Section, Row, Btn, Info, Pre } from '../shared'

// ─── 6.1 atomWithStorage ─────────────────────────────────────────────────────

const themeAtom = atomWithStorage<'dark' | 'light'>('jotai-poc-theme', 'dark')
const visitCountAtom = atomWithStorage('jotai-poc-visits', 0)

function StorageDemo() {
  const [theme, setTheme] = useAtom(themeAtom)
  const [visits, setVisits] = useAtom(visitCountAtom)
  return (
    <Section title="6.1 — atomWithStorage: localStorage persistence">
      <Info>atomWithStorage(key, init) syncs the atom to localStorage automatically. Values survive page reloads. Change values here, then refresh — state is restored.</Info>
      <Row style={{ marginBottom: 10 }}>
        <span style={{ color: '#555', fontSize: 11 }}>theme:</span>
        <Btn onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
          {theme} (toggle)
        </Btn>
        <span style={{ color: '#555', fontSize: 11, marginLeft: 12 }}>visits:</span>
        <span style={{ color: '#e0e0e0' }}>{visits}</span>
        <Btn onClick={() => setVisits(v => v + 1)}>+1</Btn>
        <Btn onClick={() => setVisits(0)} danger>Reset</Btn>
      </Row>
      <div style={{ fontSize: 11, color: '#555' }}>
        localStorage["jotai-poc-theme"]: <span style={{ color: '#79c0ff' }}>{localStorage.getItem('jotai-poc-theme') ?? '(none)'}</span>
      </div>
      <Pre>{`import { atomWithStorage } from 'jotai/utils'

const themeAtom = atomWithStorage<'dark' | 'light'>('jotai-poc-theme', 'dark')

// Reads from localStorage on mount, writes on every change
// Works with sessionStorage, IndexedDB, or custom storage via options`}</Pre>
    </Section>
  )
}

// ─── 6.2 Scoped Provider stores ──────────────────────────────────────────────

const scopedCounterAtom = atom(0)

const storeA = createStore()
const storeB = createStore()

function ScopedCounter({ label }: { label: string }) {
  const [count, setCount] = useAtom(scopedCounterAtom)
  const renders = useRef(0); renders.current++
  return (
    <div style={{ border: '1px solid #2a2a2a', borderRadius: 3, padding: '10px 14px', minWidth: 160 }}>
      <div style={{ color: '#555', fontSize: 10, marginBottom: 6, textTransform: 'uppercase' }}>{label}</div>
      <Row>
        <Btn onClick={() => setCount(c => c - 1)} danger>−</Btn>
        <span style={{ color: '#e0e0e0', fontSize: 18, minWidth: 32, textAlign: 'center' }}>{count}</span>
        <Btn onClick={() => setCount(c => c + 1)}>+</Btn>
      </Row>
      <div style={{ fontSize: 11, color: '#555', marginTop: 6 }}>renders: {renders.current}</div>
    </div>
  )
}

function ScopedProviders() {
  return (
    <Section title="6.2 — Provider: scoped isolated stores">
      <Info>{'<Provider store={createStore()}>'} creates an independent store context. The same atom used in two different Providers holds completely separate state.</Info>
      <Row style={{ marginBottom: 10, alignItems: 'flex-start' }}>
        <Provider store={storeA}>
          <ScopedCounter label="Store A" />
        </Provider>
        <Provider store={storeB}>
          <ScopedCounter label="Store B" />
        </Provider>
      </Row>
      <Pre>{`const storeA = createStore()
const storeB = createStore()

// Same atom, two completely independent values
<Provider store={storeA}>
  <Counter />   {/* scopedCounterAtom = storeA's value */}
</Provider>
<Provider store={storeB}>
  <Counter />   {/* scopedCounterAtom = storeB's value */}
</Provider>

// Use case: multiple widget instances, microfrontend isolation,
// test isolation (each test gets a fresh store)`}</Pre>
    </Section>
  )
}

// ─── 6.3 Imperative store access ─────────────────────────────────────────────

const imperativeCounterAtom = atom(0)

function ImperativeAccess() {
  const store = useStore()
  const count = useAtomValue(imperativeCounterAtom)

  const readOutside = () => {
    const val = store.get(imperativeCounterAtom)
    alert(`store.get() = ${val}`)
  }

  const setOutside = () => {
    store.set(imperativeCounterAtom, c => c + 10)
  }

  return (
    <Section title="6.3 — useStore(): imperative store access">
      <Info>useStore() returns the active store. store.get(atom) and store.set(atom, value) work outside the reactive hook system — useful in event handlers, callbacks, and non-React code.</Info>
      <Row style={{ marginBottom: 8 }}>
        <span style={{ color: '#e0e0e0' }}>{count}</span>
        <Btn onClick={setOutside}>+10 via store.set</Btn>
        <Btn onClick={readOutside}>Alert via store.get</Btn>
      </Row>
      <Pre>{`const store = useStore()

// Read current value imperatively — no subscription
const val = store.get(someAtom)

// Write imperatively — triggers all subscribers normally
store.set(someAtom, newValue)
store.set(someAtom, prev => prev + 1)  // functional update

// Also works with createStore() for global access outside components:
const globalStore = createStore()
// ... later, in any module:
globalStore.get(atom)
globalStore.set(atom, value)`}</Pre>
    </Section>
  )
}

// ─── 6.4 debugLabel ──────────────────────────────────────────────────────────

const labeledAtom = atom(42)
labeledAtom.debugLabel = 'mySpecialAtom'

function DebugLabel() {
  const [val, setVal] = useAtom(labeledAtom)
  return (
    <Section title="6.4 — atom.debugLabel for DevTools">
      <Info>Set atom.debugLabel to give the atom a human-readable name in React DevTools and Jotai DevTools. Without it, atoms appear as anonymous objects.</Info>
      <Row>
        <Btn onClick={() => setVal(v => v - 1)} danger>−</Btn>
        <span style={{ color: '#e0e0e0', fontSize: 18, minWidth: 36, textAlign: 'center' }}>{val}</span>
        <Btn onClick={() => setVal(v => v + 1)}>+</Btn>
      </Row>
      <Pre>{`const labeledAtom = atom(42)
labeledAtom.debugLabel = 'mySpecialAtom'
// Appears as 'mySpecialAtom' in React DevTools atom inspector

// Best practice: set debugLabel in dev builds only
if (import.meta.env.DEV) labeledAtom.debugLabel = 'mySpecialAtom'`}</Pre>
    </Section>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function AdvancedExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>06 · Advanced</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        atomWithStorage for persistence, Provider for scoped isolation, useStore() for imperative
        access, and debugLabel for DevTools visibility.
      </p>
      <StorageDemo />
      <ScopedProviders />
      <ImperativeAccess />
      <DebugLabel />
    </div>
  )
}
