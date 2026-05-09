import { Elysia } from "elysia";

type AuthUser = {
  id: number;
  name: string;
  role: "admin" | "user";
};

// Simulated token store — in real apps: JWT decode or DB lookup
const TOKENS: Record<string, AuthUser> = {
  "token-admin": { id: 1, name: "Erik", role: "admin" },
  "token-user": { id: 2, name: "Alice", role: "user" },
};

// Named plugin — Elysia deduplicates by name so registering this in multiple
// route files won't run derive() twice on the same request
export const authPlugin = new Elysia({ name: "auth" }).derive(
  { as: "scoped" },
  ({ headers }) => {
    const token = headers["x-token"] ?? "";
    const user = TOKENS[token] ?? null;
    return { user };
  },
);

// Reusable beforeHandle guard — throws if no valid user
export function requireAuth({
  user,
  set,
}: {
  user: AuthUser | null;
  set: { status: number };
}) {
  if (!user) {
    set.status = 401;
    return { code: "UNAUTHORIZED", message: "Missing or invalid X-Token header", status: 401 };
  }
}

// Admin-only variant
export function requireAdmin({
  user,
  set,
}: {
  user: AuthUser | null;
  set: { status: number };
}) {
  if (!user) {
    set.status = 401;
    return { code: "UNAUTHORIZED", message: "Missing or invalid X-Token header", status: 401 };
  }
  if (user.role !== "admin") {
    set.status = 403;
    return { code: "FORBIDDEN", message: "Admin role required", status: 403 };
  }
}
