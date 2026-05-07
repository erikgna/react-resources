# Zustand — Analysis

## Pros

**1. Minimal, zero-ceremony API**
`create((set) => ({ count: 0, inc: () => set(s => ({ count: s.count + 1 })) }))` is a complete store. No action type strings, no reducers, no dispatch, no Provider required. Same functionality as Redux in ~15 lines vs ~40.

**2. Opt-in re-renders via selectors**
`useStore(s => s.count)` re-renders only when `count` changes. No `useMemo`, no `React.memo`, no manual `shallowEqual` wiring needed for primitives. The comparison is `Object.is` — cheap and predictable.

**3. Works outside React**
`createStore` is a plain JS object with no React dependency. You can call `store.getState()`, `store.setState()`, and `store.subscribe()` from event handlers, WebSocket callbacks, timers, or Node.js scripts without a React tree.

**4. Tiny bundle (~1KB)**
The entire vanilla core is ~30 lines. The React hook adds ~20 lines. Middleware is opt-in and tree-shakeable. MobX is ~50KB; Redux Toolkit is ~10KB.

**5. Middleware composability**
`devtools(immer(initializer))` stacks behaviors without touching the store's state type. Custom middleware follows the same pattern — wrap `set`, call through. Writing one is ~10 lines.

**6. `persist` is drop-in**
`persist(initializer, { name: 'key' })` adds localStorage sync with no extra code. Partial persistence via `partialize`, custom storage adapters, and hydration hooks are all first-class options.

**7. Slice pattern scales without global coupling**
`StateCreator<RootState, [], [], SliceT>` keeps slices isolated while giving them type-safe access to the full store. Cross-slice access via `set`/`get` without explicit imports between slices.

## Cons

**1. No selector = silent over-rendering**
`useStore()` with no argument subscribes to the entire state object. Any `setState` — even for an unrelated field — triggers a re-render. No warning, no error. The most common Zustand production bug. (tab 8.2)

**2. Object selectors need `shallow` or they over-render too**
`useStore(s => ({ count: s.count, name: s.name }))` creates a new object every render — `Object.is` always fails — re-renders on every `setState`. Developers unfamiliar with the model won't notice until they profile. (tab 2.4)

**3. No built-in action audit trail**
Unlike Redux, Zustand has no action log by default. `devtools` middleware adds action names to Redux DevTools, but only if you pass the action name as the third argument to `set`. Omit it and you get anonymous actions. No time-travel. (tab 3.3)

**4. Stale closure in actions**
`set({ count: state.count + 1 })` where `state` is captured at action definition time will produce wrong results under concurrent calls. Must always use the functional form `set(s => ...)`. TypeScript doesn't catch this. (tab 8.1)

**5. `shallow` is one level deep only**
`shallow` compares own keys with `Object.is`. It does NOT recurse into nested objects. `{ user: { name: 'Alice' } }` compared with a mutated version of the same ref returns `true` — stale display. (tab 8.5, tab 2.5)

**6. `persist` silently drops non-JSON values**
`Map`, `Set`, `undefined`, `Date`, functions — all are silently dropped or corrupted by `JSON.stringify`. After hydration, code that calls `.get()` on what was a `Map` throws a `TypeError`. Requires a custom serializer. (tab 8.3)

**7. Missing `unsub` from `subscribe` leaks memory**
`store.subscribe(handler)` returns an unsubscribe function. Forgetting to call it (especially inside `useEffect`) leaks the listener forever — it fires on every `setState` even after the component is gone. No GC. (tab 8.4)

## When Zustand Fits

- Small to medium apps where Redux's explicit action model adds more ceremony than clarity
- Apps that need state accessible outside React (timers, WebSockets, vanilla JS modules)
- Stores that map naturally to flat objects with co-located actions (not deep domain models)
- Teams that want `persist` without a separate library (Redux Persist, localStorage sync)
- Features that need fine-grained re-render control via selectors without the MobX Proxy model
- Prototypes and tools where bundle size matters

## When Zustand Breaks Down

- Large codebases where "which action changed what and when" is a debugging requirement — Redux's action log is invaluable there
- Teams that need enforced, reviewable patterns — Zustand's `set(anything)` is too permissive at scale
- Apps with deep, interconnected domain models that benefit from MobX's Proxy-based fine-grained tracking
- Stores that need complex derived state (chains of computed values) — Zustand has no built-in computed; you'd add Jotai or selector libraries
- Server-side rendering where hydration timing matters — `persist` hydrates async; without `skipHydration` + manual control, you get hydration mismatches
- Contexts where type safety on the action surface matters — Zustand actions are plain functions, not discriminated union action types

## Performance Notes

From experiment 07 benchmarks (add measured values after running):

- **Selector miss**: 50 components with no selector — `tick()` (unrelated field) re-renders all 50. With `s => s.count` selector — `tick()` triggers 0 re-renders. Cost is pure component re-render time; Zustand's listener overhead is negligible.
- **setState merge**: `Object.assign({}, prev, partial)` per call. At 100k calls, merge and replace are within ~10ms of each other — the allocation cost is irrelevant in practice.
- **Subscription Set**: `Set.add` and `Set.delete` are O(1). `setState` iterates all listeners — O(n). At 50k listeners (pathological), notify takes measurable time; real apps with <100 subscriptions see <0.1ms.
- **Shallow equality**: `shallow` prevents re-renders when object selector values haven't changed. One-level only — nested object mutations bypass it and cause stale displays.

## Key Decision Point

**Use Zustand when**: You want the smallest API surface that gives you shared state, opt-in React integration, and middleware extensibility. Flat stores with co-located actions are where it excels. The selector model is the same one you'd write manually with `useSyncExternalStore`.

**Use MobX when**: Your state is a rich domain model (entities with relationships, computed chains, deep mutation), and you want automatic dependency tracking — no selectors needed. The Proxy model makes MobX significantly more powerful for this shape of problem, at the cost of explicitness.

**Use Redux when**: You need a complete audit trail of state changes, time-travel debugging, enforced unidirectional data flow, and the ability to reproduce a bug by replaying actions. Redux's action log is a first-class debugging tool; Zustand's is an afterthought.

**All three can coexist**: Zustand for global UI state (modals, filters, session), MobX for domain models, Redux for business-critical flows that need auditability.
