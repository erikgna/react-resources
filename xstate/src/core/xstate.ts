// Minimal flat state machine interpreter.
// Covers: createMachine, interpret, assign, guards.
// No hierarchical states, no actors — those require the real XState library.
// Read this before touching the real API to understand the core event loop.

export type EventObject = { type: string; [key: string]: unknown }

type ActionFn<C, E extends EventObject> = (context: C, event: E) => void
type AssignFn<C, E extends EventObject> = (context: C, event: E) => Partial<C>
type GuardFn<C, E extends EventObject> = (context: C, event: E) => boolean

export type Action<C, E extends EventObject> =
  | ActionFn<C, E>
  | { type: '__assign__'; assigner: AssignFn<C, E> }

export type Transition<C, E extends EventObject> = {
  target: string
  guard?: GuardFn<C, E>
  actions?: Action<C, E>[]
}

export type StateConfig<C, E extends EventObject> = {
  on?: { [eventType: string]: Transition<C, E> | Transition<C, E>[] }
  entry?: Action<C, E>[]
  exit?: Action<C, E>[]
}

export type MachineConfig<C, E extends EventObject> = {
  id?: string
  initial: string
  context: C
  states: { [stateName: string]: StateConfig<C, E> }
}

export type Snapshot<C> = {
  value: string
  context: C
  matches(state: string): boolean
  can(eventType: string): boolean
}

export type Listener<C> = (snapshot: Snapshot<C>) => void

export function createMachine<C, E extends EventObject>(config: MachineConfig<C, E>) {
  return config
}

// assign() returns an action descriptor — not a function call.
// The interpreter detects the __assign__ marker and applies context updates.
export function assign<C, E extends EventObject>(
  assigner: AssignFn<C, E>,
): Action<C, E> {
  return { type: '__assign__', assigner }
}

function runActions<C, E extends EventObject>(
  actions: Action<C, E>[] | undefined,
  context: C,
  event: E,
  onAssign: (next: Partial<C>) => void,
) {
  for (const action of actions ?? []) {
    if (typeof action === 'function') {
      action(context, event)
    } else {
      onAssign(action.assigner(context, event))
    }
  }
}

export function interpret<C, E extends EventObject>(machine: MachineConfig<C, E>) {
  let currentState = machine.initial
  let currentContext = { ...machine.context }
  const listeners = new Set<Listener<C>>()
  let started = false

  function snapshot(): Snapshot<C> {
    const value = currentState
    const context = currentContext
    return {
      value,
      context,
      matches: (s: string) => s === value,
      can: (eventType: string) => {
        const stateDef = machine.states[value]
        const trans = stateDef?.on?.[eventType]
        if (!trans) return false
        const candidates = Array.isArray(trans) ? trans : [trans]
        return candidates.some(t => !t.guard || t.guard(context, { type: eventType } as E))
      },
    }
  }

  function notify() {
    const snap = snapshot()
    listeners.forEach(l => l(snap))
  }

  function send(event: E) {
    if (!started) return
    const stateDef = machine.states[currentState]
    if (!stateDef?.on) return

    const transitions = stateDef.on[event.type]
    if (!transitions) return

    const candidates = Array.isArray(transitions) ? transitions : [transitions]
    const match = candidates.find(t => !t.guard || t.guard(currentContext, event))
    if (!match) return

    // Run exit actions on current state
    runActions(stateDef.exit, currentContext, event, patch => {
      currentContext = { ...currentContext, ...patch }
    })

    // Run transition actions + assigns
    runActions(match.actions, currentContext, event, patch => {
      currentContext = { ...currentContext, ...patch }
    })

    // Switch state
    currentState = match.target

    // Run entry actions on new state
    const nextDef = machine.states[currentState]
    runActions(nextDef?.entry, currentContext, event, patch => {
      currentContext = { ...currentContext, ...patch }
    })

    notify()
  }

  function subscribe(listener: Listener<C>) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  function start() {
    started = true
    // Run entry actions for the initial state
    const initDef = machine.states[currentState]
    let ctx = currentContext
    runActions(initDef?.entry, ctx, { type: '$$init' } as E, patch => {
      ctx = { ...ctx, ...patch }
    })
    currentContext = ctx
    notify()
    return service
  }

  function stop() {
    started = false
    listeners.clear()
  }

  function getSnapshot() {
    return snapshot()
  }

  const service = { send, subscribe, start, stop, getSnapshot }
  return service
}

