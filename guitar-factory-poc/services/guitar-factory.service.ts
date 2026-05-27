import { produceGuitar } from '../domain/factory'
import type { Guitar, GuitarSpec, ValidationResult } from '../domain/types'
import { GUITAR_OPTIONS } from '../domain/types'

export function validateSpec(spec: Partial<GuitarSpec>): ValidationResult {
  const errors: string[] = []

  if (!spec.type) errors.push('Guitar type is required')
  if (!spec.bodyWood) errors.push('Body wood is required')
  if (!spec.neckWood) errors.push('Neck wood is required')
  if (!spec.fretboardWood) errors.push('Fretboard wood is required')
  if (!spec.finish) errors.push('Finish is required')
  if (!spec.modelSeries) errors.push('Model series is required')

  if (spec.type && spec.pickupConfig) {
    const validPickups = GUITAR_OPTIONS.pickupConfigs[spec.type] as readonly string[]
    if (!validPickups.includes(spec.pickupConfig)) {
      errors.push(`Pickup config '${spec.pickupConfig}' is not valid for ${spec.type} guitars`)
    }
  } else if (!spec.pickupConfig) {
    errors.push('Pickup configuration is required')
  }

  if (spec.type && spec.scaleLength !== undefined) {
    const validScales = GUITAR_OPTIONS.scaleLengths[spec.type] as readonly number[]
    if (!validScales.includes(spec.scaleLength)) {
      errors.push(`Scale length ${spec.scaleLength}" is not valid for ${spec.type} guitars`)
    }
  } else if (spec.scaleLength === undefined) {
    errors.push('Scale length is required')
  }

  return { valid: errors.length === 0, errors }
}

export function createGuitar(spec: GuitarSpec): Guitar {
  const validation = validateSpec(spec)
  if (!validation.valid) {
    throw new Error(`Invalid spec: ${validation.errors.join('; ')}`)
  }
  const guitar = produceGuitar(spec)
  console.log(JSON.stringify({ event: 'GUITAR_CREATED', serial: guitar.serialNumber, type: spec.type, model: spec.modelSeries, ts: new Date().toISOString() }))
  return guitar
}
