import Link from 'next/link'

type Props = { params: Promise<{ slug: string[] }> }

export default async function DocsPage({ params }: Props) {
  const { slug } = await params

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 flex flex-col gap-3">
      <Link href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">← Home</Link>
      <h1 className="text-2xl font-semibold">Docs: {slug.join(' / ')}</h1>
      <p className="text-sm text-zinc-500">
        Catch-all route <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">[...slug]</code> matched{' '}
        <strong>{slug.length}</strong> segment{slug.length !== 1 ? 's' : ''}:
      </p>
      <ul className="flex flex-col gap-1">
        {slug.map((s, i) => (
          <li key={i} className="text-sm font-mono text-zinc-700 dark:text-zinc-300">
            slug[{i}] = {s}
          </li>
        ))}
      </ul>
    </div>
  )
}
