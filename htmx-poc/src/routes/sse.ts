import { Hono } from "hono"
import { streamSSE } from "hono/streaming"
import { layout } from "../templates/layout.ts"

export const sse = new Hono()

sse.get("/experiments/sse", (c) => {
  const body = `
    <section>
      <h2>Server-Sent Events (SSE Extension)</h2>
      <p>HTMX SSE extension connects to <code>/sse</code> and swaps incoming event data into target.</p>
      <p class="note">Extension loaded via <code>hx-ext="sse"</code>. SSE connection is persistent; browser handles reconnect on drop.</p>

      <div hx-ext="sse"
        sse-connect="/sse"
        sse-swap="message"
        hx-target="#sse-output"
        hx-swap="beforeend">
        <div id="sse-output" class="result log" style="height:200px;overflow:auto;"></div>
      </div>

      <p class="note">
        Failure test: stop the server (<code>Ctrl+C</code>) and watch the browser attempt reconnect.<br>
        SSE reconnect is handled by the browser natively (with exponential backoff).<br>
        HTMX fires <code>htmx:sseError</code> and <code>htmx:sseClose</code> on disconnect.
      </p>
    </section>
  `
  return c.html(layout("07 — SSE", body))
})

sse.get("/sse", async (c) => {
  return streamSSE(c, async (stream) => {
    let counter = 0
    while (true) {
      const ts = new Date().toISOString().slice(11, 23)
      await stream.writeSSE({
        data: `<div class="ok">event #${++counter} @ ${ts}</div>`,
        event: "message",
      })
      await stream.sleep(1000)
    }
  })
})
