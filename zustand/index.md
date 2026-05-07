# Zustand Deep POC — Action Plan

## 1. Objective Definition

Target Zustand internals, not just the surface API:
- `createStore` — the vanilla store primitive: listener `Set`, `getState`, `setState`, `subscribe`, `destroy`
- How `setState` calls each listener and how equality is determined
- `create` — the React wrapper: how it wires `createStore` to `useSyncExternalStore`
- `useSyncExternalStore` — the React 18 primitive Zustand uses internally; why it prevents tearing
- The middleware composition model: `(set, get, api) => StateCreator` chain via `StoreMutatorIdentifier`
- `immer` middleware — patches `setState` to accept a draft mutator
- `devtools` middleware — intercepts `setState` to emit Redux DevTools protocol messages
- `persist` middleware — wraps store init + `setState` for serialized storage with hydration lifecycle
- `subscribeWithSelector` middleware — extends `subscribe` to accept a selector + equality function
- `shallow` — what it checks and why it differs from `===` and `JSON.stringify`
- Slice pattern — how `StateCreator` types compose independent slices into one store

Read `node_modules/zustand/esm/vanilla.js` first — it is ~60 lines. The entire store model is there. Do not touch React integration until you can predict exactly what `createStore` does from reading those 60 lines.

## 2. Minimal Setup

Start with zero abstractions — vanilla, no React:
```ts
import { createStore } from 'zustand/vanilla'

const store = createStore<{ count: number; inc: () => void }>((set) => ({
  count: 0,
  inc: () => set((s) => ({ count: s.count + 1 })),
}))

const unsub = store.subscribe((state) => console.log(state.count))
store.getState().inc()  // logs 1
unsub()
store.destroy()
```

Verify the listener set, `getState`, and `setState` behavior at the raw level before adding React. Then read `vanilla.js` to confirm what actually happened.

## 3. Implementation Patterns (apply to every tab)

Each experiment sub-section must include:
- A **`<Pre>` code block** showing the minimal annotated snippet that explains the mechanism — not a tutorial, just the essence
- A **`<Log entries={log} />`** panel that records state changes as strings (not `console.log`) so behavior is visible without DevTools
- A **render counter** using `useRef(0); renders.current++` displayed with color coding: green ≤ 3 renders (expected), red > 3 (unexpected re-render)
- A **"Clear log"** button on every log panel
- All store instances defined at **module level** outside React components — the store lifecycle must not be tied to component mounting

`src/experiments/shared.tsx` provides: `Section`, `Row`, `Btn`, `Info`, `Pre`, `Log`, `Box` (the render-counter display box). Build this file first — all tabs depend on it. Match the MobX `shared.tsx` style exactly.

## 4. Core Experiments

### 4.1 Store Primitives (tab 01)
- `createStore` vs `create` — what each returns
- Raw `getState` / `setState` / `subscribe` / `destroy`
- Partial update: `set({ count: 1 })` vs full replace: `set({ count: 1 }, true)`
- Listener set: add 3 subscribers, call `setState`, verify all 3 fire; then unsubscribe one, verify 2 fire
- `getInitialState()` — when does it differ from `getState()`? (after `setState` has run)
- Compare against `src/core/zustand.ts` — identical listener + notify mechanism

### 4.2 Selectors (tab 02)
- No selector (entire state subscription): change any field → always re-renders; use render counter to prove it
- Selector `(s) => s.count`: change `count` → re-renders; change unrelated field → no re-render
- Selector returning a derived value: `(s) => s.items.length` — renders only when length changes, not on item mutation without length change
- Selector returning a new object every call: `(s) => ({ a: s.a, b: s.b })` — loops re-render even if values unchanged; fix with `shallow`
- `shallow` internals: iterates own keys, `===` each value — not recursive, not `JSON.stringify`

### 4.3 Middleware (tab 03)
- How middleware wraps `createStore`: `(initializer) => (set, get, api) => initializer(wrappedSet, get, api)`
- `immer` middleware: `set(draft => { draft.count++ })` — draft mutator vs object merge
- `devtools` middleware: open Redux DevTools, verify action names, manually dispatch `{ type: 'RESET' }` and handle it
- Stack two middleware: `devtools(immer(initializer))` — trace what `set` resolves to at each layer
- `combine`: merge vanilla state with actions without TypeScript gymnastics

### 4.4 Persist (tab 04)
- `persist` wrapping a store: initial load from localStorage, `setState` writes back
- Partial persistence: `partialize: (s) => ({ count: s.count })` — verify only selected fields persist
- Custom storage adapter: implement an in-memory adapter conforming to `StateStorage`; swap out `localStorage`
- Hydration timing: `onRehydrateStorage` callback — what is `state` before vs after hydration?
- `skipHydration` + manual `rehydrate()` — why you'd want this (SSR, deferred init)
- Failure: corrupt storage (invalid JSON) — what does `persist` do? What should you do?

### 4.5 React Integration (tab 05)
- `useSyncExternalStore(subscribe, getSnapshot)` — the two arguments Zustand passes
- Why `useSyncExternalStore` prevents tearing: concurrent renders always read from a consistent snapshot
- Without a selector: entire state object changes on every `setState` → every consumer re-renders; prove with render counter
- Granularity demo: 100-item list, each item rendered by a separate `useStore` with item selector — update one item → 1 re-render only
- Correct `useEffect` + `subscribe` cleanup pattern — this is the FIX for the leak in tab 08:
  ```ts
  useEffect(() => {
    return store.subscribe((state) => setLocal(state.count))
  }, [])
  ```
- `createWithEqualityFn` (Zustand v5): custom equality instead of `Object.is`
- Context-based multi-instance pattern: `createContext` + `useContext` + Zustand store for per-tree isolation

### 4.6 Slices Pattern (tab 06)
- `StateCreator<RootState, [], [], BearSlice>` — the four type parameters and why they matter
- Build `bearSlice` and `fishSlice`, compose into one `create((...args) => ({ ...bearSlice(...args), ...fishSlice(...args) }))`
- Cross-slice access: a `fishSlice` action that reads `bearSlice` state via the shared `get`
- Verify TypeScript inference: does `get()` know the full `RootState` type including both slices?
- Refactor one slice to use `immer` middleware without touching the other
- **Zustand vs MobX vs Redux — side-by-side comparison** (same counter feature, in-tab `Pre` blocks):
  - Zustand: `create` + flat state + action functions (~15 lines, 1 file)
  - MobX: `makeAutoObservable` class + `observer` (~10 lines, 1 file, but requires Proxy)
  - Redux: slice + `configureStore` + `useSelector` + `useDispatch` (~40 lines, 3 files, explicit audit trail)
  - Record LOC, files needed, re-render counts, tradeoffs

### 4.7 Performance (tab 07)

All timings measured with `performance.now()` and logged to the `<Log>` panel with actual numbers.

- **Selector miss cost**: 1000 components subscribed without selectors, one `setState` → 1000 re-renders; add selectors → measure reduction; display per-component render count
- **Shallow equality**: store holding array; push new item → with `===`: always re-renders; with `shallow`: same-content array → no re-render; render counter proves it
- **setState merge vs replace**: merge is default (`Object.assign`-like); replace=true requires discipline — wrong use destroys unrelated fields without error
- **Subscription count**: 1 store, add/remove 10000 listeners in a loop — measure `Set.add`/`delete` cost vs array

### 4.8 Failures (tab 08)

Each failure is an **interactive demo** with a button that triggers the broken behavior plus a button showing the fix — not just a table. Pattern from MobX: show bad behavior visually (stale value, extra renders, empty state after hydration), then fix it in the same section.

| Failure | Loud or Silent | Mechanism |
|---------|---------------|-----------|
| Stale closure in action | **Silent** — reads old state | Action closes over initial `state`; fix: always use `set((s) => ...)` functional form |
| No selector on complex state | **Silent** — over-renders | Every `setState` triggers re-render; render counter shows it; fix: add targeted selector |
| `persist` with `Map`/`Set` | **Silent** — hydrates as `{}` | `JSON.stringify` drops non-JSON values; fix: custom `serialize`/`deserialize` |
| Missing `unsub` from `subscribe` | **Silent** — leak | Listener stays in `Set`; mount bad N times, trigger change, see N log entries; fix: `useEffect` cleanup |
| `shallow` on nested objects | **Silent** — stale | `shallow` is one level only; deep change in nested object not detected; fix: `deep-equal` or restructure |
| `replace=true` without full state | **Silent** — missing fields `undefined` | No error thrown; TypeScript catches it only if typed strictly |

## 5. Advanced Patterns

```ts
// Transient subscriptions — subscribe outside React, unsubscribe on demand
const unsub = useStore.subscribe(
  (s) => s.count,
  (count) => console.log('count changed to', count),
  { equalityFn: shallow, fireImmediately: true }
)

// Atomic update across slices without intermediate render
store.setState((s) => ({
  bears: s.bears + 1,
  fish: s.fish - 1,
}))

// Derived store (read-only projection of another store)
const derivedStore = createStore(() => {
  mainStore.subscribe((s) => derivedStore.setState({ doubled: s.count * 2 }))
  return { doubled: mainStore.getState().count * 2 }
})

// Zustand with React Query — store holds UI state, RQ holds server state
// Store: selectedId, filters, sort
// RQ: useQuery keyed by selectedId

// Reset to initial state — pattern, not built-in
const initialState = { count: 0 }
const useStore = create<typeof initialState & { reset: () => void }>((set) => ({
  ...initialState,
  reset: () => set(initialState),
}))
```

## 6. Source Code Reading

Open `node_modules/zustand/esm/vanilla.js` and `node_modules/zustand/esm/react.js`:

| What to find | Why |
|-------------|-----|
| `createStoreImpl` | The entire vanilla store in ~30 lines — `listeners: Set`, `setState`, `getState`, `subscribe` |
| `setState` merge logic | `Object.assign({}, state, nextState)` vs `replace=true` branch |
| `subscribe` return value | Returns `() => listeners.delete(listener)` — the unsubscribe closure |
| `useStore` in `react.js` | Calls `useSyncExternalStore(api.subscribe, api.getState)` directly |
| `useStoreWithEqualityFn` | Wraps `useSyncExternalStore` with a selector + equality wrapper |
| Middleware type signature | `type Mutate<S, Ms>` — the recursive type that builds up the mutated store type |
| `immer.ts` in middleware | `produce(state, updater)` called inside `set` — the only change from vanilla `set` |
| `persist.ts` in middleware | `onRehydrateStorage`, `hydrate()`, `getStorage()`, the `skipHydration` flag |

Key insight: `useSyncExternalStore` takes a `getSnapshot` function. Zustand passes `api.getState` directly — which means the snapshot is the **entire state object**. Without a selector, React re-renders the consumer on every `setState` call because `getState()` returns a new object reference. The selector is applied *outside* `useSyncExternalStore` in `useStoreWithEqualityFn`, comparing previous vs next selected value with the provided equality function.

## 7. Core Reimplementation

`src/core/zustand.ts` — ~120-line reimplementation covering:
- `createStore`: listener `Set`, `getState`, `setState` (merge + replace modes), `subscribe` (returns unsub), `destroy`
- `useStore(store, selector, equalityFn)`: hook using `useSyncExternalStore`
- `useStore` without selector: subscribe to full state

Build this first. Every experiment tab should be explainable in terms of what this file does.

## 8. Deliverables

**Project scaffold** (required before any experiment):
- [ ] `package.json` — `zustand`, `immer`, `react`, `react-dom`, `vite`, TypeScript dev deps
- [ ] `index.html` — Vite entry point, `<title>Zustand POC</title>`
- [ ] `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
- [ ] `src/main.tsx` — `ReactDOM.createRoot` + `<App />`

**Core files:**
- [ ] `src/core/zustand.ts` — working ~120-line reimplementation
- [ ] `src/experiments/shared.tsx` — Section, Row, Btn, Info, Pre, Log, Box UI primitives

**Experiment tabs:**
- [ ] `src/experiments/01-primitives/PrimitivesExperiment.tsx`
- [ ] `src/experiments/02-selectors/SelectorsExperiment.tsx`
- [ ] `src/experiments/03-middleware/MiddlewareExperiment.tsx`
- [ ] `src/experiments/04-persist/PersistExperiment.tsx`
- [ ] `src/experiments/05-react/ReactExperiment.tsx`
- [ ] `src/experiments/06-slices/SlicesExperiment.tsx`
- [ ] `src/experiments/07-performance/PerformanceExperiment.tsx`
- [ ] `src/experiments/08-failures/FailuresExperiment.tsx`
- [ ] `src/App.tsx` — tab nav shell (same structure as MobX `App.tsx`)

**Analysis:**
- [ ] `note.md` — follow MobX `note.md` structure exactly:
  - **Pros** — numbered, specific, each backed by an experiment result
  - **Cons** — numbered, specific, each naming the failure mode from tab 08
  - **When Zustand Fits** — scenario list
  - **When Zustand Breaks Down** — scenario list
  - **Performance Notes** — actual numbers from tab 07 benchmarks
  - **Key Decision Point** — one-paragraph comparison against MobX and Redux

## 9. Escalation

- Implement the same `TodoStore` in Zustand with persist + devtools. Compare: lines of code, files needed, re-render counts, time to implement — against the MobX and Redux versions already in this repo.
- Find the complexity crossover: at what store size does the slice pattern become harder to manage than a single flat store?
- Stress-test `persist` with a 10,000-item list: measure read/write times, identify when `localStorage` becomes a bottleneck.
- Build a custom middleware from scratch (e.g., a logger that records action names + diffs) to understand the `StoreMutatorIdentifier` type mechanics.
- Probe `useSyncExternalStore` tearing: use `startTransition` to defer a render, mutate the store mid-transition — does Zustand actually prevent the stale read?

## 10. Constraint — POC Discipline

- Every section must include a failure or stress scenario. No pure happy-path demos.
- Do not accept "it just works" — force the edge cases.
- Read the Zustand source for any behavior not immediately obvious from the API.
- `src/core/zustand.ts` is mandatory — build and understand it before using the library.
- Do not move on from any section until you can predict what will happen before running the code.
- Compare against MobX and Redux throughout: same concept, different mechanism — what are the actual tradeoffs?
