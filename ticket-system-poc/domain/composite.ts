// POC05 — Composite pattern
// totalCapacity() and availableSeats() work identically on SeatNode (leaf) and VenueTree (root).
// Callers never know if they're operating on a leaf or a branch.

export interface VenueNode {
  readonly id: string
  readonly name: string
  totalCapacity(): number
  availableSeats(): number
  children(): readonly VenueNode[]
}

export class SeatNode implements VenueNode {
  private _available: boolean

  constructor(
    readonly id: string,
    readonly name: string,
    available = true
  ) {
    this._available = available
  }

  totalCapacity(): number { return 1 }
  availableSeats(): number { return this._available ? 1 : 0 }
  children(): readonly VenueNode[] { return [] }

  reserve(): void { this._available = false }
  release(): void { this._available = true }
}

abstract class BranchNode implements VenueNode {
  private _children: VenueNode[] = []
  private childIds: Set<string> = new Set()

  constructor(readonly id: string, readonly name: string) {}

  addChild(node: VenueNode): void {
    if (this.childIds.has(node.id)) {
      throw new Error(`Duplicate node id in ${this.name}: ${node.id}`)
    }
    this.childIds.add(node.id)
    this._children.push(node)
  }

  totalCapacity(): number {
    return this._children.reduce((sum, c) => sum + c.totalCapacity(), 0)
  }

  availableSeats(): number {
    return this._children.reduce((sum, c) => sum + c.availableSeats(), 0)
  }

  children(): readonly VenueNode[] { return this._children }
}

export class RowNode extends BranchNode {}
export class ZoneNode extends BranchNode {}
export class SectionNode extends BranchNode {}
export class VenueTree extends BranchNode {}
