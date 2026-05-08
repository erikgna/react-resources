// Minimal reimplementation of Jotai's reactive core.
// Key insight vs Recoil: atoms have NO key string — identity is the object reference.
// Key insight vs Zustand: no single global store object; state lives in a Store class
// keyed by atom identity (WeakMap), and a global singleton store is used by default.

import { useCallback, useContext, createContext, useRef, useSyncExternalStore, createElement, type ReactNode } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────────

type Listener = () => void
// Internal getter: tracks dep reads during evaluation
type InternalGet = (atom: CoreAtom) => unknown
// Internal setter: dispatches writes through the store
type InternalSet = (atom: CoreAtom, ...args: unknown[]) => void

// Base shape — every atom is one of these three flavors
export type CoreAtom =
  | { __type: 'primitive'; init: unknown; write: (get: InternalGet, set: InternalSet, update: unknown) => void; debugLabel?: string }
  | { __type: 'derived';   read: (get: InternalGet) => unknown; debugLabel?: string }
  | { __type: 'writable';  read: (get: InternalGet) => unknown; write: (get: InternalGet, set: InternalSet, ...args: unknown[]) => void; debugLabel?: string }

// Typed public-facing wrappers — nominal-like types over CoreAtom
export type PrimitiveAtom<T> = CoreAtom & {
  readonly __type: 'primitive'
  readonly init: T
  debugLabel?: string
}

export type ReadAtom<T> = CoreAtom & {
  readonly __type: 'derived'
  readonly _phantom?: T
  debugLabel?: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type WritableAtom<T = unknown, _A extends unknown[] = unknown[]> = CoreAtom & {
  readonly __type: 'writable' | 'primitive'
  readonly _phantom?: T
  debugLabel?: string
}

// ─── atom() factory ────────────────────────────────────────────────────────────
// Overload 1: atom(value)            → PrimitiveAtom with default setState-style setter
// Overload 2: atom(readFn)           → ReadAtom (read-only derived)
// Overload 3: atom(readFn, writeFn)  → WritableAtom (read-write derived)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function atom<T>(init: T): PrimitiveAtom<T> & WritableAtom<T, any[]>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function atom<T>(read: (get: InternalGet) => T): ReadAtom<T>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function atom<T>(init: T | ((get: InternalGet) => T), write?: (...args: any[]) => void): CoreAtom {
  if (typeof init === 'function') {
    const readFn = init as (get: InternalGet) => T
    if (write) {
      return { __type: 'writable', read: readFn, write } satisfies CoreAtom
    }
    return { __type: 'derived', read: readFn } satisfies CoreAtom
  }
  // Primitive atom — default write applies a setState-style update
  let result!: CoreAtom
  const defaultWrite = (_get: InternalGet, set: InternalSet, update: unknown) => {
    const prev = _get(result)
    set(result, typeof update === 'function' ? (update as (p: T) => T)(prev as T) : update)
  }
  result = { __type: 'primitive', init, write: defaultWrite } satisfies CoreAtom
  return result
}

// ─── Store ─────────────────────────────────────────────────────────────────────
// Holds atom state keyed by atom object reference (WeakMap).
// This is the critical difference from Recoil: no string registry.

interface AtomState {
  value: unknown
  listeners: Set<Listener>
  depUnsubs: (() => void)[]
}

export class Store {
  private states = new WeakMap<CoreAtom, AtomState>()

  private getOrInit(atom: CoreAtom): AtomState {
    if (!this.states.has(atom)) {
      const value = atom.__type === 'primitive'
        ? atom.init
        : this.evalDerived(atom)
      this.states.set(atom, { value, listeners: new Set(), depUnsubs: [] })
    }
    return this.states.get(atom)!
  }

  private evalDerived(atom: CoreAtom): unknown {
    if (atom.__type === 'primitive') return atom.init
    const deps = new Set<CoreAtom>()
    const getter: InternalGet = (dep) => {
      deps.add(dep)
      return this.get(dep)
    }
    const value = atom.read(getter)
    // Re-subscribe to deps so we invalidate on change
    const state = this.states.get(atom)
    if (state) {
      state.depUnsubs.forEach(u => u())
      state.depUnsubs = [...deps].map(dep =>
        this.subscribe(dep, () => this.invalidate(atom))
      )
    }
    return value
  }

  private invalidate(atom: CoreAtom): void {
    const state = this.states.get(atom)
    if (!state) return
    const next = this.evalDerived(atom)
    if (Object.is(state.value, next)) return
    state.value = next
    ;[...state.listeners].forEach(l => l())
  }

  get<T>(atom: PrimitiveAtom<T> | ReadAtom<T> | WritableAtom<T>): T {
    return this.getOrInit(atom as CoreAtom).value as T
  }

  set<T, A extends unknown[]>(atom: WritableAtom<T, A> | PrimitiveAtom<T>, ...args: A): void {
    const a = atom as CoreAtom
    if (a.__type === 'primitive') {
      const state = this.getOrInit(a)
      const next = args[0]
      if (Object.is(state.value, next)) return
      state.value = next
      ;[...state.listeners].forEach(l => l())
      return
    }
    if (a.__type === 'writable') {
      const getter: InternalGet = (dep) => this.get(dep as PrimitiveAtom<unknown>)
      const setter: InternalSet = (dep, ...depArgs) =>
        this.set(dep as PrimitiveAtom<unknown>, ...depArgs)
      a.write(getter, setter, ...args)
      return
    }
    throw new Error('Cannot write to a read-only derived atom')
  }

  subscribe<T>(atom: PrimitiveAtom<T> | ReadAtom<T> | WritableAtom<T>, listener: Listener): () => void {
    const state = this.getOrInit(atom as CoreAtom)
    state.listeners.add(listener)
    // Ensure derived atoms are evaluated so dep subscriptions are wired
    if ((atom as CoreAtom).__type !== 'primitive') this.evalDerived(atom as CoreAtom)
    return () => state.listeners.delete(listener)
  }
}

// ─── Global default store ──────────────────────────────────────────────────────
// This is what makes Jotai work without any Provider.

const globalStore = new Store()

export function createStore(): Store {
  return new Store()
}

// ─── React context for scoped stores ──────────────────────────────────────────

const StoreCtx = createContext<Store>(globalStore)

export function Provider({ store, children }: { store: Store; children: ReactNode }) {
  return createElement(StoreCtx.Provider, { value: store }, children)
}

function useActiveStore(): Store {
  return useContext(StoreCtx)
}

// ─── React hooks ───────────────────────────────────────────────────────────────

export function useAtomValue<T>(atomArg: PrimitiveAtom<T> | ReadAtom<T> | WritableAtom<T>): T {
  const store = useActiveStore()
  const atomRef = useRef(atomArg)
  atomRef.current = atomArg
  return useSyncExternalStore(
    useCallback(cb => store.subscribe(atomRef.current, cb), [store]),
    () => store.get(atomRef.current),
  ) as T
}

export function useSetAtom<T, A extends unknown[]>(
  atomArg: WritableAtom<T, A> | PrimitiveAtom<T>,
): (...args: A) => void {
  const store = useActiveStore()
  return useCallback((...args: A) => store.set(atomArg as PrimitiveAtom<T>, ...args), [store, atomArg])
}

export function useAtom<T>(
  atomArg: (PrimitiveAtom<T> & WritableAtom<T>) | WritableAtom<T>,
): [T, (update: T | ((prev: T) => T)) => void] {
  const value = useAtomValue(atomArg)
  const set = useSetAtom(atomArg as WritableAtom<T, [T | ((prev: T) => T)]>)
  return [value as T, set]
}

// ─── atomFamily ────────────────────────────────────────────────────────────────
// Returns a function that maps params → stable atom instances.
// Atoms are cached by JSON.stringify(param) so equal params get the same atom.

export function atomFamily<T, P>(initFn: (param: P) => T) {
  const cache = new Map<string, PrimitiveAtom<T> & WritableAtom<T>>()
  const family = (param: P): PrimitiveAtom<T> & WritableAtom<T> => {
    const key = JSON.stringify(param)
    if (!cache.has(key)) {
      cache.set(key, atom(initFn(param)))
    }
    return cache.get(key)!
  }
  family.remove = (param: P) => cache.delete(JSON.stringify(param))
  family.cache = cache
  return family
}
