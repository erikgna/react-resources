export type GuitarType = 'electric' | 'acoustic' | 'bass' | 'semi-hollow'

export type BodyWood = 'alder' | 'ash' | 'mahogany' | 'maple' | 'basswood'
export type NeckWood = 'maple' | 'mahogany' | 'roasted-maple'
export type FretboardWood = 'rosewood' | 'ebony' | 'maple' | 'pau-ferro'
export type PickupConfig = 'SSS' | 'HSS' | 'HH' | 'P90' | 'single-acoustic' | 'PJ'
export type Finish = 'gloss' | 'satin' | 'natural' | 'matte'
export type ScaleLength = 24.75 | 25.5 | 30 | 32 | 34
export type ModelSeries = 'Standard' | 'Pro' | 'Custom' | 'Signature'
export type GuitarStatus = 'in-stock' | 'reserved' | 'sold'

export interface GuitarSpec {
  type: GuitarType
  bodyWood: BodyWood
  neckWood: NeckWood
  fretboardWood: FretboardWood
  pickupConfig: PickupConfig
  finish: Finish
  scaleLength: ScaleLength
  modelSeries: ModelSeries
  customNotes?: string
}

export interface Guitar {
  readonly id: string
  readonly serialNumber: string
  readonly spec: GuitarSpec
  readonly createdAt: string
  readonly status: GuitarStatus
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export const GUITAR_OPTIONS = {
  types: ['electric', 'acoustic', 'bass', 'semi-hollow'] as GuitarType[],
  bodyWoods: ['alder', 'ash', 'mahogany', 'maple', 'basswood'] as BodyWood[],
  neckWoods: ['maple', 'mahogany', 'roasted-maple'] as NeckWood[],
  fretboardWoods: ['rosewood', 'ebony', 'maple', 'pau-ferro'] as FretboardWood[],
  pickupConfigs: {
    electric: ['SSS', 'HSS', 'HH', 'P90'] as PickupConfig[],
    acoustic: ['single-acoustic'] as PickupConfig[],
    bass: ['PJ', 'HH'] as PickupConfig[],
    'semi-hollow': ['HH', 'P90'] as PickupConfig[],
  },
  finishes: ['gloss', 'satin', 'natural', 'matte'] as Finish[],
  scaleLengths: {
    electric: [24.75, 25.5] as ScaleLength[],
    acoustic: [25.5] as ScaleLength[],
    bass: [30, 32, 34] as ScaleLength[],
    'semi-hollow': [24.75, 25.5] as ScaleLength[],
  },
  modelSeries: ['Standard', 'Pro', 'Custom', 'Signature'] as ModelSeries[],
} as const
