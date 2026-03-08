'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Home' },
  { href: '/dashboard/posts', label: 'Dashboard' },
  { href: '/about', label: 'About' },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-10 flex gap-6 border-b border-zinc-200 bg-white/80 px-6 py-3 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
      {links.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={`text-sm font-medium transition-colors ${
            pathname === link.href
              ? 'text-zinc-900 dark:text-white'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
