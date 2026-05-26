import { Hono } from "hono"
import { layout } from "../templates/layout.ts"

export const swaps = new Hono()

const strategies = ["innerHTML", "outerHTML", "beforebegin", "afterbegin", "beforeend", "afterend", "delete", "none"] as const

swaps.get("/experiments/swaps", (c) => {
  const rows = strategies.map((s) => `
    <div class="swap-row" id="swap-row-${s}">
      <code>${s}</code>
      <button
        hx-get="/fragments/swaps/${s}"
        hx-target="#swap-target-${s}"
        hx-swap="${s}">
        Apply ${s}
      </button>
      <div class="swap-zone" id="swap-target-${s}">
        <span class="original">[ original content ]</span>
      </div>
    </div>
  `).join("\n")

  const body = `
    <section>
      <h2>All 8 hx-swap Strategies</h2>
      <p>Watch Elements tab in DevTools. Each button applies a different swap to its target div.</p>
      <p class="note">Settlement: after swap, HTMX adds <code>.htmx-settling</code> class, removes it after CSS transition (see styles.css — htmx-settling has outline).</p>
      ${rows}

      <hr>
      <h2>Failure: swap onto detached element</h2>
      <button hx-get="/fragments/swaps/innerHTML"
        hx-target="#i-dont-exist"
        hx-swap="innerHTML">
        Swap to #i-dont-exist
      </button>
      <p class="note">Target not in DOM. Request fires, response returns, HTMX silently drops the swap.</p>
    </section>
  `
  return c.html(layout("02 — Swap Strategies", body))
})

swaps.get("/fragments/swaps/:strategy", (c) => {
  const s = c.req.param("strategy")
  const ts = new Date().toISOString().slice(11, 19)

  if (s === "delete") {
    return c.html(``)
  }
  if (s === "none") {
    return c.html(`<!-- none swap: response processed, DOM unchanged -->`)
  }

  return c.html(`<span class="swapped">[${s} @ ${ts}]</span>`)
})
