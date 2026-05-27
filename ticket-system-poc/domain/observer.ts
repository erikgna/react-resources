// POC04 — Observer pattern
// CapacityEventBus fires typed events when seat counts cross thresholds.
// Bus catches observer exceptions — publisher is never crashed by a subscriber.

import type { ShowId, SeatId, ZoneId } from './types'

export type CapacityEvent =
  | { type: 'SEAT_SOLD'; showId: ShowId; seatId: SeatId; zoneId: ZoneId }
  | { type: 'SEAT_RELEASED'; showId: ShowId; seatId: SeatId; zoneId: ZoneId }
  | { type: 'THRESHOLD_80'; showId: ShowId; zoneId: ZoneId; soldCount: number; capacity: number }
  | { type: 'ZONE_FULL'; showId: ShowId; zoneId: ZoneId; capacity: number }
  | { type: 'PURCHASE_COMPLETE'; showId: ShowId; ticketCount: number; total: number }
  | { type: 'TICKET_CANCELLED'; showId: ShowId; ticketId: string }

export interface CapacityObserver {
  onCapacityEvent(event: CapacityEvent): void
}

export class CapacityEventBus {
  private observers: Set<CapacityObserver> = new Set()

  subscribe(observer: CapacityObserver): () => void {
    this.observers.add(observer)
    return () => this.observers.delete(observer)
  }

  emit(event: CapacityEvent): void {
    for (const observer of this.observers) {
      try {
        observer.onCapacityEvent(event)
      } catch {
        // Observer failure must never crash the publisher
      }
    }
  }
}

export class LoggingObserver implements CapacityObserver {
  onCapacityEvent(event: CapacityEvent): void {
    console.log(JSON.stringify({ ...event, ts: new Date().toISOString() }))
  }
}

// Module-level singleton bus — all domain code emits through this
export const capacityBus = new CapacityEventBus()
capacityBus.subscribe(new LoggingObserver())
