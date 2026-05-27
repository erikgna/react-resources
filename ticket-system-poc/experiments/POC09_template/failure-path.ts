// POC09 — Template Method: Failure Paths

interface Order { showId: string; seatIds: string[]; zoneType: string; quantity: number; date: string }
interface Result { valid: boolean; errors: string[] }

abstract class TicketValidator {
  validate(order: Order): Result {
    const errors: string[] = []
    this.checkCapacity(order, errors)
    this.checkDateValidity(order, errors)
    this.checkZoneRules(order, errors)
    return { valid: errors.length === 0, errors }
  }
  protected checkCapacity(order: Order, errors: string[]) {
    if (order.quantity <= 0) errors.push('quantity must be > 0')
  }
  protected checkDateValidity(order: Order, errors: string[]) {
    if (new Date(order.date) <= new Date()) errors.push(`date must be in the future: ${order.date}`)
  }
  protected abstract checkZoneRules(order: Order, errors: string[]): void
}

class ConcertTicketValidator extends TicketValidator {
  protected checkZoneRules(order: Order, errors: string[]) {
    if (order.zoneType === 'general' && order.seatIds.length > 0) {
      errors.push('General Admission zone does not use seat assignments')
    }
  }
}

class SportsTicketValidator extends TicketValidator {
  protected checkZoneRules(order: Order, errors: string[]) {
    if (order.zoneType === 'vip' && order.quantity > 4) {
      errors.push('VIP zone maximum is 4 tickets per order')
    }
  }
}

class TheaterTicketValidator extends TicketValidator {
  protected checkZoneRules(order: Order, errors: string[]) {
    if (order.quantity > 6) errors.push('Maximum 6 tickets per order for theater shows')
  }
}

// 1. Concert GA + seat IDs — zone rule fails
const r1 = new ConcertTicketValidator().validate({ showId: 'C1', seatIds: ['A1', 'A2'], zoneType: 'general', quantity: 2, date: '2026-10-01' })
console.log(`[OK] Concert GA + seats: valid=${r1.valid}, error="${r1.errors[0]}"`)

// 2. Sports VIP qty=5 — zone rule fails
const r2 = new SportsTicketValidator().validate({ showId: 'S1', seatIds: [], zoneType: 'vip', quantity: 5, date: '2026-10-01' })
console.log(`[OK] Sports VIP qty=5: valid=${r2.valid}, error="${r2.errors[0]}"`)

// 3. Past date — base class catches it (not zone rule)
const r3 = new TheaterTicketValidator().validate({ showId: 'TH1', seatIds: [], zoneType: 'general', quantity: 2, date: '2020-01-01' })
console.log(`[OK] Past date (base class step): valid=${r3.valid}, error="${r3.errors[0]}"`)

// 4. Zero quantity — base class catches it
const r4 = new ConcertTicketValidator().validate({ showId: 'C1', seatIds: [], zoneType: 'vip', quantity: 0, date: '2026-10-01' })
console.log(`[OK] Zero quantity (base class): valid=${r4.valid}, error="${r4.errors[0]}"`)

// 5. Multiple errors accumulate (all steps always run)
const r5 = new SportsTicketValidator().validate({ showId: 'S1', seatIds: [], zoneType: 'vip', quantity: 6, date: '2020-01-01' })
console.log(`[OK] Multiple errors: ${r5.errors.length} errors (past date + VIP limit): ${r5.errors.join(' | ')}`)

console.log('[INFO] All steps always run — errors accumulate across steps. This is the strength of the template skeleton.')
