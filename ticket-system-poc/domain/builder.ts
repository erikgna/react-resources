// POC02 — Builder pattern
// TicketOrderBuilder accumulates seat IDs (additive, not overwrite) and validates
// all required fields before returning a frozen PurchaseOrder.

import type { PurchaseOrder, ShowId, SeatId, ZoneType } from './types'

export class TicketOrderBuilder {
  private _showId: ShowId | null = null
  private _seatIds: SeatId[] = []
  private _zoneType: ZoneType | null = null
  private _date: string | null = null
  private _quantity: number | null = null

  show(id: ShowId): this {
    this._showId = id
    return this
  }

  seat(id: SeatId): this {
    this._seatIds.push(id)
    return this
  }

  zone(type: ZoneType): this {
    this._zoneType = type
    return this
  }

  date(isoDate: string): this {
    this._date = isoDate
    return this
  }

  quantity(n: number): this {
    this._quantity = n
    return this
  }

  build(): PurchaseOrder {
    const errors: string[] = []

    if (!this._showId) errors.push('showId is required')
    if (!this._zoneType) errors.push('zoneType is required')
    if (!this._date) errors.push('date is required')
    if (this._quantity === null) errors.push('quantity is required')

    if (this._date) {
      if (new Date(this._date) <= new Date()) {
        errors.push('date must be in the future')
      }
    }

    if (this._quantity !== null && this._quantity > 0 && this._seatIds.length !== this._quantity) {
      errors.push(`seat count mismatch: ${this._seatIds.length} seats for quantity ${this._quantity}`)
    }

    if (errors.length > 0) throw new Error(`TicketOrderBuilder.build() failed: ${errors.join(', ')}`)

    return Object.freeze({
      showId: this._showId!,
      seatIds: Object.freeze([...this._seatIds]),
      zoneType: this._zoneType!,
      quantity: this._quantity!,
      date: this._date!,
    })
  }
}
