import { Hono } from "hono"
import { layout } from "../templates/layout.ts"

export const triggers = new Hono()

triggers.get("/experiments/triggers", (c) => {
  const body = `
    <section>
      <h2>hx-trigger Modifiers</h2>

      <div class="row">
        <label>delay:500ms (keyup)</label>
        <input type="text"
          hx-get="/fragments/triggers/keyup"
          hx-trigger="keyup delay:500ms"
          hx-target="#result-keyup"
          hx-swap="innerHTML"
          placeholder="type here...">
        <span id="result-keyup">—</span>
      </div>

      <div class="row">
        <label>throttle:1s (mousemove)</label>
        <div id="mousezone"
          hx-get="/fragments/triggers/mouse"
          hx-trigger="mousemove throttle:1s"
          hx-target="#result-mouse"
          hx-swap="innerHTML"
          style="width:200px;height:60px;border:2px dashed #666;display:flex;align-items:center;justify-content:center;">
          hover me
        </div>
        <span id="result-mouse">—</span>
      </div>

      <div class="row">
        <label>once modifier</label>
        <button hx-get="/fragments/triggers/once"
          hx-trigger="click once"
          hx-target="#result-once"
          hx-swap="innerHTML">
          Click me (once only)
        </button>
        <span id="result-once">—</span>
      </div>

      <div class="row">
        <label>every 2s (polling)</label>
        <div id="poll-toggle">
          <div id="poller"
            hx-get="/fragments/triggers/poll"
            hx-trigger="every 2s"
            hx-target="#result-poll"
            hx-swap="innerHTML">
          </div>
          <span id="result-poll">—</span>
          <button onclick="document.getElementById('poller').removeAttribute('hx-trigger'); htmx.process(document.getElementById('poller'))">Stop polling</button>
        </div>
      </div>

      <div class="row">
        <label>from: (listen on another element)</label>
        <button id="source-btn">Click source button</button>
        <div hx-get="/fragments/triggers/from"
          hx-trigger="click from:#source-btn"
          hx-target="#result-from"
          hx-swap="innerHTML">
        </div>
        <span id="result-from">—</span>
        <p class="note">The div listens for clicks on #source-btn. No hx-* on the button.</p>
      </div>

      <div class="row">
        <label>intersect (viewport entry)</label>
        <div style="height:200px;overflow:auto;border:1px solid #ccc;padding:10px;">
          <div style="height:180px;display:flex;align-items:center;justify-content:center;">scroll down to see</div>
          <div hx-get="/fragments/triggers/intersect"
            hx-trigger="intersect once"
            hx-target="#result-intersect"
            hx-swap="innerHTML">
            [intersect target]
          </div>
        </div>
        <span id="result-intersect">—</span>
      </div>

      <hr>
      <h2>Failure: concurrent triggers, same target</h2>
      <p class="note">Two buttons hit the same target simultaneously. Default: queued. Watch Network tab.</p>
      <button hx-get="/fragments/triggers/slow?label=A"
        hx-target="#result-concurrent">A (slow 1s)</button>
      <button hx-get="/fragments/triggers/slow?label=B"
        hx-target="#result-concurrent">B (slow 1s)</button>
      <div id="result-concurrent" class="result">—</div>
    </section>
  `
  return c.html(layout("03 — Triggers", body))
})

triggers.get("/fragments/triggers/keyup", (c) => {
  return c.html(`<span class="ok">keyup @ ${new Date().toISOString().slice(11,23)}</span>`)
})

triggers.get("/fragments/triggers/mouse", (c) => {
  return c.html(`<span class="ok">mousemove @ ${new Date().toISOString().slice(11,23)}</span>`)
})

triggers.get("/fragments/triggers/once", (c) => {
  return c.html(`<span class="ok">fired once @ ${new Date().toISOString().slice(11,19)}</span>`)
})

triggers.get("/fragments/triggers/poll", (c) => {
  return c.html(`<span class="ok">poll @ ${new Date().toISOString().slice(11,23)}</span>`)
})

triggers.get("/fragments/triggers/from", (c) => {
  return c.html(`<span class="ok">from:click @ ${new Date().toISOString().slice(11,19)}</span>`)
})

triggers.get("/fragments/triggers/intersect", (c) => {
  return c.html(`<span class="ok">intersected @ ${new Date().toISOString().slice(11,19)}</span>`)
})

triggers.get("/fragments/triggers/slow", async (c) => {
  const label = c.req.query("label") ?? "?"
  await new Promise((r) => setTimeout(r, 1000))
  return c.html(`<span class="ok">slow-${label} @ ${new Date().toISOString().slice(11,23)}</span>`)
})
