# Jotai POC — Deep Action Plan

## Objective

Understand Jotai's internal architecture: how atoms are identified by object reference instead of string keys, how the Store uses a WeakMap to hold atom state, how derived atoms build a reactive dep graph at evaluation time using a capturing getter, how `useSyncExternalStore` wires atoms into React's render cycle, and why the opt-in Provider model is safer than a mandatory root.

---

## Core Internals to Internalize

### Atom Identity
- `atom(0)` returns `{ __type: 'primitive', init: 0, write: defaultWrite }` — a plain object
- The object reference IS the key — no global string registry, no collision possible
- Two calls to `atom(0)` return two different objects → two independent atoms
- `atomFamily` is just a `Map<string, atom>` cache — same-param calls return the same cached object
- Moving an atom between files, renaming it, or tree-shaking it has no effect on identity

### Store (WeakMap-Based)
- `Store` holds a `WeakMap<atom, AtomState>` — keyed by object reference
- `AtomState = { value, listeners: Set<() => void>, depUnsubs: (() => void)[] }`
- Primitive atom: `state.value` is the current value, updated by `store.set()`
- Derived atom: `state.value` is the cached result of the last evaluation
- WeakMap means: if the atom object is garbage-collected (no references), its state is also GC'd
- This is why atoms must be declared at module level — component-local atoms get GC'd and re-created

### Dep Tracking (Capturing Getter)
- `store.get(derivedAtom)` calls `derivedAtom.read(getter)`
- The `getter` is a closure that captures a `Set<atom>` (deps)
- Every `get(dep)` call inside `read()` adds `dep` to that Set
- After evaluation: Store subscribes to each dep — on dep change, derived atom invalidates and re-notifies
- No global tracker variable (MobX uses a global `currentTracker`; Jotai passes the getter explicitly)
- Dynamic deps: if `read()` conditionally calls `get()`, deps change per evaluation — Jotai handles this by re-subscribing on each re-evaluation

### useSyncExternalStore Integration
- `useAtomValue(atom)` calls `useSyncExternalStore(subscribe, getSnapshot)`
- `subscribe`: calls `store.subscribe(atom, callback)` — adds callback to `atom.listeners`
- `getSnapshot`: calls `store.get(atom)` — returns current value
- React calls `getSnapshot()` after every `subscribe()` notification to check if the value changed
- If `Object.is(prev, next)` → no re-render (referential stability matters for objects/arrays)
- `useSetAtom` does NOT call `useSyncExternalStore` — no subscription, no re-render on change

### Suspense Protocol
- `atom(async get => ...)` evaluates to a `Promise<T>` stored in `state.value`
- Jotai detects the Promise and throws it when `useAtomValue` reads the atom
- React catches the thrown Promise → shows Suspense fallback → re-renders when Promise resolves
- `loadable(asyncAtom)` wraps this: returns `{ state: 'loading' | 'hasData' | 'hasError', data/error }` so the component handles loading explicitly instead of throwing

### Provider and Store Scoping
- A module-level `const globalStore = new Store()` is the default
- `useContext(StoreCtx)` returns `globalStore` unless a `<Provider>` is present above
- `<Provider store={createStore()}>` injects a fresh store into context — all `useAtom` calls inside use it
- Nested `<Provider>` trees are fully isolated — no shared state between siblings

---

## Experiment Learning Objectives

### 01 · Atoms
- `atom(0)` returns an object — the value is in the Store, not in the atom
- `useAtom` = `useAtomValue` + `useSetAtom` — split them to control which components re-render
- `useSetAtom` returns only the setter — holds no subscription — renders exactly once (mount)
- Three independent atoms = three independent listeners — updating one never triggers the other two
- Global store: no Provider wrapping needed — `useContext` falls back to `globalStore`

**Debug exercise**: In React DevTools, find the `StoreCtx.Provider` (only present if you use `<Provider>`). Without a Provider, observe there is no context wrapper at all — atoms work through the module-level `globalStore` singleton. Set a breakpoint in `store.set()` and trace the listener notification.

### 02 · Derived Atoms
- `atom(get => ...)` is not evaluated until first read — lazy
- The capturing getter records deps during evaluation — not a static declaration
- Dynamic deps: a derived atom that conditionally calls `get()` changes its dep Set each evaluation
- Chained derivation: `quadrupled` depends on `doubled` depends on `base` — one `base` change notifies through the whole chain
- `Object.is()` guards downstream re-renders — if derived value doesn't change, subscribers skip

**Debug exercise**: Add a `console.log` inside a derived atom's `get` function. Observe it fires on first read (lazy init) and again on each dep change. It does NOT fire when an unrelated atom changes — proof of fine-grained tracking.

### 03 · Write Atoms
- `atom(readFn, writeFn)` — `writeFn` receives `(get, set, ...args)` — can read and write any atom
- Action atom: `atom(null, (get, set) => set(counterAtom, 0))` — read value is `null`, the atom IS the action
- Multi-atom write: `set()` called multiple times inside one `writeFn` — React 18+ batches them → one re-render
- Bidirectional: `milesAtom` derives from `kmAtom` on read, sets `kmAtom` on write — two-way binding with one atom
- Composition: a write atom can call `set(anotherWriteAtom, args)` — write atoms are composable commands

**Debug exercise**: Step through the write path in `core/jotai.ts`: `store.set(writableAtom, value)` → calls `atom.write(getter, setter, value)` → calls `setter(primitiveAtom, newValue)` → updates state → notifies listeners. Confirm two separate `set()` calls inside one `writeFn` each trigger their own listener notification (React batches the DOM updates but the JS notifications are separate).

### 04 · Async Atoms
- `atom(async get => ...)` stores a `Promise` in `state.value` — Jotai detects this and throws it
- React's Suspense contract: throw a Promise → React shows fallback → Promise resolves → React retries
- On dep change: old Promise is discarded, new evaluation fires — Jotai does NOT debounce or cancel
- `loadable()` wraps the async atom — `state: 'loading'` while pending, `state: 'hasData'` on resolve
- ErrorBoundary catches rejected Promises — without one, the error propagates up the React tree

**Debug exercise**: Open the Network tab. Rapidly change the `userIdAtom` by clicking IDs 1→2→3→4→5 fast. Count the number of network requests fired. Notice Jotai fires one per change with no debouncing — the latest result wins because the atom re-evaluates on each dep change, but all requests fire.

### 05 · Atom Families
- `atomFamily(initFn)` returns a function: `param → atom`
- Cache key: `JSON.stringify(param)` — same-shaped objects with same values → same atom
- Key footgun: `{ a: 1, b: 2 }` and `{ b: 2, a: 1 }` serialize differently → two atoms (same as Recoil)
- `atomFamily.remove(param)`: deletes the cached atom — next call creates a fresh one with default value
- Without `remove()`, family atoms accumulate forever — same leak as Recoil without explicit GC

**Debug exercise**: Inspect `todoAtomFamily.cache` (a `Map`) after creating and removing items. Confirm `remove()` shrinks the Map. Mount a component that reads `todoAtomFamily(1)`, then call `todoAtomFamily.remove(1)`, then mount another component with the same id — confirm it gets the default value, not the previous value.

### 06 · Advanced
- `atomWithStorage(key, init)`: wraps `localStorage.getItem/setItem` in atom effects — reads on init, writes on every change
- `createStore()` + `<Provider>`: two `<Provider>` subtrees using the same atom hold completely separate values
- `useStore()`: returns the active `Store` instance — imperative `store.get(atom)` / `store.set(atom, v)` outside React's render cycle
- `atom.debugLabel = 'name'`: sets the display name in React DevTools atom inspector — no runtime effect

**Debug exercise**: Open React DevTools. Find the atom values panel (requires `jotai-devtools` or the React DevTools beta). Without `debugLabel`, atoms appear as `atom1`, `atom2`. Add `debugLabel` and observe the name update. Confirm `debugLabel` has no effect on atom identity or state.

### 07 · Performance
- Single object atom: all readers re-render when ANY field changes — one listener, one notification
- Separate atoms: only the field's subscriber re-renders — N listeners, targeted notifications
- `selectAtom(base, selector, equalityFn)`: creates a derived atom that only notifies when `selector(state)` changes by `equalityFn` — `Object.is` by default
- `useSetAtom` renders once (mount) — never again — proof: click increment 20 times, writer render count stays at 1

**Debug exercise**: Open React DevTools Profiler. Record while clicking "Object: score++" in 7.1 — flame graph shows 3 components highlighted (all object readers). Record while clicking "Atom: score++" — flame graph shows 1 component highlighted (only scoreAtom's reader). This is the empirical proof of fine-grained subscriptions.

### 08 · Failures

| Failure | Loud/Silent | Root Cause | Recovery |
|---------|-------------|------------|----------|
| Atom inside component | Silent loop or stale value | New atom object every render = new subscription | Move atom to module level |
| Circular derived atoms | Loud (stack overflow) | Dep evaluation recurses infinitely | ErrorBoundary + restructure |
| Write to read-only atom | Loud (runtime throw) | No write fn defined | Add write fn or use primitive |
| Async without Suspense | Silent (blank render) | Promise thrown, no boundary catches it | Wrap in `<Suspense>` |
| Stale subscription | Silent logic bug | `store.sub()` return not called on cleanup | Always call the returned unsub |
| Global store contamination in tests | Silent (state bleeds) | Module-level store persists across tests | Wrap each test in `<Provider store={createStore()}>` |

---

## Source Code Reading Guide

```
node_modules/jotai/src/
├── vanilla/
│   ├── atom.ts          ← atom() factory — the 30-line core
│   └── store.ts         ← Store class: WeakMap, get, set, sub, createStore
├── react/
│   ├── useAtom.ts       ← useAtom = useAtomValue + useSetAtom
│   ├── useAtomValue.ts  ← useSyncExternalStore integration
│   ├── useSetAtom.ts    ← setter-only hook, no subscription
│   └── Provider.tsx     ← createContext + Provider component
└── utils/
    ├── atomFamily.ts    ← Map cache, remove()
    ├── atomWithStorage.ts ← localStorage/sessionStorage effect
    ├── loadable.ts      ← wraps async atom into { state, data/error }
    └── selectAtom.ts    ← memoized partial read with equality fn
```

**Key reads** (in order):
1. `vanilla/atom.ts`: the entire file — it's ~30 lines. Understand that `atom()` is just an object factory.
2. `vanilla/store.ts`: `buildStore()` → focus on `readAtom()` and how deps are tracked via the `getter` closure. Then `writeAtom()` → how it dispatches to the atom's write fn.
3. `react/useAtomValue.ts`: how `useSyncExternalStore` is wired — `subscribe` calls `store.sub(atom, cb)`, `getSnapshot` calls `store.get(atom)`.
4. `utils/atomFamily.ts`: the cache Map and `remove()` — confirm it's ~20 lines.
5. `utils/loadable.ts`: how it wraps an async atom — a derived atom that catches the thrown Promise and returns a discriminated union instead.

---

## Performance Benchmarks to Run

1. **Subscription isolation**: Create 50 atoms, 50 components. Update one atom. Measure how many components re-render (should be 1, not 50).
2. **Object atom vs granular**: 20 fields in one object atom vs 20 separate atoms. Measure re-renders per field update.
3. **Derived atom cache hit rate**: Wrap `atom.read()` calls with `performance.mark()`. Rapid dep changes → measure evaluation count vs subscriber notification count.
4. **atomFamily memory**: Create 1000 family entries without calling `remove()`. Inspect memory in Chrome DevTools heap snapshot — confirm entries accumulate. Call `remove()` for all 1000 — confirm heap shrinks.
5. **Async atom waterfall**: Chain 3 async atoms `A → B → C`. Measure total Suspense time vs firing all three fetches in parallel.

---

## Advanced Experiments (after mastering the basics)

- Implement a custom `atomWithIndexedDB` effect that persists to IndexedDB instead of localStorage — study `atomWithStorage` source first
- Build a minimal devtools panel: use `store.sub(debugAtom, cb)` to log all writes to a circular buffer, display in a floating overlay
- Implement optimistic updates: write to a local atom immediately, async atom confirms from server, write atom rolls back on error
- Implement `useUndoRedo` using a history stack atom + write atoms for undo/redo — no library needed
- Compare Jotai vs Recoil side-by-side: take the Recoil POC's `AtomsExperiment` and rewrite it using Jotai. Measure the behavioral differences in the failures tab (especially string key collisions — which Jotai makes impossible)
- Build a `syncAtoms` utility: given two stores, subscribe each atom to the other and keep them in sync — demonstrates why Provider isolation is useful
- Implement `atomWithBroadcastChannel`: an atom that syncs across browser tabs using `BroadcastChannel` API
