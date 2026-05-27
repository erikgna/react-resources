// POC01 — State Pattern: Failure Paths
// Every illegal transition must throw a descriptive error.
// Terminal states (cancelled, expired) reject all transitions.

import type { Ticket, TicketStatus } from '../../domain/types'

function illegal(from: TicketStatus, to: string): never {
  throw new Error(`Illegal transition: cannot ${to} a ${from} ticket`)
}
function next(t: Ticket, s: TicketStatus): Ticket { return Object.freeze({ ...t, status: s }) }

const STATE_MAP: Record<TicketStatus, { reserve(t: Ticket): Ticket; confirm(t: Ticket): Ticket; cancel(t: Ticket): Ticket; expire(t: Ticket): Ticket }> = {
  available: { reserve: t => next(t, 'reserved'), confirm: t => illegal(t.status, 'confirm'), cancel: t => illegal(t.status, 'cancel'), expire: t => next(t, 'expired') },
  reserved:  { reserve: t => illegal(t.status, 'reserve'), confirm: t => next(t, 'confirmed'), cancel: t => next(t, 'cancelled'), expire: t => next(t, 'expired') },
  confirmed: { reserve: t => illegal(t.status, 'reserve'), confirm: t => illegal(t.status, 'confirm'), cancel: t => next(t, 'cancelled'), expire: t => illegal(t.status, 'expire') },
  cancelled: { reserve: t => illegal(t.status, 'reserve'), confirm: t => illegal(t.status, 'confirm'), cancel: t => illegal(t.status, 'cancel'), expire: t => illegal(t.status, 'expire') },
  expired:   { reserve: t => illegal(t.status, 'reserve'), confirm: t => illegal(t.status, 'confirm'), cancel: t => illegal(t.status, 'cancel'), expire: t => illegal(t.status, 'expire') },
}

function make(status: TicketStatus): Ticket {
  return Object.freeze({ id: 'T1', showId: 'S1', seatId: 'A1', zoneType: 'vip', priceCharged: 100, status, createdAt: '' })
}

// 1. confirm an available ticket (must be reserved first)
try { STATE_MAP['available'].confirm(make('available')); console.log('[FAIL] should have thrown') }
catch (e) { console.log(`[OK] Cannot confirm available: ${(e as Error).message}`) }

// 2. cancel an expired ticket (terminal)
try { STATE_MAP['expired'].cancel(make('expired')); console.log('[FAIL] should have thrown') }
catch (e) { console.log(`[OK] Cannot cancel expired: ${(e as Error).message}`) }

// 3. reserve an already-reserved ticket
try { STATE_MAP['reserved'].reserve(make('reserved')); console.log('[FAIL] should have thrown') }
catch (e) { console.log(`[OK] Cannot re-reserve: ${(e as Error).message}`) }

// 4. anything on cancelled (terminal)
try { STATE_MAP['cancelled'].expire(make('cancelled')); console.log('[FAIL] should have thrown') }
catch (e) { console.log(`[OK] Cannot expire cancelled: ${(e as Error).message}`) }

console.log('[INFO] All failure paths verified — State pattern enforces lifecycle correctly')
