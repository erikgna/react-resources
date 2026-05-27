// POC07 — Command pattern with undo
// PurchaseCommand stores issuedTicketIds[] for targeted undo — no full registry scan needed.
// CommandInvoker maintains a LIFO history stack.

import { InventoryRegistry } from './registry'
import { transitionTicket } from './state'
import { capacityBus } from './observer'
import type { PurchaseOrder, TicketId, Seat } from './types'
import { randomUUID } from 'crypto'

export interface Command {
  execute(): void
  undo(): void
}

export class PurchaseCommand implements Command {
  private issuedTicketIds: TicketId[] = []
  private reservedSeatIds: string[] = []

  constructor(
    private registry: InventoryRegistry,
    private order: PurchaseOrder
  ) {}

  execute(): void {
    const show = this.registry.getShow(this.order.showId)
    if (!show) throw new Error(`Show not found: ${this.order.showId}`)

    const zone = show.zones.find(z => z.type === this.order.zoneType)
    if (!zone) throw new Error(`Zone not found: ${this.order.zoneType}`)

    for (const seatId of this.order.seatIds) {
      const seat = this.registry.getSeat(seatId)
      if (!seat) throw new Error(`Seat not found: ${seatId}`)
      if (seat.status !== 'available') throw new Error(`Seat not available: ${seatId}`)

      this.registry.updateSeatStatus(seatId, 'sold')
      this.reservedSeatIds.push(seatId)

      const updatedShow = this.registry.incrementZoneSoldCount(this.order.showId, zone.id)
      const updatedZone = updatedShow.zones.find(z => z.id === zone.id)!

      const ticket = this.registry.createTicket(Object.freeze({
        id: randomUUID(),
        showId: this.order.showId,
        seatId,
        zoneType: this.order.zoneType,
        priceCharged: zone.pricePerSeat,
        status: 'confirmed' as const,
        createdAt: new Date().toISOString(),
      }))
      this.issuedTicketIds.push(ticket.id)

      capacityBus.emit({ type: 'SEAT_SOLD', showId: this.order.showId, seatId, zoneId: zone.id })

      const soldPct = updatedZone.soldCount / updatedZone.capacity
      if (soldPct >= 1) {
        capacityBus.emit({ type: 'ZONE_FULL', showId: this.order.showId, zoneId: zone.id, capacity: updatedZone.capacity })
      } else if (soldPct >= 0.8 && updatedZone.soldCount - 1 < updatedZone.capacity * 0.8) {
        capacityBus.emit({ type: 'THRESHOLD_80', showId: this.order.showId, zoneId: zone.id, soldCount: updatedZone.soldCount, capacity: updatedZone.capacity })
      }
    }
  }

  undo(): void {
    const show = this.registry.getShow(this.order.showId)
    if (!show) return

    const zone = show.zones.find(z => z.type === this.order.zoneType)
    if (!zone) return

    for (const seatId of this.reservedSeatIds) {
      try {
        this.registry.updateSeatStatus(seatId, 'available')
        this.registry.decrementZoneSoldCount(this.order.showId, zone.id)
      } catch { /* seat may already be in different state */ }
    }

    for (const ticketId of this.issuedTicketIds) {
      this.registry.removeTicket(ticketId)
    }

    this.issuedTicketIds = []
    this.reservedSeatIds = []
  }

  getIssuedTicketIds(): readonly TicketId[] {
    return this.issuedTicketIds
  }
}

export class CancelCommand implements Command {
  private previousSeatStatus: 'available' | 'reserved' | 'sold' | null = null
  private affectedSeatId: string | null = null

  constructor(
    private registry: InventoryRegistry,
    private ticketId: TicketId
  ) {}

  execute(): void {
    const ticket = this.registry.getTicket(this.ticketId)
    if (!ticket) throw new Error(`Ticket not found: ${this.ticketId}`)

    const seat = this.registry.getSeat(ticket.seatId)
    if (seat) {
      this.previousSeatStatus = seat.status
      this.affectedSeatId = seat.id
      this.registry.updateSeatStatus(seat.id, 'available')

      const show = this.registry.getShow(ticket.showId)
      if (show) {
        const zone = show.zones.find(z => z.type === ticket.zoneType)
        if (zone) this.registry.decrementZoneSoldCount(ticket.showId, zone.id)
      }
    }

    this.registry.updateTicketStatus(this.ticketId, 'cancelled')
    capacityBus.emit({ type: 'TICKET_CANCELLED', showId: ticket.showId, ticketId: this.ticketId })
  }

  undo(): void {
    const ticket = this.registry.getTicket(this.ticketId)
    if (!ticket) return

    this.registry.updateTicketStatus(this.ticketId, 'confirmed')

    if (this.affectedSeatId && this.previousSeatStatus) {
      try {
        this.registry.updateSeatStatus(this.affectedSeatId, this.previousSeatStatus)
        const show = this.registry.getShow(ticket.showId)
        if (show) {
          const zone = show.zones.find(z => z.type === ticket.zoneType)
          if (zone) this.registry.incrementZoneSoldCount(ticket.showId, zone.id)
        }
      } catch { /* state may have changed */ }
    }
  }
}

export class CommandInvoker {
  private history: Command[] = []

  execute(cmd: Command): void {
    cmd.execute()
    this.history.push(cmd)
  }

  undoLast(): void {
    const cmd = this.history.pop()
    if (!cmd) return
    cmd.undo()
  }

  historyLength(): number {
    return this.history.length
  }
}
