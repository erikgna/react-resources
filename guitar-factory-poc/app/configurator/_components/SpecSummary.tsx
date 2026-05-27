'use client'
import type { GuitarSpec } from '../../../domain/types'

type Props = { spec: Partial<GuitarSpec> }

const LABELS: Record<keyof GuitarSpec, string> = {
  type: 'Type',
  bodyWood: 'Body Wood',
  neckWood: 'Neck Wood',
  fretboardWood: 'Fretboard',
  pickupConfig: 'Pickups',
  finish: 'Finish',
  scaleLength: 'Scale',
  modelSeries: 'Series',
  customNotes: 'Notes',
}

export function SpecSummary({ spec }: Props) {
  const entries = (Object.keys(LABELS) as (keyof GuitarSpec)[])
    .filter(k => spec[k] !== undefined && spec[k] !== '')

  if (entries.length === 0) {
    return (
      <div className="text-sm text-gray-400 italic">No specs selected yet.</div>
    )
  }

  return (
    <dl className="space-y-2">
      {entries.map(k => (
        <div key={k} className="flex justify-between text-sm">
          <dt className="text-gray-500">{LABELS[k]}</dt>
          <dd className="font-medium text-gray-800">
            {k === 'scaleLength' ? `${spec[k]}"` : String(spec[k])}
          </dd>
        </div>
      ))}
    </dl>
  )
}
