import { useRef, useState, memo, useCallback } from 'react'
import { configureStore, createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { Provider, useSelector, useDispatch } from 'react-redux'
import { Btn, Row, Section, Info, Pre, ui } from '../shared'

// ─── Store ────────────────────────────────────────────────────────────────────

type Item = { id: number; label: string; value: number }
type PerfState = {
  counter: number
  input: string
  items: Item[]
}

const N_ITEMS = 100

const initialItems: Item[] = Array.from({ length: N_ITEMS }, (_, i) => ({
  id: i, label: `item-${i}`, value: 0,
}))

const perfSlice = createSlice({
  name: 'perf',
  initialState: {
    counter: 0,
    input: '',
    items: initialItems,
  } as PerfState,
  reducers: {
    tick(state) { state.counter += 1 },
    setInput(state, action: PayloadAction<string>) { state.input = action.payload },
    toggleItem(state, action: PayloadAction<number>) {
      const item = state.items[action.payload]
      if (item) item.value = item.value === 0 ? 1 : 0
    },
    resetItems(state) { state.items = initialItems },
  },
})

const store = configureStore({ reducer: perfSlice.reducer })
type S = ReturnType<typeof store.getState>

// ─── Global render counters (module-level, reset between tests) ───────────────

const renderCounters = { bad: 0, good: 0 }

// ─── Bad list item — parent selects ALL items and passes as prop ──────────────
// When ANY item changes, ALL bad items re-render because the parent re-renders
// with a new array reference.

const BadItem = memo(function BadItem({ item }: { item: Item }) {
  renderCounters.bad++
  return (
    <div style={{ padding: '2px 6px', fontSize: 11, color: '#666',
      background: item.value === 1 ? '#1a2a1a' : 'transparent' }}>
      {item.label}: {item.value}
    </div>
  )
})

// ─── Good list item — each item selects ONLY its own data ────────────────────
// When item[5] changes, only GoodItem with id=5 re-renders.
// Other GoodItems see the same reference from state.items[id] → no re-render.

const GoodItem = memo(function GoodItem({ id }: { id: number }) {
  renderCounters.good++
  const item = useSelector((s: S) => s.items[id])
  return (
    <div style={{ padding: '2px 6px', fontSize: 11, color: '#666',
      background: item?.value === 1 ? '#1a2a1a' : 'transparent' }}>
      {item?.label}: {item?.value}
    </div>
  )
})

// ─── Components ───────────────────────────────────────────────────────────────

function HighFrequencySection() {
  const dispatch = useDispatch()
  const input = useSelector((s: S) => s.input)
  const counter = useSelector((s: S) => s.counter)
  const dispatchTimes = useRef<number[]>([])
  const renderRef = useRef(0)
  renderRef.current++

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t0 = performance.now()
    dispatch(perfSlice.actions.setInput(e.target.value))
    dispatchTimes.current.push(performance.now() - t0)
  }

  const avgMs = dispatchTimes.current.length
    ? (dispatchTimes.current.reduce((a, b) => a + b, 0) / dispatchTimes.current.length).toFixed(3)
    : '—'

  return (
    <Section title="7.1 High-frequency dispatch — typing benchmark">
      <Info>
        Type anything. Each keystroke dispatches <code>setInput</code>. Timing measures
        dispatch cost (reducer + subscriber notification), NOT React render cost.
      </Info>
      <Row>
        <input
          style={{ ...ui.input, width: 220 }}
          value={input}
          onChange={handleChange}
          placeholder="type here…"
        />
        <Btn onClick={() => {
          dispatch(perfSlice.actions.tick())
        }}>tick counter ({counter})</Btn>
      </Row>
      <div style={{ marginTop: 10, fontSize: 12, color: '#888', display: 'flex', gap: 24 }}>
        <span>keystrokes: <b style={{ color: '#e0e0e0' }}>{dispatchTimes.current.length}</b></span>
        <span>avg dispatch: <b style={{ color: '#4caf50' }}>{avgMs}ms</b></span>
        <span>component renders: <b style={{ color: '#e0e0e0' }}>{renderRef.current}</b></span>
        <Btn onClick={() => { dispatchTimes.current = []; dispatch(perfSlice.actions.setInput('')) }}>
          reset
        </Btn>
      </div>
    </Section>
  )
}

function ListSection() {
  const dispatch = useDispatch()
  const allItems = useSelector((s: S) => s.items)
  const [badRenders, setBadRenders] = useState(0)
  const [goodRenders, setGoodRenders] = useState(0)
  const ids = useRef(Array.from({ length: N_ITEMS }, (_, i) => i))

  const handleToggle = useCallback((id: number) => {
    renderCounters.bad = 0
    renderCounters.good = 0
    dispatch(perfSlice.actions.toggleItem(id))
    requestAnimationFrame(() => {
      setBadRenders(renderCounters.bad)
      setGoodRenders(renderCounters.good)
    })
  }, [dispatch])

  return (
    <Section title={`7.2 List performance — ${N_ITEMS} items, toggle one`}>
      <Info>
        <b style={{ color: '#ff6b6b' }}>Bad pattern:</b> parent selects entire items array, passes each item as prop.
        Toggle one → parent re-renders → ALL {N_ITEMS} items re-render (memo helps if item ref unchanged, but depends on RTK/Immer).
        <br />
        <b style={{ color: '#4caf50' }}>Good pattern:</b> each item selects its own data via id. Toggle one → only that item re-renders.
      </Info>
      <Row>
        <Btn onClick={() => handleToggle(Math.floor(Math.random() * N_ITEMS))}>
          toggle random item
        </Btn>
        <Btn onClick={() => { dispatch(perfSlice.actions.resetItems()); setBadRenders(0); setGoodRenders(0) }}>
          reset
        </Btn>
      </Row>
      <div style={{ marginTop: 10, display: 'flex', gap: 24, fontSize: 13 }}>
        <span>bad re-renders: <b style={{ color: badRenders > 5 ? '#ff6b6b' : '#888' }}>{badRenders}</b></span>
        <span>good re-renders: <b style={{ color: '#4caf50' }}>{goodRenders}</b></span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: '#ff6b6b', marginBottom: 6 }}>Bad (full list selector)</div>
          <div style={{ maxHeight: 200, overflowY: 'auto', background: '#0a0a0a', borderRadius: 3, padding: 4 }}>
            {allItems.slice(0, 20).map(item => <BadItem key={item.id} item={item} />)}
            <div style={{ fontSize: 10, color: '#333', padding: '2px 6px' }}>…{N_ITEMS - 20} more</div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#4caf50', marginBottom: 6 }}>Good (per-item selector)</div>
          <div style={{ maxHeight: 200, overflowY: 'auto', background: '#0a0a0a', borderRadius: 3, padding: 4 }}>
            {ids.current.slice(0, 20).map(id => <GoodItem key={id} id={id} />)}
            <div style={{ fontSize: 10, color: '#333', padding: '2px 6px' }}>…{N_ITEMS - 20} more</div>
          </div>
        </div>
      </div>
      <Pre>{`// Bad — parent owns all data, all children re-render on parent re-render
const items = useSelector(s => s.items) // new array ref on any state change
return items.map(item => <BadItem key={item.id} item={item} />)
// memo() only helps if item object reference is stable (RTK/Immer ensures this)

// Good — each child owns its own selector
function GoodItem({ id }) {
  const item = useSelector(s => s.items[id]) // only re-renders when items[id] changes
  return <div>{item.label}</div>
}`}</Pre>
    </Section>
  )
}

function SelectorMemoSection() {
  const dispatch = useDispatch()
  const counter = useSelector((s: S) => s.counter)
  const derivedRenders = useRef(0)

  // This selector runs on EVERY dispatch — even when counter hasn't changed.
  // Without memoization, expensive computations run unnecessarily.
  const expensiveDerived = useSelector((s: S) => {
    derivedRenders.current++
    // Simulate expensive computation
    let sum = 0
    for (const item of s.items) sum += item.value
    return sum
  })

  return (
    <Section title="7.3 Selector recomputation — when selectors are too eager">
      <Info>
        This selector (sum of all item values) runs on EVERY dispatch — even when typing in the input.
        Counter: {counter}, sum: {expensiveDerived}, selector ran: {derivedRenders.current} times.
      </Info>
      <Row>
        <Btn onClick={() => dispatch(perfSlice.actions.tick())}>tick (runs selector)</Btn>
        <Btn onClick={() => dispatch(perfSlice.actions.setInput('x'))}>set input (also runs selector)</Btn>
      </Row>
      <Pre>{`// Problem: selector runs on every dispatch
const sum = useSelector(s => {
  return s.items.reduce((acc, item) => acc + item.value, 0)
})

// Fix: createSelector from 'reselect' (included in toolkit)
// Memoizes based on input selectors — only recomputes when items change
import { createSelector } from '@reduxjs/toolkit'

const selectSum = createSelector(
  s => s.items,         // input selector — checked for reference equality
  items => items.reduce((acc, item) => acc + item.value, 0) // recomputed only when items changes
)
const sum = useSelector(selectSum)`}</Pre>
    </Section>
  )
}

export default function PerformanceExperiment() {
  return (
    <div>
      <h2 style={ui.h2}>7 · Performance Analysis</h2>
      <p style={ui.desc}>
        Measure dispatch overhead, re-render propagation, and selector recomputation.
        Performance problems in Redux almost always come from selector design, not Redux itself.
      </p>
      <Provider store={store}>
        <HighFrequencySection />
        <ListSection />
        <SelectorMemoSection />
      </Provider>
    </div>
  )
}
