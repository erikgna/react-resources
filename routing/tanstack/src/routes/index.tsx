import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <div className='flex flex-col gap-2'>
        <Link
          to="/posts/$postId"
          params={{ postId: '1' }}
          activeOptions={{ exact: true }}
          activeProps={{ className: 'text-red-500' }}
          className="text-blue-500"
        >
          Post 1
        </Link>
        <Link
          to="/dashboard/posts"
          activeOptions={{ exact: true }}
          activeProps={{ className: 'text-red-500' }}
          className="text-blue-500"
        >
          Dashboard Posts
        </Link>
      </div>
    </main>
  )
}
