// POC08 — Singleton pattern
// InventoryRegistry is the single source of truth for all show/seat/ticket state.
// Callers never construct this — only getInstance() is public.

import type { Show, ShowId, Seat, SeatId, Ticket, TicketId, TicketStatus, SeatStatus } from './types'

export class InventoryRegistry {
  private static instance: InventoryRegistry | null = null

  private shows: Map<ShowId, Show> = new Map()
  private seats: Map<SeatId, Seat> = new Map()
  private tickets: Map<TicketId, Ticket> = new Map()

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  static getInstance(): InventoryRegistry {
    if (!InventoryRegistry.instance) {
      InventoryRegistry.instance = new InventoryRegistry()
    }
    return InventoryRegistry.instance
  }

  // For test isolation only — never call in production code
  static resetForTests(): void {
    InventoryRegistry.instance = null
  }

  // Shows
  addShow(show: Show): void {
    if (this.shows.has(show.id)) throw new Error(`Show already exists: ${show.id}`)
    this.shows.set(show.id, Object.freeze({ ...show }))
  }

  getShow(id: ShowId): Show | undefined {
    return this.shows.get(id)
  }

  listShows(): readonly Show[] {
    return Array.from(this.shows.values())
  }

  count(): number {
    return this.shows.size
  }

  // Seats
  addSeat(seat: Seat): void {
    this.seats.set(seat.id, Object.freeze({ ...seat }))
  }

  getSeat(id: SeatId): Seat | undefined {
    return this.seats.get(id)
  }

  listSeatsByZone(showId: ShowId, zoneId: string): readonly Seat[] {
    return Array.from(this.seats.values()).filter(
      s => s.showId === showId && s.zoneId === zoneId
    )
  }

  listSeatsByShow(showId: ShowId): readonly Seat[] {
    return Array.from(this.seats.values()).filter(s => s.showId === showId)
  }

  updateSeatStatus(id: SeatId, status: SeatStatus): Seat {
    const seat = this.seats.get(id)
    if (!seat) throw new Error(`Seat not found: ${id}`)
    const updated = Object.freeze({ ...seat, status })
    this.seats.set(id, updated)
    return updated
  }

  // Tickets
  createTicket(ticket: Ticket): Ticket {
    const frozen = Object.freeze({ ...ticket })
    this.tickets.set(ticket.id, frozen)
    return frozen
  }

  getTicket(id: TicketId): Ticket | undefined {
    return this.tickets.get(id)
  }

  updateTicketStatus(id: TicketId, status: TicketStatus): Ticket {
    const ticket = this.tickets.get(id)
    if (!ticket) throw new Error(`Ticket not found: ${id}`)
    const updated = Object.freeze({ ...ticket, status })
    this.tickets.set(id, updated)
    return updated
  }

  removeTicket(id: TicketId): void {
    this.tickets.delete(id)
  }

  // Zone capacity helpers
  incrementZoneSoldCount(showId: ShowId, zoneId: string): Show {
    const show = this.shows.get(showId)
    if (!show) throw new Error(`Show not found: ${showId}`)
    const updatedZones = show.zones.map(z =>
      z.id === zoneId ? Object.freeze({ ...z, soldCount: z.soldCount + 1 }) : z
    )
    const updated = Object.freeze({ ...show, zones: Object.freeze(updatedZones) })
    this.shows.set(showId, updated)
    return updated
  }

  decrementZoneSoldCount(showId: ShowId, zoneId: string): Show {
    const show = this.shows.get(showId)
    if (!show) throw new Error(`Show not found: ${showId}`)
    const updatedZones = show.zones.map(z =>
      z.id === zoneId ? Object.freeze({ ...z, soldCount: Math.max(0, z.soldCount - 1) }) : z
    )
    const updated = Object.freeze({ ...show, zones: Object.freeze(updatedZones) })
    this.shows.set(showId, updated)
    return updated
  }
}
