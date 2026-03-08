import { Link } from "@tanstack/react-router";

export default function NotFound() {
    return (
        <div className="page-wrap px-4 pt-10 flex flex-col gap-3">
            <h1 className="text-2xl font-semibold">404 — Page not found</h1>
            <Link to="/" className="text-[var(--lagoon-deep)] hover:underline">← Go home</Link>
        </div>
    )
}