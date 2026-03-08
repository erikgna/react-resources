import Link from 'next/link'

const features = [
  {
    href: '/dashboard/posts',
    label: '/dashboard/posts',
    desc: 'nested layout · async Server Component · static metadata · searchParams · loading.tsx · error.tsx · template.tsx',
  },
  {
    href: '/dashboard/posts/1',
    label: '/dashboard/posts/1',
    desc: 'dynamic route [postId] · generateMetadata · generateStaticParams',
  },
  {
    href: '/dashboard/posts/99',
    label: '/dashboard/posts/99',
    desc: 'notFound() → route-level not-found.tsx',
  },
  {
    href: '/about',
    label: '/about',
    desc: 'route group (marketing) — nested layout without URL segment',
  },
  {
    href: '/docs/next/routing/intro',
    label: '/docs/next/routing/intro',
    desc: 'catch-all route [...slug] — matches any depth',
  },
  {
    href: '/not-a-real-page',
    label: '/not-a-real-page',
    desc: 'unmatched URL → global not-found.tsx',
  },
]

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10 flex flex-col gap-3">
      <h1 className="text-2xl font-semibold mb-2">Next.js Routing POC</h1>
      {features.map(f => (
        <div key={f.href} className="flex flex-col gap-0.5">
          <Link href={f.href} className="font-mono text-sm text-blue-600 hover:underline dark:text-blue-400">
            {f.label}
          </Link>
          <p className="text-xs text-zinc-500">{f.desc}</p>
        </div>
      ))}
    </main>
  )
}
