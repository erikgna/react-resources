import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getShowById } from '@/services/show.service'
import { SeatPickerClient } from './_components/SeatPickerClient'

export const dynamic = 'force-dynamic'

const TYPE_ICONS: Record<string, string> = { concert: '🎵', sports: '🏆', theater: '🎭' }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ShowDetailPage({ params }: PageProps) {
  const { id } = await params
  const show = getShowById(decodeURIComponent(id))
  if (!show) notFound()

  const date = new Date(show.date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  })

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <Link href="/" className="text-sm text-indigo-600 hover:underline mb-6 inline-block">&larr; All Shows</Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{TYPE_ICONS[show.type]}</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{show.name}</h1>
            <p className="text-gray-500 text-sm">{show.venueName} · {date}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <SeatPickerClient showId={show.id} />
      </div>
    </div>
  )
}
