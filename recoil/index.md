# Recoil POC — Deep Action Plan

## Objective

Understand Recoil's internal architecture: how AtomNode keys are registered globally, how RecoilRoot provides an isolated store via React context, how SelectorNode builds a reactive dep graph at evaluation time, how Recoil integrates with Suspense by throwing Promises, and why its fine-grained subscription model outperforms a single Context blob.

---

## Core Internals to Internalize

### Atom Registration
- `atom()` returns a descriptor `{ key, default }` — the key is a global string
- State lives in `RecoilRoot`'s `Recoil_State` context — NOT in the atom descriptor
- Two atoms with the same key share state (bug) — no runtime error in dev
- Keys are registered in `Recoil_Keys.js` module-level Map — survives HMR reloads (causes dup-key warnings on hot reload)

### RecoilRoot
- Provides two React contexts: `AppContext` (state + graph) and `SuspenseContext`
- Each `<RecoilRoot>` is an isolated store — nested roots don't share state
- `override={false}` allows reading from ancestor root — useful for testing

### Selector Evaluation Engine
- `Recoil_RecoilValueInterface.js`: `getNodeLoadable()` → calls the selector's `get` fn
- During evaluation, a global `evaluatingSelector` tracker records which atoms/selectors are `get()`-called → builds `deps` set
- Selector state machine: `loading | hasValue | hasError`
- Cache key: hash of input deps — invalidated when any dep atom changes
- Async: selector returns `Promise` → Recoil wraps in `Loadable.loading` → throws Promise for Suspense

### useSyncExternalStore Integration
- Recoil 0.7.7 uses `ReactDOM.unstable_batchedUpdates` (React 18 only)
- Subscription: component registers a listener on the atom/selector node
- On atom change: `notify()` fires → React schedules a re-render for that component only

### Suspense Protocol
- `useRecoilValue` calls `getNodeLoadable(node)`
- If loadable is `loading`: **throws the Promise** (React's Suspense contract)
- React catches the throw → shows Suspense fallback → Promise resolves → React retries the render
- If loadable is `hasError`: throws the Error → caught by ErrorBoundary
- If loadable is `hasValue`: returns `loadable.contents`

---

## Experiment Learning Objectives

### 01 · Atoms
- `atom()` is a descriptor, not a value — the value is in the store
- `useRecoilState` = useState + cross-component sharing
- `useSetRecoilState` = write-only, no re-render on change — the key optimization
- Multiple independent atoms = multiple independent subscriptions (no Context blob)

**Debug exercise**: In React DevTools, find the `RecoilRoot` component. Observe the contexts it provides. Set a breakpoint in `atom.js` and trace what happens when you call `setCount`.

### 02 · Selectors
- Selectors build a dep graph lazily — only when first read
- `get()` inside selector is tracked — NOT the same as React's hook tracking
- Selector cache: same dep values = same cached result (referential stability matters)
- Selector chain: A → B → C — invalidating A marks B and C dirty

**Debug exercise**: Read `Recoil_selector.js`. Find where `evaluatingSelectorFunction` is set. Trace how `deps` is populated during the first evaluation of a selector.

### 03 · Atom Effects
- Effects run once: when the atom is first used (first `get()` or component mount)
- `setSelf()` during init: sets the atom default before any subscriber sees it
- `setSelf()` after init: triggers a state update + re-render
- `onSet()`: fires AFTER React's batched update — safe for sync external writes
- Return value: cleanup function — called when atom is garbage collected or root unmounts

**Debug exercise**: Add a console.log at the start and end of an effect. Navigate between tabs (mounts/unmounts) and observe when effects run and clean up.

### 04 · Async Selectors
- Async selector: `get` returns `Promise<T>` — Recoil wraps in `Loadable.loading`
- On dependency change: previous Promise is discarded, new Promise created
- Recoil does NOT debounce — rapid atom changes = rapid selector re-evaluations
- `useRecoilValueLoadable` avoids Suspense: reads the `Loadable` directly
- Loadable states: `hasValue` (T), `loading` (Promise<T>), `hasError` (Error)

**Debug exercise**: In Network tab, watch multiple fetch calls fire as you rapidly change the ID atom. Notice Recoil cancels stale evaluations. Read `Recoil_selector_NEW.js` and find where `requestID` is used to cancel stale async evaluations.

### 05 · Families
- `atomFamily(config)(param)` = atom with key `${config.key}__${JSON.stringify(param)}`
- Factory caches by serialized param — same param = same atom descriptor
- `selectorFamily` same pattern: one cached selector per param
- Key footgun: changing the param reference (e.g., object) creates a new serialized key → new atom

**Debug exercise**: In Recoil DevTools (or console), inspect the atom registry. Create 10 todo items via atomFamily — observe 10 unique atom keys registered.

### 06 · Advanced
- `useRecoilCallback`: non-render path access — reads without subscribing, writes without rendering
- `snapshot.getLoadable(node)`: synchronous read of current or async value
- Multiple `set()` calls in one callback: batched by React 18 — one re-render
- `useGotoRecoilSnapshot`: time-travel (Recoil's built-in undo mechanism)
- `useRecoilSnapshot()`: emits a new snapshot on every state change — build custom devtools

**Debug exercise**: Use `useRecoilSnapshot()` and `snapshot.getNodes_UNSTABLE({ isModified: true })` to log every changed atom to the console. This is the foundation of Recoil devtools.

### 07 · Performance
- Fine-grained subscriptions: N atoms = N listeners, one per component
- Context blob: one `useState` object = one listener, all consumers re-render
- Selector caching: `Object.is()` prevents re-renders when derived value doesn't change
- `React.memo` + `useRecoilValue` = component skips render if atom hasn't changed
- Measured: at N=20, Recoil gives 1 re-render per update vs Context's 20

**Debug exercise**: Open React DevTools Profiler. Record while clicking bench cells in 7.1 vs 7.2. Compare flame graphs — Recoil shows 1 commit with 1 component highlighted vs Context shows 1 commit with all 20 highlighted.

### 08 · Failures
| Failure | Loud/Silent | Recovery |
|---------|------------|----------|
| Missing RecoilRoot | Loud (throws at hook call) | ErrorBoundary |
| Duplicate atom key | Silent (console warn, overwrites) | Naming convention |
| Circular selector | Loud (throws at first read) | ErrorBoundary |
| atomFamily key collision | Silent (same string key → same atom) | Unique key prefix |
| Async rejection, no boundary | Crash (React tree collapses) | Add ErrorBoundary |

---

## Source Code Reading Guide

```
node_modules/recoil/src/
├── core/
│   ├── Recoil_RecoilValueInterface.js   ← getNodeLoadable, setNodeValue
│   ├── Recoil_State.js                  ← RecoilRoot store shape
│   ├── Recoil_Graph.js                  ← dep graph: nodeDeps, nodeToNodeSubscriptions
│   └── Recoil_Snapshot.js              ← Snapshot class
├── recoil_values/
│   ├── Recoil_atom.js                   ← atom() factory + atom effects
│   └── Recoil_selector_NEW.js          ← selector evaluation, caching, async
└── hooks/
    ├── Recoil_Hooks.js                  ← useRecoilValue, useRecoilState
    └── Recoil_SnapshotHooks.js         ← useRecoilCallback, useRecoilSnapshot
```

**Key reads** (in order):
1. `Recoil_atom.js`: `init()` function — how atom state is first created in the store
2. `Recoil_selector_NEW.js`: `evaluateSelectorFunction()` — the dep-tracking `get()` proxy
3. `Recoil_Hooks.js`: `useRecoilValueLoadable_LEGACY()` — the useSyncExternalStore integration
4. `Recoil_Graph.js`: `addNodeDeps()` and `removeNodeDeps()` — how the dep graph is maintained

---

## Performance Benchmarks to Run

1. **Subscription count**: Create 100 atoms, 100 components. Measure time to mount and time per update.
2. **Selector cache hit rate**: Wrap selector evaluation in `performance.mark()`. Measure cache hits vs misses.
3. **Async selector waterfall**: Chain 3 async selectors. Measure total time vs parallel fetch.
4. **Memory**: 1000 atomFamily entries — check if GC reclaims unused atoms (Recoil does NOT GC by default).

---

## Advanced Experiments (after mastering the basics)

- Implement a custom `persistEffect` that syncs to IndexedDB instead of localStorage
- Build a simple devtools panel using `useRecoilSnapshot()` and `snapshot.getNodes_UNSTABLE()`
- Implement optimistic updates: set atom immediately, async selector confirms or rolls back
- Compare Recoil vs Jotai (Recoil's maintained successor): same atom/selector model, no deprecated status
- Implement a `useUndoRedo` hook using `useGotoRecoilSnapshot` + a history stack
