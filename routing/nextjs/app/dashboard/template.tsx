'use client'

import { useState } from 'react'

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  const [mountTime] = useState(() => new Date().toLocaleTimeString())

  return (
    <>
      <p className="mb-4 text-xs text-zinc-400 border border-zinc-200 rounded px-2 py-1 inline-block dark:border-zinc-700">
        template.tsx — mounted at: <strong>{mountTime}</strong> (resets on each navigation, unlike layout.tsx)
      </p>
      {children}
    </>
  )
}
