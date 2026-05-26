import { Hono } from "hono"
import { layout } from "../templates/layout.ts"

export const failures = new Hono()

failures.get("/experiments/failures", (c) => {
  const body = `
    <section>
      <h2>10 — Failure Modes & Edge Cases</h2>
      <p class="note">All paths here are failure paths. Observe <code>htmx:responseError</code> and <code>htmx:sendError</code> in console (htmx.logAll).</p>

      <script>
        document.addEventListener("htmx:responseError", (e) => {
          console.error("[htmx:responseError]", e.detail)
          document.getElementById("event-log").insertAdjacentHTML("afterbegin",
            \`<div class="warn">htmx:responseError — status: \${e.detail.xhr?.status}</div>\`)
        })
        document.addEventListener("htmx:sendError", (e) => {
          console.error("[htmx:sendError]", e.detail)
          document.getElementById("event-log").insertAdjacentHTML("afterbegin",
            \`<div class="warn">htmx:sendError — network failure</div>\`)
        })
      </script>

      <h3>Event Log</h3>
      <div id="event-log" class="result log" style="height:120px;overflow:auto;"></div>

      <hr>

      <h3>F1 — 404 Not Found</h3>
      <button hx-get="/fragments/failures/not-found" hx-target="#f1">Hit 404</button>
      <div id="f1" class="result">—</div>
      <p class="note">HTMX default: no swap on 4xx. htmx:responseError fires.</p>

      <h3>F2 — 422 Unprocessable (swap on error)</h3>
      <button hx-get="/fragments/failures/validation-error"
        hx-target="#f2"
        hx-swap="innerHTML"
        hx-target-422="#f2"
        hx-swap-422="innerHTML">
        Trigger 422
      </button>
      <div id="f2" class="result">—</div>
      <p class="note">Use <code>htmx.config.responseHandling</code> or response-error event to swap on 4xx. Default: no swap.</p>

      <h3>F3 — 500 Server Error</h3>
      <button hx-get="/fragments/failures/server-error" hx-target="#f3">Hit 500</button>
      <div id="f3" class="result">—</div>

      <h3>F4 — Malformed HTML response</h3>
      <button hx-get="/fragments/failures/malformed"
        hx-target="#f4"
        hx-swap="innerHTML">
        Malformed HTML
      </button>
      <div id="f4" class="result">—</div>
      <p class="note">Browser parser corrects malformed HTML. Most malformed fragments survive and render. Unclosed tags get auto-closed.</p>

      <h3>F5 — hx-disable (disables HTMX on subtree)</h3>
      <div hx-disable>
        <button hx-get="/fragments/basics/get" hx-target="#f5">This button is HTMX-disabled</button>
      </div>
      <div id="f5" class="result">—</div>
      <p class="note"><code>hx-disable</code> on parent prevents HTMX from processing descendants. Button click does nothing.</p>

      <h3>F6 — Race Condition + hx-sync</h3>
      <p class="note">Default (no hx-sync): requests queue. With hx-sync="this:replace" last request cancels in-flight.</p>
      <div class="row">
        <button hx-get="/fragments/triggers/slow?label=Race-A"
          hx-target="#f6"
          hx-sync="this:replace">
          Race A (replace)
        </button>
        <button hx-get="/fragments/triggers/slow?label=Race-B"
          hx-target="#f6"
          hx-sync="this:replace">
          Race B (replace)
        </button>
      </div>
      <div id="f6" class="result">—</div>

      <h3>F7 — CSP: Scripts in swapped HTML</h3>
      <button hx-get="/fragments/failures/script-injection"
        hx-target="#f7"
        hx-swap="innerHTML">
        Swap HTML with inline script
      </button>
      <div id="f7" class="result">—</div>
      <p class="note">By default <code>htmx.config.allowScriptTags = false</code>. Scripts in swapped HTML are not executed. Toggle in console to test.</p>
    </section>
  `
  return c.html(layout("10 — Failures", body))
})

failures.get("/fragments/failures/not-found", (c) => c.html("<p>not found</p>", 404))
failures.get("/fragments/failures/validation-error", (c) => c.html("<p class='warn'>validation failed</p>", 422))
failures.get("/fragments/failures/server-error", (c) => c.html("<p class='warn'>internal server error</p>", 500))
failures.get("/fragments/failures/malformed", (c) =>
  c.html(`<div class="ok">Malformed: <b>unclosed bold <i>unclosed italic <div>nested`)
)
failures.get("/fragments/failures/script-injection", (c) =>
  c.html(`<span class="ok">fragment content</span><script>document.title = "PWNED"</script>`)
)
