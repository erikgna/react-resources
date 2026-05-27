// POC10 — Facade pattern
// TicketingFacade is the single entry point for all ticketing operations.
// It orchestrates: validate → price → command → observe.
// API routes never call subsystems directly.

import { InventoryRegistry } from './registry'
import { CommandInvoker, PurchaseCommand, CancelCommand } from './command'
import { validateOrder } from './validation'
import { calculatePrice } from './pricing'
import { capacityBus } from './observer'
import { transitionTicket } from './state'
import type { PurchaseOrder, Ticket, TicketId, ZoneAvailability } from './types'

export class TicketingFacade {
  constructor(
    private registry: InventoryRegistry,
    private invoker: CommandInvoker
  ) {}

  purchaseTickets(order: PurchaseOrder): { tickets: readonly Ticket[]; totalPrice: number } {
    // 1. Validate (Template Method)
    const result = validateOrder(order, this.registry)
    if (!result.valid) throw new Error(`Purchase validation failed: ${result.errors.join('; ')}`)

    // 2. Price (Strategy)
    const show = this.registry.getShow(order.showId)!
    const zone = show.zones.find(z => z.type === order.zoneType)!
    const totalPrice = calculatePrice(order.zoneType, zone.pricePerSeat, order.quantity)

    // 3. Execute Command (Command pattern — reserve seats + create tickets)
    const cmd = new PurchaseCommand(this.registry, order)
    this.invoker.execute(cmd)

    // 4. Notify (Observer)
    capacityBus.emit({
      type: 'PURCHASE_COMPLETE',
      showId: order.showId,
      ticketCount: order.quantity,
      total: totalPrice,
    })

    const tickets = cmd.getIssuedTicketIds().map(id => this.registry.getTicket(id)!)
    return { tickets, totalPrice }
  }

  cancelTicket(ticketId: TicketId): Ticket {
    const ticket = this.registry.getTicket(ticketId)
    if (!ticket) throw new Error(`Ticket not found: ${ticketId}`)
    if (ticket.status === 'cancelled') throw new Error('Ticket already cancelled')

    const cmd = new CancelCommand(this.registry, ticketId)
    this.invoker.execute(cmd)

    return this.registry.getTicket(ticketId)!
  }

  undoLastAction(): void {
    this.invoker.undoLast()
  }

  getShowAvailability(showId: string): readonly ZoneAvailability[] {
    const show = this.registry.getShow(showId)
    if (!show) throw new Error(`Show not found: ${showId}`)
    return show.zones.map(z => Object.freeze({
      zoneId: z.id,
      zoneType: z.type,
      available: z.capacity - z.soldCount,
      capacity: z.capacity,
      soldCount: z.soldCount,
      pricePerSeat: z.pricePerSeat,
    }))
  }
}

// Module-level export — callers never new() this
export const ticketingFacade = new TicketingFacade(
  InventoryRegistry.getInstance(),
  new CommandInvoker()
)
