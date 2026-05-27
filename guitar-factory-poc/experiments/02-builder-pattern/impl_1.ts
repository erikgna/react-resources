// Builder Pattern — impl_1 (with reference)
// Goal: understand method chaining, required field enforcement, immutable output

import { randomUUID } from 'crypto'

type GuitarType = 'electric' | 'acoustic' | 'bass'
type BodyWood = 'alder' | 'mahogany' | 'ash'
type Finish = 'gloss' | 'satin'

interface GuitarSpec {
  type: GuitarType
  bodyWood: BodyWood
  finish: Finish
}

interface Guitar {
  readonly id: string
  readonly spec: GuitarSpec
  readonly createdAt: string
}

class GuitarBuilder {
  private spec: Partial<GuitarSpec> = {}

  setType(t: GuitarType): this { this.spec.type = t; return this }
  setBodyWood(w: BodyWood): this { this.spec.bodyWood = w; return this }
  setFinish(f: Finish): this { this.spec.finish = f; return this }

  build(): Guitar {
    if (!this.spec.type || !this.spec.bodyWood || !this.spec.finish) {
      throw new Error('Missing required fields')
    }
    return Object.freeze({
      id: randomUUID(),
      spec: Object.freeze({ ...this.spec }) as GuitarSpec,
      createdAt: new Date().toISOString(),
    })
  }
}

// Usage
const guitar = new GuitarBuilder()
  .setType('electric')
  .setBodyWood('alder')
  .setFinish('gloss')
  .build()

console.log(guitar)

// Failure path: missing field
try {
  new GuitarBuilder().setType('bass').build()
} catch (e) {
  console.log('Expected error:', (e as Error).message)
}
