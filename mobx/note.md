# MobX — Analysis

## Pros

**1. Minimal boilerplate**
A 10-line class with `makeAutoObservable` is a complete store. No action type strings, no reducers, no dispatch, no selectors. Redux equivalent: 3+ files, 40+ lines.

**2. Fine-grained reactivity without effort**
`observer()` tracks exactly which observables a component reads. Only that component re-renders when those values change. No `useMemo`, no `React.memo`, no custom equality functions. The tracking is automatic and per-execution — not per-selector.

**3. Dynamic dependency tracking**
Computed dependencies are collected at runtime, per-execution. A computed that conditionally reads a value only depends on that value when it actually reads it. Changing an unread dependency does not trigger recomputation.

**4. Transparent async**
`runInAction(() => { this.data = result })` is the entire async pattern. No thunk middleware, no `createAsyncThunk`, no generator functions.

**5. Computed caching is automatic**
MobX never recomputes a computed value if its dependencies haven't changed. Reading it 100 times = 1 computation until a dependency changes. No `createSelector`, no `useMemo` discipline.

**6. Strict mode fails loudly**
`configure({ enforceActions: 'always' })` throws on mutation outside an action. Explicit, actionable error vs silent wrong behavior.

**7. Natural OOP fit**
Class-based stores, methods as actions, getters as computeds. Matches mental models for domain models, entity stores, service layers. No need to invert existing class designs.

## Cons

**1. Implicit tracking = silent snapshot footgun**
Reading an observable outside `observer`/`autorun` silently returns a snapshot that never updates. No error, no warning. The most common MobX React bug. Redux's `useSelector` cannot be misused this way — it either subscribes or doesn't compile.

**2. No built-in action audit trail**
MobX does not record a history of state transitions by default. `spy()` gives you a runtime log, but there's no time-travel debugging. Redux DevTools records every dispatched action + state snapshot. This matters at scale for debugging "how did state get here?"

**3. Manual reaction disposal**
Every `autorun`/`reaction`/`when` must be explicitly disposed. Forget the disposer and you have a memory leak. Redux's `useSelector` is tied to component lifecycle automatically.

**4. `observer` must wrap the correct component**
Fine-grained updates only work if the component that reads the observable is wrapped in `observer`. Wrapping a parent but not the reading child = parent re-renders, child misses updates. This is a non-obvious wrapping scope bug.

**5. Circular computeds throw**
MobX detects cycles and throws at runtime. This is safer than silent wrong results, but it requires more careful design of computed relationships. Redux reducers cannot have circular derivations at all (no derived state in the core model).

**6. Mutation semantics are unfamiliar to immutability-trained developers**
Teams that internalized Redux/React's immutability model are surprised that MobX state is mutable. `store.items.push(x)` is correct MobX; `store.items = [...store.items, x]` works but wastes Proxy overhead. This creates inconsistent patterns in codebases with mixed experience levels.

**7. TypeScript integration has rough edges**
`makeAutoObservable` is convenient but infers aggressively — private methods become actions, getters become computeds even when unintended. `makeObservable` with explicit annotations is verbose. The decorator API is cleaner but requires `experimentalDecorators` + different class field semantics.

## When MobX Fits

- Complex domain models that map naturally to OOP classes (e-commerce, inventory, CRM)
- Medium-scale apps where Redux boilerplate overhead exceeds the value of explicit patterns
- Real-time dashboards with high-frequency updates where fine-grained re-renders matter
- Teams with OOP backgrounds comfortable with mutation semantics
- Apps where developer velocity matters more than auditability
- Features with deeply nested state that would be tedious to normalize for Redux

## When MobX Breaks Down

- Large teams that need enforced, predictable patterns and code-review-visible action boundaries
- Apps that require time-travel debugging or action replay (Redux DevTools)
- Codebases where the implicit tracking model creates recurring "why isn't this updating?" bugs
- Performance-critical paths with very deep computed chains (100+ depth adds measurable latency)
- Teams new to reactive programming — the snapshot footgun (8.4) causes sustained confusion
- Server-side rendering: MobX's global state and Proxy-based observables require careful isolation between requests

## Performance Notes

From experiment 07 benchmarks:
- Chain of 100 computeds: propagation is O(depth) with no redundant recomputation (topological sort)
- 1000 observables in one `action` batch: fires 1 autorun re-run, not 1000
- 200-item observer list: update 1 item → 1 re-render; without observer → all 200 re-render
- Wide reaction graph (1000 observables, 1 autorun reading all): efficient but the autorun itself must re-execute its full read to collect dependencies on re-run

## Key Decision Point

**Use MobX when**: You have rich domain objects, need fine-grained UI updates, and your team is comfortable with the mental model that "reads subscribe, writes notify."

**Use Redux when**: You need a verifiable, auditable state history, work on a large team where predictability outweighs terseness, or your debugging workflow depends on time-travel.

**Use both**: It's valid to use MobX for local component state and Redux for global application state. They don't conflict.
