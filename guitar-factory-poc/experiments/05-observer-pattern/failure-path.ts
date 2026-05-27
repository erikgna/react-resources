// Observer failure paths

import { InventoryStore } from '../../domain/inventory'
import { produceGuitar } from '../../domain/factory'

const store = new InventoryStore()

const g1 = produceGuitar({ type: 'electric', bodyWood: 'alder', neckWood: 'maple', fretboardWood: 'maple', pickupConfig: 'SSS', finish: 'gloss', scaleLength: 25.5, modelSeries: 'Standard' })

// 1. Remove non-existent guitar
try {
  store.remove('fake-id-123')
  console.error('SHOULD HAVE THROWN')
} catch (e) {
  console.log('[OK] Remove non-existent:', (e as Error).message)
}

// 2. Add duplicate
store.add(g1)
try {
  store.add(g1)
  console.error('SHOULD HAVE THROWN')
} catch (e) {
  console.log('[OK] Duplicate add caught:', (e as Error).message)
}

// 3. Observer unsubscribe stops receiving events
let callCount = 0
const unsubscribe = store.subscribe({ onEvent: () => { callCount++ } })
const g2 = produceGuitar({ type: 'bass', bodyWood: 'ash', neckWood: 'maple', fretboardWood: 'rosewood', pickupConfig: 'PJ', finish: 'satin', scaleLength: 34, modelSeries: 'Pro' })
store.add(g2)
console.log('[INFO] Events before unsubscribe:', callCount) // 1
unsubscribe()
store.remove(g2.id)
console.log('[INFO] Events after unsubscribe:', callCount) // still 1 — observer removed
console.log(callCount === 1 ? '[OK] Unsubscribe works' : '[FAIL] Observer leaked after unsubscribe')
