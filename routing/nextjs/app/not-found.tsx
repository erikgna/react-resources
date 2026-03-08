import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10 flex flex-col gap-3">
      <h1 className="text-2xl font-semibold">404 — Page not found</h1>
      <Link href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">← Go home</Link>
    </div>
  )
}
