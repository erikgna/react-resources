import { inventoryStore } from '../domain/store'
import type { Guitar, GuitarSpec, GuitarStatus } from '../domain/types'

export function addToInventory(guitar: Guitar): void {
  inventoryStore.add(guitar)
}

export function removeFromInventory(id: string): void {
  inventoryStore.remove(id)
}

export function getInventory(): Guitar[] {
  return inventoryStore.list()
}

export function getGuitarById(id: string): Guitar | undefined {
  return inventoryStore.findById(id)
}

export function filterInventory(filter: Partial<GuitarSpec>): Guitar[] {
  return inventoryStore.filter(filter)
}

export function updateGuitarStatus(id: string, status: GuitarStatus): void {
  inventoryStore.updateStatus(id, status)
}
