import { Elysia } from "elysia";
import { authPlugin, type AuthUser } from "./auth";

type AuthCtx = { user: AuthUser | null; set: { status: number } };

// Macro API — Elysia's killer differentiator.
// Each macro key maps to a route option. When Elysia sees { auth: true } on a route,
// it calls auth(true) and merges the returned MacroProperty (beforeHandle, etc.) into
// that specific route's lifecycle. Zero runtime cost after registration.
export const macroPlugin = new Elysia({ name: "macros" })
  .use(authPlugin)
  .macro({
    // auth: true  → any authenticated user
    // auth: "admin" → admin role required
    auth(level: true | "admin") {
      return {
        // ctx typed as any: Elysia's MacroProperty.beforeHandle uses a generic Singleton
        // that doesn't see authPlugin's derive at macro-definition time. Cast at use site.
        beforeHandle: (ctx: any) => {
          const { user, set } = ctx as AuthCtx;
          if (!user) {
            set.status = 401;
            return { code: "UNAUTHORIZED", message: "Auth required", status: 401 };
          }
          if (level === "admin" && user.role !== "admin") {
            set.status = 403;
            return { code: "FORBIDDEN", message: "Admin role required", status: 403 };
          }
        },
      };
    },
  });
