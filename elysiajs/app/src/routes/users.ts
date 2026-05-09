import { Elysia, t } from "elysia";
import { authPlugin, requireAdmin, requireAuth } from "../plugins/auth";
import {
  CreateUserSchema,
  UpdateUserSchema,
  UserSchema,
  type User,
} from "../schemas";

// In-memory store
let users: User[] = [
  { id: 1, name: "Erik", email: "erik@example.com", role: "admin" },
  { id: 2, name: "Alice", email: "alice@example.com", role: "user" },
];
let nextId = 3;

export const userRoutes = new Elysia({ prefix: "/users" })
  .use(authPlugin)

  // Public: list users
  .get("/", () => users, {
    response: t.Array(UserSchema),
    detail: { summary: "List all users", tags: ["users"] },
  })

  // Public: get single user
  .get("/:id", ({ params, set }) => {
    const user = users.find((u) => u.id === Number(params.id));
    if (!user) {
      set.status = 404;
      return { code: "NOT_FOUND", message: `User ${params.id} not found`, status: 404 };
    }
    return user;
  }, {
    params: t.Object({ id: t.Numeric() }),
    detail: { summary: "Get user by ID", tags: ["users"] },
  })

  // Protected: create user (any authenticated user)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Elysia 1.x guard doesn't propagate derived context to beforeHandle type
  .guard({ beforeHandle: [requireAuth as any] }, (app) =>
    app
      .post("/", ({ body, user }) => {
        const created: User = {
          id: nextId++,
          name: body.name,
          email: body.email,
          role: body.role ?? "user",
        };
        users.push(created);
        console.log(`[users] created by ${user!.name}:`, created);
        return created;
      }, {
        body: CreateUserSchema,
        response: UserSchema,
        detail: { summary: "Create user (auth required)", tags: ["users"] },
      })

      .put("/:id", ({ params, body, set, user }) => {
        const idx = users.findIndex((u) => u.id === Number(params.id));
        if (idx === -1) {
          set.status = 404;
          return { code: "NOT_FOUND", message: `User ${params.id} not found`, status: 404 };
        }
        users[idx] = { ...users[idx], ...body };
        console.log(`[users] updated by ${user!.name}:`, users[idx]);
        return users[idx];
      }, {
        params: t.Object({ id: t.Numeric() }),
        body: UpdateUserSchema,
        detail: { summary: "Update user (auth required)", tags: ["users"] },
      })

      // Admin-only: delete
      .delete("/:id", ({ params, set, user: _caller }) => {
        const idx = users.findIndex((u) => u.id === Number(params.id));
        if (idx === -1) {
          set.status = 404;
          return { code: "NOT_FOUND", message: `User ${params.id} not found`, status: 404 };
        }
        const [removed] = users.splice(idx, 1);
        return { deleted: removed };
      }, {
        beforeHandle: [requireAdmin as any],
        params: t.Object({ id: t.Numeric() }),
        detail: { summary: "Delete user (admin only)", tags: ["users"] },
      }),
  );
