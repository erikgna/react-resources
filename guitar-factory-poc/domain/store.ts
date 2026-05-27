import { InventoryStore } from './inventory'
import { produceGuitar } from './factory'
import type { GuitarSpec } from './types'

// In-memory singleton — lives for process lifetime
const inventoryStore = new InventoryStore()

function seed(): void {
  const seeds: GuitarSpec[] = [
    { type: 'electric', bodyWood: 'alder', neckWood: 'maple', fretboardWood: 'maple', pickupConfig: 'SSS', finish: 'gloss', scaleLength: 25.5, modelSeries: 'Standard', customNotes: 'Sunburst finish' },
    { type: 'electric', bodyWood: 'mahogany', neckWood: 'mahogany', fretboardWood: 'rosewood', pickupConfig: 'HH', finish: 'satin', scaleLength: 24.75, modelSeries: 'Pro' },
    { type: 'acoustic', bodyWood: 'mahogany', neckWood: 'mahogany', fretboardWood: 'rosewood', pickupConfig: 'single-acoustic', finish: 'natural', scaleLength: 25.5, modelSeries: 'Standard' },
    { type: 'bass', bodyWood: 'ash', neckWood: 'maple', fretboardWood: 'rosewood', pickupConfig: 'PJ', finish: 'gloss', scaleLength: 34, modelSeries: 'Pro' },
    { type: 'semi-hollow', bodyWood: 'maple', neckWood: 'maple', fretboardWood: 'rosewood', pickupConfig: 'HH', finish: 'gloss', scaleLength: 24.75, modelSeries: 'Signature', customNotes: 'Thinline body' },
  ]
  for (const spec of seeds) {
    try {
      inventoryStore.add(produceGuitar(spec))
    } catch {
      // already seeded in hot-reload
    }
  }
  console.log(JSON.stringify({ event: 'INVENTORY_SEEDED', count: inventoryStore.count(), ts: new Date().toISOString() }))
}

seed()

export { inventoryStore }
