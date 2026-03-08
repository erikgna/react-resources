'use client'

import { useSelectedLayoutSegment } from 'next/navigation'

// useSelectedLayoutSegment — returns the active child route segment from inside a layout
export default function ActiveSegment() {
  const segment = useSelectedLayoutSegment()
  return (
    <p className="text-xs text-zinc-400">
      useSelectedLayoutSegment():{' '}
      <strong className="text-zinc-600 dark:text-zinc-300">{segment ?? '(root)'}</strong>
    </p>
  )
}
