/**
 * Eden Treaty demo — consumes the Elysia app with full type inference.
 *
 * Run: bun src/eden/client.ts
 * Requires the server to be running: bun src/index.ts
 *
 * Eden reads the App type exported from index.ts and infers:
 *   - URL structure from route definitions
 *   - Request body/param/query shapes
 *   - Response types per route
 *
 * Zero runtime overhead — it's just a typed fetch wrapper.
 */

import { treaty } from "@elysiajs/eden";
import type { App } from "../index";

const api = treaty<App>("http://localhost:3000");

async function main() {
  console.log("\n=== Eden Treaty POC ===\n");

  // Health check via plain fetch — Eden Treaty maps `/` to `api[""].get()`
  // but root index routes are easier to verify outside Eden
  const healthRaw = await fetch("http://localhost:3000/").then((r) => r.json());
  console.log("Health:", healthRaw);

  // --- List users (typed as User[]) ---
  const { data: users, error: usersErr } = await api.users.get();
  if (usersErr) throw usersErr;
  console.log("\nUsers:", users);

  // If you hover `users` in your editor, you'll see: User[] | null
  // TypeScript knows the exact shape — no manual type annotation needed

  // --- Get single user (typed response: User or error object) ---
  const { data: user1 } = await api.users({ id: 1 }).get();
  console.log("\nUser 1:", user1);

  // --- Create user without auth → expect 401 ---
  const { data: noAuth, error: authErr } = await api.users.post({
    name: "Bob",
    email: "bob@example.com",
  });
  console.log("\nCreate without auth:", authErr?.status, authErr?.value ?? noAuth);

  // --- Create user with auth (token-admin) ---
  const { data: created, error: createErr } = await api.users.post(
    { name: "Bob", email: "bob@example.com", role: "user" },
    { headers: { "x-token": "token-admin" } },
  );
  if (createErr) {
    console.log("\nCreate error:", createErr.status, createErr.value);
  } else {
    console.log("\nCreated user:", created);
  }

  // --- Validation error: missing required email ---
  const { error: validationErr } = await api.users.post(
    // @ts-expect-error intentionally sending bad body to test validation
    { name: "Bad User" },
    { headers: { "x-token": "token-admin" } },
  );
  console.log("\nValidation error (expected 422):", validationErr?.status, validationErr?.value);

  // --- Products (public read) ---
  const { data: products } = await api.products.get();
  console.log("\nProducts:", products);

  // --- Create product with user token ---
  const { data: newProduct } = await api.products.post(
    { name: "Mouse", price: 49.99, stock: 100 },
    { headers: { "x-token": "token-user" } },
  );
  console.log("\nNew product:", newProduct);

  console.log("\n=== Done ===\n");
}

main().catch(console.error);
