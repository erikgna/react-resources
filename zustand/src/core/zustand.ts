// Minimal reimplementation of Zustand's core.
// Covers: createStore (vanilla), useStore (React hook via useSyncExternalStore), shallow.
// Read this before using the real Zustand API to understand what it does.

import { useSyncExternalStore, useRef } from 'react'

type Listener<T> = (state: T, prevState: T) => void

export type SetState<T> = {
  (partial: T | Partial<T> | ((state: T) => T | Partial<T>), replace?: false): void
  (state: T | ((state: T) => T), replace: true): void
}

export type StoreApi<T> = {
  getState: () => T
  getInitialState: () => T
  setState: SetState<T>
  subscribe: (listener: Listener<T>) => () => void
  destroy: () => void
}

type StateCreator<T> = (set: SetState<T>, get: () => T, api: StoreApi<T>) => T

// ─── createStore ──────────────────────────────────────────────────────────────
// The entire Zustand vanilla store is ~30 lines in vanilla.js.
// Listener Set + setState (merge/replace) + subscribe (returns unsub) + destroy.

export function createStore<T>(initializer: StateCreator<T>): StoreApi<T> {
  let state: T
  let initialState: T
  const listeners = new Set<Listener<T>>()

  const setState: SetState<T> = (partial, replace?) => {
    const prev = state
    const next =
      typeof partial === 'function'
        ? (partial as (s: T) => T | Partial<T>)(prev)
        : partial

    if (Object.is(next, prev)) return

    // Merge by default; replace=true skips Object.assign
    state = (replace === true ? next : Object.assign({}, prev, next)) as T

    // Snapshot listeners before iterating — a listener may add/remove others
    const snapshot = [...listeners]
    snapshot.forEach(l => l(state, prev))
  }

  const getState = () => state
  const getInitialState = () => initialState

  // subscribe returns the unsubscribe function — forgetting to call it leaks memory
  const subscribe = (listener: Listener<T>) => {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }

  const destroy = () => listeners.clear()

  const api: StoreApi<T> = { getState, getInitialState, setState, subscribe, destroy }

  state = initializer(setState, getState, api)
  initialState = state  // frozen snapshot for getInitialState / SSR

  return api
}

// ─── shallow ──────────────────────────────────────────────────────────────────
// Iterates own keys, compares each with Object.is. NOT recursive.
// Nested object { x: { n: 1 } } compared as reference — not deep-equal.

export function shallow<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true
  if (typeof a !== 'object' || !a || typeof b !== 'object' || !b) return false
  const keysA = Object.keys(a as object)
  const keysB = Object.keys(b as object)
  if (keysA.length !== keysB.length) return false
  return keysA.every(k =>
    Object.is(
      (a as Record<string, unknown>)[k],
      (b as Record<string, unknown>)[k],
    )
  )
}

// ─── useStore ─────────────────────────────────────────────────────────────────
// Wires StoreApi to useSyncExternalStore.
//
// Without selector: getSnapshot = getState → new object every setState → always re-renders.
// With selector + equalityFn: returns previous slice reference when equal →
//   Object.is(prev, prev) → React skips the re-render.
//
// Key insight: useSyncExternalStore compares snapshots with Object.is.
// Returning the same reference (via prevRef) is how equality-based memoization works.

export function useStore<T>(store: StoreApi<T>): T
export function useStore<T, U>(
  store: StoreApi<T>,
  selector: (state: T) => U,
  equalityFn?: (a: U, b: U) => boolean,
): U
export function useStore<T, U = T>(
  store: StoreApi<T>,
  selector?: (state: T) => U,
  equalityFn?: (a: U, b: U) => boolean,
): U {
  const prevRef = useRef<{ value: U } | null>(null)

  const getSnapshot = (): U => {
    const state = store.getState()
    const next = selector ? selector(state) : (state as unknown as U)

    // If equalityFn says equal, return the previous reference so Object.is passes
    if (prevRef.current && equalityFn && equalityFn(prevRef.current.value, next)) {
      return prevRef.current.value
    }
    prevRef.current = { value: next }
    return next
  }

  const getServerSnapshot = (): U => {
    const state = store.getInitialState()
    return selector ? selector(state) : (state as unknown as U)
  }

  // Cast required: our subscribe passes (state, prevState) but useSyncExternalStore
  // calls the listener with no args. Extra params are ignored at runtime.
  return useSyncExternalStore(
    store.subscribe as unknown as (onStoreChange: () => void) => () => void,
    getSnapshot,
    getServerSnapshot,
  )
}
