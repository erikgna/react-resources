import { useState } from 'react'
import { atom, selector, useRecoilState, useRecoilValue, useRecoilCallback, useRecoilSnapshot, useGotoRecoilSnapshot, RecoilRoot } from 'recoil'
import {
  atom as coreAtom,
  useRecoilState as coreUseState,
  useRecoilCallback as coreUseCallback,
  RecoilRoot as CoreRoot,
} from '../../core/recoil'
import { Section, Row, Btn, Info, Pre, Log } from '../shared'

// ─── Atoms ────────────────────────────────────────────────────────────────────

const xAtom = atom({ key: '06/x', default: 0 })
const yAtom = atom({ key: '06/y', default: 0 })

const positionSelector = selector({
  key: '06/position',
  get: ({ get }) => ({ x: get(xAtom), y: get(yAtom) }),
})

const cartAtom = atom<Array<{ id: number; qty: number }>>({ key: '06/cart', default: [] })
const priceAtom = atom<Record<number, number>>({ key: '06/prices', default: { 1: 9.99, 2: 24.99, 3: 4.49 } })

const cartTotalSelector = selector({
  key: '06/cartTotal',
  get: ({ get }) => {
    const cart = get(cartAtom)
    const prices = get(priceAtom)
    return cart.reduce((sum, item) => sum + (prices[item.id] ?? 0) * item.qty, 0)
  },
})

// Core atoms for useRecoilCallback demo
const coreXAtom = coreAtom({ key: 'core-06/x', default: 0 })
const coreYAtom = coreAtom({ key: 'core-06/y', default: 0 })

// ─── 6.1 useRecoilCallback: read without subscribe ───────────────────────────

function PositionLogger() {
  const [log, setLog] = useState<string[]>([])

  const logPosition = useRecoilCallback(({ snapshot }) => async () => {
    const pos = await snapshot.getLoadable(positionSelector).getValue()
    setLog(l => [...l, `snapshot @ ${Date.now() % 100000}: x=${pos.x} y=${pos.y}`])
  })

  const moveAndLog = useRecoilCallback(({ set, snapshot }) => async () => {
    set(xAtom, x => x + 1)
    set(yAtom, y => y + 1)
    // snapshot is from BEFORE the sets above (it's a point-in-time view)
    const pos = await snapshot.getLoadable(positionSelector).getValue()
    setLog(l => [...l, `pre-move snapshot: x=${pos.x} y=${pos.y} (sets applied after)`])
  })

  const [x] = useRecoilState(xAtom)
  const [y] = useRecoilState(yAtom)

  return (
    <Section title="6.1 — useRecoilCallback: read + set without subscribing">
      <Info>The callback component does NOT subscribe to xAtom or yAtom — it won't re-render when they change. The callback reads via snapshot (point-in-time) and sets atoms via set().</Info>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>
        live: x=<span style={{ color: '#e0e0e0' }}>{x}</span> y=<span style={{ color: '#e0e0e0' }}>{y}</span>
      </div>
      <Row>
        <Btn onClick={logPosition}>Log snapshot</Btn>
        <Btn onClick={moveAndLog}>Move + log pre-move snapshot</Btn>
        <Btn onClick={() => setLog([])} danger>Clear log</Btn>
      </Row>
      <Log entries={log} />
      <Pre>{`const logPosition = useRecoilCallback(({ snapshot, set }) => async () => {
  // snapshot is point-in-time — reads don't subscribe
  const pos = await snapshot.getLoadable(positionSelector).getValue()
  console.log(pos)

  // set() updates atoms outside of React render cycle
  set(xAtom, x => x + 1)
})`}</Pre>
    </Section>
  )
}

// ─── 6.2 Snapshot time-travel ────────────────────────────────────────────────

function SnapshotHistory() {
  const [snapshots, setSnapshots] = useState<string[]>([])
  const snapshot = useRecoilSnapshot()
  const [x, setX] = useRecoilState(xAtom)
  const [y, setY] = useRecoilState(yAtom)

  const captureSnapshot = useRecoilCallback(({ snapshot: s }) => async () => {
    const pos = await s.getLoadable(positionSelector).getValue()
    setSnapshots(ss => [...ss, `x=${pos.x} y=${pos.y} (nodes: ${[...s.getNodes_UNSTABLE()].length})`])
  })

  // useRecoilSnapshot() gives the current snapshot on every atom change
  const nodeCount = [...snapshot.getNodes_UNSTABLE()].length

  return (
    <Section title="6.2 — Snapshot: point-in-time state capture">
      <Info>Snapshots are immutable views of the entire Recoil state. useRecoilSnapshot() fires on every state change — useful for devtools. Capture stores the state at that moment.</Info>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>
        current: x=<span style={{ color: '#e0e0e0' }}>{x}</span> y=<span style={{ color: '#e0e0e0' }}>{y}</span>
        {'  ·  '}live node count: <span style={{ color: '#4a9eff' }}>{nodeCount}</span>
      </div>
      <Row>
        <Btn onClick={() => setX(v => v + 1)}>Move X +1</Btn>
        <Btn onClick={() => setY(v => v + 1)}>Move Y +1</Btn>
        <Btn onClick={captureSnapshot}>Capture snapshot</Btn>
        <Btn onClick={() => setSnapshots([])} danger>Clear</Btn>
      </Row>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {snapshots.map((s, i) => (
          <div key={i} style={{ fontSize: 12, color: '#666' }}>
            [{i}] {s}
          </div>
        ))}
        {snapshots.length === 0 && <span style={{ color: '#333', fontSize: 12 }}>— capture a snapshot first —</span>}
      </div>
      <Pre>{`// useRecoilSnapshot() — current snapshot on every state change
const snapshot = useRecoilSnapshot()

// useRecoilCallback gives access to snapshot at call time (not render time)
const cb = useRecoilCallback(({ snapshot }) => async () => {
  for (const node of snapshot.getNodes_UNSTABLE({ isModified: true })) {
    const loadable = snapshot.getLoadable(node)
    console.log(node.key, loadable.getValue())
  }
})`}</Pre>
    </Section>
  )
}

// ─── 6.3 Multi-atom "transaction" pattern ────────────────────────────────────

function CartManager() {
  const cart = useRecoilValue(cartAtom)
  const total = useRecoilValue(cartTotalSelector)
  const prices = useRecoilValue(priceAtom)

  const addToCart = useRecoilCallback(({ set }) => (id: number) => {
    set(cartAtom, c => {
      const existing = c.find(i => i.id === id)
      return existing
        ? c.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i)
        : [...c, { id, qty: 1 }]
    })
  })

  const clearCart = useRecoilCallback(({ set, reset }) => () => {
    reset(cartAtom)
  })

  const applyDiscount = useRecoilCallback(({ set }) => () => {
    // Multi-atom update in one callback — both apply before any re-render
    set(priceAtom, prices => Object.fromEntries(
      Object.entries(prices).map(([k, v]) => [k, +(v * 0.9).toFixed(2)])
    ))
  })

  return (
    <Section title="6.3 — useRecoilCallback for multi-atom updates">
      <Info>Multiple set() calls in one callback batch React re-renders. This is the closest Recoil has to a "transaction" — all sets apply before the next render.</Info>
      <Row style={{ marginBottom: 8 }}>
        {([1, 2, 3] as const).map(id => (
          <Btn key={id} onClick={() => addToCart(id)}>
            Add #{id} (${prices[id]})
          </Btn>
        ))}
        <Btn onClick={applyDiscount}>−10% discount</Btn>
        <Btn onClick={clearCart} danger>Clear cart</Btn>
      </Row>
      <div style={{ fontSize: 13, color: '#888', lineHeight: 1.8 }}>
        {cart.map(i => (
          <div key={i.id}>#{i.id} × {i.qty} = ${(prices[i.id] * i.qty).toFixed(2)}</div>
        ))}
        {cart.length === 0 && <span style={{ color: '#444' }}>empty cart</span>}
        {cart.length > 0 && (
          <div style={{ borderTop: '1px solid #2a2a2a', marginTop: 6, paddingTop: 6, color: '#e0e0e0' }}>
            total: ${total.toFixed(2)}
          </div>
        )}
      </div>
      <Pre>{`const addToCart = useRecoilCallback(({ set }) => (id: number) => {
  // Both set() calls are batched — one re-render
  set(cartAtom, c => [...c, { id, qty: 1 }])
  set(analyticsAtom, a => [...a, { event: 'add_to_cart', id }])
})

// reset() sets atom back to its declared default
const clear = useRecoilCallback(({ reset }) => () => {
  reset(cartAtom)
})`}</Pre>
    </Section>
  )
}

// ─── 6.4 Core useRecoilCallback ──────────────────────────────────────────────

function CoreCallbackDemo() {
  const [x, setX] = coreUseState(coreXAtom)
  const [y, setY] = coreUseState(coreYAtom)
  const [log, setLog] = useState<string[]>([])

  const logBoth = coreUseCallback(({ snapshot }) => () => {
    const cx = snapshot.getLoadable(coreXAtom)
    const cy = snapshot.getLoadable(coreYAtom)
    setLog(l => [...l, `x=${cx} y=${cy}`])
  })

  const moveBoth = coreUseCallback(({ set }) => () => {
    set(coreXAtom, x + 10)
    set(coreYAtom, y + 5)
  })

  return (
    <Section title="6.4 — core/recoil.ts — useRecoilCallback">
      <Info>Core implementation: callback receives snapshot.getLoadable (reads without subscribe) and set (writes without render). Same semantics as real Recoil.</Info>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>
        x=<span style={{ color: '#e0e0e0' }}>{x}</span> y=<span style={{ color: '#e0e0e0' }}>{y}</span>
      </div>
      <Row>
        <Btn onClick={moveBoth}>Move both</Btn>
        <Btn onClick={logBoth}>Log snapshot</Btn>
      </Row>
      <Log entries={log} />
      <Pre>{`// core/recoil.ts
function useRecoilCallback(cb) {
  const store = useStore()
  return useCallback((...args) =>
    cb({
      snapshot: { getLoadable: n => store.readNode(n) },  // no subscribe
      set: (n, v) => store.setAtomValue(n, v),
    })(...args),
    [store, cb]
  )
}`}</Pre>
    </Section>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function AdvancedExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>06 · Advanced</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        <code>useRecoilCallback</code> gives imperative access to the Recoil graph — read without subscribing,
        write without being in the render path. Snapshots provide point-in-time immutable views of all state.
      </p>
      <RecoilRoot>
        <PositionLogger />
        <SnapshotHistory />
        <CartManager />
      </RecoilRoot>
      <CoreRoot>
        <CoreCallbackDemo />
      </CoreRoot>
    </div>
  )
}
