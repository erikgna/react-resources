import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="max-w-3xl mx-auto py-20 px-4 text-center space-y-6">
      <div className="text-6xl">🎸</div>
      <h1 className="text-4xl font-bold text-gray-900">Guitar Factory System</h1>
      <p className="text-gray-500 text-lg max-w-xl mx-auto">
        Configure a custom guitar — body, woods, pickups, finish, scale — and the factory builds it.
        Demonstrates Factory Method, Builder, Observer, and Strategy OOAD patterns in Next.js.
      </p>
      <div className="flex gap-4 justify-center pt-4">
        <Link href="/configurator" className="px-6 py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 text-sm">
          Build a Guitar
        </Link>
        <Link href="/inventory" className="px-6 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 text-sm">
          View Inventory
        </Link>
      </div>
      <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
        {[
          { pattern: 'Factory Method', desc: 'ElectricFactory, AcousticFactory, BassFactory each return a GuitarBuilder' },
          { pattern: 'Builder', desc: 'GuitarBuilder chains setType().setWood()...build() producing immutable Guitar' },
          { pattern: 'Observer', desc: 'InventoryStore emits GUITAR_ADDED/REMOVED events to subscribed observers' },
          { pattern: 'Strategy', desc: 'selectFactory(type) picks the correct factory at runtime' },
        ].map(({ pattern, desc }) => (
          <div key={pattern} className="bg-white rounded-lg border border-gray-200 p-4 text-sm">
            <div className="font-bold text-gray-900 mb-1">{pattern}</div>
            <div className="text-gray-500 text-xs">{desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
