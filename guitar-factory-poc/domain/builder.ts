import { randomUUID } from 'crypto'
import type {
  Guitar,
  GuitarSpec,
  GuitarType,
  BodyWood,
  NeckWood,
  FretboardWood,
  PickupConfig,
  Finish,
  ScaleLength,
  ModelSeries,
} from './types'

let serialCounter = 1

function nextSerial(): string {
  const year = new Date().getFullYear()
  const seq = String(serialCounter++).padStart(4, '0')
  return `GF-${year}-${seq}`
}

export class GuitarBuilder {
  private spec: Partial<GuitarSpec> = {}

  setType(t: GuitarType): this { this.spec.type = t; return this }
  setBodyWood(w: BodyWood): this { this.spec.bodyWood = w; return this }
  setNeckWood(w: NeckWood): this { this.spec.neckWood = w; return this }
  setFretboardWood(w: FretboardWood): this { this.spec.fretboardWood = w; return this }
  setPickups(p: PickupConfig): this { this.spec.pickupConfig = p; return this }
  setFinish(f: Finish): this { this.spec.finish = f; return this }
  setScale(s: ScaleLength): this { this.spec.scaleLength = s; return this }
  setModel(m: ModelSeries): this { this.spec.modelSeries = m; return this }
  setNotes(n: string): this { this.spec.customNotes = n; return this }

  build(): Guitar {
    const required: (keyof GuitarSpec)[] = [
      'type', 'bodyWood', 'neckWood', 'fretboardWood',
      'pickupConfig', 'finish', 'scaleLength', 'modelSeries',
    ]
    const missing = required.filter(k => this.spec[k] === undefined)
    if (missing.length > 0) {
      throw new Error(`GuitarBuilder: missing required fields: ${missing.join(', ')}`)
    }

    return Object.freeze({
      id: randomUUID(),
      serialNumber: nextSerial(),
      spec: Object.freeze({ ...this.spec }) as GuitarSpec,
      createdAt: new Date().toISOString(),
      status: 'in-stock',
    })
  }
}

export function resetSerialCounter(start = 1): void {
  serialCounter = start
}
