import { t } from "elysia";

export const UserSchema = t.Object({
  id: t.Number(),
  name: t.String(),
  email: t.String({ format: "email" }),
  role: t.Union([t.Literal("admin"), t.Literal("user")]),
});

export const CreateUserSchema = t.Object({
  name: t.String({ minLength: 1 }),
  email: t.String({ format: "email" }),
  role: t.Optional(t.Union([t.Literal("admin"), t.Literal("user")])),
});

export const UpdateUserSchema = t.Partial(CreateUserSchema);

export const ProductSchema = t.Object({
  id: t.Number(),
  name: t.String(),
  price: t.Number({ minimum: 0 }),
  stock: t.Number({ minimum: 0 }),
});

export const CreateProductSchema = t.Object({
  name: t.String({ minLength: 1 }),
  price: t.Number({ minimum: 0 }),
  stock: t.Optional(t.Number({ minimum: 0 })),
});

export const ApiErrorSchema = t.Object({
  code: t.String(),
  message: t.String(),
  status: t.Number(),
});

export type User = typeof UserSchema.static;
export type CreateUser = typeof CreateUserSchema.static;
export type Product = typeof ProductSchema.static;
export type CreateProduct = typeof CreateProductSchema.static;
