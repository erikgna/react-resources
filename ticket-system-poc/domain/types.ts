export type ShowId = string
export type SeatId = string
export type TicketId = string
export type ZoneId = string

export type ZoneType = 'vip' | 'premium' | 'general'
export type ShowType = 'concert' | 'sports' | 'theater'
export type TicketStatus = 'available' | 'reserved' | 'confirmed' | 'cancelled' | 'expired'
export type SeatStatus = 'available' | 'reserved' | 'sold'

export interface Zone {
  readonly id: ZoneId
  readonly type: ZoneType
  readonly capacity: number
  readonly pricePerSeat: number
  readonly soldCount: number
}

export interface Show {
  readonly id: ShowId
  readonly name: string
  readonly type: ShowType
  readonly date: string
  readonly venueId: string
  readonly venueName: string
  readonly zones: readonly Zone[]
}

export interface Seat {
  readonly id: SeatId
  readonly showId: ShowId
  readonly zoneId: ZoneId
  readonly zoneType: ZoneType
  readonly row: string
  readonly number: number
  readonly status: SeatStatus
}

export interface Ticket {
  readonly id: TicketId
  readonly showId: ShowId
  readonly seatId: SeatId
  readonly zoneType: ZoneType
  readonly priceCharged: number
  readonly status: TicketStatus
  readonly createdAt: string
}

export interface PurchaseOrder {
  readonly showId: ShowId
  readonly seatIds: readonly SeatId[]
  readonly zoneType: ZoneType
  readonly quantity: number
  readonly date: string
}

export interface ValidationResult {
  readonly valid: boolean
  readonly errors: readonly string[]
}

export interface ZoneAvailability {
  readonly zoneId: ZoneId
  readonly zoneType: ZoneType
  readonly available: number
  readonly capacity: number
  readonly soldCount: number
  readonly pricePerSeat: number
}
