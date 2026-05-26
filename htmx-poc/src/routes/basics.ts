import { Hono } from "hono"
import { layout } from "../templates/layout.ts"

export const basics = new Hono()

const isHtmx = (c: { req: { header: (k: string) => string | undefined } }) =>
  c.req.header("HX-Request") === "true"

basics.get("/experiments/basics", (c) => {
  const body = `
    <section>
      <h2>hx-get / hx-post / hx-put / hx-delete</h2>
      <p>Check console (htmx.logAll) and Network tab for <code>HX-Request</code>, <code>HX-Target</code>, <code>HX-Trigger</code> headers.</p>

      <div class="row">
        <button id="btn-get"
          hx-get="/fragments/basics/get"
          hx-target="#result-get"
          hx-swap="innerHTML">
          GET request
        </button>
        <div id="result-get" class="result">—</div>
      </div>

      <div class="row">
        <button id="btn-post"
          hx-post="/fragments/basics/post"
          hx-target="#result-post"
          hx-swap="innerHTML">
          POST request
        </button>
        <div id="result-post" class="result">—</div>
      </div>

      <div class="row">
        <button id="btn-put"
          hx-put="/fragments/basics/put"
          hx-target="#result-put"
          hx-swap="innerHTML">
          PUT request
        </button>
        <div id="result-put" class="result">—</div>
      </div>

      <div class="row">
        <button id="btn-delete"
          hx-delete="/fragments/basics/delete"
          hx-target="#result-delete"
          hx-swap="innerHTML">
          DELETE request
        </button>
        <div id="result-delete" class="result">—</div>
      </div>

      <hr>
      <h2>Failure: 404 route</h2>
      <button hx-get="/fragments/basics/missing"
        hx-target="#result-404">
        Hit missing route (404)
      </button>
      <div id="result-404" class="result">—</div>
      <p class="note">Observe: htmx:responseError fires. Default behavior: no swap on 4xx.</p>
    </section>
  `
  return c.html(layout("01 — Basics", body))
})

basics.get("/fragments/basics/get", (c) => {
  const trigger = c.req.header("HX-Trigger") ?? "unknown"
  const target = c.req.header("HX-Target") ?? "unknown"
  return c.html(`<span class="ok">GET response — trigger: ${trigger}, target: ${target}</span>`)
})

basics.post("/fragments/basics/post", (c) => {
  return c.html(`<span class="ok">POST response @ ${new Date().toISOString()}</span>`)
})

basics.put("/fragments/basics/put", (c) => {
  return c.html(`<span class="ok">PUT response @ ${new Date().toISOString()}</span>`)
})

basics.delete("/fragments/basics/delete", (c) => {
  return c.html(`<span class="ok">DELETE response @ ${new Date().toISOString()}</span>`)
})
