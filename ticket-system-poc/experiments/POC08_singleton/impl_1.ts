// POC08 — Singleton Pattern: InventoryRegistry
// Key insight: getInstance() === getInstance() (reference equality, not just value).
// Mutation on any reference is visible on all others — single shared object.
// Private constructor enforced at TypeScript compile time.

class InventoryRegistry {
  private static instance: InventoryRegistry | null = null
  private data: Map<string, string> = new Map()

  // Private — TypeScript prevents new InventoryRegistry() at compile time
  private constructor() {}

  static getInstance(): InventoryRegistry {
    if (!InventoryRegistry.instance) {
      InventoryRegistry.instance = new InventoryRegistry()
      console.log('[INFO] InventoryRegistry created')
    }
    return InventoryRegistry.instance
  }

  // Escape hatch for test isolation only
  static resetForTests(): void {
    InventoryRegistry.instance = null
  }

  set(key: string, val: string) { this.data.set(key, val) }
  get(key: string) { return this.data.get(key) }
  size() { return this.data.size }
}

// Three calls — same instance
const r1 = InventoryRegistry.getInstance()
const r2 = InventoryRegistry.getInstance()
const r3 = InventoryRegistry.getInstance()

console.log(`[OK] r1 === r2: ${r1 === r2}`)
console.log(`[OK] r2 === r3: ${r2 === r3}`)

// Mutate via r1, read via r3
r1.set('show:C1', 'Taylor Swift')
console.log(`[OK] r3.get('show:C1') = "${r3.get('show:C1')}" (mutation on r1 visible on r3)`)

// All three point to same size
r2.set('show:S1', 'NBA Finals')
console.log(`[OK] All refs see size ${r1.size()} (expected 2)`)

// Reset for test isolation
InventoryRegistry.resetForTests()
const r4 = InventoryRegistry.getInstance()
console.log(`[OK] After reset: r4 !== r1: ${r4 !== r1}`)
console.log(`[OK] Fresh instance size: ${r4.size()} (expected 0)`)

console.log('[INFO] private constructor enforced at compile time — TypeScript prevents new InventoryRegistry()')
console.log('[INFO] Hot-reload trap: Next.js re-executes modules but TypeScript module singleton survives in Node.js process')
