import { useState } from 'react'
import { atom, useAtom, useAtomValue } from 'jotai'
import { atomFamily } from 'jotai/utils'
import { atomFamily as coreAtomFamily } from '../../core/jotai'
import { Section, Row, Btn, Info, Pre } from '../shared'

// ─── atomFamily: parameterized atom factory ───────────────────────────────────

// Each unique id gets its own atom instance — stable across re-renders
const todoAtomFamily = atomFamily((id: number) =>
  atom({ id, text: `Task ${id}`, done: false })
)

// Derived atom: computes done count across all active IDs
const doneCountAtom = atom(get => {
  const ids = get(todoIdsAtom)
  return ids.filter(id => get(todoAtomFamily(id)).done).length
})

// List of active todo IDs
const todoIdsAtom = atom([1, 2, 3])

// Core hand-rolled atomFamily
const coreCounterFamily = coreAtomFamily((id: string) => 0)

// ─── 5.1 Basic atomFamily ────────────────────────────────────────────────────

function TodoItem({ id }: { id: number }) {
  const [todo, setTodo] = useAtom(todoAtomFamily(id))
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
      <input
        type="checkbox"
        checked={todo.done}
        onChange={e => setTodo(t => ({ ...t, done: e.target.checked }))}
        style={{ accentColor: '#4a9eff' }}
      />
      <input
        value={todo.text}
        onChange={e => setTodo(t => ({ ...t, text: e.target.value }))}
        style={{ background: '#111', border: '1px solid #2a2a2a', color: todo.done ? '#555' : '#e0e0e0', padding: '3px 7px', borderRadius: 3, fontSize: 13, textDecoration: todo.done ? 'line-through' : 'none', width: 160 }}
      />
      <span style={{ color: '#555', fontSize: 11 }}>id: {id}</span>
    </div>
  )
}

function BasicFamily() {
  const ids = useAtomValue(todoIdsAtom)
  return (
    <Section title="5.1 — atomFamily: one atom per parameter">
      <Info>atomFamily(id =&gt; atom(init(id))) returns a function. Calling it with the same id returns the same atom instance — stable identity, no duplicate state.</Info>
      <div style={{ marginBottom: 10 }}>
        {ids.map(id => <TodoItem key={id} id={id} />)}
      </div>
      <Pre>{`const todoAtomFamily = atomFamily((id: number) =>
  atom({ id, text: \`Task \${id}\`, done: false })
)

// todoAtomFamily(1) → always returns the same atom for id=1
// todoAtomFamily(2) → different atom, independent state
// Key = JSON.stringify(param) — objects work too`}</Pre>
    </Section>
  )
}

// ─── 5.2 Dynamic creation and deletion ───────────────────────────────────────

function DynamicFamily() {
  const [ids, setIds] = useAtom(todoIdsAtom)
  const [next, setNext] = useState(4)

  const addItem = () => {
    setIds(prev => [...prev, next])
    setNext(n => n + 1)
  }

  const removeItem = (id: number) => {
    setIds(prev => prev.filter(i => i !== id))
    todoAtomFamily.remove(id)  // GC: drop the atom from the family cache
  }

  return (
    <Section title="5.2 — Dynamic add / remove with atomFamily.remove()">
      <Info>atomFamily.remove(param) drops the cached atom instance. If no component holds a reference to it, the atom's state is garbage-collected.</Info>
      <Row style={{ marginBottom: 10 }}>
        <Btn onClick={addItem}>Add item</Btn>
        <span style={{ color: '#555', fontSize: 11 }}>ids: [{ids.join(', ')}]</span>
      </Row>
      <div>
        {ids.map(id => (
          <div key={id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
            <TodoItem id={id} />
            <Btn onClick={() => removeItem(id)} danger>Remove</Btn>
          </div>
        ))}
      </div>
      <Pre>{`// Remove atom from family cache when no longer needed
todoAtomFamily.remove(id)

// Without remove(), the atom stays cached even after unmount.
// With remove(), the next call to todoAtomFamily(id) creates a fresh atom.`}</Pre>
    </Section>
  )
}

// ─── 5.3 Derived atomFamily ───────────────────────────────────────────────────

function DoneCountDisplay() {
  const ids = useAtomValue(todoIdsAtom)
  const doneCount = useAtomValue(doneCountAtom)
  return (
    <div style={{ fontSize: 13, color: '#888' }}>
      Done: <span style={{ color: '#4caf50' }}>{doneCount}</span> / {ids.length}
    </div>
  )
}

function DerivedFamily() {
  return (
    <Section title="5.3 — Derived atom over family: done count">
      <Info>doneCountAtom reads todoAtomFamily(id).done for every active id. Only re-renders when any .done field changes — text changes are invisible to it.</Info>
      <DoneCountDisplay />
      <Pre>{`const doneCountAtom = atom(get => {
  const ids = get(todoIdsAtom)
  return ids.filter(id => get(todoAtomFamily(id)).done).length
})
// Dep graph: doneCountAtom depends on todoIdsAtom + each todoAtomFamily(id)
// Changing an item's .text field does NOT trigger this atom's recomputation`}</Pre>
    </Section>
  )
}

// ─── 5.4 Core atomFamily ──────────────────────────────────────────────────────

function CoreFamilyDemo() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ca, setCa] = useAtom(coreCounterFamily('a') as any)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cb, setCb] = useAtom(coreCounterFamily('b') as any)

  return (
    <Section title="5.4 — core/jotai.ts — hand-rolled atomFamily">
      <Info>core atomFamily caches atoms in a Map keyed by JSON.stringify(param). Same semantics as the real atomFamily — stable identity, isolated state per key.</Info>
      <Row style={{ marginBottom: 8 }}>
        <span style={{ color: '#555', fontSize: 11 }}>a:</span>
        <Btn onClick={() => setCa((n: number) => n - 1)} danger>−</Btn>
        <span style={{ color: '#e0e0e0', minWidth: 24, textAlign: 'center' }}>{ca as number}</span>
        <Btn onClick={() => setCa((n: number) => n + 1)}>+</Btn>
        <span style={{ color: '#555', fontSize: 11, marginLeft: 12 }}>b:</span>
        <Btn onClick={() => setCb((n: number) => n - 1)} danger>−</Btn>
        <span style={{ color: '#e0e0e0', minWidth: 24, textAlign: 'center' }}>{cb as number}</span>
        <Btn onClick={() => setCb((n: number) => n + 1)}>+</Btn>
      </Row>
      <div style={{ fontSize: 11, color: '#555' }}>
        Cache size: {coreCounterFamily.cache.size} atom(s)
      </div>
      <Pre>{`// core/jotai.ts
export function atomFamily<T, P>(initFn: (param: P) => T) {
  const cache = new Map<string, Atom>()
  const family = (param: P) => {
    const key = JSON.stringify(param)
    if (!cache.has(key)) cache.set(key, atom(initFn(param)))
    return cache.get(key)!
  }
  family.remove = (param) => cache.delete(JSON.stringify(param))
  family.cache  = cache
  return family
}`}</Pre>
    </Section>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function FamiliesExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>05 · Atom Families</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        atomFamily maps parameters to stable atom instances. Same param = same atom. Enables
        per-item state in dynamic lists without atom proliferation or key collisions.
      </p>
      <BasicFamily />
      <DynamicFamily />
      <DerivedFamily />
      <CoreFamilyDemo />
    </div>
  )
}
