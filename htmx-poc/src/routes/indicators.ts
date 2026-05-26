import { Hono } from "hono"
import { layout } from "../templates/layout.ts"

export const indicators = new Hono()

indicators.get("/experiments/indicators", (c) => {
  const body = `
    <section>
      <h2>hx-indicator + .htmx-indicator Lifecycle</h2>
      <p>HTMX adds <code>.htmx-request</code> to the triggering element and <code>.htmx-request</code> to the indicator during request. Removes both on settle.</p>
      <p class="note">Styles: <code>.htmx-indicator</code> is opacity:0 by default; <code>.htmx-request .htmx-indicator</code> or <code>.htmx-indicator.htmx-request</code> sets opacity:1.</p>

      <div class="row">
        <button hx-get="/fragments/indicators/slow"
          hx-target="#result-indicator"
          hx-indicator="#spinner-1">
          Slow request (1.5s)
        </button>
        <span id="spinner-1" class="htmx-indicator spinner">⏳ loading...</span>
        <div id="result-indicator" class="result">—</div>
      </div>

      <div class="row">
        <label>Self-indicator (button is its own indicator)</label>
        <button id="self-btn"
          hx-get="/fragments/indicators/slow"
          hx-target="#result-self"
          hx-indicator="#self-btn">
          Slow request (self-indicator)
        </button>
        <div id="result-self" class="result">—</div>
        <p class="note">Button gets .htmx-request class → use CSS to style it while loading.</p>
      </div>

      <hr>
      <h2>Failure: Indicator never clears (server hangs)</h2>
      <button hx-get="/fragments/indicators/hang"
        hx-target="#result-hang"
        hx-indicator="#spinner-hang">
        Hang request (no response)
      </button>
      <span id="spinner-hang" class="htmx-indicator spinner">⏳ hanging...</span>
      <div id="result-hang" class="result">—</div>
      <p class="note">Server holds connection open forever. Indicator stays visible until you close tab or abort.</p>
    </section>
  `
  return c.html(layout("05 — Indicators", body))
})

indicators.get("/fragments/indicators/slow", async (c) => {
  await new Promise((r) => setTimeout(r, 1500))
  return c.html(`<span class="ok">loaded @ ${new Date().toISOString().slice(11, 23)}</span>`)
})

indicators.get("/fragments/indicators/hang", (c) => {
  return new Promise<never>(() => {})
})
