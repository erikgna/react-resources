'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LikeButton({ postId, likes }: { postId: number; likes: number }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleLike() {
    setPending(true)
    await fetch(`/api/posts/${postId}/like`, { method: 'POST' })
    router.refresh()
    setPending(false)
  }

  return (
    <button
      onClick={handleLike}
      disabled={pending}
      className="px-3 py-1 border border-zinc-200 rounded-lg text-sm dark:border-zinc-700 disabled:opacity-40"
    >
      {pending ? '...' : `Like (${likes})`}
    </button>
  )
}
