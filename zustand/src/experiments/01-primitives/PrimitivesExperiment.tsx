import { useState, useEffect, useRef } from 'react'
import { create, createStore } from 'zustand'
import { createStore as coreCreateStore, useStore as coreUseStore } from '../../core/zustand'
import { Section, Row, Btn, Info, Pre, Log } from '../shared'

// ─── 1.1 createStore vs create ───────────────────────────────────────────────

const vanillaStore = createStore<{ count: number; inc: () => void }>((set) => ({
  count: 0,
  inc: () => set(s => ({ count: s.count + 1 })),
}))

const useReactStore = create<{ count: number; inc: () => void }>((set) => ({
  count: 0,
  inc: () => set(s => ({ count: s.count + 1 })),
}))

function CreateVsCreate() {
  const [log, setLog] = useState<string[]>([])
  const count = useReactStore(s => s.count)

  return (
    <Section title="1.1 — createStore vs create">
      <Info>
        <code>createStore</code> returns a plain JS object — no React hooks. <code>create</code> wraps it and returns a React hook. Both share the same listener Set mechanism.
      </Info>
      <Row>
        <Btn onClick={() => {
          vanillaStore.getState().inc()
          setLog(p => [...p, `[vanilla] count=${vanillaStore.getState().count} (no React hook)`])
        }}>Vanilla .inc()</Btn>
        <Btn onClick={() => useReactStore.getState().inc()}>React hook .inc() (updates counter below)</Btn>
        <Btn onClick={() => setLog([])} danger>Clear</Btn>
      </Row>
      <p style={{ color: '#888', fontSize: 12, marginTop: 8 }}>React hook renders: count = {count}</p>
      <Log entries={log} />
      <Pre>{`// createStore — vanilla, usable outside React
const store = createStore<State>((set) => ({
  count: 0,
  inc: () => set(s => ({ count: s.count + 1 })),
}))
store.getState().inc()   // imperative call
store.subscribe(...)     // raw listener

// create — React wrapper, returns a hook
const useStore = create<State>((set) => ({ ... }))
const count = useStore(s => s.count)  // React component hook`}</Pre>
    </Section>
  )
}

// ─── 1.2 Raw API: getState / setState / subscribe / destroy ──────────────────

const rawStore = createStore<{ x: number; y: number }>(() => ({ x: 0, y: 0 }))

function RawApiSection() {
  const [log, setLog] = useState<string[]>([])
  const unsubsRef = useRef<Array<() => void>>([])

  const addSubs = () => {
    unsubsRef.current.forEach(u => u())
    unsubsRef.current = []
    const u1 = rawStore.subscribe((s, p) => setLog(l => [...l, `[L1] x:${p.x}→${s.x} y:${p.y}→${s.y}`]))
    const u2 = rawStore.subscribe((s, p) => setLog(l => [...l, `[L2] x changed: ${p.x}→${s.x}`]))
    const u3 = rawStore.subscribe((s) => setLog(l => [...l, `[L3] full state: ${JSON.stringify(s)}`]))
    unsubsRef.current = [u1, u2, u3]
    setLog(l => [...l, '3 listeners registered'])
  }

  return (
    <Section title="1.2 — Raw getState / setState / subscribe / destroy">
      <Info>
        The vanilla store API. <code>subscribe</code> returns an unsubscribe function. <code>setState</code> iterates every listener in the Set with <code>(newState, prevState)</code>.
      </Info>
      <Row>
        <Btn onClick={addSubs}>Add 3 subscribers</Btn>
        <Btn onClick={() => rawStore.setState(s => ({ x: s.x + 1 }))}>x++</Btn>
        <Btn onClick={() => rawStore.setState(s => ({ y: s.y + 1 }))}>y++</Btn>
        <Btn onClick={() => {
          rawStore.destroy()
          setLog(l => [...l, 'destroy() — listener Set cleared, no more notifications'])
        }} danger>destroy()</Btn>
        <Btn onClick={() => setLog([])} danger>Clear</Btn>
      </Row>
      <Log entries={log} />
      <Pre>{`const store = createStore(() => ({ x: 0, y: 0 }))

const unsub = store.subscribe((state, prevState) => {
  console.log(state.x, prevState.x)  // called on every setState
})

store.setState({ x: 1 })              // merge: { x: 1, y: 0 }
store.setState(s => ({ x: s.x + 1 })) // functional form — safe for async
unsub()                                // remove from listener Set
store.destroy()                        // clear all listeners`}</Pre>
    </Section>
  )
}

// ─── 1.3 Merge vs replace ────────────────────────────────────────────────────

const mergeStore = createStore<{ a: number; b: number; c: string }>(() => ({ a: 0, b: 0, c: 'original' }))

function MergeVsReplace() {
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    return mergeStore.subscribe(s => setLog(l => [...l, JSON.stringify(s)]))
  }, [])

  return (
    <Section title="1.3 — Partial update (merge) vs full replace">
      <Info>
        Default <code>setState</code> merges via <code>Object.assign</code>. Passing <code>true</code> as second arg replaces entirely. Replace without full state silently destroys fields.
      </Info>
      <Row>
        <Btn onClick={() => mergeStore.setState({ a: mergeStore.getState().a + 1 })}>Merge a++</Btn>
        <Btn onClick={() => mergeStore.setState(s => ({ b: s.b + 1 }))}>Merge b++</Btn>
        <Btn onClick={() => mergeStore.setState({ a: 99, b: 99, c: 'replaced' }, true)}>Replace full state</Btn>
        <Btn onClick={() => {
          // @ts-expect-error intentional — show the footgun
          mergeStore.setState({ a: -1 }, true)
          setLog(l => [...l, `FOOTGUN: replace with partial → ${JSON.stringify(mergeStore.getState())}`])
        }} danger>Replace partial (destroys b,c)</Btn>
        <Btn onClick={() => setLog([])} danger>Clear</Btn>
      </Row>
      <Log entries={log} />
      <Pre>{`store.setState({ a: 1 })               // merge → { a:1, b:0, c:'original' }
store.setState(s => ({ b: s.b + 1 }))  // merge → { a:1, b:1, c:'original' }
store.setState({ a:1, b:1, c:'new' }, true)  // replace → { a:1, b:1, c:'new' }

// FOOTGUN: replace with partial — b and c silently become undefined
// @ts-expect-error
store.setState({ a: -1 }, true)        // { a:-1, b:undefined, c:undefined }`}</Pre>
    </Section>
  )
}

// ─── 1.4 Listener Set — add 3, fire all, unsub one, fire 2 ──────────────────

const listenerStore = createStore<{ val: number }>(() => ({ val: 0 }))

function ListenerSetSection() {
  const [log, setLog] = useState<string[]>([])
  const unsubsRef = useRef<Array<() => void>>([])

  const addListeners = () => {
    unsubsRef.current.forEach(u => u())
    unsubsRef.current = []
    const u1 = listenerStore.subscribe(() => setLog(l => [...l, `[L1] val=${listenerStore.getState().val}`]))
    const u2 = listenerStore.subscribe(() => setLog(l => [...l, `[L2] val=${listenerStore.getState().val}`]))
    const u3 = listenerStore.subscribe(() => setLog(l => [...l, `[L3] val=${listenerStore.getState().val}`]))
    unsubsRef.current = [u1, u2, u3]
    setLog(l => [...l, '3 listeners in Set'])
  }

  const removeOne = () => {
    const [first, ...rest] = unsubsRef.current
    first?.()
    unsubsRef.current = rest
    setLog(l => [...l, 'L1 removed from Set'])
  }

  return (
    <Section title="1.4 — Listener Set — add 3, fire all, unsub one, fire 2">
      <Info>
        <code>subscribe</code> adds to a <code>Set&lt;Listener&gt;</code>. Each <code>setState</code> iterates the whole Set. Unsubscribe removes from the Set — subsequent notifies skip it.
      </Info>
      <Row>
        <Btn onClick={addListeners}>Add 3 listeners</Btn>
        <Btn onClick={() => listenerStore.setState(s => ({ val: s.val + 1 }))}>setState (notifies all active)</Btn>
        <Btn onClick={removeOne} danger>Remove L1 from Set</Btn>
        <Btn onClick={() => setLog([])} danger>Clear</Btn>
      </Row>
      <Log entries={log} />
      <Pre>{`const u1 = store.subscribe(() => console.log('L1'))
const u2 = store.subscribe(() => console.log('L2'))
const u3 = store.subscribe(() => console.log('L3'))

store.setState({ val: 1 })  // prints: L1, L2, L3
u1()                         // removes L1 from Set
store.setState({ val: 2 })  // prints: L2, L3 — L1 is gone`}</Pre>
    </Section>
  )
}

// ─── 1.5 getInitialState vs getState ─────────────────────────────────────────

const initStore = createStore<{ count: number; inc: () => void }>((set) => ({
  count: 0,
  inc: () => set(s => ({ count: s.count + 1 })),
}))

function InitialStateSection() {
  const [log, setLog] = useState<string[]>([])

  const check = () => {
    setLog(l => [...l,
      `getInitialState().count = ${initStore.getInitialState().count}  (always 0)`,
      `getState().count        = ${initStore.getState().count}  (current)`,
      `same object? ${Object.is(initStore.getInitialState(), initStore.getState())}`,
    ])
  }

  return (
    <Section title="1.5 — getInitialState() vs getState()">
      <Info>
        <code>getInitialState()</code> returns the frozen snapshot from store creation. <code>getState()</code> is live. React's <code>useSyncExternalStore</code> receives both — <code>getInitialState</code> is used as the server snapshot for SSR consistency.
      </Info>
      <Row>
        <Btn onClick={() => initStore.getState().inc()}>inc()</Btn>
        <Btn onClick={check}>Compare</Btn>
        <Btn onClick={() => setLog([])} danger>Clear</Btn>
      </Row>
      <Log entries={log} />
      <Pre>{`const store = createStore(set => ({ count: 0, inc: ... }))

store.getInitialState().count  // always 0 — frozen at creation
store.getState().count         // current live value

// useSyncExternalStore(subscribe, getState, getInitialState)
//                                           ↑ SSR: server uses this snapshot`}</Pre>
    </Section>
  )
}

// ─── 1.6 core/zustand.ts — hand-rolled store ─────────────────────────────────

const coreStore = coreCreateStore<{ n: number }>((set) => ({ n: 0, inc: () => set(s => ({ n: s.n + 1 })) } as { n: number }))

function CoreSection() {
  const n = coreUseStore(coreStore, s => s.n)
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    return coreStore.subscribe((s, p) => setLog(l => [...l, `[core] ${p.n} → ${s.n}`]))
  }, [])

  return (
    <Section title="1.6 — src/core/zustand.ts — hand-rolled store">
      <Info>
        Our ~100-line reimplementation. Same listener Set, same merge/replace logic, same <code>useSyncExternalStore</code> wiring. This IS what Zustand's <code>vanilla.js</code> does.
      </Info>
      <Row>
        <Btn onClick={() => coreStore.setState(s => ({ n: s.n + 1 }))}>core n++</Btn>
        <Btn onClick={() => setLog([])} danger>Clear</Btn>
      </Row>
      <p style={{ color: '#888', fontSize: 12, marginTop: 8 }}>hook value: {n}</p>
      <Log entries={log} />
      <Pre>{`// core/zustand.ts — the whole model
export function createStore<T>(initializer) {
  let state: T
  const listeners = new Set<Listener<T>>()

  const setState = (partial, replace?) => {
    const next = typeof partial === 'function' ? partial(state) : partial
    if (Object.is(next, state)) return
    const prev = state
    state = replace === true ? next : Object.assign({}, state, next)
    listeners.forEach(l => l(state, prev))
  }
  // getState, subscribe, destroy follow the same pattern
}`}</Pre>
    </Section>
  )
}

export default function PrimitivesExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>01 · Store Primitives</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        The vanilla store: a listener Set, getState/setState/subscribe/destroy. Understand this before touching React integration or middleware.
      </p>
      <CreateVsCreate />
      <RawApiSection />
      <MergeVsReplace />
      <ListenerSetSection />
      <InitialStateSection />
      <CoreSection />
    </div>
  )
}
