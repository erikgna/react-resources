import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { userRoutes } from "./routes/users";
import { productRoutes } from "./routes/products";

const connectedClients = new Set<string>();

export const app = new Elysia()

  // --- Global plugins ---
  .use(cors())
  .use(swagger({
    documentation: {
      info: { title: "Elysia JS POC", version: "1.0.0" },
    },
  }))

  // --- Global lifecycle hooks ---
  .onRequest(({ request }) => {
    // Runs before everything — good for rate limiting, tracing
    console.log(`→ ${request.method} ${new URL(request.url).pathname}`);
  })

  .onError(({ code, error, set }) => {
    // Centralized error handling — Elysia calls this for validation errors too
    if (code === "VALIDATION") {
      set.status = 422;
      return {
        code: "VALIDATION_ERROR",
        message: error.message,
        status: 422,
      };
    }
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { code: "NOT_FOUND", message: "Route not found", status: 404 };
    }
    console.error(`[error] ${code}:`, error);
    set.status = 500;
    return { code: "INTERNAL_ERROR", message: "Internal server error", status: 500 };
  })

  // --- Health check ---
  .get("/", () => ({ status: "ok", docs: "/swagger" }))

  // --- Route groups ---
  .use(userRoutes)
  .use(productRoutes)

  // --- WebSocket: live chat demo ---
  // Shows open/message/close handlers + ws.publish for broadcast
  .ws("/ws/chat", {
    open(ws) {
      const id = String(ws.id);
      connectedClients.add(id);
      ws.subscribe("chat");
      ws.publish("chat", { type: "join", id, clients: connectedClients.size });
      console.log(`[ws] client ${id} connected (total: ${connectedClients.size})`);
    },

    message(ws, message) {
      // message is typed as unknown — cast after validating in a real app
      const payload = typeof message === "string" ? message : JSON.stringify(message);
      console.log(`[ws] message from ${ws.id}: ${payload}`);
      // Broadcast to all subscribers including sender
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

export type App = typeof app;
