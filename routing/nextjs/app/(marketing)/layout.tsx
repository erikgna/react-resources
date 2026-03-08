export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <p className="mb-4 text-xs text-zinc-400 border border-zinc-200 rounded px-2 py-1 inline-block dark:border-zinc-700">
        (marketing) route group layout — wraps /about without adding a URL segment
      </p>
      {children}
    </div>
  )
}
