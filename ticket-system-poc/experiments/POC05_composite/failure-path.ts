// POC05 — Composite: Failure Paths

class SeatNode { constructor(readonly id: string) {} totalCapacity() { return 1 } availableSeats() { return 1 } children() { return [] } }

class BranchNode {
  private _children: { id: string; totalCapacity(): number; availableSeats(): number }[] = []
  private ids = new Set<string>()
  constructor(readonly id: string) {}
  add(n: { id: string; totalCapacity(): number; availableSeats(): number }) {
    if (this.ids.has(n.id)) throw new Error(`Duplicate node id: ${n.id}`)
    this.ids.add(n.id); this._children.push(n)
  }
  totalCapacity() { return this._children.reduce((s, c) => s + c.totalCapacity(), 0) }
  availableSeats() { return this._children.reduce((s, c) => s + c.availableSeats(), 0) }
}

// 1. Duplicate seat ID
const row = new BranchNode('R1')
row.add(new SeatNode('A1'))
try { row.add(new SeatNode('A1')) }
catch (e) { console.log(`[OK] Duplicate rejected: ${(e as Error).message}`) }

// 2. Empty branch returns 0
const emptyVenue = new BranchNode('V0')
console.log(`[OK] Empty venue totalCapacity: ${emptyVenue.totalCapacity()} (expected 0)`)
console.log(`[OK] Empty venue availableSeats: ${emptyVenue.availableSeats()} (expected 0)`)

// 3. Partial tree — capacity recalculates at each level
const venue = new BranchNode('V1')
const sectionA = new BranchNode('SA')
const sectionB = new BranchNode('SB')
sectionA.add(new SeatNode('X1')); sectionA.add(new SeatNode('X2'))
sectionB.add(new SeatNode('Y1'))
venue.add(sectionA); venue.add(sectionB)
console.log(`[OK] Venue with 2 sections: ${venue.totalCapacity()} seats (expected 3)`)

console.log('[INFO] Composite: uniform API prevents callers from needing to know tree depth')
