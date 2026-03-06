import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

const isAuthenticated = true;

export const Route = createFileRoute('/dashboard')({
    component: RouteComponent,
    beforeLoad: ({ location }) => {
        if (!isAuthenticated) {
            throw redirect({
                to: '/',
                search: {
                    // Redirect back here after authentication
                    redirect: location.href,
                },
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