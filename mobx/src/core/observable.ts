// Minimal reimplementation of MobX's reactive core.
// Corresponds to: Atom (ObservableBox), ComputedValue (ComputedBox),
// Reaction (autorun), and transaction (batch).
// Read this before using the real MobX API to understand what it does.

export type Listener = () => void

// Global tracking context — set while a computed or autorun is executing.
// Any observable that is read while this is active registers itself as a dependency.
let currentTracker: { track: (obs: ObservableBox<unknown>) => void } | null = null

// Batch (transaction) state — while batchDepth > 0, notifications are deferred.
let batchDepth = 0
const pendingNotifications = new Set<ObservableBox<unknown>>()

// ─── ObservableBox ─────────────────────────────────────────────────────────────
// The atom: holds a single value, notifies listeners on change.
// Equivalent to MobX's Atom + observable.box().

export class ObservableBox<T> {
  private _value: T
  private _listeners = new Set<Listener>()

  constructor(value: T) {
    this._value = value
  }

  get(): T {
    // Register with the active tracker (computed or autorun running right now)
    if (currentTracker) {
      currentTracker.track(this as unknown as ObservableBox<unknown>)
    }
    return this._value
  }

  set(next: T): void {
    if (Object.is(this._value, next)) return
    this._value = next
    // Defer notification if inside a batch; otherwise notify immediately
    if (batchDepth > 0) {
      pendingNotifications.add(this as unknown as ObservableBox<unknown>)
    } else {
      this._notify()
    }
  }

  _notify(): void {
    // Snapshot listeners before iterating — a listener may add/remove others
    const snapshot = [...this._listeners]
    snapshot.forEach(l => l())
  }

  _subscribe(listener: Listener): () => void {
    this._listeners.add(listener)
    return () => this._listeners.delete(listener)
  }
}

// ─── ComputedBox ───────────────────────────────────────────────────────────────
// Lazy derived value with dirty-checking and automatic dependency tracking.
// Equivalent to MobX's ComputedValue.
// Key insight: a computed is both an observer (of its sources) and
// an observable (for things that depend on it).

export class ComputedBox<T> {
  private _value!: T
  private _dirty = true
  private _fn: () => T
  private _sources = new Set<ObservableBox<unknown>>()
  private _listeners = new Set<Listener>()
  private _disposeSource: (() => void) | null = null

  constructor(fn: () => T) {
    this._fn = fn
  }

  get(): T {
    // Register with any outer tracker (another computed or autorun reading us)
    if (currentTracker) {
      currentTracker.track(this as unknown as ObservableBox<unknown>)
    }
    if (this._dirty) {
      this._recompute()
    }
    return this._value
  }

  private _recompute(): void {
    // Dispose subscriptions to old sources
    this._disposeSource?.()

    const newSources = new Set<ObservableBox<unknown>>()

    // Swap in our tracker so reads inside _fn register to newSources
    const prevTracker = currentTracker
    currentTracker = { track: (obs) => newSources.add(obs) }
    try {
      this._value = this._fn()
    } finally {
      currentTracker = prevTracker
    }

    this._dirty = false
    this._sources = newSources

    // Subscribe to each source — invalidate when any changes
    const unsubs = [...newSources].map(source =>
      source._subscribe(() => {
        this._dirty = true
        this._notify()
      })
    )
    this._disposeSource = () => unsubs.forEach(u => u())
  }

  _notify(): void {
    const snapshot = [...this._listeners]
    snapshot.forEach(l => l())
  }

  _subscribe(listener: Listener): () => void {
    this._listeners.add(listener)
    return () => this._listeners.delete(listener)
  }

  dispose(): void {
    this._disposeSource?.()
    this._listeners.clear()
  }
}

// ─── autorun ───────────────────────────────────────────────────────────────────
// Runs fn immediately, tracks which observables it reads,
// and re-runs whenever any of them change.
// Equivalent to MobX's autorun().

export function autorun(fn: () => void): () => void {
  let disposeTracking: (() => void) | null = null

  function run() {
    disposeTracking?.()

    const sources = new Set<ObservableBox<unknown>>()
    const prevTracker = currentTracker
    currentTracker = { track: (obs) => sources.add(obs) }
    try {
      fn()
    } finally {
      currentTracker = prevTracker
    }

    const unsubs = [...sources].map(source => source._subscribe(run))
    disposeTracking = () => unsubs.forEach(u => u())
  }

  run()

  return () => {
    disposeTracking?.()
    disposeTracking = null
  }
}

// ─── batch ─────────────────────────────────────────────────────────────────────
// Groups multiple mutations into a single notification flush.
// Equivalent to MobX's action() / transaction().

export function batch(fn: () => void): void {
  batchDepth++
  try {
    fn()
  } finally {
    batchDepth--
    if (batchDepth === 0) {
      const toNotify = [...pendingNotifications]
      pendingNotifications.clear()
      toNotify.forEach(box => box._notify())
    }
  }
}
