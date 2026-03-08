'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function PostsFilter({ defaultFilter }: { defaultFilter?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) params.delete(key)
      else params.set(key, value)
    }
    router.push(`/dashboard/posts?${params}`)
  }

  return (
    <div className="flex gap-2 items-center flex-wrap">
      <input
        defaultValue={defaultFilter}
        onChange={e => updateParams({ filter: e.target.value || null, page: '1' })}
        placeholder="Filter posts..."
        className="border border-zinc-300 rounded px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      <button
        disabled={page <= 1}
        onClick={() => updateParams({ page: String(page - 1) })}
        className="px-3 py-1 border border-zinc-300 rounded text-sm disabled:opacity-40 dark:border-zinc-700"
      >
        Prev
      </button>
      <span className="text-sm text-zinc-500">Page {page}</span>
      <button
        onClick={() => updateParams({ page: String(page + 1) })}
        className="px-3 py-1 border border-zinc-300 rounded text-sm dark:border-zinc-700"
      >
        Next
      </button>
    </div>
  )
}
