// POC04 — Observer Pattern: CapacityEventBus
// Key insight: Bus catches observer exceptions — publisher never crashes due to subscriber failure.
// subscribe() returns an unsubscribe function — no separate unsubscribe() method needed.

interface CapacityEvent {
  type: string
  [key: string]: unknown
}

interface Observer {
  onCapacityEvent(event: CapacityEvent): void
}

class CapacityEventBus {
  private observers: Set<Observer> = new Set()

  subscribe(o: Observer): () => void {
    this.observers.add(o)
    return () => this.observers.delete(o)
  }

  emit(event: CapacityEvent): void {
    for (const o of this.observers) {
      try { o.onCapacityEvent(event) }
      catch { /* observer failure never propagates */ }
    }
  }

  count(): number { return this.observers.size }
}

const bus = new CapacityEventBus()

// Observer 1: logger
let log1Events: CapacityEvent[] = []
const obs1: Observer = { onCapacityEvent: e => log1Events.push(e) }

// Observer 2: counter
let count2 = 0
const obs2: Observer = { onCapacityEvent: _ => count2++ }

const unsub1 = bus.subscribe(obs1)
bus.subscribe(obs2)

// Simulate selling seats
bus.emit({ type: 'SEAT_SOLD', showId: 'S1', seatId: 'A1', zoneId: 'Z1' })
bus.emit({ type: 'SEAT_SOLD', showId: 'S1', seatId: 'A2', zoneId: 'Z1' })
bus.emit({ type: 'THRESHOLD_80', showId: 'S1', zoneId: 'Z1', soldCount: 8, capacity: 10 })

console.log(`[OK] obs1 received ${log1Events.length} events (expected 3)`)
console.log(`[OK] obs2 count: ${count2} (expected 3)`)

// Unsubscribe obs1
unsub1()
console.log(`[OK] Observers after unsub: ${bus.count()} (expected 1)`)

bus.emit({ type: 'ZONE_FULL', showId: 'S1', zoneId: 'Z1', capacity: 10 })
console.log(`[OK] obs1 still at ${log1Events.length} events after unsubscribe (expected 3)`)
console.log(`[OK] obs2 at ${count2} (expected 4)`)
