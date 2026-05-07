# Recoil — Pros, Cons, and When to Use

## What Recoil Is

Facebook's atom-based state management for React. Released 2020, declared stable 2021, effectively unmaintained post-2023 (Meta shifted resources). The mental model: atoms = shared useState, selectors = useMemo that crosses components. Fine-grained subscriptions by default.

---

## Pros

### Fine-Grained Subscriptions
Each component subscribes to exactly the atoms it reads. Updating atom A only re-renders components that read atom A. Context + useState requires every consumer to re-render when any field in the blob changes.

### Async-First with Suspense
Async selectors integrate with React Suspense natively — no manual loading flags, no `useEffect` for data fetching. Returning a Promise from `get()` is all it takes.

### Transparent Atom Effects
Persistence, logging, validation, async init — all declared directly on the atom. Effects are composable (array of functions). They run once on first use and clean up on unmount. No separate middleware or saga layer needed.

### atomFamily for Dynamic Lists
`atomFamily` makes per-entity state trivial. Each list item gets its own atom, its own subscriptions, its own effects. Updating item #47 doesn't re-render item #1. Redux would require careful memoized selectors; Context would re-render everything.

### Selector Caching
Selectors are lazily evaluated and cached. Multiple components reading the same selector pay the computation cost once. `Object.is()` prevents downstream re-renders when the derived value hasn't changed.

### Snapshot and Time-Travel
`useRecoilSnapshot()` and `useGotoRecoilSnapshot()` give built-in time-travel. No third-party devtools plugin required. Snapshots are immutable — safe to hold and compare.

### useRecoilCallback
Imperative read + write without being in the render path. Essential for analytics (read state on event), form submission (read many atoms atomically), and undo/redo (snapshot before mutation).

---

## Cons

### Unmaintained Since 2023
Meta stopped active development. Last release: 0.7.7 (2023). React 19 broke Recoil (`unstable_batchedUpdates` removed from `react-dom`) — this POC uses React 18 for this reason. Any future React breaking change will go unfixed.

### String Keys Are a Footgun
Every atom and selector requires a globally unique string key. No TypeScript enforcement. Duplicate keys cause silent state corruption in development (console warn only) and harder-to-diagnose bugs. atomFamily compounds this — keys must be unique across all families.

### No Automatic Garbage Collection
Atoms created by `atomFamily` persist in the store even after all consumers unmount. For long-lived apps with many dynamic entities (chats, list items), this leaks memory. Real Recoil has `useRecoilTransactionObserver` but no built-in GC.

### RecoilRoot Isolation Is Non-Obvious
Nested `<RecoilRoot>` creates an isolated child store. Components in the child root cannot read atoms from the parent root (unless `override={false}`). Forgetting this causes confusing "atom has default value" behavior.

### Async Selector Cancellation Is Manual
Recoil cancels stale evaluations using a `requestID` counter, but it doesn't cancel the underlying `fetch()` or `Promise`. If you fire 10 rapid changes, 10 network requests fire — only the last result is used. You must add `AbortController` cancellation yourself.

### atomFamily Key Must Be Stable JSON
`atomFamily(config)(param)` serializes `param` with `JSON.stringify`. Object param `{ id: 1 }` and `{ id: 1 }` produce the same key — correct. But `{ a: 1, b: 2 }` and `{ b: 2, a: 1 }` produce DIFFERENT keys — silent duplicate state. Use primitives as params when possible.

### No Built-In Devtools
Redux DevTools doesn't integrate with Recoil. `useRecoilSnapshot()` + custom logging is the only debugging path. No time-travel UI, no action log.

### Selector Effects Not Supported
Selectors are pure read functions — no side effects, no onSet, no persistence. Want to sync derived state to an external system? You need an atom with an effect, then a selector, then a subscription at the component level.

---

## When Recoil Fits

- Apps with many independent state slices (dashboards, editors with per-entity state)
- Async-heavy data-fetch graphs where the dep chain is meaningful
- Teams comfortable with atom/selector mental model and willing to accept the unmaintained risk
- Internal tools or short-lived projects where the React 18 lock-in is acceptable

---

## When Recoil Breaks

- **Large teams**: No enforced patterns, no Redux DevTools time-travel, difficult to audit state changes
- **React 19**: Broken out of the box — requires React 18
- **Long-lived apps**: Memory leaks from atomFamily without explicit cleanup
- **SSR**: Partial support — snapshot serialization is manual and fragile
- **New projects (2024+)**: Use Jotai instead — same atom/selector model, actively maintained, React 19 compatible, no string keys required

---

## Migration Path (Recoil → Jotai)

Jotai is Recoil's spiritual successor: atoms, derived atoms (Jotai's equivalent of selectors), atom effects. Key differences:
- No global string keys — atoms are JavaScript references (no collision possible)
- React 19 support
- Smaller bundle (~3KB vs ~22KB)
- No `RecoilRoot` required (optional `Provider` for isolation)
- `atomFamily` replaced by `atomWithFamily` or plain `useMemo`

Migration is mechanical: `atom({ key, default })` → `atom(default)`, `selector({ key, get })` → `atom(get => get(dep))`.

---

## Comparison with Peers

| Feature | Redux RTK | MobX | Zustand | Recoil | Jotai |
|---------|-----------|------|---------|--------|-------|
| Fine-grained subscriptions | Via selectors | Yes | Via selectors | Yes | Yes |
| Async | Thunk/Saga | Transparent | Middleware | Native (Suspense) | Native |
| Devtools | Excellent | Good | Chrome ext | None built-in | None built-in |
| Bundle size | ~20KB | ~18KB | ~3KB | ~22KB | ~3KB |
| Learning curve | High | High | Low | Medium | Low |
| React 19 | Yes | Yes | Yes | No | Yes |
| Maintained | Yes | Yes | Yes | No | Yes |
