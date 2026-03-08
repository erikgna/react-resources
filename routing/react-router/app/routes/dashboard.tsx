import { Link, NavLink, Outlet, redirect } from "react-router";
import type { Route } from "./+types/dashboard";

const isAuthenticated = true;

// [Framework] loader runs on the SERVER before the component renders
// [Data] redirect() from loader — server-side auth guard
export async function loader({}: Route.LoaderArgs) {
  if (!isAuthenticated) {
    throw redirect("/?reason=unauthenticated");
  }
  return { username: "admin" };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  return (
    // [Declarative] Outlet — renders the matched nested child route
    <div className="flex min-h-[calc(100vh-45px)]">
      <aside className="w-48 shrink-0 border-r border-gray-200 p-4 dark:border-gray-800">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
          Dashboard
        </p>
        <p className="mb-3 text-xs text-gray-400">user: {loaderData.username}</p>
        <nav className="flex flex-col gap-1">
          {/* [Declarative] NavLink in sidebar */}
          <NavLink
            to="/dashboard/posts"
            className={({ isActive }) =>
              `text-sm ${isActive ? "text-gray-900 font-medium dark:text-white" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`
            }
          >
            Posts
          </NavLink>
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
