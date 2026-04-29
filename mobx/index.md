# MobX Deep POC — Action Plan

## 1. Objective Definition

Target MobX internals, not just the surface API:
- The Atom (observable primitive): value + listener set + global tracking context
- How `globalState.trackingDerivation` enables automatic dependency collection
- `ComputedValue`: dirty-checking, lazy evaluation, dual role as observer and observable
- `Reaction`: how `autorun`/`reaction`/`when` are built on top of it
- The topological scheduler (`runReactions`): glitch-free propagation, no diamond problem
- How `observer()` from mobx-react-lite patches React's render to track observable reads
- Action batching via `transaction`

Read `src/core/observable.ts` first — it's a ~180-line reimplementation of these primitives. Use it as a mental model before touching the real API.

## 2. Minimal Setup

Start with zero abstractions:
```ts
import { observable, autorun } from 'mobx'

const box = observable.box(0)
const dispose = autorun(() => console.log(box.get()))
box.set(1) // logs 1
dispose()
```

No `makeObservable`, no classes, no React. Verify reactivity at the raw API level first. Then read `core/observable.ts` to understand what `box` and `autorun` actually do.

## 3. Core Experiments

### 3.1 Observable Primitives (tab 01)
- `observable.box()` — the Atom
- `makeObservable` with explicit annotations
- `makeAutoObservable` — infers all fields as observable, all methods as actions
- `observable.array` / `observable.map` — in-place mutation, `toJS()` extraction
- Compare against `core/ObservableBox` — identical mechanism

### 3.2 Computed Values (tab 02)
- Caching: read computed 3× without state change = 1 computation
- Dynamic dependency tracking: dependencies are collected per-execution, not statically
- Chained computeds: `a → ab → abc` — changing `c` only recomputes `abc`
- `core/ComputedBox`: dirty flag, source subscription, `currentTracker` swap

### 3.3 Reactions (tab 03)
- `autorun`: fires immediately, re-fires on change, disposable
- `reaction(data, effect)`: fires only on change, exposes `oldVal`/`newVal`, data fn tracked but effect fn not
- `when`: one-shot, self-disposes; Promise form with timeout
- Disposal: undisposed reaction = memory leak; fix with `useEffect(() => return autorun(...))`

### 3.4 Actions (tab 04)
- `configure({ enforceActions: 'always' })` — strict mode: direct mutation throws
- Named vs anonymous action — `action('name', fn)` for devtools visibility
- Batching: two mutations in one action = one notification
- `runInAction`: async pattern — must re-enter action context after `await`

### 3.5 Observer / React Integration (tab 05)
- `observer()` patches the React render function to track observable reads
- Only the component that reads a changed observable re-renders (no selectors needed)
- Without `observer`: reads once, never updates (silent failure)
- `useLocalObservable`: component-scoped store with computed values
- Render granularity: 100-item list, update one → 1 re-render

### 3.6 Class Stores (tab 06)
- `TodoStore` with `makeAutoObservable` — full CRUD, filter, computed counts
- RootStore composition pattern: cross-store access via `this.root`
- MobX vs Redux side-by-side: same feature, LOC comparison, tradeoff analysis

## 4. Performance Analysis (tab 07)

- **Depth**: chain of 100 computeds, 100 updates — measure propagation time; verify topological sort prevents redundant recompute
- **Width**: 1000 observables, one autorun reading all — batch vs unbatched update timing
- **Render granularity**: 200-item observer list — update-one vs update-all render counts
- **Anti-pattern**: computed with side effects — runs at MobX's discretion, not yours

## 5. Failure Scenarios (tab 08)

| Failure | Loud or Silent | Mechanism |
|---------|---------------|-----------|
| Mutation outside action (strict mode) | **Loud** — throws | `enforceActions: 'always'` |
| Undisposed reaction | **Silent** — leak | No GC, listener set holds reference |
| Circular computed | **Loud** — throws | "Cycle detected in computation" |
| Read outside reactive context | **Silent** — stale | No subscription without observer/autorun |
| Stale lazy computed (no observer) | **Silent** — expected | Lazy: only recomputes on `.get()` |

## 6. Advanced Patterns

```ts
// Debounced reaction
reaction(() => store.searchQuery, (q) => doSearch(q), { delay: 300 })

// Global spy — see all actions/reactions (like Redux DevTools without time-travel)
import { spy } from 'mobx'
spy(event => console.log(event))

// Intercept before mutation
import { intercept } from 'mobx'
intercept(store, 'count', change => {
  if (change.newValue < 0) return null // reject mutation
  return change
})

// Observe after mutation (lower level than autorun)
import { observe } from 'mobx'
observe(store, 'count', change => console.log(change))

// Persistence via autorun
import { toJS } from 'mobx'
autorun(() => localStorage.setItem('state', JSON.stringify(toJS(store))))

// Inspection utilities
import { isObservable, getObserverTree, getDependencyTree } from 'mobx'
isObservable(store)           // true
getObserverTree(store, 'count') // what reactions observe this
getDependencyTree(store, 'total') // what this computed depends on
```

## 7. Source Code Reading

Open `node_modules/mobx/dist/mobx.cjs.development.js` and find:

| What to find | Why |
|-------------|-----|
| `createAtom` | Shows how `observable.box` creates an Atom with `reportObserved`/`reportChanged` |
| `class ComputedValue` | `trackAndCompute()`, `peek()`, `wakeUpIfNeeded()` — the dirty-checking algorithm |
| `class Reaction` | How `autorun`/`reaction`/`when` are all `Reaction` instances with different `onInvalidate` |
| `globalState.trackingDerivation` | The global context variable — set when entering `runReaction`/`trackDerived` |
| `runReactions()` | The scheduler: `globalState.pendingReactions` queue, topological order |
| `_startAction` / `_endAction` | How `action` wraps fn with batch start/end and derivation context swap |

Key insight: `observable.box.get()` calls `reportObserved(atom)` which does:
```js
if (globalState.trackingDerivation) {
  trackObservable(globalState.trackingDerivation, atom)
}
```
This is the exact same `currentTracker` mechanism in `src/core/observable.ts`.

## 8. Deliverables

- [ ] `src/core/observable.ts` — working ~180-line reimplementation
- [ ] 8 experiment tabs with interactive demos and intentional breakage
- [ ] Timing benchmarks from tab 07 (add actual numbers)
- [ ] `note.md` — pros/cons with specific failure modes

## 9. Escalation

- Build the same `TodoStore` in both Redux (with RTK) and MobX. Measure: lines of code, files needed, re-render counts, time to implement from scratch.
- Find the complexity crossover: at what store size does Redux's explicit model become clearer than MobX's implicit one?
- Probe Proxy-based deep observability: `observable({ nested: { deeply: { value: 1 } } })` — how deep does mutation tracking go? What about `Object.assign`?
- Replace `makeAutoObservable` with explicit `makeObservable` annotations and compare the debugging experience.

## 10. Constraint — POC Discipline

- Every section must include a failure or stress scenario. No pure happy-path demos.
- Do not accept "it just works" — force the edge cases.
- Read the MobX source for any behavior not immediately obvious from the API.
- `src/core/observable.ts` is mandatory — build and understand it before using the library.
- Do not move on from any section until you can predict what will happen before running the code.
