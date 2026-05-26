import { Hono } from "hono"
import { layout } from "../templates/layout.ts"

export const extensions = new Hono()

extensions.get("/experiments/extensions", (c) => {
  const body = `
    <section>
      <h2>hx-boost</h2>
      <p><code>hx-boost="true"</code> on a parent intercepts all child <code>&lt;a&gt;</code> and <code>&lt;form&gt;</code> via AJAX instead of full page load.</p>
      <p class="note">Internally: <code>boostElement()</code> in htmx.js patches click/submit events. hx-get by contrast is wired directly to a single element's trigger.</p>

      <nav hx-boost="true">
        <a href="/experiments/basics">Go to Basics (boosted)</a>
        <a href="/experiments/swaps">Go to Swaps (boosted)</a>
      </nav>
      <p class="note">Above links load via AJAX — observe HX-Boosted: true header in Network tab. No full page reload.</p>

      <hr>
      <h2>json-enc Extension</h2>
      <p>Sends form data as JSON instead of form-urlencoded.</p>
      <div hx-ext="json-enc">
        <form hx-post="/fragments/extensions/json"
          hx-target="#result-json"
          hx-swap="innerHTML">
          <input type="text" name="username" placeholder="username" value="alice">
          <input type="number" name="age" placeholder="age" value="30">
          <button type="submit">Submit as JSON</button>
        </form>
      </div>
      <div id="result-json" class="result">—</div>

      <hr>
      <h2>Failure: json-enc with server expecting form-urlencoded</h2>
      <div hx-ext="json-enc">
        <form hx-post="/fragments/extensions/urlencoded-only"
          hx-target="#result-json-fail"
          hx-swap="innerHTML">
          <input type="text" name="field" value="test">
          <button type="submit">Submit JSON to urlencoded endpoint</button>
        </form>
      </div>
      <div id="result-json-fail" class="result">—</div>
      <p class="note">Server expects Content-Type: application/x-www-form-urlencoded, gets application/json. Observe how server responds.</p>

      <hr>
      <h2>preload Extension</h2>
      <p>Prefetches links on mouseenter (or mousedown for fast-click).</p>
      <div hx-ext="preload">
        <a href="/experiments/triggers" preload="mouseenter">Hover me → preloads triggers page</a>
      </div>
      <p class="note">Open Network tab → hover the link → see GET /experiments/triggers fire before you click.</p>
    </section>
  `
  return c.html(layout("09 — Extensions & Boost", body))
})

extensions.post("/fragments/extensions/json", async (c) => {
  const ct = c.req.header("Content-Type") ?? ""
  let body: unknown
  if (ct.includes("application/json")) {
    body = await c.req.json()
  } else {
    body = await c.req.parseBody()
  }
  return c.html(`<span class="ok">received: ${JSON.stringify(body)}</span>`)
})

extensions.post("/fragments/extensions/urlencoded-only", async (c) => {
  const ct = c.req.header("Content-Type") ?? ""
  if (!ct.includes("application/x-www-form-urlencoded")) {
    return c.html(`<span class="warn">expected urlencoded, got: ${ct}</span>`, 415)
  }
  const body = await c.req.parseBody()
  return c.html(`<span class="ok">urlencoded: ${JSON.stringify(body)}</span>`)
})
