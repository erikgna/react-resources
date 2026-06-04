# Million.js POC — Report for Lead Review

**Engineer:** Erik Na
**Date:** 2026-06-04
**Repo path:** `react-resources/milionjs/`

---

## What This POC Explores

What Million.js's two core APIs do and how to explain them. Million is a build-time
compiler that turns components into "Blocks" that skip React's VDOM diff and patch changed
DOM nodes directly.

The POC is intentionally minimal: one component per API, no React baselines, no pickers.

- **`block()`** → `MillionTicker.tsx` — one component, primitive props (`value`, `color`)
  changing ~60×/sec.
- **`<For>`** → `MillionList.tsx` — 1,000 rows, exactly one row toggled per frame.

---

## Architecture

```
App.tsx ─ renders both demos stacked
  ├─ MillionTicker (block())  ── primitive-prop island, in-place dirty-check patch
  └─ MillionList   (<For>)    ── large list, children auto-blocked, one row patched

Build: vite.config.ts → million.vite({ auto: true }) compiles components into Blocks.
```

---

## The Core Concept: Blocks vs VDOM Diff

React re-renders by building a new virtual tree and diffing it against the old one. Million
compiles each Block once into a static template with dynamic "holes," then on update
dirty-checks only the holes and writes the DOM directly — no tree, no diff.

```
React:    setState → render() → new VDOM → diff(old, new) → patch
Million:  setState → dirty-check holes only → patch changed nodes
```

`<For>` applies the same idea to a list: it keys items and patches only the changed ones,
instead of re-walking the whole list.

---

## Key Concepts

### block() dirty-checks primitive props
`block()` returns a hyper-optimized component. Its update check is a shallow `Object.is`
per prop, so it shines with strings/numbers/booleans. Pass an object/array and every render
looks "changed" (new reference) — optimization gone. `MillionTicker` passes only number +
string, by design.

### <For> auto-blocks — do not double-block
`<For>` replaces `{items.map()}` and blocks each child internally. Wrapping the child in
`block()` yourself double-blocks it and breaks Million. Manual `block()` is for standalone
islands (the Ticker); inside `<For>`, children stay plain.

### The `key`-remount gotcha (bug found + fixed)
`MillionTicker` originally rendered `<TickerInner key={val} ... />`. A new `key` every frame
makes React treat each tick as a different element → unmount old Block, mount new one. That
discards the in-place patch — the exact optimization. **Fix:** remove the key (stable
identity → Million patches in place). The single most important fix.

### React 19 + Million v3 type gap (TS2786)
`block()` returns a forwardRef-style 2-arg component that React 19's `JSX.ElementType`
rejects, so `tsc` fails (build-only; dev/esbuild ignores types). **Fix:**
`const X = block(...) as unknown as FC<Props>`. Known interop gap, not a logic bug.

---

## When Million Helps (the honest boundary)

| Scenario | React | Million |
|---|---|---|
| 1 item update / frame | re-walks list | patches 1 node ✅ |
| whole-array replace / frame | heavy | heavy (no win) |
| 10k–50k DOM nodes | browser-bound | browser-bound (no win) |
| fine-grained high-frequency UI | weak | strong ✅ |

---

## What's Still Shallow

1. **No automated tests.** Demos are interactive (watch the rows update).
2. **No quantified benchmark.** This POC is for *understanding the APIs*; perf measurement
   (Profiler/comparison) was removed to keep the code minimal.
3. **Million internals not traced.** Have not read the compiler output or stepped the
   block-diff engine source — understanding is behavioral, not source-level.

---

## Files

| File | Role |
|------|------|
| `app/src/App.tsx` | Renders both Million demos stacked |
| `app/src/MillionTicker.tsx` | `block()` demo — primitive-prop island (no `key`) |
| `app/src/MillionList.tsx` | `<For>` demo — large list, children auto-blocked |
| `app/vite.config.ts` | `million.vite({ auto: true })` build-time compiler |
| `knowledge/index.md` | Learning log — concepts + the core rule |
| `knowledge/TECHNICAL.md` | Deep technical reference |
