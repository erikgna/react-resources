import { Elysia, t } from "elysia";
import { authPlugin, requireAuth } from "../plugins/auth";
import {
  CreateProductSchema,
  ProductSchema,
  type Product,
} from "../schemas";

let products: Product[] = [
  { id: 1, name: "Keyboard", price: 120.0, stock: 50 },
  { id: 2, name: "Monitor", price: 450.0, stock: 12 },
];
let nextId = 3;

export const productRoutes = new Elysia({ prefix: "/products" })
  .use(authPlugin)

  // afterHandle hook scoped to this route group only — transforms all responses
  // to include a metadata wrapper, showing how afterHandle can reshape output
  .onAfterHandle(({ response, set }) => {
    // Only wrap plain object/array responses, not error returns
    if (response !== null && typeof response === "object" && !("code" in (response as object))) {
      set.headers["x-source"] = "products-route";
    }
  })

  // beforeHandle scoped hook — logs product route access
  .onBeforeHandle(({ request }) => {
    console.log(`[products] ${request.method} ${new URL(request.url).pathname}`);
  })

  .get("/", () => products, {
    response: t.Array(ProductSchema),
    detail: { summary: "List products (public)", tags: ["products"] },
  })

  .get("/:id", ({ params, set }) => {
    const product = products.find((p) => p.id === Number(params.id));
    if (!product) {
      set.status = 404;
      return { code: "NOT_FOUND", message: `Product ${params.id} not found`, status: 404 };
    }
    return product;
  }, {
    params: t.Object({ id: t.Numeric() }),
    detail: { summary: "Get product by ID (public)", tags: ["products"] },
  })

  // Protected CRUD via guard — requireAuth runs before all handlers inside
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Elysia 1.x guard doesn't propagate derived context to beforeHandle type
  .guard({ beforeHandle: [requireAuth as any] }, (app) =>
    app
      .post("/", ({ body }) => {
        const created: Product = {
          id: nextId++,
          name: body.name,
          price: body.price,
          stock: body.stock ?? 0,
        };
        products.push(created);
        return created;
      }, {
        body: CreateProductSchema,
        response: ProductSchema,
        detail: { summary: "Create product (auth required)", tags: ["products"] },
      })

      .delete("/:id", ({ params, set }) => {
        const idx = products.findIndex((p) => p.id === Number(params.id));
        if (idx === -1) {
          set.status = 404;
          return { code: "NOT_FOUND", message: `Product ${params.id} not found`, status: 404 };
        }
        const [removed] = products.splice(idx, 1);
        return { deleted: removed };
      }, {
        params: t.Object({ id: t.Numeric() }),
        detail: { summary: "Delete product (auth required)", tags: ["products"] },
      }),
  );
