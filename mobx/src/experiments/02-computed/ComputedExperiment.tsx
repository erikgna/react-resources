import { useState, useEffect, useRef } from 'react'
import { makeAutoObservable, autorun, computed, observable } from 'mobx'
import { ObservableBox, ComputedBox, autorun as coreAutorun } from '../../core/observable'
import { Section, Row, Btn, Info, Pre, Log } from '../shared'

// ─── 2.1 Computed caching ─────────────────────────────────────────────────────

class PriceStore {
  price = 10
  quantity = 2
  computeCount = 0

  constructor() { makeAutoObservable(this) }

  get total() {
    this.computeCount++
    return this.price * this.quantity
  }

  setPrice(n: number) { this.price = n }
  setQty(n: number) { this.quantity = n }
}

const priceStore = new PriceStore()

function ComputedCaching() {
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    return autorun(() => {
      // Read total 3 times — should only recompute once per dependency change
      const a = priceStore.total
      const b = priceStore.total
      const c = priceStore.total
      setLog(p => [...p, `total=${a} (reads: a=${a} b=${b} c=${c}) computeCount=${priceStore.computeCount}`])
    })
  }, [])

  return (
    <Section title="2.1 — Computed caching — reads twice = 1 computation">
      <Info>
        Reading <code>total</code> 3 times inside one autorun costs 1 computation, not 3. MobX caches the result and recomputes only when <code>price</code> or <code>quantity</code> changes.
      </Info>
      <Row>
        <Btn onClick={() => priceStore.setPrice(priceStore.price + 1)}>Price +1</Btn>
        <Btn onClick={() => priceStore.setQty(priceStore.quantity + 1)}>Qty +1</Btn>
        <span style={{ color: '#888', fontSize: 12 }}>price={priceStore.price} qty={priceStore.quantity} total={priceStore.total}</span>
      </Row>
      <Log entries={log} />
      <Pre>{`class PriceStore {
  price = 10; quantity = 2; computeCount = 0
  get total() {
    this.computeCount++           // track how often it runs
    return this.price * this.quantity
  }
}
// Read total 3× → computeCount increments by 1, not 3
// MobX caches computed results between dependency changes`}</Pre>
    </Section>
  )
}

// ─── 2.2 Dynamic dependency tracking ──────────────────────────────────────────

class VatStore {
  showVat = false
  price = 100
  vatRate = 0.2
  computeCount = 0

  constructor() { makeAutoObservable(this) }

  get displayPrice() {
    this.computeCount++
    if (!this.showVat) return this.price          // vatRate NOT accessed → not a dependency
    return this.price * (1 + this.vatRate)
  }

  toggle() { this.showVat = !this.showVat }
  setVat(v: number) { this.vatRate = v }
  setPrice(v: number) { this.price = v }
}

const vatStore = new VatStore()

function DynamicDeps() {
  const [log, setLog] = useState<string[]>([])
  const countBefore = useRef(0)

  useEffect(() => {
    return autorun(() => {
      countBefore.current = vatStore.computeCount
      setLog(p => [...p,
        `showVat=${vatStore.showVat} displayPrice=${vatStore.displayPrice.toFixed(2)} computeCount=${vatStore.computeCount}`
      ])
    })
  }, [])

  return (
    <Section title="2.2 — Dynamic dependency tracking">
      <Info>
        Dependencies are tracked per-execution, not statically. When <code>showVat=false</code>, changing <code>vatRate</code> does NOT recompute <code>displayPrice</code> because it was never read.
      </Info>
      <Row>
        <Btn onClick={() => vatStore.toggle()}>Toggle VAT ({vatStore.showVat ? 'on' : 'off'})</Btn>
        <Btn onClick={() => vatStore.setVat(vatStore.vatRate + 0.05)}>vatRate +0.05</Btn>
        <Btn onClick={() => vatStore.setPrice(vatStore.price + 10)}>price +10</Btn>
      </Row>
      <Log entries={log} />
      <Pre>{`get displayPrice() {
  if (!this.showVat) return this.price  // vatRate never read → not tracked
  return this.price * (1 + this.vatRate)
}
// Change vatRate while showVat=false → no recompute
// MobX builds dependency graph at runtime, per-execution`}</Pre>
    </Section>
  )
}

// ─── 2.3 Chained computeds ────────────────────────────────────────────────────

class ChainStore {
  a = 1
  b = 2
  c = 3
  abCount = 0
  abcCount = 0

  constructor() { makeAutoObservable(this) }

  get ab() { this.abCount++; return this.a + this.b }
  get abc() { this.abcCount++; return this.ab + this.c }

  setA(v: number) { this.a = v }
  setB(v: number) { this.b = v }
  setC(v: number) { this.c = v }
}

const chainStore = new ChainStore()

function ChainedComputeds() {
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    return autorun(() => {
      setLog(p => [...p,
        `a=${chainStore.a} b=${chainStore.b} c=${chainStore.c} | ab=${chainStore.ab} abc=${chainStore.abc} | abRecomputes=${chainStore.abCount} abcRecomputes=${chainStore.abcCount}`
      ])
    })
  }, [])

  return (
    <Section title="2.3 — Chained computeds — propagation path">
      <Info>
        Changing <code>a</code> recomputes <code>ab</code> then <code>abc</code>. Changing <code>c</code> only recomputes <code>abc</code> — MobX skips <code>ab</code> because it's not in the dependency chain.
      </Info>
      <Row>
        <Btn onClick={() => chainStore.setA(chainStore.a + 1)}>a +1 (recomputes ab+abc)</Btn>
        <Btn onClick={() => chainStore.setB(chainStore.b + 1)}>b +1 (recomputes ab+abc)</Btn>
        <Btn onClick={() => chainStore.setC(chainStore.c + 1)}>c +1 (recomputes abc only)</Btn>
      </Row>
      <Log entries={log} />
      <Pre>{`get ab() { return this.a + this.b }   // depends on a, b
get abc() { return this.ab + this.c }  // depends on ab (→ a,b), c

change a → ab dirty → abc dirty (topological propagation)
change c → only abc dirty, ab stays cached`}</Pre>
    </Section>
  )
}

// ─── 2.4 core/observable.ts — ComputedBox ────────────────────────────────────

function CoreComputedBox() {
  const [log, setLog] = useState<string[]>([])
  const [boxes] = useState(() => {
    const price = new ObservableBox(10)
    const qty = new ObservableBox(2)
    const total = new ComputedBox(() => price.get() * qty.get())
    return { price, qty, total }
  })

  useEffect(() => {
    const dispose = coreAutorun(() => {
      setLog(p => [...p, `[core] price=${boxes.price.get()} qty=${boxes.qty.get()} total=${boxes.total.get()}`])
    })
    return () => { dispose(); boxes.total.dispose() }
  }, [boxes])

  return (
    <Section title="2.4 — core/observable.ts — ComputedBox internals">
      <Info>
        Our <code>ComputedBox</code> mirrors MobX's <code>ComputedValue</code>: dirty flag, source tracking via global context, lazy recompute.
      </Info>
      <Row>
        <Btn onClick={() => boxes.price.set(boxes.price.get() + 1)}>price +1</Btn>
        <Btn onClick={() => boxes.qty.set(boxes.qty.get() + 1)}>qty +1</Btn>
      </Row>
      <Log entries={log} />
      <Pre>{`// core/observable.ts
class ComputedBox<T> {
  private _dirty = true

  get(): T {
    if (currentTracker) currentTracker.track(this) // also an observable
    if (this._dirty) this._recompute()
    return this._value
  }
  private _recompute() {
    // swap in our tracker, run fn, collect sources, subscribe to each
    // on any source change: _dirty=true, notify own listeners
  }
}`}</Pre>
    </Section>
  )
}

export default function ComputedExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>02 · Computed Values</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Computed values are lazy, cached, and automatically track their dependencies at runtime. They are both observers (of their sources) and observables (for downstream computeds and reactions).
      </p>
      <ComputedCaching />
      <DynamicDeps />
      <ChainedComputeds />
      <CoreComputedBox />
    </div>
  )
}
