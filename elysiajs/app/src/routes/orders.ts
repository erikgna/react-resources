import { Elysia, t } from "elysia";
import { authPlugin } from "../plugins/auth";
import { macroPlugin } from "../plugins/macros";

const OrderSchema = t.Object({
  id: t.Number(),
  item: t.String(),
  qty: t.Number({ minimum: 1 }),
  ownerId: t.Number(),
});

const CreateOrderSchema = t.Object({
  item: t.String({ minLength: 1 }),
  qty: t.Number({ minimum: 1 }),
});

type Order = typeof OrderSchema.static;

let orders: Order[] = [
  { id: 1, item: "Keyboard", qty: 1, ownerId: 1 },
  { id: 2, item: "Mouse", qty: 2, ownerId: 2 },
];
let nextId = 3;

export const orderRoutes = new Elysia({ prefix: "/orders" })
  .use(authPlugin)  // provides user context (deduped by name with users/products)
  .use(macroPlugin) // provides auth macro; shares authPlugin via name dedup

  // resolve() — runs in the beforeHandle phase (after schema validation).
  // Unlike derive() which runs in transform (before validation), resolve() sees
  // the validated body and can access typed request fields.
  // Use resolve() when you need validated data to build context (e.g. DB lookups).
  .resolve(({ headers }) => ({
    requestId: headers["x-request-id"] ?? crypto.randomUUID(),
  }))

  // Public: no auth option needed — macro is opt-in per route
  .get("/", () => orders, {
    response: t.Array(OrderSchema),
    detail: { summary: "List orders (public)", tags: ["orders"] },
  })

  // auth: true via macro — no .guard() wrapper required
  .post("/", ({ body, user, requestId, set }) => {
    const order: Order = {
      id: nextId++,
      item: body.item,
      qty: body.qty,
      ownerId: user!.id,
    };
    orders.push(order);
    set.headers["x-request-id"] = requestId;
    console.log(`[orders] created by user ${user!.id}: ${order.item}`);
    return order;
  }, {
    body: CreateOrderSchema,
    response: OrderSchema,
    auth: true,
    detail: { summary: "Create order (auth required)", tags: ["orders"] },
  })

  // auth: "admin" via macro — escalated role check, same clean syntax
  .delete("/:id", ({ params, set, requestId }) => {
    const idx = orders.findIndex((o) => o.id === Number(params.id));
    if (idx === -1) {
      set.status = 404;
      return { code: "NOT_FOUND", message: `Order ${params.id} not found`, status: 404 };
    }
    const [removed] = orders.splice(idx, 1);
    set.headers["x-request-id"] = requestId;
    return { deleted: removed };
  }, {
    auth: "admin",
    params: t.Object({ id: t.Numeric() }),
    detail: { summary: "Delete order (admin only)", tags: ["orders"] },
  });
