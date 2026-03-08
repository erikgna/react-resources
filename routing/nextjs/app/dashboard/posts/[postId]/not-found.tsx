import Link from 'next/link'

export default function PostNotFound() {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Post not found</h2>
      <p className="text-sm text-zinc-500">The post you requested does not exist.</p>
      <Link href="/dashboard/posts" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
        ← Back to posts
      </Link>
    </div>
  )
}
