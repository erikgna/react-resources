import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import ActiveSegment from './_components/ActiveSegment'

export default async function DashboardLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value ?? 'none'
  const headersList = await headers()
  const userAgent = (headersList.get('user-agent') ?? 'unknown').slice(0, 40)

  return (
    <div className="flex min-h-[calc(100vh-45px)]">
      <aside className="w-56 shrink-0 border-r border-zinc-200 p-4 dark:border-zinc-800 flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Dashboard</p>
        <nav className="flex flex-col gap-1">
          <Link href="/dashboard/posts" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
            Posts
          </Link>
        </nav>
        <div className="flex flex-col gap-1 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <ActiveSegment />
          <p className="text-xs text-zinc-400">
            cookies(): session=<strong className="text-zinc-600 dark:text-zinc-300">{session}</strong>
          </p>
          <p className="text-xs text-zinc-400 break-all">
            headers(): ua=<strong className="text-zinc-600 dark:text-zinc-300">{userAgent}</strong>
          </p>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
      {modal}
    </div>
  )
}
