## SolidJS

No VDOM. Components run exactly once. Only reactive expressions update the DOM directly.

React: component re-runs on state change, diffing reconciles VDOM to DOM.
SolidJS: component runs once at mount, signal subscriptions patch DOM nodes in-place.

## Core Primitives

### createSignal
Reactive atom. Returns [getter, setter]. Anything reading the getter inside a reactive context (effect, memo, JSX) auto-subscribes.

### createEffect
Runs after DOM is updated. Re-runs when any signal read inside it changes. Used for side effects (RAF loops, subscriptions).

### createMemo
Derived/computed signal. Only recomputes when its signal deps change. Cached otherwise.

### createStore
Nested reactive state. Uses Proxy to track property-level subscriptions. `<For>` with a store only re-evaluates the specific item that changed.

### For
Fine-grained list primitive. Maps each item to a stable DOM node keyed by identity. No full list reconciliation — only diffs the changed item.

## Pros
- Fastest UI framework in JS benchmarks (js-framework-benchmark)
- Components run once = zero re-render overhead
- Tiny runtime (~7kb gzipped)
- React-like JSX syntax
- Fine-grained reactivity: surgical DOM updates
- No need for useMemo, useCallback, React.memo — not needed when there are no re-renders

## Cons
- Smaller ecosystem vs React
- JSX compiles differently — can't destructure props (breaks reactivity)
- No React DevTools equivalent
- Less community knowledge, fewer libraries
- Mental model shift: must think in signals, not state

## Key Gotcha
Never destructure props in SolidJS components:

// WRONG — breaks reactivity
function Comp({ value }) { return <div>{value}</div> }

// RIGHT — props.value stays reactive
function Comp(props) { return <div>{props.value}</div> }

## What this POC demonstrates

1. Signal tab: 60fps ticker via createSignal + createEffect RAF loop. Component body runs once — counter proves it.
2. Store tab: 1000-item list, single-item stress updates. Only the mutated item's DOM row re-evaluates.
3. Memo tab: fibonacci(N) via createMemo. Unrelated clock signal doesn't trigger recomputation.
