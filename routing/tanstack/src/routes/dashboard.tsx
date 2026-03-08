import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
    component: RouteComponent,
    beforeLoad: ({ context, location }) => {
        if (!context.auth.isAuthenticated) {
            throw redirect({
                to: '/',
                search: { redirect: location.href },
            })
        }
    },
})

function RouteComponent() {
    return (
        <div className="p-4">
            <h1>Dashboard Layout</h1>
            <hr />
            <Outlet /> {/* Nested routes (like /posts) render here */}
        </div>
    )
}