/**
 * Eden Treaty demo — consumes the Elysia app with full type inference.
 *
 * Run: bun src/eden/client.ts
 * Requires the server to be running: bun src/index.ts
 */

import { treaty } from "@elysiajs/eden";
import type { App } from "../index";

const api = treaty<App>("http://localhost:3000");

async function section(title: string) {
  console.log(`\n${"─".repeat(50)}`);
  console.log(`  ${title}`);
  console.log("─".repeat(50));
}

async function main() {
  console.log("\n=== Eden Treaty POC ===");

  // ── Meta routes ──────────────────────────────────────
  await section(".decorate() and .state()");

  const { data: uptime } = await api.uptime.get();
  console.log("Uptime (decorate):", uptime);

  const { data: stats } = await api.stats.get();
  console.log("Stats before calls (state):", stats);

  // ── Users (existing) ─────────────────────────────────
  await section("Users — existing routes");

  const { data: users } = await api.users.get();
  console.log("Users:", users);

  const { data: user1 } = await api.users({ id: 1 }).get();
  console.log("User 1:", user1);

  // ── Orders (macro API) ───────────────────────────────
  await section("Orders — macro API (auth: true / auth: 'admin')");

  // Public list — no token needed
  const { data: orders } = await api.orders.get();
  console.log("Orders (public):", orders);

  // Create without auth → 401 from macro, not guard
  const { error: noAuthErr } = await api.orders.post({ item: "Trackpad", qty: 1 });
  console.log("Create without auth:", noAuthErr?.status, noAuthErr?.value);

  // Create with user token — macro: auth: true passes
  const { data: newOrder, error: orderErr } = await api.orders.post(
    { item: "Trackpad", qty: 1 },
    { headers: { "x-token": "token-user", "x-request-id": "test-req-001" } },
  );
  if (orderErr) {
    console.log("Create error:", orderErr.status, orderErr.value);
  } else {
    console.log("Created order:", newOrder);
  }

  // Delete with user token → 403 from macro: auth: "admin"
  const { error: notAdminErr } = await api.orders({ id: 1 }).delete(undefined, {
    headers: { "x-token": "token-user" },
  });
  console.log("Delete as user (expect 403):", notAdminErr?.status, notAdminErr?.value);

  // Delete with admin token → 200
  const { data: deleted } = await api.orders({ id: 1 }).delete(undefined, {
    headers: { "x-token": "token-admin" },
  });
  console.log("Delete as admin:", deleted);

  // ── Validation ───────────────────────────────────────
  await section("Validation errors");

  const { error: validationErr } = await api.users.post(
    // @ts-expect-error intentionally bad body
    { name: "Bad" },
    { headers: { "x-token": "token-admin" } },
  );
  console.log("Missing email (expect 422):", validationErr?.status);

  const { error: negativeQty } = await api.orders.post(
    // @ts-expect-error negative qty violates minimum: 1
    { item: "Thing", qty: -1 },
    { headers: { "x-token": "token-user" } },
  );
  console.log("Negative qty (expect 422):", negativeQty?.status);

  // ── Products (existing) ──────────────────────────────
  await section("Products — existing routes");

  const { data: products } = await api.products.get();
  console.log("Products:", products);

  const { data: newProduct } = await api.products.post(
    { name: "Mouse", price: 49.99, stock: 100 },
    { headers: { "x-token": "token-user" } },
  );
  console.log("New product:", newProduct);

  // ── SSE ──────────────────────────────────────────────
  await section("SSE: generator streaming — fetching 3 events then closing");

  // Eden Treaty doesn't have native SSE support; use fetch directly.
  // Type safety is on the server side — the generator return type informs Swagger.
  const sseRes = await fetch("http://localhost:3000/events/ticker");
  const reader = sseRes.body!.getReader();
  const decoder = new TextDecoder();
  let ticksReceived = 0;

  while (ticksReceived < 3) {
    const { value, done } = await reader.read();
    if (done) break;
    const text = decoder.decode(value).trim();
    if (text) {
      console.log("SSE chunk:", text);
      ticksReceived++;
    }
  }
  await reader.cancel();
  console.log("(cancelled after 3 ticks)");

  // ── Final stats ──────────────────────────────────────
  await section("Final state check");

  const { data: finalStats } = await api.stats.get();
  console.log("Stats after all calls:", finalStats);

  console.log("\n=== Done ===\n");
}

main().catch(console.error);
