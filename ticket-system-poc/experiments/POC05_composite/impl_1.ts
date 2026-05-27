// POC05 — Composite Pattern: Venue Hierarchy
// Key insight: totalCapacity() and availableSeats() work identically on leaf and root.
// Callers never switch on node type — polymorphism handles depth.

interface VenueNode {
  id: string
  name: string
  totalCapacity(): number
  availableSeats(): number
  children(): readonly VenueNode[]
}

class SeatNode implements VenueNode {
  private _available = true
  constructor(readonly id: string, readonly name: string) {}
  totalCapacity() { return 1 }
  availableSeats() { return this._available ? 1 : 0 }
  children(): readonly VenueNode[] { return [] }
  reserve() { this._available = false }
  release() { this._available = true }
}

abstract class BranchNode implements VenueNode {
  private _children: VenueNode[] = []
  private ids = new Set<string>()
  constructor(readonly id: string, readonly name: string) {}
  add(n: VenueNode) {
    if (this.ids.has(n.id)) throw new Error(`Duplicate id in ${this.name}: ${n.id}`)
    this.ids.add(n.id); this._children.push(n)
  }
  totalCapacity() { return this._children.reduce((s, c) => s + c.totalCapacity(), 0) }
  availableSeats() { return this._children.reduce((s, c) => s + c.availableSeats(), 0) }
  children() { return this._children }
}

class RowNode extends BranchNode {}
class ZoneNode extends BranchNode {}
class SectionNode extends BranchNode {}
class VenueTree extends BranchNode {}

// Build: Venue → Section → Zone → Row → Seat
const venue = new VenueTree('V1', 'Madison Square Garden')
const section = new SectionNode('SEC-A', 'Section A')
const vipZone = new ZoneNode('VIP', 'VIP Zone')
const row1 = new RowNode('R1', 'Row 1')
const row2 = new RowNode('R2', 'Row 2')

const seats: SeatNode[] = ['A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'B3', 'B4', 'B5'].map(id => new SeatNode(id, `Seat ${id}`))
seats.slice(0, 5).forEach(s => row1.add(s))
seats.slice(5).forEach(s => row2.add(s))
vipZone.add(row1); vipZone.add(row2)
section.add(vipZone)
venue.add(section)

console.log(`[OK] venue.totalCapacity() = ${venue.totalCapacity()} (expected 10)`)
console.log(`[OK] vipZone.totalCapacity() = ${vipZone.totalCapacity()} (expected 10)`)
console.log(`[OK] row1.totalCapacity() = ${row1.totalCapacity()} (expected 5)`)
console.log(`[OK] seats[0].totalCapacity() = ${seats[0].totalCapacity()} (expected 1)`)

// Reserve 3 seats
seats[0].reserve(); seats[1].reserve(); seats[5].reserve()
console.log(`[OK] After 3 reservations: venue.availableSeats() = ${venue.availableSeats()} (expected 7)`)
console.log(`[OK] vipZone.availableSeats() = ${vipZone.availableSeats()} (expected 7)`)
console.log(`[OK] row1.availableSeats() = ${row1.availableSeats()} (expected 3)`)
console.log('[INFO] Same API on leaf vs root — Composite pattern in action')
