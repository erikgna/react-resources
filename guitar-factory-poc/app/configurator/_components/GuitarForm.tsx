'use client'
import type { GuitarSpec } from '../../../domain/types'
import { GUITAR_OPTIONS } from '../../../domain/types'

type Props = {
  spec: Partial<GuitarSpec>
  step: number
  totalSteps: number
  onUpdate: (patch: Partial<GuitarSpec>) => void
  onNext: () => void
  onPrev: () => void
  onSubmit: () => void
  submitting: boolean
  error: string | null
}

const STEP_LABELS = ['Guitar Type', 'Woods', 'Pickups & Scale', 'Finish & Model']

function Select<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T | undefined
  options: readonly T[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        value={value ?? ''}
        onChange={e => onChange(e.target.value as T)}
      >
        <option value="">— select —</option>
        {options.map(o => (
          <option key={String(o)} value={String(o)}>{String(o)}</option>
        ))}
      </select>
    </div>
  )
}

export function GuitarForm({ spec, step, totalSteps, onUpdate, onNext, onPrev, onSubmit, submitting, error }: Props) {
  const canNext = (): boolean => {
    if (step === 0) return !!spec.type
    if (step === 1) return !!spec.bodyWood && !!spec.neckWood && !!spec.fretboardWood
    if (step === 2) return !!spec.pickupConfig && spec.scaleLength !== undefined
    if (step === 3) return !!spec.finish && !!spec.modelSeries
    return false
  }

  const pickupOptions = spec.type ? GUITAR_OPTIONS.pickupConfigs[spec.type] : []
  const scaleOptions = spec.type ? GUITAR_OPTIONS.scaleLengths[spec.type] : []

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === step ? 'bg-amber-500 text-white' : i < step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${i === step ? 'text-amber-700 font-semibold' : 'text-gray-400'}`}>{label}</span>
            {i < totalSteps - 1 && <div className="w-6 h-px bg-gray-300" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="space-y-4">
        {step === 0 && (
          <div className="grid grid-cols-2 gap-3">
            {GUITAR_OPTIONS.types.map(t => (
              <button
                key={t}
                onClick={() => onUpdate({ type: t, pickupConfig: undefined, scaleLength: undefined })}
                className={`p-4 rounded-lg border-2 text-sm font-medium capitalize transition-all ${spec.type === t ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-gray-200 hover:border-gray-400'}`}
              >
                {t === 'semi-hollow' ? 'Semi-Hollow' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Select label="Body Wood" value={spec.bodyWood} options={GUITAR_OPTIONS.bodyWoods} onChange={v => onUpdate({ bodyWood: v })} />
            <Select label="Neck Wood" value={spec.neckWood} options={GUITAR_OPTIONS.neckWoods} onChange={v => onUpdate({ neckWood: v })} />
            <Select label="Fretboard Wood" value={spec.fretboardWood} options={GUITAR_OPTIONS.fretboardWoods} onChange={v => onUpdate({ fretboardWood: v })} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Select label="Pickup Configuration" value={spec.pickupConfig} options={pickupOptions} onChange={v => onUpdate({ pickupConfig: v })} />
            <Select label="Scale Length (inches)" value={spec.scaleLength} options={scaleOptions} onChange={v => onUpdate({ scaleLength: Number(v) as typeof spec.scaleLength })} />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Select label="Finish" value={spec.finish} options={GUITAR_OPTIONS.finishes} onChange={v => onUpdate({ finish: v })} />
            <Select label="Model Series" value={spec.modelSeries} options={GUITAR_OPTIONS.modelSeries} onChange={v => onUpdate({ modelSeries: v })} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Custom Notes (optional)</label>
              <textarea
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                rows={3}
                value={spec.customNotes ?? ''}
                onChange={e => onUpdate({ customNotes: e.target.value })}
                placeholder="Special requests, color, hardware finish..."
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 text-sm rounded px-4 py-3">
          {error}
        </div>
      )}

      {/* Nav buttons */}
      <div className="flex justify-between pt-2">
        <button
          onClick={onPrev}
          disabled={step === 0}
          className="px-4 py-2 text-sm font-medium rounded border border-gray-300 disabled:opacity-30 hover:bg-gray-50"
        >
          Back
        </button>
        {step < totalSteps - 1 ? (
          <button
            onClick={onNext}
            disabled={!canNext()}
            className="px-5 py-2 text-sm font-semibold rounded bg-amber-500 text-white disabled:opacity-40 hover:bg-amber-600"
          >
            Next
          </button>
        ) : (
          <button
            onClick={onSubmit}
            disabled={!canNext() || submitting}
            className="px-5 py-2 text-sm font-semibold rounded bg-green-600 text-white disabled:opacity-40 hover:bg-green-700"
          >
            {submitting ? 'Building...' : 'Build Guitar'}
          </button>
        )}
      </div>
    </div>
  )
}
