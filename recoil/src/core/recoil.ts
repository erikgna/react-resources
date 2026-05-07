import {
  createContext, useContext, useRef, useSyncExternalStore, useCallback,
  createElement, type ReactNode, type ReactElement,
} from 'react'

// ─── Node descriptors — pure data, state lives in RecoilStore ────────────────

export interface AtomNode<T> { readonly __type: 'atom'; readonly key: string; readonly defaultValue: T }
export interface SelectorNode<T> { readonly __type: 'selector'; readonly key: string; readonly getFn: GetFn<T> }
export type RecoilNode<T> = AtomNode<T> | SelectorNode<T>
type GetFn<T> = (opts: { get: <S>(node: RecoilNode<S>) => S }) => T
type Listener = () => void

// ─── Public factories ─────────────────────────────────────────────────────────

export function atom<T>(config: { key: string; default: T }): AtomNode<T> {
  return { __type: 'atom', key: config.key, defaultValue: config.default }
}

export function selector<T>(config: { key: string; get: GetFn<T> }): SelectorNode<T> {
  return { __type: 'selector', key: config.key, getFn: config.get }
}

export function atomFamily<T, P>(config: { key: string; default: T | ((p: P) => T) }) {
  const cache = new Map<string, AtomNode<T>>()
  return (param: P): AtomNode<T> => {
    const k = JSON.stringify(param)
    if (!cache.has(k)) {
      const def =
        typeof config.default === 'function'
          ? (config.default as (p: P) => T)(param)
          : config.default
      cache.set(k, atom({ key: `${config.key}__${k}`, default: def }))
    }
    return cache.get(k)!
  }
}

export function selectorFamily<T, P>(config: { key: string; get: (p: P) => GetFn<T> }) {
  const cache = new Map<string, SelectorNode<T>>()
  return (param: P): SelectorNode<T> => {
    const k = JSON.stringify(param)
    if (!cache.has(k)) {
      cache.set(k, selector({ key: `${config.key}__${k}`, get: config.get(param) }))
    }
    return cache.get(k)!
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface AtomState { value: unknown; listeners: Set<Listener> }
interface SelectorState { cachedValue: unknown; dirty: boolean; atomDeps: Set<string> }

export class RecoilStore {
  private atomStates = new Map<string, AtomState>()
  private selectorStates = new Map<string, SelectorState>()
  private selectorGetFns = new Map<string, GetFn<unknown>>()

  ensureAtom<T>(node: AtomNode<T>): AtomState {
    if (!this.atomStates.has(node.key)) {
      this.atomStates.set(node.key, { value: node.defaultValue, listeners: new Set() })
    }
    return this.atomStates.get(node.key)!
  }

  ensureSelector<T>(node: SelectorNode<T>): SelectorState {
    if (!this.selectorStates.has(node.key)) {
      this.selectorStates.set(node.key, { cachedValue: undefined, dirty: true, atomDeps: new Set() })
      this.selectorGetFns.set(node.key, node.getFn as GetFn<unknown>)
    }
    return this.selectorStates.get(node.key)!
  }

  getAtomValue<T>(node: AtomNode<T>): T {
    return this.ensureAtom(node).value as T
  }

  setAtomValue<T>(node: AtomNode<T>, value: T): void {
    const state = this.ensureAtom(node)
    if (Object.is(state.value, value)) return
    state.value = value
    // Mark dependent selectors dirty so next read re-evaluates
    for (const [, ss] of this.selectorStates) {
      if (ss.atomDeps.has(node.key)) ss.dirty = true
    }
    for (const l of [...state.listeners]) l()
  }

  getSelectorValue<T>(node: SelectorNode<T>): T {
    const state = this.ensureSelector(node)
    if (!state.dirty) return state.cachedValue as T
    // Evaluate and track which atoms are accessed — the dep graph
    const deps = new Set<string>()
    const value = this.selectorGetFns.get(node.key)!({
      get: <S>(dep: RecoilNode<S>): S => {
        if (dep.__type === 'atom') {
          deps.add(dep.key)
          return this.getAtomValue(dep)
        }
        // Selector depending on selector: collect transitive atom deps
        const v = this.getSelectorValue(dep)
        const ds = this.selectorStates.get(dep.key)
        if (ds) for (const k of ds.atomDeps) deps.add(k)
        return v
      },
    })
    state.atomDeps = deps
    state.cachedValue = value
    state.dirty = false
    return value as T
  }

  subscribeAtom<T>(node: AtomNode<T>, listener: Listener): () => void {
    const state = this.ensureAtom(node)
    state.listeners.add(listener)
    return () => state.listeners.delete(listener)
  }

  subscribeSelector<T>(node: SelectorNode<T>, listener: Listener): () => void {
    // Evaluate first to discover atom deps, then subscribe to each dep atom
    this.getSelectorValue(node)
    const state = this.selectorStates.get(node.key)!
    const unsubs: (() => void)[] = []
    for (const atomKey of state.atomDeps) {
      const astate = this.atomStates.get(atomKey)!
      const wrapped = () => { state.dirty = true; listener() }
      astate.listeners.add(wrapped)
      unsubs.push(() => astate.listeners.delete(wrapped))
    }
    return () => unsubs.forEach(u => u())
  }

  readNode<T>(node: RecoilNode<T>): T {
    return node.__type === 'atom' ? this.getAtomValue(node) : this.getSelectorValue(node)
  }
}

// ─── React integration ────────────────────────────────────────────────────────

const StoreCtx = createContext<RecoilStore | null>(null)

export function RecoilRoot({ children }: { children: ReactNode }): ReactElement {
  const ref = useRef<RecoilStore>(null!)
  if (!ref.current) ref.current = new RecoilStore()
  return createElement(StoreCtx.Provider, { value: ref.current }, children)
}

function useStore(): RecoilStore {
  const s = useContext(StoreCtx)
  if (!s) throw new Error('Core Recoil hook used outside <RecoilRoot>')
  return s
}

export function useRecoilValue<T>(node: RecoilNode<T>): T {
  const store = useStore()
  return useSyncExternalStore(
    cb => node.__type === 'atom' ? store.subscribeAtom(node, cb) : store.subscribeSelector(node, cb),
    () => store.readNode(node),
  )
}

export function useSetRecoilState<T>(node: AtomNode<T>): (v: T | ((prev: T) => T)) => void {
  const store = useStore()
  return useCallback(
    v => {
      const prev = store.getAtomValue(node)
      store.setAtomValue(node, typeof v === 'function' ? (v as (p: T) => T)(prev) : v)
    },
    [store, node],
  )
}

export function useRecoilState<T>(node: AtomNode<T>): [T, (v: T | ((prev: T) => T)) => void] {
  return [useRecoilValue(node), useSetRecoilState(node)]
}

export function useRecoilCallback<Args extends unknown[], Return>(
  cb: (opts: {
    snapshot: { getLoadable: <T>(n: RecoilNode<T>) => T }
    set: <T>(n: AtomNode<T>, v: T) => void
  }) => (...args: Args) => Return,
) {
  const store = useStore()
  return useCallback(
    (...args: Args) =>
      cb({
        snapshot: { getLoadable: n => store.readNode(n) },
        set: (n, v) => store.setAtomValue(n, v),
      })(...args),
    [store, cb],
  )
}
