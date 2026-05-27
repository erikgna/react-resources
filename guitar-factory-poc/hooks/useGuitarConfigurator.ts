'use client'
import { useReducer, useCallback } from 'react'
import type { GuitarSpec, Guitar } from '../domain/types'

type ConfiguratorState = {
  spec: Partial<GuitarSpec>
  step: number
  submitting: boolean
  submitError: string | null
  created: Guitar | null
}

type ConfiguratorAction =
  | { type: 'UPDATE_SPEC'; patch: Partial<GuitarSpec> }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS'; guitar: Guitar }
  | { type: 'SUBMIT_ERROR'; error: string }
  | { type: 'RESET' }

const TOTAL_STEPS = 4

function reducer(state: ConfiguratorState, action: ConfiguratorAction): ConfiguratorState {
  switch (action.type) {
    case 'UPDATE_SPEC':
      return { ...state, spec: { ...state.spec, ...action.patch } }
    case 'NEXT_STEP':
      return { ...state, step: Math.min(state.step + 1, TOTAL_STEPS - 1) }
    case 'PREV_STEP':
      return { ...state, step: Math.max(state.step - 1, 0) }
    case 'SUBMIT_START':
      return { ...state, submitting: true, submitError: null }
    case 'SUBMIT_SUCCESS':
      return { ...state, submitting: false, created: action.guitar, step: 0, spec: {} }
    case 'SUBMIT_ERROR':
      return { ...state, submitting: false, submitError: action.error }
    case 'RESET':
      return { spec: {}, step: 0, submitting: false, submitError: null, created: null }
    default:
      return state
  }
}

const INITIAL: ConfiguratorState = {
  spec: {},
  step: 0,
  submitting: false,
  submitError: null,
  created: null,
}

export function useGuitarConfigurator() {
  const [state, dispatch] = useReducer(reducer, INITIAL)

  const updateSpec = useCallback((patch: Partial<GuitarSpec>) => {
    dispatch({ type: 'UPDATE_SPEC', patch })
  }, [])

  const nextStep = useCallback(() => dispatch({ type: 'NEXT_STEP' }), [])
  const prevStep = useCallback(() => dispatch({ type: 'PREV_STEP' }), [])
  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])

  const submit = useCallback(async () => {
    dispatch({ type: 'SUBMIT_START' })
    try {
      const res = await fetch('/api/guitars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.spec),
      })
      if (!res.ok) {
        const data = await res.json() as { errors?: string[]; error?: string }
        const msg = data.errors?.join('; ') ?? data.error ?? 'Unknown error'
        dispatch({ type: 'SUBMIT_ERROR', error: msg })
        return
      }
      const guitar = await res.json() as Guitar
      dispatch({ type: 'SUBMIT_SUCCESS', guitar })
    } catch (err) {
      dispatch({ type: 'SUBMIT_ERROR', error: err instanceof Error ? err.message : 'Network error' })
    }
  }, [state.spec])

  return {
    spec: state.spec,
    step: state.step,
    totalSteps: TOTAL_STEPS,
    submitting: state.submitting,
    submitError: state.submitError,
    created: state.created,
    updateSpec,
    nextStep,
    prevStep,
    submit,
    reset,
  }
}
