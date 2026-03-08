import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About — Next.js Routing POC',
}

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-semibold">About</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        This page lives inside the <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">(marketing)</code> route
        group. The folder name appears in the file system but not in the URL — this page is at <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">/about</code>, not{' '}
        <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">/marketing/about</code>.
      </p>
      <Link href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">← Home</Link>
    </div>
  )
}
