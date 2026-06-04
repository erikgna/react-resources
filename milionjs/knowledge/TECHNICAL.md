# Million.js POC — Technical Reference

## What This Is

A Vite + React 19 app demonstrating Million.js's two core APIs, one component each:
`block()` (a frequently-updating component) and `<For>` (a large list with one-item-per-frame
updates). No React baselines, no pickers — the smallest code that explains the library.

Million is a **build-time compiler**: `million.vite({ auto: true })` rewrites eligible
components into "Blocks" during bundling. A Block skips React's VDOM diff — it compiles JSX
once into a static template with dynamic "holes" and patches only the changed DOM nodes.

---

## block(): `MillionTicker.tsx`

```tsx
type TickerProps = { value: number; color: string };

const TickerInner = block(({ value, color }: TickerProps) => ( /* JSX */ ))
  as unknown as FC<TickerProps>;
```

- `block()` returns a hyper-optimized component. On update it does a shallow `Object.is`
  per prop ("dirty check") and patches only the dynamic nodes (`value` text, `color` style).
- **Primitive props are required.** The shallow check compares by reference; an object/array
  prop is a new reference every render → always "dirty" → optimization defeated. This Ticker
  passes `value: number` and `color: string` only.
- **The `as unknown as FC<TickerProps>` cast** clears TS2786: Million v3's `block()` returns
  a forwardRef-style 2-arg component that React 19's `JSX.ElementType` rejects. Build-only
  (esbuild/dev ignores types). Runtime behavior unchanged.

```tsx
<TickerInner value={val} color={col} />   // NO key
```

- **The key gotcha.** With `key={val}`, every frame's changing key makes React unmount the
  old Block and mount a new one — discarding the in-place patch. A stable identity (no key)
  lets Million reuse the Block and patch in place. This one line determines whether the demo
  demonstrates anything.

---

## <For>: `MillionList.tsx`

```tsx
function ListItem({ item }) { /* plain — NOT block() */ }

<For each={items}>
  {(item) => <ListItem key={item.id} item={item} />}
</For>
```

- `<For>` is Million's `{items.map()}` replacement. It auto-blocks each child and moves list
  diffing out of React: it keys items and patches only changed ones.
- **Do not wrap children in `block()`.** `<For>` already blocks them; double-blocking breaks
  Million. Manual `block()` is for standalone islands only.

Stress loop — localized update (where Million wins):

```tsx
setItems(prev => {
  const next = [...prev];
  const idx = Math.floor(Math.random() * next.length);
  next[idx] = { ...next[idx], highlighted: !next[idx].highlighted }; // ONE item changes
  return next;
});
```

- Only one item's object reference changes per frame. React would walk the whole list to
  find it; Million patches only that `<li>`. Replacing the whole array each frame instead
  would be worst-case for any renderer and show no difference.

---

## Build System

```ts
// vite.config.ts
plugins: [million.vite({ auto: true }), react()]
```

- `million.vite()` is a build-time transform, not a runtime import. This is why Million
  "depends on build compilation."
- `auto: true` analyzes every component and auto-wraps the ones it deems safe.
- **Plugin order matters:** `million` must precede `react()` so it transforms the JSX first.

```bash
cd app
npm install
npm run dev      # interactive (esbuild, no typecheck)
npm run build    # tsc -b && vite build (typecheck + production bundle)
npm run lint
```

---

## When Million Helps (the honest boundary)

| Scenario | React | Million |
|---|---|---|
| 1 item update / frame | re-walks list | patches 1 node ✅ |
| whole-array replace / frame | heavy | heavy (no win) |
| 10k–50k DOM nodes | browser-bound | browser-bound (no win) |
| fine-grained high-frequency UI | weak | strong ✅ |

Million will NOT fix bad state patterns, beat browser layout/paint limits, or speed up
brute-force full-dataset mutation. It WILL reduce unnecessary re-renders and shine in
localized, high-frequency, small updates.

---

## File Reference

| File | Role |
|------|------|
| `app/src/App.tsx` | Renders both Million demos stacked |
| `app/src/MillionTicker.tsx` | `block()` demo — primitive-prop island; no `key`; FC cast |
| `app/src/MillionList.tsx` | `<For>` demo — large list, children auto-blocked |
| `app/vite.config.ts` | `million.vite({ auto: true })` build-time compiler |
| `knowledge/index.md` | Learning log |
| `knowledge/POC_LEAD_REPORT.md` | Lead summary + boundary + what's shallow |
