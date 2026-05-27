// POC08 — Singleton: Failure Paths
// Verifying: private constructor is compile-time enforced, reference equality, reset isolation

class InventoryRegistry {
  private static instance: InventoryRegistry | null = null
  private store: string[] = []
  private constructor() {}
  static getInstance() {
    if (!InventoryRegistry.instance) InventoryRegistry.instance = new InventoryRegistry()
    return InventoryRegistry.instance
  }
  static resetForTests() { InventoryRegistry.instance = null }
  add(s: string) { this.store.push(s) }
  count() { return this.store.length }
}

// 1. getInstance() === getInstance() (same reference)
const a = InventoryRegistry.getInstance()
const b = InventoryRegistry.getInstance()
console.log(`[OK] Singleton reference equality: a === b = ${a === b}`)

// 2. Mutation visible across all references
a.add('item1')
console.log(`[OK] b.count() after a.add(): ${b.count()} (expected 1)`)

// 3. Reset: new empty instance after reset
InventoryRegistry.resetForTests()
const c = InventoryRegistry.getInstance()
console.log(`[OK] c !== a after reset: ${c !== a}`)
console.log(`[OK] c.count() after reset: ${c.count()} (expected 0)`)

// 4. The trade-off: simple module-level export vs getInstance()
const simpleStore = { data: [] as string[], add(s: string) { this.data.push(s) } }
// simpleStore cannot be reset between tests — requires module reload
console.log('[INFO] Simple module export: cannot reset without module reload. getInstance() has resetForTests() escape hatch.')

// 5. new InventoryRegistry() — TypeScript compile error (cannot demonstrate at runtime, but documented)
console.log('[INFO] new InventoryRegistry() is a TypeScript compile error (private constructor)')
console.log('[INFO] At runtime, if someone bypasses TS: InventoryRegistry["instance"] can still be accessed (TS privates are compile-time only)')

// Demonstrate the runtime bypass (educational — shows TS privacy is compile-time only)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const bypass = new (InventoryRegistry as any)()
bypass.add('bypassed')
console.log(`[OK] Runtime bypass (TS private is compile-time): bypass.count()=${bypass.count()} — NOT the singleton`)
console.log(`[OK] Singleton unaffected: c.count()=${c.count()} (expected 0)`)
