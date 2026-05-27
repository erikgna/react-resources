// POC01 — State Pattern: Ticket Lifecycle
// Key insight: STATE_MAP is O(1) dispatch. No switch/if anywhere in caller code.
// State objects are stateless — they're transition validators only.
// The Ticket record carries all data; states carry only transition logic.

import type { Ticket, TicketStatus } from '../../domain/types'

interface TicketState {
  readonly status: TicketStatus
  reserve(t: Ticket): Ticket
  confirm(t: Ticket): Ticket
  cancel(t: Ticket): Ticket
  expire(t: Ticket): Ticket
}

function illegal(from: TicketStatus, to: string): never {
  throw new Error(`Illegal transition: cannot ${to} a ${from} ticket`)
}

function next(t: Ticket, s: TicketStatus): Ticket {
  return Object.freeze({ ...t, status: s })
}

class AvailableState implements TicketState {
  readonly status = 'available' as const
  reserve(t: Ticket) { return next(t, 'reserved') }
  confirm(t: Ticket) { return illegal(t.status, 'confirm') }
  cancel(t: Ticket) { return illegal(t.status, 'cancel') }
  expire(t: Ticket) { return next(t, 'expired') }
}

class ReservedState implements TicketState {
  readonly status = 'reserved' as const
  reserve(t: Ticket) { return illegal(t.status, 'reserve') }
  confirm(t: Ticket) { return next(t, 'confirmed') }
  cancel(t: Ticket) { return next(t, 'cancelled') }
  expire(t: Ticket) { return next(t, 'expired') }
}

class ConfirmedState implements TicketState {
  readonly status = 'confirmed' as const
  reserve(t: Ticket) { return illegal(t.status, 'reserve') }
  confirm(t: Ticket) { return illegal(t.status, 'confirm') }
  cancel(t: Ticket) { return next(t, 'cancelled') }
  expire(t: Ticket) { return illegal(t.status, 'expire') }
}

class CancelledState implements TicketState {
  readonly status = 'cancelled' as const
  reserve(t: Ticket) { return illegal(t.status, 'reserve') }
  confirm(t: Ticket) { return illegal(t.status, 'confirm') }
  cancel(t: Ticket) { return illegal(t.status, 'cancel') }
  expire(t: Ticket) { return illegal(t.status, 'expire') }
}

class ExpiredState implements TicketState {
  readonly status = 'expired' as const
  reserve(t: Ticket) { return illegal(t.status, 'reserve') }
  confirm(t: Ticket) { return illegal(t.status, 'confirm') }
  cancel(t: Ticket) { return illegal(t.status, 'cancel') }
  expire(t: Ticket) { return illegal(t.status, 'expire') }
}

const STATE_MAP: Record<TicketStatus, TicketState> = {
  available: new AvailableState(),
  reserved: new ReservedState(),
  confirmed: new ConfirmedState(),
  cancelled: new CancelledState(),
  expired: new ExpiredState(),
}

function transition(ticket: Ticket, to: 'reserved' | 'confirmed' | 'cancelled' | 'expired'): Ticket {
  const state = STATE_MAP[ticket.status]
  switch (to) {
    case 'reserved': return state.reserve(ticket)
    case 'confirmed': return state.confirm(ticket)
    case 'cancelled': return state.cancel(ticket)
    case 'expired': return state.expire(ticket)
  }
}

// --- Demo ---
const seed: Ticket = Object.freeze({
  id: 'T001', showId: 'S1', seatId: 'A1', zoneType: 'vip',
  priceCharged: 150, status: 'available', createdAt: new Date().toISOString()
})

let t = seed
t = transition(t, 'reserved')
console.log(`[OK] reserved: status=${t.status}`)
t = transition(t, 'confirmed')
console.log(`[OK] confirmed: status=${t.status}`)
t = transition(t, 'cancelled')
console.log(`[OK] cancelled: status=${t.status}`)
console.log(`[INFO] Ticket is immutable: original status still '${seed.status}'`)
