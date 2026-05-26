import { Hono } from "hono"
import { serveStatic } from "hono/bun"
import { logger } from "hono/logger"
import { basics } from "./routes/basics.ts"
import { swaps } from "./routes/swaps.ts"
import { triggers } from "./routes/triggers.ts"
import { oob } from "./routes/oob.ts"
import { indicators } from "./routes/indicators.ts"
import { history } from "./routes/history.ts"
import { sse } from "./routes/sse.ts"
import { ws, wsHandler } from "./routes/ws.ts"
import { extensions } from "./routes/extensions.ts"
import { failures } from "./routes/failures.ts"
import { layout } from "./templates/layout.ts"

const app = new Hono()

app.use("*", logger())
app.use("/styles.css", serveStatic({ path: "./public/styles.css" }))
app.use("/htmx.js", serveStatic({ path: "./public/htmx.js" }))

app.route("/", basics)
app.route("/", swaps)
app.route("/", triggers)
app.route("/", oob)
app.route("/", indicators)
app.route("/", history)
app.route("/", sse)
app.route("/", ws)
app.route("/", extensions)
app.route("/", failures)

app.get("/", (c) => {
  const body = `
    <section>
      <p>Hypermedia-Driven Application POC. Each experiment explores HTMX internals from a different angle.</p>
      <p class="note">Console has <code>htmx.logAll()</code> active. Open DevTools to see all HTMX events.</p>

      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left;padding:6px;border-bottom:1px solid #333;">#</th>
            <th style="text-align:left;padding:6px;border-bottom:1px solid #333;">Experiment</th>
            <th style="text-align:left;padding:6px;border-bottom:1px solid #333;">Core concept</th>
            <th style="text-align:left;padding:6px;border-bottom:1px solid #333;">Failure tested</th>
          </tr>
        </thead>
        <tbody>
          ${[
            ["basics", "01 Basics", "hx-get/post/put/delete, headers", "404 missing route"],
            ["swaps", "02 Swap Strategies", "All 8 hx-swap modes + settlement", "Swap to detached element"],
            ["triggers", "03 Triggers", "delay, throttle, once, from, intersect, every", "Concurrent requests same target"],
            ["oob", "04 OOB Swaps", "hx-swap-oob multi-target", "OOB target missing from DOM"],
            ["indicators", "05 Indicators", "hx-indicator class lifecycle", "Server hang / infinite load"],
            ["history", "06 History", "hx-push-url, back button, localStorage cache", "Stale cache restore"],
            ["sse", "07 SSE", "sse-connect, sse-swap, reconnect", "Server kills stream"],
            ["ws", "08 WebSockets", "ws-connect, ws-send, bidirectional", "Server closes socket"],
            ["extensions", "09 Extensions", "hx-boost, json-enc, preload", "json-enc to urlencoded endpoint"],
            ["failures", "10 Failures", "responseError, sendError, CSP, race", "All paths are failure paths"],
          ].map(([slug, name, concept, failure]) => `
            <tr style="border-bottom:1px solid #222;">
              <td style="padding:6px;"><a href="/experiments/${slug}">${name}</a></td>
              <td style="padding:6px;color:#888;font-size:0.85em;">${name}</td>
              <td style="padding:6px;font-size:0.85em;">${concept}</td>
              <td style="padding:6px;color:#fca5a5;font-size:0.85em;">${failure}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </section>
  `
  return c.html(layout("HTMX POC", body))
})

const PORT = 3001

export default {
  port: PORT,
  fetch: app.fetch,
  websocket: wsHandler,
}

console.log(`HTMX POC running → http://localhost:${PORT}`)
