import { Hono } from "hono"
import { layout } from "../templates/layout.ts"

export const history = new Hono()

const isHtmx = (c: { req: { header: (k: string) => string | undefined } }) =>
  c.req.header("HX-Request") === "true"

history.get("/experiments/history", (c) => {
  const body = `
    <section>
      <h2>hx-push-url + Back Button</h2>
      <p>HTMX pushes URL to history and caches DOM snapshot in <code>localStorage['htmx-history-cache']</code>.</p>

      <div class="row">
        <button hx-get="/fragments/history/page-a"
          hx-target="#history-content"
          hx-swap="innerHTML"
          hx-push-url="/history/page-a">
          Navigate to Page A
        </button>
        <button hx-get="/fragments/history/page-b"
          hx-target="#history-content"
          hx-swap="innerHTML"
          hx-push-url="/history/page-b">
          Navigate to Page B
        </button>
        <button hx-get="/fragments/history/page-c"
          hx-target="#history-content"
          hx-swap="innerHTML"
          hx-replace-url="/history/page-c">
          Replace URL (Page C)
        </button>
      </div>

      <div id="history-content" class="result" hx-history-elt>
        <p>Initial content. Navigate above, then hit browser Back.</p>
      </div>

      <p class="note">After navigating: press browser Back. Watch Network tab for <code>HX-History-Restore-Request: true</code> header — HTMX sends this when restoring from cache.</p>
      <p class="note">Inspect <code>localStorage['htmx-history-cache']</code> in Application tab to see cached DOM.</p>

      <hr>
      <h2>hx-push-url with custom path</h2>
      <button hx-get="/fragments/history/custom"
        hx-target="#history-custom"
        hx-swap="innerHTML"
        hx-push-url="/my/custom/path">
        Push custom URL
      </button>
      <div id="history-custom" class="result">—</div>
      <p class="note">URL bar shows /my/custom/path but server only serves /fragments/history/custom.</p>
    </section>
  `
  return c.html(layout("06 — History & URL", body))
})

history.get("/fragments/history/page-a", (c) => {
  if (c.req.header("HX-History-Restore-Request")) {
    return c.html(layout("Page A (restored)", `<div id="history-content">Page A restored from history cache.</div>`))
  }
  return c.html(`<div><strong>Page A</strong> loaded @ ${new Date().toISOString().slice(11,19)}</div>`)
})

history.get("/fragments/history/page-b", (c) => {
  return c.html(`<div><strong>Page B</strong> loaded @ ${new Date().toISOString().slice(11,19)}</div>`)
})

history.get("/fragments/history/page-c", (c) => {
  return c.html(`<div><strong>Page C</strong> (replace-url) @ ${new Date().toISOString().slice(11,19)}</div>`)
})

history.get("/fragments/history/custom", (c) => {
  return c.html(`<div>Custom path content @ ${new Date().toISOString().slice(11,19)}</div>`)
})

history.get("/history/:page", (c) => {
  const page = c.req.param("page")
  const body = `<div id="history-content" hx-history-elt>Restored: ${page}</div>`
  return c.html(layout(`History — ${page}`, body))
})
