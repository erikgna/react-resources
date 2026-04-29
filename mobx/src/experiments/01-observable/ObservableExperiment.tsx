import { useState, useEffect } from 'react'
import { observable, makeObservable, makeAutoObservable, autorun, toJS } from 'mobx'
import { ObservableBox, autorun as coreAutorun } from '../../core/observable'
import { Section, Row, Btn, Info, Pre, Log } from '../shared'

// ─── 1.1 observable.box ───────────────────────────────────────────────────────

function BoxVsMakeObservable() {
  const [log, setLog] = useState<string[]>([])
  const addLog = (msg: string) => setLog(p => [...p, msg])

  useEffect(() => {
    const box = observable.box(0)

    class Counter {
      count = 0
      constructor() { makeObservable(this, { count: observable }) }
    }
    const c = new Counter()

    const d1 = autorun(() => addLog(`[box] value = ${box.get()}`))
    const d2 = autorun(() => addLog(`[makeObservable] count = ${c.count}`))

    return () => { d1(); d2() }
  }, [])

  const [boxVal, setBoxVal] = useState(0)
  const [boxRef] = useState(() => observable.box(0))

  return (
    <Section title="1.1 — observable.box() vs makeObservable">
      <Info>Both use the same Atom primitive under the hood. <code>box</code> is explicit; <code>makeObservable</code> annotates class fields.</Info>
      <Row>
        <Btn onClick={() => {
          const next = boxVal + 1
          setBoxVal(next)
          boxRef.set(next)
        }}>Increment box</Btn>
        <span style={{ color: '#888', fontSize: 12 }}>box.get() = {boxRef.get()}</span>
      </Row>
      <Log entries={log} />
      <Pre>{`const box = observable.box(0)
autorun(() => console.log(box.get())) // fires immediately

class Counter {
  count = 0
  constructor() { makeObservable(this, { count: observable }) }
}
// Both are Atoms — observable.box IS makeObservable's backing primitive`}</Pre>
    </Section>
  )
}

// ─── 1.2 makeAutoObservable ───────────────────────────────────────────────────

class AutoCounter {
  count = 0
  label = 'counter'
  constructor() { makeAutoObservable(this) }
  increment() { this.count++ }
  setLabel(s: string) { this.label = s }
}

const autoCounter = new AutoCounter()

function MakeAutoObservableSection() {
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    const dispose = autorun(() => {
      setLog(p => [...p, `count=${autoCounter.count} label="${autoCounter.label}"`])
    })
    return dispose
  }, [])

  return (
    <Section title="1.2 — makeAutoObservable">
      <Info>Infers all fields as observable, all methods as actions. No manual annotations.</Info>
      <Row>
        <Btn onClick={() => autoCounter.increment()}>Increment</Btn>
        <Btn onClick={() => autoCounter.setLabel('changed')}>Change label</Btn>
        <Btn onClick={() => autoCounter.setLabel('counter')} danger>Reset label</Btn>
      </Row>
      <Log entries={log} />
      <Pre>{`class AutoCounter {
  count = 0
  label = 'counter'
  constructor() { makeAutoObservable(this) }
  // methods auto-wrapped as actions
  // fields auto-annotated as observable
}`}</Pre>
    </Section>
  )
}

// ─── 1.3 observable.array / observable.map ────────────────────────────────────

const obsArray = observable.array<string>([])
const obsMap = observable.map<string, number>()

function ArrayAndMap() {
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    const d1 = autorun(() => setLog(p => [...p, `array: [${obsArray.join(', ')}]`]))
    const d2 = autorun(() => {
      const entries = [...obsMap.entries()].map(([k, v]) => `${k}:${v}`).join(', ')
      setLog(p => [...p, `map: {${entries}}`])
    })
    return () => { d1(); d2() }
  }, [])

  let itemCount = 0

  return (
    <Section title="1.3 — observable.array and observable.map">
      <Info>Mutate in place — MobX intercepts push/splice/set. <code>toJS()</code> extracts plain values.</Info>
      <Row>
        <Btn onClick={() => { itemCount++; obsArray.push(`item${obsArray.length + 1}`) }}>Push to array</Btn>
        <Btn onClick={() => obsArray.pop()} danger>Pop</Btn>
        <Btn onClick={() => obsMap.set(`key${obsMap.size}`, obsMap.size)}>Set map entry</Btn>
        <Btn onClick={() => obsMap.clear()} danger>Clear map</Btn>
      </Row>
      <Row style={{ marginTop: 8 }}>
        <span style={{ color: '#888', fontSize: 12 }}>toJS(array): {JSON.stringify(toJS(obsArray))}</span>
      </Row>
      <Log entries={log} />
      <Pre>{`const arr = observable.array([])
arr.push('item')   // triggers autorun — mutation, not new reference
toJS(arr)          // → plain JS array, no Proxy

// Contrast with Redux: must return new array reference
// MobX: mutate directly, reactivity fires automatically`}</Pre>
    </Section>
  )
}

// ─── 1.4 core/observable.ts — our hand-rolled ObservableBox ──────────────────

function CoreObservableBox() {
  const [log, setLog] = useState<string[]>([])
  const [boxRef] = useState(() => new ObservableBox(0))

  useEffect(() => {
    const dispose = coreAutorun(() => {
      setLog(p => [...p, `[core] ObservableBox value = ${boxRef.get()}`])
    })
    return dispose
  }, [boxRef])

  return (
    <Section title="1.4 — core/observable.ts — hand-rolled ObservableBox">
      <Info>Same mechanism as MobX's Atom: value + listener set + global tracking context. ~40 lines.</Info>
      <Row>
        <Btn onClick={() => boxRef.set(boxRef.get() + 1)}>Increment core box</Btn>
        <Btn onClick={() => boxRef.set(boxRef.get() - 1)} danger>Decrement</Btn>
        <span style={{ color: '#888', fontSize: 12 }}>value = {boxRef.get()}</span>
      </Row>
      <Log entries={log} />
      <Pre>{`// core/observable.ts
class ObservableBox<T> {
  get(): T {
    if (currentTracker) currentTracker.track(this) // ← dependency registration
    return this._value
  }
  set(next: T): void {
    if (Object.is(this._value, next)) return
    this._value = next
    batchDepth > 0 ? pendingNotifications.add(this) : this._notify()
  }
}
// MobX's createAtom() does exactly this`}</Pre>
    </Section>
  )
}

export default function ObservableExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>01 · Observable Primitives</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        All observable forms reduce to the same Atom primitive. Understand what observable.box, makeObservable, and makeAutoObservable actually do — then compare against our hand-rolled version.
      </p>
      <BoxVsMakeObservable />
      <MakeAutoObservableSection />
      <ArrayAndMap />
      <CoreObservableBox />
    </div>
  )
}
