import '@/domain/store'
import { InventoryRegistry } from '@/domain/registry'
import { ticketingFacade } from '@/domain/facade'
import type { Show, ShowType, ZoneAvailability } from '@/domain/types'

const registry = InventoryRegistry.getInstance()

export function listShows(type?: ShowType): readonly Show[] {
  const all = registry.listShows()
  return type ? all.filter(s => s.type === type) : all
}

export function getShowById(id: string): Show | undefined {
  return registry.getShow(id)
}

export function getShowAvailability(id: string): readonly ZoneAvailability[] {
  return ticketingFacade.getShowAvailability(id)
}
