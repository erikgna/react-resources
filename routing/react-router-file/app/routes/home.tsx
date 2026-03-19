import { Link } from "react-router"; // [Declarative] Link — client-side navigation with prefetch
import type { Route } from "./+types/home";

// [Framework] meta() — sets <title> and <meta> tags for this route
export function meta({}: Route.MetaArgs) {
  return [
    { title: "React Router POC" },
    { name: "description", content: "POC covering all three React Router modes" },
  ];
}

const features = [
  {
    href: "/dashboard/posts",
    label: "/dashboard/posts",
    desc: "server loader · clientLoader · HydrateFallback · useNavigation · shouldRevalidate · Form (GET) · ErrorBoundary",
  },
  {
    href: "/dashboard/posts/1",
    label: "/dashboard/posts/1",
    desc: "dynamic params · action · useActionData · useFetcher · defer/Await · meta() from loader data",
  },
  {
    href: "/dashboard/posts/99",
    label: "/dashboard/posts/99",
    desc: "loader throws 404 Response → ErrorBoundary catches it",
  },
  {
    href: "/about",
    label: "/about",
    desc: "per-route links() · useLocation · useSearchParams · useNavigate",
  },
  {
    href: "/api/posts",
    label: "/api/posts",
    desc: "resource route — loader with no component, returns raw JSON",
  },
  {
    href: "/api/posts?filter=first",
    label: "/api/posts?filter=first",
    desc: "resource route with query param",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10 flex flex-col gap-3">
      <h1 className="text-2xl font-semibold mb-2">React Router POC</h1>
      <p className="text-sm text-gray-500 mb-4">
        Framework mode is a superset of Data and Declarative modes. All three are demonstrated here.
      </p>
      {features.map(f => (
        <div key={f.href} className="flex flex-col gap-0.5">
          <Link to={f.href} className="font-mono text-sm text-blue-600 hover:underline dark:text-blue-400">
            {f.label}
          </Link>
          <p className="text-xs text-gray-500">{f.desc}</p>
        </div>
      ))}
    </main>
  );
}
