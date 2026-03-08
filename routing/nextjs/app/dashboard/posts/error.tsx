'use client'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-red-600">Something went wrong</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{error.message}</p>
      <button
        onClick={reset}
        className="w-fit px-3 py-1 border border-zinc-300 rounded text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
      >
        Try again
      </button>
    </div>
  )
}
