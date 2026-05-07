import { create, type StateCreator } from 'zustand'
import { Section, Row, Btn, Info, Pre } from '../shared'

// ─── Slice types ──────────────────────────────────────────────────────────────

interface BearSlice {
  bears: number
  addBear: () => void
  eatFish: () => void
}

interface FishSlice {
  fish: number
  addFish: () => void
  fishCount: () => number  // reads from the full store
}

type RootState = BearSlice & FishSlice

// ─── Slice creators — StateCreator<Root, [], [], Slice> ───────────────────────

const createBearSlice: StateCreator<RootState, [], [], BearSlice> = (set) => ({
  bears: 0,
  addBear: () => set(s => ({ bears: s.bears + 1 })),
  // Cross-slice: eatFish reduces fish from fishSlice
  eatFish: () => set(s => ({ fish: Math.max(0, s.fish - 1) })),
})

const createFishSlice: StateCreator<RootState, [], [], FishSlice> = (set, get) => ({
  fish: 10,
  addFish: () => set(s => ({ fish: s.fish + 1 })),
  // Cross-slice: reads bears from bearSlice via get()
  fishCount: () => get().fish,
})

// ─── Composed store ───────────────────────────────────────────────────────────

const useStore = create<RootState>()((...args) => ({
  ...createBearSlice(...args),
  ...createFishSlice(...args),
}))

// ─── 6.1 Slice composition ────────────────────────────────────────────────────

function SliceCompositionSection() {
  const bears = useStore(s => s.bears)
  const fish = useStore(s => s.fish)

  return (
    <Section title="6.1 — bearSlice + fishSlice — composed into one store">
      <Info>
        Each slice is a <code>StateCreator</code> typed to the full <code>RootState</code> so it can read any field. The composed store spreads both slices — they share a single listener Set.
      </Info>
      <Row style={{ marginBottom: 8 }}>
        <Btn onClick={() => useStore.getState().addBear()}>addBear()</Btn>
        <Btn onClick={() => useStore.getState().addFish()}>addFish()</Btn>
        <Btn onClick={() => useStore.getState().eatFish()} danger>eatFish() — cross-slice</Btn>
      </Row>
      <Row>
        <div style={{ padding: '10px 14px', background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 3 }}>
          <p style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>BEARS</p>
          <p style={{ fontSize: 20, color: '#e0e0e0' }}>{bears}</p>
        </div>
        <div style={{ padding: '10px 14px', background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 3 }}>
          <p style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>FISH</p>
          <p style={{ fontSize: 20, color: '#e0e0e0' }}>{fish}</p>
        </div>
      </Row>
      <Pre>{`// StateCreator<Root, [], [], BearSlice> — four type params:
// 1. Root: the full combined state type
// 2. Mutators (store-level, e.g. devtools)
// 3. Mutators (slice-level)
// 4. This slice's type

const createBearSlice: StateCreator<RootState, [], [], BearSlice> = (set) => ({
  bears: 0,
  addBear: () => set(s => ({ bears: s.bears + 1 })),
})

const useStore = create<RootState>()((...args) => ({
  ...createBearSlice(...args),  // spread bears into root
  ...createFishSlice(...args),  // spread fish into root
}))`}</Pre>
    </Section>
  )
}

// ─── 6.2 Cross-slice access via get() ────────────────────────────────────────

function CrossSliceSection() {
  const bears = useStore(s => s.bears)
  const fish = useStore(s => s.fish)

  return (
    <Section title="6.2 — Cross-slice access via shared get()">
      <Info>
        <code>eatFish()</code> lives in <code>bearSlice</code> but mutates <code>fish</code> from <code>fishSlice</code>. It works because both slices share the same <code>set</code> and <code>get</code> — typed to the full <code>RootState</code>.
      </Info>
      <Row style={{ marginBottom: 8 }}>
        <Btn onClick={() => useStore.getState().eatFish()} danger>eatFish() — set mutates fishSlice from bearSlice</Btn>
        <Btn onClick={() => {
          const count = useStore.getState().fishCount()
          alert(`fishCount() via get(): ${count}`)
        }}>fishCount() via get()</Btn>
      </Row>
      <p style={{ color: '#888', fontSize: 12, marginTop: 8 }}>bears: {bears} | fish: {fish}</p>
      <Pre>{`// In bearSlice — reads/writes fishSlice fields via shared set/get
const createBearSlice: StateCreator<RootState, [], [], BearSlice> = (set) => ({
  eatFish: () => set(s => ({ fish: Math.max(0, s.fish - 1) })),
  //                                    ↑ sets fish from fishSlice
})

// In fishSlice — reads bearSlice state via get()
const createFishSlice: StateCreator<RootState, [], [], FishSlice> = (set, get) => ({
  fishCount: () => get().fish,  // get() returns full RootState
  //                ↑ TypeScript knows this includes BearSlice fields too
})`}</Pre>
    </Section>
  )
}

// ─── 6.3 TypeScript inference ─────────────────────────────────────────────────

function TypeScriptSection() {
  return (
    <Section title="6.3 — TypeScript inference — StateCreator type parameters">
      <Info>
        With <code>StateCreator&lt;RootState, [], [], SliceT&gt;</code>, <code>get()</code> is typed as <code>() =&gt; RootState</code> — not just the slice. TypeScript enforces correct cross-slice access at compile time.
      </Info>
      <Pre>{`// Correct: get() returns full RootState
const createFishSlice: StateCreator<RootState, [], [], FishSlice> = (set, get) => ({
  fishAndBears: () => get().fish + get().bears,  // ✓ both are typed
})

// Wrong: StateCreator<FishSlice> — get() only returns FishSlice
const createFishBad: StateCreator<FishSlice> = (set, get) => ({
  bearCount: () => get().bears,  // ✗ TypeScript error — bears not on FishSlice
})

// The four type params:
// StateCreator<
//   Root,     // full combined store type — what set/get operate on
//   [],       // store-level mutators (added by middleware like devtools)
//   [],       // slice-level mutators
//   Slice,    // this slice's type — what this creator returns
// >`}</Pre>
    </Section>
  )
}

// ─── 6.4 Zustand vs MobX vs Redux — side-by-side ─────────────────────────────

function ComparisonSection() {
  return (
    <Section title="6.4 — Zustand vs MobX vs Redux — same counter, side-by-side">
      <Info>
        Same feature: a counter with increment and decrement. Three different state management models.
      </Info>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', marginTop: 8 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ color: '#4a9eff', fontSize: 11, marginBottom: 4 }}>ZUSTAND (~12 lines, 1 file)</p>
          <Pre>{`const useStore = create(set => ({
  count: 0,
  inc: () => set(s => ({ count: s.count + 1 })),
  dec: () => set(s => ({ count: s.count - 1 })),
}))

function Counter() {
  const count = useStore(s => s.count)
  const { inc, dec } = useStore()
  return (
    <div>
      {count}
      <button onClick={inc}>+</button>
      <button onClick={dec}>-</button>
    </div>
  )
}`}</Pre>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ color: '#a0c4ff', fontSize: 11, marginBottom: 4 }}>MOBX (~10 lines, 1 file, Proxy)</p>
          <Pre>{`class CounterStore {
  count = 0
  constructor() { makeAutoObservable(this) }
  inc() { this.count++ }
  dec() { this.count-- }
}
const store = new CounterStore()

const Counter = observer(() => (
  <div>
    {store.count}
    <button onClick={() => store.inc()}>+</button>
    <button onClick={() => store.dec()}>-</button>
  </div>
))`}</Pre>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ color: '#ff6b6b', fontSize: 11, marginBottom: 4 }}>REDUX (~40 lines, 3 files)</p>
          <Pre>{`// counterSlice.ts
const slice = createSlice({
  name: 'counter',
  initialState: { count: 0 },
  reducers: {
    inc: s => { s.count++ },
    dec: s => { s.count-- },
  },
})
export const { inc, dec } = slice.actions

// store.ts
export const store = configureStore({
  reducer: { counter: slice.reducer }
})

// Counter.tsx
const Counter = () => {
  const count = useSelector(s => s.counter.count)
  const dispatch = useDispatch()
  return (
    <div>
      {count}
      <button onClick={() => dispatch(inc())}>+</button>
      <button onClick={() => dispatch(dec())}>-</button>
    </div>
  )
}`}</Pre>
        </div>
      </div>
      <p style={{ color: '#888', fontSize: 13, marginTop: 12, lineHeight: 1.6 }}>
        <strong style={{ color: '#e0e0e0' }}>Zustand:</strong> minimal boilerplate, no ceremony. Actions are plain functions. No Provider required.{' '}
        <strong style={{ color: '#e0e0e0' }}>MobX:</strong> even less boilerplate for class-based domain models, but requires Proxy and <code>observer</code> wrapper.{' '}
        <strong style={{ color: '#e0e0e0' }}>Redux:</strong> most boilerplate, but every state change is an auditable, named action — time-travel debug, enforced data flow.
      </p>
    </Section>
  )
}

export default function SlicesExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>06 · Slices Pattern</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Split large stores into slices using <code>StateCreator</code>. Each slice types itself to the full root state — enabling cross-slice access via the shared <code>set</code> and <code>get</code>.
      </p>
      <SliceCompositionSection />
      <CrossSliceSection />
      <TypeScriptSection />
      <ComparisonSection />
    </div>
  )
}
