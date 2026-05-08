# Jotai — Pros, Cons, and When to Use

## What Jotai Is

Atom-based state management for React by Daishi Kato (also author of Zustand). Released 2020, stable since 2021, actively maintained as of 2024. The mental model: atoms = shared useState with no string key needed, derived atoms = useMemo that crosses components. Jotai is effectively Recoil's maintained successor — same atom/selector model, no deprecated status, React 19 compatible, 7x smaller bundle.

---

## Pros

### No String Keys — Atoms Are References
`atom(0)` returns a plain object. Identity is the JavaScript object reference, not a string. No collision possible, no global registry, no hot-reload duplicate-key warnings. Move an atom to a different file — nothing breaks. Rename it — nothing breaks.

### No Provider Required
A global singleton store handles all atoms by default. Components just read atoms — no wrapping. `<Provider store={createStore()}>` is available when isolation is needed (tests, microfrontends, multiple widget instances), but it is opt-in, not mandatory.

### Unified atom() API
Primitives and derivations use the same factory. `atom(0)` is primitive. `atom(get => get(base) * 2)` is read-only derived. `atom(get => ..., (get, set, arg) => ...)` is read-write derived. No separate `selector()` function. Less API surface, same power.

### Write Atoms
`atom(readFn, writeFn)` creates a bidirectional derived atom. The write fn receives `get` and `set` — it can read any atom and write any writable atom in one call. This replaces Recoil's `useRecoilCallback` for most multi-atom mutation patterns. No store class or action creator needed.

### Fine-Grained Subscriptions
Same model as Recoil: each component subscribes to exactly the atoms it reads. Changing atom A only re-renders components subscribed to A. React Context with one state object re-renders all consumers on every field change.

### React Suspense Integration
`atom(async get => ...)` suspends the reading component until the Promise resolves. The Suspense boundary renders the fallback. `loadable(asyncAtom)` provides a non-Suspense path with explicit `state: 'loading' | 'hasData' | 'hasError'` discrimination.

### Small Bundle
~3KB gzipped (core). Recoil is ~22KB. Zustand is ~3KB. The ecosystem packages (`jotai/utils`) are tree-shaken.

### Actively Maintained, React 19 Compatible
Regular releases, React 19 support. Recoil broke on React 19 (`unstable_batchedUpdates` removed) and has no fix. Jotai uses `useSyncExternalStore` — the stable React subscription API — and tracks React releases.

### atomFamily with Explicit GC
`atomFamily.remove(param)` drops the cached atom instance. Recoil has no built-in GC for dynamic atoms. Jotai gives the caller explicit control.

### Scoped Isolation via Provider
`createStore()` + `<Provider store={store}>` scopes all atoms under that subtree to the new store. Two `<Provider>` islands using the same atom hold independent state. Test-friendly: each test mounts its own store.

---

## Cons

### No Built-In DevTools
No Redux DevTools integration, no Jotai-native devtools in production. `atom.debugLabel` helps in React DevTools, but there is no action log or time-travel UI without third-party tools (`jotai-devtools` exists but is separate).

### WeakMap-Keyed State Is Opaque
State lives in a `WeakMap<atom, state>` inside the Store. You cannot iterate all current atoms, enumerate state, or serialize the store to JSON without explicit tooling. Recoil's `getNodes_UNSTABLE()` has no Jotai equivalent in core.

### Derived Atom Debugging Is Non-Obvious
Circular dependencies throw a stack overflow with no descriptive error. The dep graph is computed at runtime — you cannot inspect it statically. Atoms with no `debugLabel` appear as anonymous objects in DevTools.

### No Atom Key for Persistence
Recoil's string key maps naturally to a localStorage key. Jotai's `atomWithStorage` solves this, but the storage key is a separate, manually-assigned string — it's decoupled from the atom identity, which is correct but requires discipline.

### Write Atom API Has Variance Quirks in TypeScript
`atom(readFn, writeFn)` overloads interact poorly with generic variance. Casting to `as unknown as WritableAtom<...>` is common in practice. The real Jotai ships TypeScript types that are more carefully constructed than a hand-rolled version, but complex write atom compositions still produce occasional TS friction.

### No Selector Effects
Unlike Recoil's `atomFamily` with effects, derived atoms in Jotai are pure — no side effects, no persistence hook, no `onSet`. To persist derived state you must either persist the base atoms or use a `useEffect` at the component level.

### Global Store Is a Testing Footgun
The default global store persists across test files unless explicitly reset between tests. Each test should use `<Provider store={createStore()}>` to isolate state. Easy to forget — atoms from one test contaminate the next.

---

## When Jotai Fits

- Apps with many independent state slices — dashboards, editors, per-entity state
- Async-heavy data-fetch graphs where Suspense integration is desirable
- New projects replacing Recoil — mechanical migration, same mental model
- Teams that find Redux's action/reducer ceremony too heavy but want fine-grained subscriptions
- Component libraries or micro-frontends that need isolated state without a global Provider mandate

---

## When Jotai Breaks

- **Large teams needing audit trails**: No action log, no time-travel. Use Redux RTK.
- **SSR with complex state**: No serialization primitives for store hydration. Manual work required.
- **Heavy OOP codebases**: No class-based store model. MobX fits better.
- **Apps that need complete store enumeration or snapshot diffing**: WeakMap state is not iterable. Recoil's snapshot API was richer (despite Recoil being unmaintained).

---

## Comparison with Peers

| Feature | Redux RTK | MobX | Zustand | Recoil | Jotai |
|---------|-----------|------|---------|--------|-------|
| Fine-grained subscriptions | Via selectors | Yes | Via selectors | Yes | Yes |
| Async | Thunk/RTK Query | Transparent | Middleware | Native (Suspense) | Native (Suspense) |
| Devtools | Excellent | Good | Chrome ext | None built-in | None built-in |
| Bundle size | ~20KB | ~18KB | ~3KB | ~22KB | ~3KB |
| Learning curve | High | High | Low | Medium | Low |
| React 19 | Yes | Yes | Yes | No | Yes |
| Maintained | Yes | Yes | Yes | No | Yes |
| String key required | No | No | No | Yes | No |
| Provider required | No | No | No | Yes | No |
| Write atoms | No | Actions | setState | useRecoilCallback | Yes (built-in) |
