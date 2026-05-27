// POC10 — Facade Pattern: TicketingFacade
// Key insight: Single call orchestrates validate → price → command → observe.
// Caller provides an order and gets tickets + price — knows nothing about 4 subsystems.
// Facade does NOT add logic — it orchestrates.

const callLog: string[] = []

// Stub subsystems
function validate(order: { quantity: number; zoneType: string; date: string }): { valid: boolean; errors: string[] } {
  callLog.push('1-validate')
  const errors: string[] = []
  if (order.quantity <= 0) errors.push('quantity must be > 0')
  if (new Date(order.date) <= new Date()) errors.push('date must be future')
  return { valid: errors.length === 0, errors }
}

function calculatePrice(zone: string, base: number, qty: number): number {
  callLog.push('2-price')
  const multipliers: Record<string, number> = { vip: 1.5, premium: 1.2, general: 1.0 }
  return base * (multipliers[zone] ?? 1) * qty
}

let ticketSeq = 0
function executeCommand(seatIds: string[]): string[] {
  callLog.push('3-command')
  return seatIds.map(() => `T${++ticketSeq}`)
}

function emitEvent(type: string, payload: object): void {
  callLog.push(`4-observe:${type}`)
  console.log(`  [EVENT] ${type}: ${JSON.stringify(payload)}`)
}

// The Facade
class TicketingFacade {
  purchaseTickets(order: { showId: string; seatIds: string[]; zoneType: string; quantity: number; date: string; basePrice: number }) {
    // Step 1: validate
    const validation = validate(order)
    if (!validation.valid) throw new Error(`Validation failed: ${validation.errors.join('; ')}`)

    // Step 2: price
    const totalPrice = calculatePrice(order.zoneType, order.basePrice, order.quantity)

    // Step 3: command
    const ticketIds = executeCommand(order.seatIds)

    // Step 4: observe
    emitEvent('PURCHASE_COMPLETE', { showId: order.showId, ticketCount: ticketIds.length, total: totalPrice })

    return { ticketIds, totalPrice }
  }
}

const facade = new TicketingFacade()

// Happy path — all 4 subsystems called in order
callLog.length = 0
const result = facade.purchaseTickets({ showId: 'C1', seatIds: ['A1', 'A2'], zoneType: 'vip', quantity: 2, date: '2026-10-01', basePrice: 150 })
console.log(`[OK] Tickets: ${result.ticketIds.join(',')}, total: $${result.totalPrice}`)
console.log(`[OK] Call order: ${callLog.join(' → ')} (expected: 1-validate → 2-price → 3-command → 4-observe:PURCHASE_COMPLETE)`)

// Facade short-circuits on validation failure — steps 2, 3, 4 never run
callLog.length = 0
try { facade.purchaseTickets({ showId: 'C1', seatIds: [], zoneType: 'vip', quantity: 0, date: '2026-10-01', basePrice: 150 }) }
catch (e) { console.log(`[OK] Validation short-circuit: ${(e as Error).message}`) }
console.log(`[OK] Steps after validate: ${callLog.slice(1).length === 0 ? 'none (correct)' : callLog.slice(1).join(',')}`)

console.log('[INFO] Facade: zero logic of its own. All logic lives in the subsystem it belongs to.')
