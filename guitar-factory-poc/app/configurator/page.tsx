'use client'
import Link from 'next/link'
import { useGuitarConfigurator } from '../../hooks/useGuitarConfigurator'
import { GuitarForm } from './_components/GuitarForm'
import { SpecSummary } from './_components/SpecSummary'

export default function ConfiguratorPage() {
  const { spec, step, totalSteps, submitting, submitError, created, updateSpec, nextStep, prevStep, submit, reset } = useGuitarConfigurator()

  if (created) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-4">
        <div className="text-5xl">🎸</div>
        <h2 className="text-2xl font-bold text-green-700">Guitar Built!</h2>
        <p className="text-gray-600">Serial: <span className="font-mono font-bold">{created.serialNumber}</span></p>
        <p className="text-gray-600 capitalize">{created.spec.modelSeries} {created.spec.type} — {created.spec.finish} finish</p>
        <div className="flex gap-3 justify-center pt-4">
          <button onClick={reset} className="px-5 py-2 bg-amber-500 text-white rounded font-semibold hover:bg-amber-600">
            Build Another
          </button>
          <Link href="/inventory" className="px-5 py-2 bg-gray-800 text-white rounded font-semibold hover:bg-gray-700">
            View Inventory
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Guitar Configurator</h1>
      <p className="text-gray-500 mb-8 text-sm">Specify your guitar. The factory builds it and adds it to inventory.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <GuitarForm
            spec={spec}
            step={step}
            totalSteps={totalSteps}
            onUpdate={updateSpec}
            onNext={nextStep}
            onPrev={prevStep}
            onSubmit={submit}
            submitting={submitting}
            error={submitError}
          />
        </div>

        <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 h-fit">
          <h3 className="text-sm font-semibold text-amber-800 mb-4 uppercase tracking-wide">Current Spec</h3>
          <SpecSummary spec={spec} />
        </div>
      </div>
    </div>
  )
}
