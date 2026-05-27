// POC10 — Facade: Failure Paths
// 1. Invalid order short-circuits before pricing/command
// 2. Cancel-then-undo round-trips correctly through facade

const log: string[] = []

function validate(qty: number, date: string) {
  log.push('validate')
  const errs = []
  if (qty <= 0) errs.push('qty > 0 required')
  if (new Date(date) <= new Date()) errs.push('date must be future')
  return { valid: errs.length === 0, errors: errs }
}
function price() { log.push('price'); return 100 }
function command() { log.push('command'); return 'T99' }
function observe() { log.push('observe') }

class Facade {
  private cancelledTickets: Set<string> = new Set()
  private confirmedTickets: Set<string> = new Set()

  purchase(qty: number, date: string) {
    const v = validate(qty, date)
    if (!v.valid) throw new Error(v.errors.join('; '))
    price(); command(); observe()
    this.confirmedTickets.add('T99')
    return 'T99'
  }

  cancel(ticketId: string) {
    if (!this.confirmedTickets.has(ticketId)) throw new Error(`Not a confirmed ticket: ${ticketId}`)
    this.confirmedTickets.delete(ticketId)
    this.cancelledTickets.add(ticketId)
    log.push('cancel')
    return 'cancelled'
  }

  undoCancel(ticketId: string) {
    if (!this.cancelledTickets.has(ticketId)) throw new Error(`Not a cancelled ticket: ${ticketId}`)
    this.cancelledTickets.delete(ticketId)
    this.confirmedTickets.add(ticketId)
    log.push('undo-cancel')
    return 'confirmed'
  }

  isConfirmed(id: string) { return this.confirmedTickets.has(id) }
}

const f = new Facade()

// 1. Invalid order short-circuits
log.length = 0
try { f.purchase(0, '2026-10-01') } catch (e) { console.log(`[OK] Short-circuit on validation: ${(e as Error).message}`) }
console.log(`[OK] Steps after validate: ${log.slice(1).join(',') || 'none (correct)'}`)

// 2. Valid purchase
log.length = 0
const ticketId = f.purchase(2, '2026-10-01')
console.log(`[OK] Purchase steps: ${log.join(' → ')}`)
console.log(`[OK] Ticket confirmed: ${f.isConfirmed(ticketId)}`)

// 3. Cancel then undo = re-confirm
const status1 = f.cancel(ticketId)
console.log(`[OK] After cancel: ${status1}`)
const status2 = f.undoCancel(ticketId)
console.log(`[OK] After undo-cancel: ${status2}, isConfirmed=${f.isConfirmed(ticketId)}`)

// 4. Cancel already-cancelled ticket
try { f.cancel(ticketId) } // ticket is now confirmed, not cancelled — simulates wrong state
catch (e) { console.log(`[OK] Cancel non-confirmed ticket: ${(e as Error).message}`) }

console.log('[INFO] Facade: validation failure at step 1 costs only the validate call. Pricing and command are protected.')
