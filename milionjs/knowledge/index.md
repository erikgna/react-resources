Million.js is a build-time compiler for React. It does not replace React — it rewrites
eligible components during bundling into "Blocks" that bypass React's virtual-DOM diff.

React's model: build a virtual tree on every render, compare old vs new, apply the patches.
Million's model: split the component into static parts (compiled once into a template) and
dynamic parts ("holes"). On update it dirty-checks only the holes and writes the changed
DOM nodes directly. No tree walk, no reconciliation.

Pros
- Updates are very fast — only changed nodes touch the DOM.
- Strong for large lists, high-frequency updates, dashboards/real-time UIs.

Cons
- You must think about static vs dynamic structure.
- Small community; some edge cases misbehave.
- Depends on build-time compilation (the Vite plugin) for the full effect.

The two APIs this POC demonstrates (one component each):

  block()  — wraps ONE component into a hyper-optimized island. Best for a stable structure
             that updates frequently with PRIMITIVE props (string/number/boolean), because
             the dirty-check is shallow Object.is per prop.
             File: MillionTicker.tsx — a value changing ~60×/sec.

  <For>    — drop-in replacement for {items.map()}. Auto-blocks each child internally.
             Best for large lists (100+). Do NOT wrap children in block() yourself — <For>
             already does it; double-blocking breaks Million.
             File: MillionList.tsx — 1,000 rows, one row toggled per frame.

The core rule:
Million is NOT magic. It will not fix bad state patterns or beat browser layout/paint
limits, and on brute-force full-dataset mutation every frame it shows no advantage (worst
case for any renderer). It WINS on LOCALIZED, high-frequency, small updates — exactly where
React still walks the whole list to find the one change Million already knows.

Two gotchas the code exposes:
1. A changing `key` on a block() component remounts it every frame and destroys the in-place
   patch. Keep identity stable (no per-frame key). See MillionTicker.tsx.
2. Inside <For>, children must stay plain. <For> auto-blocks; manual block() double-blocks.
