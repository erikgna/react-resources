import type { Guitar, GuitarSpec, GuitarStatus } from './types'

export type InventoryEvent =
  | { type: 'GUITAR_ADDED'; guitar: Guitar }
  | { type: 'GUITAR_REMOVED'; id: string }
  | { type: 'STATUS_CHANGED'; id: string; status: GuitarStatus }

export interface InventoryObserver {
  onEvent(event: InventoryEvent): void
}

export class InventoryStore {
  private guitars: Map<string, Guitar> = new Map()
  private observers: InventoryObserver[] = []

  subscribe(observer: InventoryObserver): () => void {
    this.observers.push(observer)
    return () => {
      this.observers = this.observers.filter(o => o !== observer)
    }
  }

  private emit(event: InventoryEvent): void {
    const payload = { event: event.type, payload: event, ts: new Date().toISOString() }
    console.log(JSON.stringify(payload))
    for (const observer of this.observers) observer.onEvent(event)
  }

  add(guitar: Guitar): void {
    if (this.guitars.has(guitar.id)) {
      throw new Error(`InventoryStore: guitar ${guitar.id} already exists`)
    }
    this.guitars.set(guitar.id, guitar)
    this.emit({ type: 'GUITAR_ADDED', guitar })
  }

  remove(id: string): void {
    if (!this.guitars.has(id)) {
      throw new Error(`InventoryStore: guitar ${id} not found`)
    }
    this.guitars.delete(id)
    this.emit({ type: 'GUITAR_REMOVED', id })
  }

  updateStatus(id: string, status: GuitarStatus): void {
    const guitar = this.guitars.get(id)
    if (!guitar) throw new Error(`InventoryStore: guitar ${id} not found`)
    const updated: Guitar = { ...guitar, status }
    this.guitars.set(id, updated)
    this.emit({ type: 'STATUS_CHANGED', id, status })
  }

  list(): Guitar[] {
    return Array.from(this.guitars.values())
  }

  findById(id: string): Guitar | undefined {
    return this.guitars.get(id)
  }

  filter(predicate: Partial<GuitarSpec>): Guitar[] {
    return this.list().filter(g =>
      (Object.keys(predicate) as (keyof GuitarSpec)[]).every(
        k => predicate[k] === undefined || g.spec[k] === predicate[k]
      )
    )
  }

  count(): number {
    return this.guitars.size
  }
}
