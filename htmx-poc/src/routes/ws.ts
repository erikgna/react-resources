import { Hono } from "hono"
import { createBunWebSocket } from "hono/bun"
import { layout } from "../templates/layout.ts"

const { upgradeWebSocket, websocket } = createBunWebSocket()

export const ws = new Hono()
export { websocket as wsHandler }

ws.get("/experiments/ws", (c) => {
  const body = `
    <section>
      <h2>WebSockets (WS Extension)</h2>
      <p>Bidirectional: form submit goes over WS, server pushes HTML fragment back.</p>
      <p class="note">Extension: <code>hx-ext="ws"</code>, <code>ws-connect="/ws"</code>, <code>ws-send</code> on form.</p>

      <div hx-ext="ws" ws-connect="/ws">
        <form ws-send id="ws-form">
          <input type="text" name="message" placeholder="type a message" required>
          <button type="submit">Send via WS</button>
        </form>
        <div id="ws-output" class="result log" style="height:200px;overflow:auto;"></div>
      </div>

      <p class="note">
        Failure: close server mid-stream. HTMX fires <code>htmx:wsClose</code>. <br>
        Check console (htmx.logAll) for event details.
      </p>
    </section>
  `
  return c.html(layout("08 — WebSockets", body))
})

ws.get(
  "/ws",
  upgradeWebSocket(() => {
    return {
      onMessage(event, ws) {
        let body = ""
        try {
          const data = JSON.parse(event.data.toString())
          body = data.message ?? event.data.toString()
        } catch {
          body = event.data.toString()
        }
        const ts = new Date().toISOString().slice(11, 19)
        ws.send(`
          <div id="ws-output" hx-swap-oob="beforeend">
            <div class="ok">server echo: "${body}" @ ${ts}</div>
          </div>
        `)
      },
      onClose() {
        console.log("[ws] client disconnected")
      },
      onError(event) {
        console.error("[ws] error", event)
      },
    }
  })
)
