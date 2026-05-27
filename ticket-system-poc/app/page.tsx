import Link from 'next/link'
import { listShows } from '@/services/show.service'
import type { Show } from '@/domain/types'

export const dynamic = 'force-dynamic'

const TYPE_ICONS: Record<string, string> = { concert: '🎵', sports: '🏆', theater: '🎭' }
const TYPE_COLORS: Record<string, string> = {
  concert: 'bg-purple-100 text-purple-700',
  sports: 'bg-blue-100 text-blue-700',
  theater: 'bg-amber-100 text-amber-700',
}

function ZoneBadge({ soldCount, capacity, label }: { soldCount: number; capacity: number; label: string }) {
  const pct = soldCount / capacity
  const color = pct >= 1 ? 'bg-red-100 text-red-700' : pct >= 0.8 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
  const available = capacity - soldCount
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
      {pct >= 1 ? 'SOLD OUT' : `${label}: ${available}`}
    </span>
  )
}

function ShowCard({ show }: { show: Show }) {
  const date = new Date(show.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return (
    <Link href={`/shows/${encodeURIComponent(show.id)}`} className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{TYPE_ICONS[show.type]}</span>
        <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${TYPE_COLORS[show.type]}`}>{show.type}</span>
      </div>
      <h2 className="font-bold text-gray-900 text-base mb-1 line-clamp-2">{show.name}</h2>
      <p className="text-sm text-gray-500 mb-1">{show.venueName}</p>
      <p className="text-sm text-gray-400 mb-3">{date}</p>
      <div className="flex flex-wrap gap-1">
        {show.zones.map(z => (
          <ZoneBadge key={z.id} soldCount={z.soldCount} capacity={z.capacity} label={z.type.toUpperCase()} />
        ))}
      </div>
    </Link>
  )
}

export default function HomePage() {
  const shows = listShows()
  const concerts = shows.filter(s => s.type === 'concert')
  const sports = shows.filter(s => s.type === 'sports')
  const theater = shows.filter(s => s.type === 'theater')

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Upcoming Shows</h1>
        <p className="text-gray-500 mt-1">OOAD Challenge #7 — Ticket System POC (10 patterns)</p>
      </div>

      {[
        { label: 'Concerts', shows: concerts },
        { label: 'Sports', shows: sports },
        { label: 'Theater', shows: theater },
      ].map(({ label, shows: group }) => (
        <section key={label} className="mb-10">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">{label}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.map(show => <ShowCard key={show.id} show={show} />)}
          </div>
        </section>
      ))}

      <div className="mt-8 p-4 bg-white rounded-xl border border-gray-200 text-sm text-gray-500">
        <p className="font-semibold text-gray-700 mb-2">OOAD Patterns in this POC</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {['01 State', '02 Builder', '03 Strategy', '04 Observer', '05 Composite', '06 Factory', '07 Command', '08 Singleton', '09 Template', '10 Facade'].map(p => (
            <span key={p} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded text-center">{p}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
