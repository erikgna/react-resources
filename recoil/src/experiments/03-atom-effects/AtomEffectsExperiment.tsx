import { useState } from 'react'
import { atom, useRecoilState, useRecoilValue, RecoilRoot, type AtomEffect } from 'recoil'
import { Section, Row, Btn, Info, Pre, Log } from '../shared'

// ─── Atom with localStorage persistence effect ────────────────────────────────

const persistedCountAtom = atom<number>({
  key: '03/persistedCount',
  default: 0,
  effects: [
    ({ setSelf, onSet }) => {
      const stored = localStorage.getItem('03/count')
      if (stored != null) setSelf(JSON.parse(stored))

      onSet((newVal, _, isReset) => {
        if (isReset) localStorage.removeItem('03/count')
        else localStorage.setItem('03/count', JSON.stringify(newVal))
      })
    },
  ],
})

// ─── Atom with external log effect ────────────────────────────────────────────

const externalLog: string[] = []

const loggedValueAtom = atom<number>({
  key: '03/loggedValue',
  default: 0,
  effects: [
    ({ onSet }) => {
      onSet((newVal, oldVal) => {
        externalLog.push(`[${new Date().toLocaleTimeString()}] ${oldVal} → ${newVal}`)
      })
    },
  ],
})

// ─── Atom with async init via setSelf ─────────────────────────────────────────

const asyncInitAtom = atom<string>({
  key: '03/asyncInit',
  default: 'loading...',
  effects: [
    ({ setSelf }) => {
      // Simulate async initialization (e.g., fetch from API)
      const timer = setTimeout(() => {
        setSelf('fetched from server')
      }, 1200)
      return () => clearTimeout(timer)  // cleanup on unmount
    },
  ],
})

// ─── Atom with multiple composed effects ──────────────────────────────────────

const composedAtom = atom<number>({
  key: '03/composed',
  default: 0,
  effects: [
    // Effect 1: validate range
    ({ onSet, setSelf }) => {
      onSet(newVal => {
        if (newVal < 0) setSelf(0)
        if (newVal > 100) setSelf(100)
      })
    },
    // Effect 2: log valid changes
    ({ onSet }) => {
      onSet(newVal => {
        console.log('[effect2] validated value:', newVal)
      })
    },
  ] as AtomEffect<number>[],
})

// ─── 3.1 localStorage persistence ────────────────────────────────────────────

function PersistenceDemo() {
  const [count, setCount] = useRecoilState(persistedCountAtom)
  return (
    <Section title="3.1 — localStorage persistence effect">
      <Info>The effect runs once on atom init. setSelf hydrates from storage; onSet persists on every change. Survives page refresh.</Info>
      <Row>
        <Btn onClick={() => setCount(c => c - 1)} danger>−</Btn>
        <span style={{ color: '#e0e0e0', fontSize: 20, minWidth: 40, textAlign: 'center' }}>{count}</span>
        <Btn onClick={() => setCount(c => c + 1)}>+</Btn>
        <Btn onClick={() => setCount(0)} danger>Reset</Btn>
      </Row>
      <p style={{ fontSize: 11, color: '#555', marginTop: 8 }}>
        localStorage['03/count'] = {localStorage.getItem('03/count') ?? 'not set'}
      </p>
      <Pre>{`atom({
  key: 'count',
  default: 0,
  effects: [({ setSelf, onSet }) => {
    // Runs once — hydrate from storage
    const stored = localStorage.getItem('count')
    if (stored != null) setSelf(JSON.parse(stored))

    // Runs on every change
    onSet((newVal, _, isReset) => {
      if (isReset) localStorage.removeItem('count')
      else localStorage.setItem('count', JSON.stringify(newVal))
    })
  }]
})`}</Pre>
    </Section>
  )
}

// ─── 3.2 External log ─────────────────────────────────────────────────────────

function ExternalLogDemo() {
  const [val, setVal] = useRecoilState(loggedValueAtom)
  const [, forceUpdate] = useState(0)
  return (
    <Section title="3.2 — onSet: subscribe to changes externally">
      <Info>onSet fires after React's batched update completes. Use it to sync state to non-React systems: analytics, WebSocket, Redux devtools bridge.</Info>
      <Row>
        <Btn onClick={() => { setVal(v => v - 5); forceUpdate(n => n + 1) }} danger>−5</Btn>
        <span style={{ color: '#e0e0e0', fontSize: 20, minWidth: 40, textAlign: 'center' }}>{val}</span>
        <Btn onClick={() => { setVal(v => v + 5); forceUpdate(n => n + 1) }}>+5</Btn>
      </Row>
      <Log entries={externalLog} />
      <Pre>{`effects: [({ onSet }) => {
  onSet((newVal, oldVal) => {
    // oldVal: previous value
    // newVal: updated value
    // third param isReset: true if atom was reset to default
    analytics.track('atom_changed', { from: oldVal, to: newVal })
  })
}]
// onSet is NOT called when setSelf() is used inside the same effect`}</Pre>
    </Section>
  )
}

// ─── 3.3 Async init + cleanup ─────────────────────────────────────────────────

function AsyncInitDemo() {
  const value = useRecoilValue(asyncInitAtom)
  return (
    <Section title="3.3 — setSelf for async initialization + cleanup">
      <Info>setSelf() inside an effect sets the atom's value from outside React. Returning a cleanup function prevents memory leaks when the atom is no longer used.</Info>
      <div style={{ fontSize: 14, color: '#e0e0e0', padding: '8px 0' }}>
        value: <span style={{ color: value === 'loading...' ? '#666' : '#4a9eff' }}>{value}</span>
      </div>
      <Pre>{`effects: [({ setSelf }) => {
  const timer = setTimeout(() => {
    setSelf('fetched from server')  // mutates atom without React event
  }, 1200)

  return () => clearTimeout(timer)  // ← cleanup: runs on atom GC or remount
}]
// setSelf during init (before atom is first read) sets default value
// setSelf after init triggers a state update + re-render`}</Pre>
    </Section>
  )
}

// ─── 3.4 Composed effects ────────────────────────────────────────────────────

function ComposedEffectsDemo() {
  const [val, setVal] = useRecoilState(composedAtom)
  return (
    <Section title="3.4 — Composed effects: validation + logging">
      <Info>effects is an array — each effect is independent. Effects run in order. setSelf() inside onSet creates a correction cycle. Try values outside 0–100.</Info>
      <Row>
        <Btn onClick={() => setVal(v => v - 20)} danger>−20</Btn>
        <span style={{ color: '#e0e0e0', fontSize: 20, minWidth: 40, textAlign: 'center' }}>{val}</span>
        <Btn onClick={() => setVal(v => v + 20)}>+20</Btn>
        <Btn onClick={() => setVal(150)}>set 150 (clamped)</Btn>
        <Btn onClick={() => setVal(-50)} danger>set −50 (clamped)</Btn>
      </Row>
      <Pre>{`effects: [
  // Effect 1: clamp to [0, 100]
  ({ onSet, setSelf }) => {
    onSet(v => {
      if (v < 0)   setSelf(0)
      if (v > 100) setSelf(100)
    })
  },
  // Effect 2: log (runs after effect 1)
  ({ onSet }) => {
    onSet(v => console.log('validated:', v))
  }
]`}</Pre>
    </Section>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function AtomEffectsExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>03 · Atom Effects</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Atom effects are side-effect functions declared on the atom itself. They run once when the atom is first used.
        Use them for persistence, logging, validation, or async initialization.
      </p>
      <RecoilRoot>
        <PersistenceDemo />
        <ExternalLogDemo />
        <AsyncInitDemo />
        <ComposedEffectsDemo />
      </RecoilRoot>
    </div>
  )
}
