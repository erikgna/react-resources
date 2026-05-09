import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { userRoutes } from "./routes/users";
import { productRoutes } from "./routes/products";
import { orderRoutes } from "./routes/orders";

const connectedClients = new Set<string>();

export const app = new Elysia()

  // --- Global plugins ---
  .use(cors())
  .use(swagger({
    documentation: {
      info: { title: "Elysia JS POC", version: "1.0.0" },
    },
  }))

  // --- .state() — mutable app-level store, typed and shared across all routes ---
  // Access via context.store in any handler or lifecycle hook
  .state("requestCount", 0)
  .state("errors", 0)

  // --- .decorate() — injects an immutable constant/helper into every context ---
  // Differs from .state(): decorate is read-only, set once at startup
  .decorate("startTime", Date.now())

  // --- Global lifecycle hooks ---
  .onRequest(({ request, store }) => {
    store.requestCount++;
    console.log(`→ ${request.method} ${new URL(request.url).pathname} (req #${store.requestCount})`);
  })

  .onError(({ code, error, set, store }) => {
    if (code === "VALIDATION") {
      set.status = 422;
      return { code: "VALIDATION_ERROR", message: error.message, status: 422 };
    }
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { code: "NOT_FOUND", message: "Route not found", status: 404 };
    }
    store.errors++;
    console.error(`[error] ${code}:`, error);
    set.status = 500;
    return { code: "INTERNAL_ERROR", message: "Internal server error", status: 500 };
  })

  // --- Introspection routes using .state() and .decorate() ---
  .get("/", () => ({ status: "ok", docs: "/swagger" }))

  // store values are live — reflects actual runtime counts
  .get("/stats", ({ store }) => ({
    requestCount: store.requestCount,
    errors: store.errors,
  }), {
    detail: { summary: "Live request counter (reads .state())", tags: ["meta"] },
  })

  // startTime is from .decorate() — immutable, set at startup
  .get("/uptime", ({ startTime }) => ({
    uptimeMs: Date.now() - startTime,
    startedAt: new Date(startTime).toISOString(),
  }), {
    detail: { summary: "Server uptime (reads .decorate())", tags: ["meta"] },
  })

  // --- SSE: generator function streaming ---
  // Elysia detects async generators and streams the response.
  // Each yield sends a chunk; Bun keeps the connection open between yields.
  // Client receives chunks as they arrive — no polling needed.
  .get("/events/ticker", async function* () {
    for (let i = 1; i <= 5; i++) {
      yield `data: ${JSON.stringify({ tick: i, time: new Date().toISOString() })}\n\n`;
      await Bun.sleep(1000);
    }
  }, {
    detail: { summary: "SSE: 5 ticks at 1s intervals (generator streaming)", tags: ["events"] },
  })

  // --- Route groups ---
  .use(userRoutes)
  .use(productRoutes)
  .use(orderRoutes)

  // --- WebSocket: live chat demo ---
  .ws("/ws/chat", {
    open(ws) {
      const id = String(ws.id);
      connectedClients.add(id);
      ws.subscribe("chat");
      ws.publish("chat", { type: "join", id, clients: connectedClients.size });
      console.log(`[ws] client ${id} connected (total: ${connectedClients.size})`);
    },

    message(ws, message) {
      const payload = typeof message === "string" ? message : JSON.stringify(message);
      console.log(`[ws] message from ${ws.id}: ${payload}`);
      ws.publish("chat", { type: "message", from: String(ws.id), text: payload });
    },

    close(ws) {
      const id = String(ws.id);
      connectedClients.delete(id);
      ws.publish("chat", { type: "leave", id, clients: connectedClients.size });
      console.log(`[ws] client ${id} disconnected (total: ${connectedClients.size})`);
    },
  })

  .listen(3000);

console.log(`Elysia running at http://localhost:3000`);
console.log(`Swagger UI at  http://localhost:3000/swagger`);
console.log(`WebSocket at   ws://localhost:3000/ws/chat`);
console.log(`SSE ticker at  http://localhost:3000/events/ticker`);

export type App = typeof app;
