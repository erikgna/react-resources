'use client'

import { useRouter } from 'next/navigation'

// Client component wrapping the intercepted route content
// router.back() closes the modal by undoing the navigation
export default function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => router.back()}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl p-6 max-w-lg w-full mx-4 flex flex-col gap-3 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            Intercepting route — soft-nav shows this modal; direct URL shows the full page
          </p>
          <button
            onClick={() => router.back()}
            className="text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-white ml-4 shrink-0"
          >
            ✕ Close
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
