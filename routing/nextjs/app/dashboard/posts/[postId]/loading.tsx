export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-4 w-24 rounded bg-zinc-200 animate-pulse dark:bg-zinc-800" />
      <div className="h-8 w-56 rounded bg-zinc-200 animate-pulse dark:bg-zinc-800" />
      <div className="h-4 w-full rounded bg-zinc-200 animate-pulse dark:bg-zinc-800" />
    </div>
  )
}
