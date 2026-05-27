// POC02 — Builder: Failure Paths
// build() without required fields, quantity mismatch, past date

import type { ZoneType } from '../../domain/types'

class TicketOrderBuilder {
  private _showId: string | null = null
  private _seatIds: string[] = []
  private _zoneType: ZoneType | null = null
  private _date: string | null = null
  private _quantity: number | null = null

  show(id: string): this { this._showId = id; return this }
  seat(id: string): this { this._seatIds.push(id); return this }
  zone(t: ZoneType): this { this._zoneType = t; return this }
  date(d: string): this { this._date = d; return this }
  quantity(n: number): this { this._quantity = n; return this }

  build() {
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
    return { showId: this._showId, seatIds: [...this._seatIds], zoneType: this._zoneType, quantity: this._quantity, date: this._date }
  }
}

// 1. build without show
try { new TicketOrderBuilder().zone('vip').date('2026-08-15').quantity(1).seat('A1').build() }
catch (e) { console.log(`[OK] Missing showId: ${(e as Error).message}`) }

// 2. quantity mismatch
try { new TicketOrderBuilder().show('S1').zone('vip').date('2026-08-15').quantity(3).seat('A1').seat('A2').build() }
catch (e) { console.log(`[OK] Seat mismatch: ${(e as Error).message}`) }

// 3. past date
try { new TicketOrderBuilder().show('S1').zone('vip').date('2020-01-01').quantity(1).seat('A1').build() }
catch (e) { console.log(`[OK] Past date: ${(e as Error).message}`) }

// 4. zero quantity — valid (no seat requirement)
const order = new TicketOrderBuilder().show('S1').zone('general').date('2026-08-15').quantity(0).build()
console.log(`[OK] Zero quantity is valid (GA zone): qty=${order.quantity}, seats=${order.seatIds.length}`)

console.log('[INFO] Builder validates at build() time, not at setter time')
