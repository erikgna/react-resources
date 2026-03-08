import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("about", "routes/about.tsx"),
  // [Framework] layout() — wraps children with a shared UI without adding a URL segment
  layout("routes/dashboard.tsx", [
    route("dashboard/posts", "routes/dashboard.posts.tsx"),
    route("dashboard/posts/:postId", "routes/dashboard.posts.$postId.tsx"),
  ]),
  // [Framework] Resource route — no component, returns raw data over HTTP
  route("api/posts", "routes/api.posts.tsx"),
  // [Declarative] wildcard * route — catches any unmatched URL
  route("*", "routes/catchall.tsx"),
] satisfies RouteConfig;
