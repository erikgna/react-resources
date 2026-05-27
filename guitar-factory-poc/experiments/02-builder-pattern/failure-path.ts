// Builder failure paths

import { GuitarBuilder } from '../../domain/builder'

// 1. Missing required field
try {
  new GuitarBuilder().setType('electric').build()
  console.error('SHOULD HAVE THROWN')
} catch (e) {
  console.log('[OK] Missing fields caught:', (e as Error).message)
}

// 2. Mutating returned Guitar (frozen object)
const guitar = new GuitarBuilder()
  .setType('electric')
  .setBodyWood('alder')
  .setNeckWood('maple')
  .setFretboardWood('rosewood')
  .setPickups('SSS')
  .setFinish('gloss')
  .setScale(25.5)
  .setModel('Standard')
  .build()

try {
  // @ts-expect-error — intentional mutation attempt
  guitar.status = 'sold'
  console.error('SHOULD HAVE THROWN — frozen object was mutable')
} catch {
  console.log('[OK] Frozen object rejected mutation')
}

// 3. Reusing builder after build — spec should reset per instance
const b = new GuitarBuilder()
b.setType('acoustic')
  .setBodyWood('mahogany')
  .setNeckWood('mahogany')
  .setFretboardWood('rosewood')
  .setPickups('single-acoustic')
  .setFinish('natural')
  .setScale(25.5)
  .setModel('Pro')
const g1 = b.build()
// Builder retains state — calling build() again produces another valid guitar
const g2 = b.build()
console.log('[INFO] Same builder, two builds. g1 serial:', g1.serialNumber, 'g2 serial:', g2.serialNumber)
console.log('[NOTE] Different serials, same spec. Builder is stateful — new instance per guitar is safer.')
