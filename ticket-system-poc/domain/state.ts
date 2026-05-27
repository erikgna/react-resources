// POC01 — State pattern
// Each TicketStatus has a handler object that enforces legal transitions.
// The ticket record carries the status; STATE_MAP is O(1) dispatch — no switch anywhere.

import type { Ticket, TicketStatus } from './types'

interface TicketState {
  readonly status: TicketStatus
  reserve(ticket: Ticket): Ticket
  confirm(ticket: Ticket): Ticket
  cancel(ticket: Ticket): Ticket
  expire(ticket: Ticket): Ticket
}

function illegal(from: TicketStatus, to: string): never {
  throw new Error(`Illegal transition: cannot ${to} a ${from} ticket`)
}

function transition(ticket: Ticket, to: TicketStatus): Ticket {
  return Object.freeze({ ...ticket, status: to })
}

class AvailableState implements TicketState {
  readonly status = 'available' as const
  reserve(ticket: Ticket): Ticket { return transition(ticket, 'reserved') }
  confirm(ticket: Ticket): Ticket { return illegal(ticket.status, 'confirm') }
  cancel(ticket: Ticket): Ticket { return illegal(ticket.status, 'cancel') }
  expire(ticket: Ticket): Ticket { return transition(ticket, 'expired') }
}

class ReservedState implements TicketState {
  readonly status = 'reserved' as const
  reserve(ticket: Ticket): Ticket { return illegal(ticket.status, 'reserve') }
  confirm(ticket: Ticket): Ticket { return transition(ticket, 'confirmed') }
  cancel(ticket: Ticket): Ticket { return transition(ticket, 'cancelled') }
  expire(ticket: Ticket): Ticket { return transition(ticket, 'expired') }
}

class ConfirmedState implements TicketState {
  readonly status = 'confirmed' as const
  reserve(ticket: Ticket): Ticket { return illegal(ticket.status, 'reserve') }
  confirm(ticket: Ticket): Ticket { return illegal(ticket.status, 'confirm') }
  cancel(ticket: Ticket): Ticket { return transition(ticket, 'cancelled') }
  expire(ticket: Ticket): Ticket { return illegal(ticket.status, 'expire') }
}

class CancelledState implements TicketState {
  readonly status = 'cancelled' as const
  reserve(ticket: Ticket): Ticket { return illegal(ticket.status, 'reserve') }
  confirm(ticket: Ticket): Ticket { return illegal(ticket.status, 'confirm') }
  cancel(ticket: Ticket): Ticket { return illegal(ticket.status, 'cancel') }
  expire(ticket: Ticket): Ticket { return illegal(ticket.status, 'expire') }
}

class ExpiredState implements TicketState {
  readonly status = 'expired' as const
  reserve(ticket: Ticket): Ticket { return illegal(ticket.status, 'reserve') }
  confirm(ticket: Ticket): Ticket { return illegal(ticket.status, 'confirm') }
  cancel(ticket: Ticket): Ticket { return illegal(ticket.status, 'cancel') }
  expire(ticket: Ticket): Ticket { return illegal(ticket.status, 'expire') }
}

const STATE_MAP: Record<TicketStatus, TicketState> = {
  available: new AvailableState(),
  reserved: new ReservedState(),
  confirmed: new ConfirmedState(),
  cancelled: new CancelledState(),
  expired: new ExpiredState(),
}

export function transitionTicket(ticket: Ticket, to: 'reserved' | 'confirmed' | 'cancelled' | 'expired'): Ticket {
  const state = STATE_MAP[ticket.status]
  switch (to) {
    case 'reserved': return state.reserve(ticket)
    case 'confirmed': return state.confirm(ticket)
    case 'cancelled': return state.cancel(ticket)
    case 'expired': return state.expire(ticket)
  }
}
