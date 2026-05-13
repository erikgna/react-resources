## SvelteJS 5

Compiled reactivity. No VDOM. No runtime reactive library. Components initialize once.
Reactive bindings are compile-time transforms — the compiler rewires reads/writes of `$state` variables into fine-grained DOM patches.

React: component function re-runs on state change, VDOM diff reconciles to DOM.
SolidJS: component runs once, runtime signal subscriptions patch DOM directly.
Svelte 5: component initializes once, compiler-emitted code tracks reactive reads and patches DOM directly. No runtime overhead for the reactive system itself.

## Core Runes

### $state
Reactive atom. Assign like a normal variable — compiler intercepts reads/writes.
Deep reactive for objects/arrays (Proxy-based). Mutate nested properties directly.

### $derived
Cached computed value. Only recomputes when its reactive dependencies change.
For complex logic: `$derived.by(() => { ... })`.

### $effect
Runs after DOM is updated. Re-runs when reactive deps read inside it change.
Cleanup: return a function. No separate `onCleanup` call needed.

### setContext / getContext
Pass reactive context via objects with JS getters — NOT plain values (those would snapshot).
Each consumer subscribes only to the getters it actually reads.

### {#await}
Built-in template block for Promises. Handles pending / fulfilled / rejected inline.
No separate loading/error state variables needed.

## Pros
- Zero runtime overhead for reactivity — compiled away
- Smallest bundle size of any major framework
- Direct mutation syntax (`items[i].x = y`) — no produce(), immer, or setters
- Built-in template syntax: `{#if}`, `{#each}`, `{#await}` — no JSX
- Deep reactive `$state` — nested object/array mutations tracked automatically
- Familiar HTML-like `.svelte` files with `<script>`, template, `<style>`

## Cons
- Runes are compiler magic — harder to debug than explicit signal calls
- `$state`/`$derived`/`$effect` only work inside `.svelte` files or `.svelte.js` modules
- No equivalent to SolidJS `createResource` — must compose `$effect` + Promise manually
- Smaller ecosystem than React; fewer component libraries
- `untrack` needed to read reactive values without subscribing (same as SolidJS)
- Context gotcha: must use getter pattern, not plain values, or subscriptions break

## Key Gotcha: Context must use getters
```js
// WRONG — snapshots the value at setContext call time
setContext('theme', { color, count });

// RIGHT — getter defers the read; consumers stay reactive
setContext('theme', {
  get color() { return color; },
  get count() { return count; },
});
```

## Key Gotcha: $state/$derived only in reactive contexts
```js
// WRONG — plain .js file
let x = $state(0); // compile error outside .svelte / .svelte.js

// RIGHT — .svelte file or .svelte.js module
```

## What this POC demonstrates

1. Reactive tab: 60fps ticker via `$state` + `$effect` RAF loop. Script initializes once — counter proves it.
2. Derived tab: fibonacci(N) via `$derived`. Unrelated clock signal does not trigger recomputation. `untrack` demonstrated.
3. Store tab: 1000-item deep `$state` array. Direct mutation `items[i].x = y` patches only the changed row.
4. Context tab: getter-pattern context. Three children each subscribe only to their own field — eval counts diverge.
5. Async tab: `$state` Promise + `{#await}` block. Loading / result / error all handled in template, no extra state vars.
