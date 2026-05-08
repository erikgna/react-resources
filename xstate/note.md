# XState — Pros, Cons, and When to Use

## What XState Is

Finite state machine and statechart library by David Khourshid. The v5 rewrite (2023) introduced a unified actor model — every machine is an actor with its own inbox, state, and lifecycle. The mental model: instead of managing boolean flags and async races by hand, you declare all legal states and transitions explicitly. Illegal states become unreachable by construction, not by convention.

XState is not a React state manager. It is a general-purpose state machine runtime that happens to have a React adapter (`@xstate/react`). It runs equally well in Node, workers, and browsers with no DOM dependency.

---

## Pros

### Illegal States Are Unreachable by Construction
Every state and transition is declared upfront. If a state is not in the machine definition, it cannot be reached — not by a bug, not by a race, not by a missing guard. Contrast with boolean flags: `isLoading && isError` is representable but meaningless; a machine with `loading` and `error` as separate states makes that combination impossible.

### Guards Make Conditional Logic Explicit
Guards are named, testable predicates on `({ context, event })`. They live in the machine definition, not scattered across `if` statements in event handlers. First-match semantics with fallback transitions replace nested conditionals. You can enumerate every possible transition for a given state and event from the config alone.

### Invoked Actors — Guaranteed Cleanup
`invoke` ties an actor's lifetime to a state. When the machine exits that state, the actor is automatically stopped — the interval is cleared, the subscription is dropped, the fetch is cancelled. This is the lifecycle management that `useEffect` requires discipline for; `invoke` makes it structural. You cannot forget cleanup: there is nothing to forget.

### Hierarchical States Eliminate Repetition
Events defined on a parent state apply to all child states without repeating them. A CANCEL event on a `filling` parent works in `filling.step1`, `filling.step2`, and `filling.step3` automatically. Parallel states run multiple independent regions simultaneously with a single machine definition — no synchronization code, no shared mutable flag.

### Context Is Append-Only via assign()
Context is updated exclusively through `assign()` actions, which produce a new context object. XState v5 freezes context in development. Mutation outside `assign()` throws immediately. This is stricter than Redux (where you can mutate in a reducer if you forget `return`), and stricter than Zustand (where `setState` can accept a merge or a whole-state replacement).

### Actor Model — Compositional Concurrency
Each machine instance is an actor with its own inbox and state. Actors communicate via `sendTo(id, event)`. A parent can spawn children, monitor them, and stop them. This is a principled model for coordinating concurrent async work — no shared mutable state between actors, no lock contention, explicit message passing.

### Visualizable and Auditable
The machine config is a plain JavaScript object. XState's DevTools can render a live state diagram. Every transition is logged. Time-travel is possible by replaying events against the initial state. The entire state space is enumerable from the config at design time — not just at runtime.

### TypeScript-First in v5
v5 infers context, event union, and state value types from the machine definition. `state.matches('loading')` narrows the type of `state.context`. `state.can({ type: 'SUBMIT' })` is type-checked against the event union. No manual discriminated union maintenance.

---

## Cons

### Verbosity for Simple State
A toggle button needs a machine definition, a `createMachine` call, and a `useMachine` hook. Zustand does it in three lines of `create()`. MobX does it with one `observable`. XState's ceremony is justified only when the state space is complex enough to warrant explicit modeling. For 1–2 booleans it is overengineering.

### Learning Curve Is Steep
Finite state machines, statecharts, guards, entry/exit actions, invoked actors, spawned actors, `fromPromise`, `fromCallback`, compound states, parallel states — the full mental model is large. Teams unfamiliar with statecharts spend significant time mapping familiar patterns (loading flags, modal open/close) into machine terms before becoming productive.

### Re-render Isolation Requires useSelector
`useMachine` re-renders on every state or context change, regardless of which context field changed. Unlike MobX (which tracks reads at render time) or Zustand (where selectors prevent re-renders), XState requires explicit `useSelector(actorRef, snap => snap.context.field)` to isolate a component from irrelevant updates. Easy to miss on large context objects.

### Silent Event Discard Is the Default
Events with no matching transition in the current state are silently dropped. A typo (`SUBMT` vs `SUBMIT`) fails with no error, no warning, and no log entry. The machine stays consistent, but the expected effect never happens. You must probe with `state.can({ type })` proactively, or add a catch-all transition, to surface discard bugs.

### Infinite raise() Loops Have No Safety Net
`raise()` in an entry action that loops unconditionally locks the browser. XState does not detect cycles in the event queue. The guard must terminate the loop — if the guard is wrong, the tab hangs with no error message until the call stack overflows.

### Spawned Actors Require Manual Cleanup
Invoked actors clean up automatically. Spawned actors (via `spawn()`) do not. They persist until the parent machine stops or you call `stopChild(id)`. Forgetting `stopChild` on a spawned actor that holds a timer or WebSocket connection is a silent resource leak — identical in behavior to forgetting `clearInterval` in a `useEffect`.

### No Fine-Grained Reactivity
XState has no equivalent of MobX's reactive dependency tracking. There is no way to subscribe to a specific context field without a selector. There is no computed value that lazily re-evaluates only when its inputs change. All subscribers receive the full snapshot on every transition.

### Bundle Size Is Non-Trivial
XState v5 core is ~32KB gzipped with `@xstate/react`. MobX is ~18KB. Zustand is ~3KB. Jotai is ~3KB. The size reflects the full actor system, inspector integration, and type machinery. For small apps or bundle-constrained environments, the cost is visible.

---

## When XState Fits

- Complex async flows with multiple intermediate states — fetch → polling → timeout → retry — where boolean flags would require auditing 6+ combinations
- Multi-step forms or wizards where CANCEL must work from any step and BACK/NEXT must be explicit transitions
- Media players, game loops, device controllers — anything with a well-defined finite state space
- Systems where invalid state must be provably unreachable, not just unlikely (payment flows, onboarding, auth)
- Teams that need a visual audit trail and the ability to say "this state combination is impossible by construction"
- Long-lived background actors (WebSocket managers, polling loops, timers) where lifecycle correctness is critical

---

## When XState Breaks

- **Simple UI state (modals, toggles, form dirty flags)**: Zustand or even `useState` is less overhead with no behavioral tradeoff.
- **Fine-grained reactive data**: MobX tracks observable reads automatically; XState requires explicit selectors per subscription.
- **High-frequency updates**: Raw transition throughput is lower than Zustand/MobX due to the actor system and inspector overhead. Animation or canvas state should stay in refs or a dedicated library.
- **Teams new to statecharts**: The learning curve produces worse output than simple flags until the mental model clicks. Budget ramp-up time or start with simpler state managers.
- **Tiny bundles**: 32KB gzipped for a toggle — don't.

---

## Comparison with Peers

| Feature | Redux RTK | MobX | Zustand | Jotai | XState |
|---------|-----------|------|---------|-------|--------|
| State model | Reducer + slice | Observable graph | Closure store | Atom graph | State machine + actors |
| Invalid state prevention | Convention | Convention | Convention | Convention | Structural |
| Async model | Thunk / RTK Query | Transparent reactions | Middleware | Async atoms (Suspense) | invoke / spawn |
| Lifecycle cleanup | Manual | Disposers | Manual | Effect atoms | Automatic (invoke) |
| Fine-grained re-renders | Selectors | Automatic | Selectors | Automatic | useSelector |
| Time-travel | Excellent | No | No | No | Event replay |
| Visual tooling | Redux DevTools | MobX DevTools | No | jotai-devtools | XState Inspector |
| Bundle (gzipped) | ~20KB | ~18KB | ~3KB | ~3KB | ~32KB |
| Learning curve | High | High | Low | Low | Very high |
| React coupling | Optional | Optional | Optional | Required | Optional |
| Illegal state reachable | Yes | Yes | Yes | Yes | No |
