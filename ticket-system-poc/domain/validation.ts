// POC09 — Template Method pattern
// validate() skeleton is fixed: checkCapacity → checkDateValidity → checkZoneRules.
// Subclasses only override checkZoneRules — they cannot alter the algorithm skeleton.

import { InventoryRegistry } from './registry'
import type { PurchaseOrder, ValidationResult, ShowType } from './types'

abstract class TicketValidator {
  validate(order: PurchaseOrder, registry: InventoryRegistry): ValidationResult {
    const errors: string[] = []
    this.checkCapacity(order, registry, errors)
    this.checkDateValidity(order, errors)
    this.checkZoneRules(order, registry, errors)
    return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) })
  }

  protected checkCapacity(order: PurchaseOrder, registry: InventoryRegistry, errors: string[]): void {
    const show = registry.getShow(order.showId)
    if (!show) { errors.push(`Show not found: ${order.showId}`); return }

    const zone = show.zones.find(z => z.type === order.zoneType)
    if (!zone) { errors.push(`Zone not found: ${order.zoneType}`); return }

    const available = zone.capacity - zone.soldCount
    if (order.quantity > available) {
      errors.push(`Insufficient capacity: ${available} seats available, ${order.quantity} requested`)
    }

    for (const seatId of order.seatIds) {
      const seat = registry.getSeat(seatId)
      if (!seat) { errors.push(`Seat not found: ${seatId}`); continue }
      if (seat.status !== 'available') {
        errors.push(`Seat not available: ${seatId} (status: ${seat.status})`)
      }
    }
  }

  protected checkDateValidity(order: PurchaseOrder, errors: string[]): void {
    if (new Date(order.date) <= new Date()) {
      errors.push(`Show date must be in the future: ${order.date}`)
    }
  }

  protected abstract checkZoneRules(order: PurchaseOrder, registry: InventoryRegistry, errors: string[]): void
}

class ConcertTicketValidator extends TicketValidator {
  protected checkZoneRules(order: PurchaseOrder, _registry: InventoryRegistry, errors: string[]): void {
    // General Admission: no seat assignments (quantity > 0, seatIds must be empty)
    if (order.zoneType === 'general' && order.seatIds.length > 0) {
      errors.push('General Admission zone does not use seat assignments')
    }
  }
}

class SportsTicketValidator extends TicketValidator {
  protected checkZoneRules(order: PurchaseOrder, _registry: InventoryRegistry, errors: string[]): void {
    if (order.zoneType === 'vip' && order.quantity > 4) {
      errors.push('VIP zone maximum is 4 tickets per order')
    }
  }
}

class TheaterTicketValidator extends TicketValidator {
  protected checkZoneRules(order: PurchaseOrder, _registry: InventoryRegistry, errors: string[]): void {
    if (order.quantity > 6) {
      errors.push('Maximum 6 tickets per order for theater shows')
    }
  }
}

const VALIDATOR_MAP: Record<ShowType, TicketValidator> = {
  concert: new ConcertTicketValidator(),
  sports: new SportsTicketValidator(),
  theater: new TheaterTicketValidator(),
}

export function getValidator(showType: ShowType): TicketValidator {
  return VALIDATOR_MAP[showType]
}

export function validateOrder(order: PurchaseOrder, registry: InventoryRegistry): ValidationResult {
  const show = registry.getShow(order.showId)
  if (!show) return Object.freeze({ valid: false, errors: [`Show not found: ${order.showId}`] })
  const validator = getValidator(show.type)
  return validator.validate(order, registry)
}
