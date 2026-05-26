import { Hono } from "hono"
import { layout } from "../templates/layout.ts"

export const oob = new Hono()

oob.get("/experiments/oob", (c) => {
  const body = `
    <section>
      <h2>Out-of-Band Swaps (hx-swap-oob)</h2>
      <p>One response from the server updates <em>multiple</em> targets atomically.</p>
      <p class="note">Primary swap target + OOB elements all processed from a single response. No N separate requests.</p>

      <div class="row">
        <button hx-get="/fragments/oob/multi"
          hx-target="#oob-primary"
          hx-swap="innerHTML">
          Trigger multi-target response
        </button>
      </div>

      <h3>Primary target</h3>
      <div id="oob-primary" class="result">—</div>

      <h3>OOB target A (updated via hx-swap-oob="true")</h3>
      <div id="oob-a" class="result">—</div>

      <h3>OOB target B (updated via hx-swap-oob="innerHTML:#oob-b")</h3>
      <div id="oob-b" class="result">—</div>

      <hr>
      <h2>Failure: OOB target missing from DOM</h2>
      <button hx-get="/fragments/oob/missing-target"
        hx-target="#oob-primary2"
        hx-swap="innerHTML">
        OOB to #does-not-exist
      </button>
      <div id="oob-primary2" class="result">—</div>
      <p class="note">Primary swaps fine. OOB element for #does-not-exist is silently discarded.</p>

      <hr>
      <h2>OOB with delete strategy</h2>
      <div id="oob-delete-target" class="result" style="background:#fcc">I will be deleted</div>
      <button hx-get="/fragments/oob/delete-oob"
        hx-target="#oob-primary3"
        hx-swap="innerHTML">
        Delete #oob-delete-target via OOB
      </button>
      <div id="oob-primary3" class="result">—</div>
    </section>
  `
  return c.html(layout("04 — Out-of-Band Swaps", body))
})

oob.get("/fragments/oob/multi", (c) => {
  const ts = new Date().toISOString().slice(11, 19)
  return c.html(`
    <span class="ok">primary @ ${ts}</span>
    <div id="oob-a" hx-swap-oob="true"><span class="ok">OOB-A @ ${ts}</span></div>
    <div id="oob-b" hx-swap-oob="innerHTML:#oob-b"><span class="ok">OOB-B @ ${ts}</span></div>
  `)
})

oob.get("/fragments/oob/missing-target", (c) => {
  const ts = new Date().toISOString().slice(11, 19)
  return c.html(`
    <span class="ok">primary2 @ ${ts}</span>
    <div id="does-not-exist" hx-swap-oob="true"><span class="warn">this will be dropped</span></div>
  `)
})

oob.get("/fragments/oob/delete-oob", (c) => {
  const ts = new Date().toISOString().slice(11, 19)
  return c.html(`
    <span class="ok">primary3 @ ${ts}</span>
    <div id="oob-delete-target" hx-swap-oob="delete"></div>
  `)
})
