export default function Loading() {
  return (
    <div className="flex flex-col gap-3">
      <div className="h-6 w-32 rounded bg-zinc-200 animate-pulse dark:bg-zinc-800" />
      <div className="h-8 w-64 rounded bg-zinc-200 animate-pulse dark:bg-zinc-800" />
      {[1, 2, 3].map(i => (
        <div key={i} className="h-4 w-48 rounded bg-zinc-200 animate-pulse dark:bg-zinc-800" />
      ))}
    </div>
  )
}
