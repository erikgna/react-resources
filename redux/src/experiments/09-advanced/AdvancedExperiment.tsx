import { useRef, useState } from 'react'
import { createRawStore } from '../../core/rawStore'
import type { Action, Reducer } from '../../core/rawStore'
import { Btn, Row, Section, Info, Pre, ui } from '../shared'

// ─── Advanced 1: Normalized state ─────────────────────────────────────────────
// Flat structure: { ids: number[], entities: Record<id, entity> }
// vs nested: { posts: [{ id, comments: [{ id, ... }] }] }
// Normalized = O(1) lookup, no nesting updates, no duplicates.

type User = { id: number; name: string; age: number }
type NormalState = {
  users: { ids: number[]; entities: Record<number, User> }
  selectedId: number | null
}

const normalReducer: Reducer<NormalState> = (
  state = { users: { ids: [], entities: {} }, selectedId: null },
  action
) => {
  switch (action.type) {
    case 'USER/ADD': {
      const user = action.payload as User
      return {
        ...state,
        users: {
          ids: [...state.users.ids, user.id],
          entities: { ...state.users.entities, [user.id]: user },
        },
      }
    }
    case 'USER/UPDATE': {
      const { id, ...changes } = action.payload as Partial<User> & { id: number }
      return {
        ...state,
        users: {
          ...state.users,
          entities: {
            ...state.users.entities,
            [id]: { ...state.users.entities[id], ...changes },
          },
        },
      }
    }
    case 'USER/REMOVE': {
      const id = action.payload as number
      const { [id]: _removed, ...remaining } = state.users.entities
      return {
        ...state,
        users: { ids: state.users.ids.filter(i => i !== id), entities: remaining },
      }
    }
    case 'USER/SELECT':
      return { ...state, selectedId: action.payload as number }
    default: return state
  }
}

let nextUserId = 1

// ─── Advanced 2: Undo/Redo — undoable reducer HOC ────────────────────────────
// Wraps any reducer. Tracks past/present/future state snapshots.
// UNDO: pop from past, push present to future.
// REDO: pop from future, push present to past.

type UndoableState<S> = {
  past: S[]
  present: S
  future: S[]
}

function undoable<S>(reducer: Reducer<S>): Reducer<UndoableState<S>> {
  const initialPresent = reducer(undefined, { type: '@@INIT' })
  const initialState: UndoableState<S> = { past: [], present: initialPresent, future: [] }

  return function(state = initialState, action: Action): UndoableState<S> {
    if (action.type === '@@UNDO') {
      if (state.past.length === 0) return state
      const past = [...state.past]
      const newPresent = past.pop()!
      return { past, present: newPresent, future: [state.present, ...state.future] }
    }

    if (action.type === '@@REDO') {
      if (state.future.length === 0) return state
      const [newPresent, ...future] = state.future
      return { past: [...state.past, state.present], present: newPresent, future }
    }

    // Normal action — push current to past, clear future (branching history)
    const newPresent = reducer(state.present, action)
    if (newPresent === state.present) return state // no-op, don't pollute history
    return {
      past: [...state.past, state.present],
      present: newPresent,
      future: [], // branch erases redo history (same as text editors)
    }
  }
}

type CounterState = { n: number; label: string }
const counterReducer: Reducer<CounterState> = (state = { n: 0, label: 'start' }, action) => {
  switch (action.type) {
    case 'INC':   return { ...state, n: state.n + 1 }
    case 'DEC':   return { ...state, n: state.n - 1 }
    case 'LABEL': return { ...state, label: action.payload as string }
    default: return state
  }
}

const undoableStore = createRawStore(undoable(counterReducer))

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdvancedExperiment() {
  // ── Normalized state
  const normStoreRef = useRef(createRawStore(normalReducer))
  const normStore = normStoreRef.current
  const [normState, setNormState] = useState(() => normStore.getState())
  useRef(normStore.subscribe(() => setNormState({ ...normStore.getState() })))
  const dispatch = (a: Action) => normStore.dispatch(a)

  const [nameInput, setNameInput] = useState('')
  const [ageInput, setAgeInput] = useState('25')

  const selected = normState.selectedId !== null
    ? normState.users.entities[normState.selectedId]
    : null

  // ── Undo/Redo
  const [undoState, setUndoState] = useState(() => undoableStore.getState())
  useRef(undoableStore.subscribe(() => setUndoState({ ...undoableStore.getState() })))
  const ud = (a: Action) => undoableStore.dispatch(a)
  const [labelInput, setLabelInput] = useState('')

  return (
    <div>
      <h2 style={ui.h2}>9 · Advanced Patterns</h2>
      <p style={ui.desc}>
        Normalized state (entity cache) and undo/redo via reducer composition.
        Both patterns work with raw Redux — no libraries required.
      </p>

      <Section title="9.1 Normalized state — entity map">
        <Info>
          Nested arrays → O(n) lookups. Entity map → O(1) lookups.
          Update one user → spread one key in entities object (no array copy).
          Select one user → <code>{'state.users.entities[id]'}</code> (no find()).
        </Info>
        <Row>
          <input style={{ ...ui.input, width: 120 }} value={nameInput}
            onChange={e => setNameInput(e.target.value)} placeholder="name" />
          <input style={{ ...ui.input, width: 60 }} type="number" value={ageInput}
            onChange={e => setAgeInput(e.target.value)} placeholder="age" />
          <Btn onClick={() => {
            if (nameInput) {
              dispatch({ type: 'USER/ADD', payload: { id: nextUserId++, name: nameInput, age: Number(ageInput) } })
              setNameInput('')
            }
          }}>add user</Btn>
        </Row>

        {normState.users.ids.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>
              IDs: [{normState.users.ids.join(', ')}] — click to select
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {normState.users.ids.map(id => {
                const u = normState.users.entities[id]
                return (
                  <div
                    key={id}
                    onClick={() => dispatch({ type: 'USER/SELECT', payload: id })}
                    style={{
                      padding: '6px 10px', borderRadius: 3, cursor: 'pointer', fontSize: 12,
                      border: `1px solid ${normState.selectedId === id ? '#4a9eff' : '#1e1e1e'}`,
                      background: normState.selectedId === id ? '#0d1f33' : '#0f0f0f',
                    }}
                  >
                    #{id} {u?.name} ({u?.age})
                    <span
                      onClick={e => { e.stopPropagation(); dispatch({ type: 'USER/REMOVE', payload: id }) }}
                      style={{ marginLeft: 8, color: '#ff6b6b', cursor: 'pointer' }}
                    >×</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {selected && (
          <div style={{ marginTop: 10, padding: '10px 12px', background: '#0d1f33', borderRadius: 3, fontSize: 13 }}>
            <div style={{ color: '#4a9eff', marginBottom: 6 }}>selected: #{selected.id}</div>
            <Row>
              <Btn onClick={() => dispatch({ type: 'USER/UPDATE', payload: { id: selected.id, age: selected.age + 1 } })}>
                age+1 ({selected.age})
              </Btn>
              <Btn onClick={() => dispatch({ type: 'USER/UPDATE', payload: { id: selected.id, name: selected.name + '!' } })}>
                name+! ({selected.name})
              </Btn>
            </Row>
          </div>
        )}

        <Pre>{`// Flat structure — efficient updates:
type NormalState = {
  users: {
    ids: number[]                      // ordered list for iteration
    entities: Record<number, User>     // O(1) lookup by id
  }
}

// Update one user — no array copy, no find():
entities: { ...state.users.entities, [id]: updatedUser }

// Lookup — O(1):
const user = state.users.entities[userId]

// Redux Toolkit's createEntityAdapter generates this automatically.`}</Pre>
      </Section>

      <Section title="9.2 Undo/Redo — undoable reducer HOC">
        <Info>
          <code>undoable(reducer)</code> wraps any reducer. The wrapped store tracks
          <code> past</code>, <code>present</code>, and <code>future</code> state snapshots.
          Branching: any non-UNDO action clears the future (same behavior as text editors).
        </Info>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 10 }}>
          n = <b style={{ color: '#e0e0e0', fontSize: 16 }}>{undoState.present.n}</b> |
          label = "<b style={{ color: '#e0e0e0' }}>{undoState.present.label}</b>" |
          past: <b>{undoState.past.length}</b> steps |
          future: <b>{undoState.future.length}</b> steps
        </div>
        <Row>
          <Btn onClick={() => ud({ type: '@@UNDO' })} danger={undoState.past.length === 0}>
            ↩ undo
          </Btn>
          <Btn onClick={() => ud({ type: '@@REDO' })} danger={undoState.future.length === 0}>
            ↪ redo
          </Btn>
          <Btn onClick={() => ud({ type: 'INC' })}>n + 1</Btn>
          <Btn onClick={() => ud({ type: 'DEC' })}>n − 1</Btn>
        </Row>
        <Row style={{ marginTop: 8 }}>
          <input style={{ ...ui.input, width: 120 }} value={labelInput}
            onChange={e => setLabelInput(e.target.value)} placeholder="new label" />
          <Btn onClick={() => { if (labelInput) ud({ type: 'LABEL', payload: labelInput }) }}>
            set label
          </Btn>
        </Row>

        <div style={{ marginTop: 10, fontSize: 11, color: '#444' }}>
          <div>Past snapshots: [{undoState.past.map(s => `n=${s.n}`).join(', ')}]</div>
          <div>Future snapshots: [{undoState.future.map(s => `n=${s.n}`).join(', ')}]</div>
        </div>

        <Pre>{`// undoable is a higher-order reducer — wraps any reducer:
function undoable<S>(reducer: Reducer<S>): Reducer<UndoableState<S>> {
  return (state = initialState, action) => {
    if (action.type === '@@UNDO') {
      const [newPresent, ...past] = state.past.reverse()
      return { past, present: newPresent, future: [state.present, ...state.future] }
    }
    if (action.type === '@@REDO') {
      const [newPresent, ...future] = state.future
      return { past: [...state.past, state.present], present: newPresent, future }
    }
    const newPresent = reducer(state.present, action)
    return { past: [...state.past, state.present], present: newPresent, future: [] }
  }
}

// Usage — wrap any reducer, get undo/redo for free:
const store = createRawStore(undoable(counterReducer))
store.dispatch({ type: 'INC' })   // n=1, past=[{n:0}]
store.dispatch({ type: '@@UNDO' }) // n=0, future=[{n:1}]
store.dispatch({ type: '@@REDO' }) // n=1`}</Pre>
      </Section>
    </div>
  )
}
