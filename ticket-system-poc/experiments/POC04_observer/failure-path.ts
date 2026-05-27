// POC04 — Observer: Failure Paths
// 1. Post-unsubscribe events not received
// 2. Throwing observer does not crash the bus or other observers

interface CapacityEvent { type: string }
interface Observer { onCapacityEvent(e: CapacityEvent): void }

class CapacityEventBus {
  private observers: Set<Observer> = new Set()
  subscribe(o: Observer) { this.observers.add(o); return () => this.observers.delete(o) }
  emit(e: CapacityEvent) {
    for (const o of this.observers) {
      try { o.onCapacityEvent(e) } catch { /* bus survives observer throws */ }
    }
  }
}

const bus = new CapacityEventBus()

// 1. Throwing observer
let safeCount = 0
const throwingObs: Observer = { onCapacityEvent: () => { throw new Error('observer boom') } }
const safeObs: Observer = { onCapacityEvent: () => safeCount++ }

bus.subscribe(throwingObs)
bus.subscribe(safeObs)
bus.emit({ type: 'SEAT_SOLD' })

console.log(`[OK] Bus survived throwing observer. Safe observer still received event: count=${safeCount}`)

// 2. Unsubscribe stops delivery
const bus2 = new CapacityEventBus()
let received = 0
const obs: Observer = { onCapacityEvent: () => received++ }
const unsub = bus2.subscribe(obs)
bus2.emit({ type: 'A' })
console.log(`[OK] Before unsub: ${received} (expected 1)`)
unsub()
bus2.emit({ type: 'B' })
console.log(`[OK] After unsub: ${received} (expected still 1)`)

// 3. Two observers, unsubscribe one, other still works
const bus3 = new CapacityEventBus()
let a = 0, b = 0
const unsubA = bus3.subscribe({ onCapacityEvent: () => a++ })
bus3.subscribe({ onCapacityEvent: () => b++ })
bus3.emit({ type: 'X' })
unsubA()
bus3.emit({ type: 'Y' })
console.log(`[OK] A received ${a} (expected 1), B received ${b} (expected 2)`)

console.log('[INFO] Observer isolation: bus catches exceptions; unsubscribe is precise; remaining observers unaffected')
