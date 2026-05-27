// POC02 — Builder Pattern: TicketOrderBuilder
// Key insight: seat() is ADDITIVE (pushes to array), not overwriting.
// build() validates all fields together — partial orders are caught at build time, not call time.

import type { PurchaseOrder, ShowId, SeatId, ZoneType } from '../../domain/types'

class TicketOrderBuilder {
  private _showId: ShowId | null = null
  private _seatIds: SeatId[] = []
  private _zoneType: ZoneType | null = null
  private _date: string | null = null
  private _quantity: number | null = null

  show(id: ShowId): this { this._showId = id; return this }
  seat(id: SeatId): this { this._seatIds.push(id); return this }
  zone(t: ZoneType): this { this._zoneType = t; return this }
  date(d: string): this { this._date = d; return this }
  quantity(n: number): this { this._quantity = n; return this }

  build(): PurchaseOrder {
    const errs: string[] = []
    if (!this._showId) errs.push('showId required')
    if (!this._zoneType) errs.push('zoneType required')
    if (!this._date) errs.push('date required')
    if (this._quantity === null) errs.push('quantity required')
    if (this._date && new Date(this._date) <= new Date()) errs.push('date must be in the future')
    if (this._quantity !== null && this._quantity > 0 && this._seatIds.length !== this._quantity) {
      errs.push(`seat count mismatch: ${this._seatIds.length} seats for quantity ${this._quantity}`)
    }
    if (errs.length) throw new Error(`Build failed: ${errs.join(', ')}`)
    return Object.freeze({ showId: this._showId!, seatIds: Object.freeze([...this._seatIds]), zoneType: this._zoneType!, quantity: this._quantity!, date: this._date! })
  }
}

// Happy path
const order = new TicketOrderBuilder()
  .show('concert-2026-08-15')
  .seat('A1').seat('A2').seat('A3')
  .zone('vip')
  .date('2026-08-15')
  .quantity(3)
  .build()

console.log(`[OK] Built order: showId=${order.showId}, qty=${order.quantity}, seats=${order.seatIds.join(',')}`)
console.log(`[OK] seat() is additive: ${order.seatIds.length} seats accumulated`)
console.log(`[OK] Frozen: ${Object.isFrozen(order)}`)
