import Link from 'next/link'
import { getGuitarById } from '../../../services/inventory.service'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function GuitarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const guitar = getGuitarById(id)
  if (!guitar) notFound()

  const rows: [string, string][] = [
    ['Serial Number', guitar.serialNumber],
    ['Type', guitar.spec.type],
    ['Model Series', guitar.spec.modelSeries],
    ['Body Wood', guitar.spec.bodyWood],
    ['Neck Wood', guitar.spec.neckWood],
    ['Fretboard Wood', guitar.spec.fretboardWood],
    ['Pickup Config', guitar.spec.pickupConfig],
    ['Scale Length', `${guitar.spec.scaleLength}"`],
    ['Finish', guitar.spec.finish],
    ['Status', guitar.status],
    ['Created', new Date(guitar.createdAt).toLocaleString()],
  ]

  return (
    <div className="max-w-lg mx-auto py-12 px-4 space-y-6">
      <Link href="/inventory" className="text-sm text-amber-700 hover:underline">
        ← Back to Inventory
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">{guitar.spec.modelSeries} {guitar.spec.type}</h1>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label} className="border-b last:border-0">
                <td className="px-4 py-3 text-gray-500 w-1/2">{label}</td>
                <td className="px-4 py-3 font-medium text-gray-900 capitalize">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {guitar.spec.customNotes && (
        <div className="bg-amber-50 rounded-lg border border-amber-200 p-4 text-sm text-amber-800">
          <span className="font-semibold">Notes: </span>{guitar.spec.customNotes}
        </div>
      )}
    </div>
  )
}
