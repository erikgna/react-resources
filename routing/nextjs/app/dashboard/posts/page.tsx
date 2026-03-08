import type { Metadata } from 'next'
import Link from 'next/link'
import { getPosts } from '@/lib/data'
import PostsFilter from './_components/PostsFilter'

export const metadata: Metadata = {
  title: 'Posts — Dashboard',
}

type Props = {
  searchParams: Promise<{ page?: string; filter?: string }>
}

export default async function PostsPage({ searchParams }: Props) {
  const { page = '1', filter } = await searchParams
  const posts = getPosts(filter)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Posts — Page {page}</h1>
      <PostsFilter defaultFilter={filter} />
      <ul className="flex flex-col gap-2">
        {posts.length === 0 && (
          <p className="text-sm text-zinc-500">No posts match the filter.</p>
        )}
        {posts.map(post => (
          <li key={post.id}>
            <Link
              href={`/dashboard/posts/${post.id}`}
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
