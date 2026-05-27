import Link from 'next/link'
import { InventoryClient } from './_components/InventoryClient'

export const dynamic = 'force-dynamic'

export default function InventoryPage() {
  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500 text-sm mt-1">All guitars currently in the factory system.</p>
        </div>
        <Link
          href="/configurator"
          className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded hover:bg-amber-600"
        >
          + New Guitar
        </Link>
      </div>
      <InventoryClient />
    </div>
  )
}
