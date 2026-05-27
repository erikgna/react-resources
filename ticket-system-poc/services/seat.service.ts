import '@/domain/store'
import { InventoryRegistry } from '@/domain/registry'
import type { Seat } from '@/domain/types'

const registry = InventoryRegistry.getInstance()

export function listSeatsByZone(showId: string, zoneId: string): readonly Seat[] {
  return registry.listSeatsByZone(showId, zoneId)
}

export function listSeatsByShow(showId: string): readonly Seat[] {
  return registry.listSeatsByShow(showId)
}
