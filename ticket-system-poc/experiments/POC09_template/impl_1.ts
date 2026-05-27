// POC09 — Template Method Pattern: TicketValidator
// Key insight: validate() skeleton is FIXED — checkCapacity → checkDateValidity → checkZoneRules.
// Subclasses only override checkZoneRules(). They cannot alter order or skip steps.
// TypeScript has no `final` keyword — document this constraint explicitly.

interface Order { showId: string; seatIds: string[]; zoneType: string; quantity: number; date: string }
interface Result { valid: boolean; errors: string[] }

abstract class TicketValidator {
  // Template method — fixed skeleton. Do not override this method.
  validate(order: Order): Result {
    const errors: string[] = []
    this.checkCapacity(order, errors)       // step 1: shared
    this.checkDateValidity(order, errors)   // step 2: shared
    this.checkZoneRules(order, errors)      // step 3: abstract hook
    return { valid: errors.length === 0, errors }
  }

  protected checkCapacity(order: Order, errors: string[]): void {
    if (order.quantity <= 0) errors.push('quantity must be > 0')
  }

  protected checkDateValidity(order: Order, errors: string[]): void {
    if (new Date(order.date) <= new Date()) errors.push(`date must be in the future: ${order.date}`)
  }

  protected abstract checkZoneRules(order: Order, errors: string[]): void
}

class ConcertTicketValidator extends TicketValidator {
  protected checkZoneRules(order: Order, errors: string[]): void {
    if (order.zoneType === 'general' && order.seatIds.length > 0) {
      errors.push('General Admission zone does not use seat assignments')
    }
  }
}

class SportsTicketValidator extends TicketValidator {
  protected checkZoneRules(order: Order, errors: string[]): void {
    if (order.zoneType === 'vip' && order.quantity > 4) {
      errors.push('VIP zone maximum is 4 tickets per order')
    }
  }
}

class TheaterTicketValidator extends TicketValidator {
  protected checkZoneRules(order: Order, errors: string[]): void {
    if (order.quantity > 6) errors.push('Maximum 6 tickets per order for theater shows')
  }
}

const concertVal = new ConcertTicketValidator()
const sportsVal = new SportsTicketValidator()
const theaterVal = new TheaterTicketValidator()

// Concert happy path (general zone, no seats)
const r1 = concertVal.validate({ showId: 'C1', seatIds: [], zoneType: 'general', quantity: 2, date: '2026-10-01' })
console.log(`[OK] Concert GA (no seats): valid=${r1.valid}`)

// Sports VIP ≤ 4
const r2 = sportsVal.validate({ showId: 'S1', seatIds: ['A1', 'A2'], zoneType: 'vip', quantity: 2, date: '2026-10-01' })
console.log(`[OK] Sports VIP qty=2: valid=${r2.valid}`)

// Theater max 6
const r3 = theaterVal.validate({ showId: 'TH1', seatIds: [], zoneType: 'general', quantity: 6, date: '2026-10-01' })
console.log(`[OK] Theater qty=6: valid=${r3.valid}`)

console.log('[INFO] Template Method guarantees step order. Subclass controls only checkZoneRules. Base class steps always run.')
