# XState Deep POC — Action Plan

## 1. Objective Definition

Target XState v5 internals, not just the surface API:
- The state machine: `createMachine`, `createActor`, the event queue
- How `send(event)` resolves: guard evaluation → exit actions → transition actions → assign → entry actions → notify
- How invoked actors (`fromPromise`, `fromCallback`) are tied to state lifetime
- Spawned actors: independent lifecycle, parent↔child messaging via `sendTo` / `stopChild`
- Hierarchical states: compound (nested) and parallel regions, `state.value` as object
- Guards: predicate chain, first-match semantics, silent discard on no match
- React integration: `useMachine`, `useActorRef`, `useSelector` — when each is appropriate

Read `src/core/xstate.ts` first — ~200-line reimplementation of a flat interpreter. Use it to understand the event loop before touching the real API.

## 2. Minimal Setup

Start with zero React:
```ts
import { createMachine, createActor } from 'xstate'

const m = createMachine({
  initial: 'idle',
  states: {
    idle: { on: { START: 'running' } },
    running: { on: { STOP: 'idle' } },
  },
})

const actor = createActor(m)
actor.subscribe(snap => console.log(snap.value))
actor.start()
actor.send({ type: 'START' }) // logs 'running'
actor.send({ type: 'STOP' })  // logs 'idle'
actor.stop()
```

Then compare against `core/interpret` — same mechanism: start → notify → send → transition → notify.

## 3. Core Experiments

### 3.1 Machines (tab 01)
- `createMachine` with `states` + `on` transitions
- `useMachine` → `[state, send]`
- Traffic light: three cyclic states, one event
- `state.value` (string for flat, object for compound)
- `state.matches(s)` vs string equality — prefer `matches()`
- `state.can(event)` — predicate before sending
- Core reimplementation comparison: identical behavior, ~10x fewer lines

### 3.2 Context (tab 02)
- `context` field: extended state alongside the state value
- `assign()` object form vs function form — both produce immutable patches
- Guards that read context: `guard: ({ context }) => ...`
- Counter with `min`/`max` — guards from context, `state.can()` reflects live
- Direct mutation footgun: XState v5 freezes context in dev → throws

### 3.3 Guards (tab 03)
- Guard predicate: `({ context, event }) => boolean`
- Multiple transitions on one event: evaluated top-to-bottom, first match wins
- Fallback transition: no guard = always matches
- Vault demo: two transitions on UNLOCK, first checks PIN
- Pricing tier: four guards, first passing tier wins
- Always-false guard: event silently discarded, no error, `state.can()` → false

### 3.4 Actions (tab 04)
- Execution order: exit → transition → entry (never changes)
- `assign()` as a transition action — context updated before next state's entry
- `raise()`: self-event, processed in same microtask, enables synchronous loops
- Named action arrays — run multiple actions per hook point
- Logging action: capture order proof with a shared external array

### 3.5 Actors (tab 05)
- `fromPromise`: wraps async fn, XState owns pending state, `onDone`/`onError` are transitions
- `fromCallback`: bidirectional — `sendBack` pushes events up, return = cleanup
- Invoked actors are automatically stopped on state exit (cleanup is guaranteed)
- `spawn()` in entry action: persistent child actor, holds `ActorRef`
- `sendTo(id, event)`: parent → child messaging
- `stopChild(id)`: explicit teardown — required for spawned (not invoked) actors

### 3.6 Hierarchical (tab 06)
- Compound state: parent + `initial` child, enter parent = enter initial child automatically
- `#id.state` syntax: absolute target from within nested states
- Parent-level `on`: events defined on parent apply to all child states — no repetition
- `state.matches({ parent: 'child' })` for nested state checks
- Parallel (`type: 'parallel'`): all child regions active simultaneously
- `state.value` as object: `{ bold: 'on', italic: 'off', underline: 'on' }`

## 4. Performance Analysis (tab 07)

- **Throughput**: 10k, 100k raw `send()` calls on a 2-state machine, measure ms
- **Core vs XState**: same workload, two runtimes — quantify feature overhead
- **Re-render model**: `useMachine` re-renders on every change regardless of which context slice changed — no selector isolation by default
- **Fix**: `useSelector(actorRef, s => s.context.field)` from `@xstate/react` — only re-renders when the selected slice changes

Key insight: XState is not designed for maximum transition throughput — it's designed for correctness, traceability, and actor isolation. Compare against Zustand (raw store speed) and MobX (fine-grained reactivity) to see the tradeoff surface.

## 5. Failure Scenarios (tab 08)

| Failure | Loud or Silent | Mechanism |
|---------|---------------|-----------|
| Unknown event type | **Silent** — discarded | Not in `on` → dropped |
| Guard always false | **Silent** — discarded | No match found → dropped |
| Direct context mutation | **Loud** (dev) / **Silent** (prod) | Context frozen in dev; prod: no re-render |
| Undefined target state | **Loud** — throws at `createMachine` | Config validation |
| Forgotten `stopChild()` | **Silent** — leak | Spawned actor holds references until stopped |
| Infinite `raise()` loop | **Crash** — browser hang | No cycle detection in XState |
| Wrong event type typo | **Silent** — discarded | Identical to unknown event |

## 6. Advanced Patterns

```ts
// useSelector — fine-grained subscription
import { useSelector } from '@xstate/react'
const count = useSelector(actorRef, snap => snap.context.count)

// Inspector integration (XState v5)
import { createActor, createBrowserInspector } from '@xstate/inspect'
const actor = createActor(machine, { inspect: createBrowserInspector().inspect })

// Snapshot serialization
const snapshot = actor.getSnapshot()
const restored = createActor(machine, { snapshot }).start()

// Type-safe events with discriminated union
type Event = { type: 'INC' } | { type: 'SET'; value: number }
const m = createMachine({ ... } as MachineConfig<Context, Event>)

// waitFor — promise that resolves when predicate is true
import { waitFor } from 'xstate'
await waitFor(actor, snap => snap.matches('done'))
```

## 7. Source Code Reading

Open `node_modules/xstate/dist/xstate.cjs.development.js` and find:

| What to find | Why |
|-------------|-----|
| `class StateMachine` | How `createMachine` constructs the definition — no execution, just config parsing |
| `class Actor` | The running instance: `mailbox`, `_state`, `send()`, `subscribe()` |
| `Actor.prototype.send` | The event loop: dequeue → resolve transitions → run actions → notify |
| `resolveStateValue` | How `state.matches()` handles nested objects vs strings |
| `resolveActions` | How exit/transition/entry action arrays are flattened and executed in order |
| `fromPromise` | Wraps async fn in an actor — `onDone`/`onError` wired via `sendBack` |
| `fromCallback` | Bidirectional: receives `sendBack`, return value = cleanup |

Key insight: `send()` does not directly mutate state — it enqueues an event in `actor.mailbox`, then `actor._flush()` processes the queue synchronously until empty. This is why `raise()` works: it enqueues into the same flush cycle.

## 8. Deliverables

- [x] `src/core/xstate.ts` — ~200-line flat machine interpreter
- [x] 8 experiment tabs with interactive demos and failure scenarios
- [x] `index.md` — deep action plan
- [ ] Timing benchmarks from tab 07 (fill in actual numbers after running)
- [ ] `note.md` — pros/cons analysis (after all experiments complete)

## 9. Escalation

- Build the same TODO app in XState, Zustand, and MobX. Compare: LOC, number of files, invalid state reachability, time-travel debugging story, TypeScript inference quality.
- Find the complexity crossover: at what state complexity does a state machine's explicit model become *clearer* than ad-hoc boolean flags? At what point does it become *too verbose*?
- Probe `fromObservable` — wrap an RxJS observable as an XState actor source.
- Implement a multi-step form wizard using only compound states — no `useState` booleans. How much of the UI logic moves into the machine?
- Test the `@xstate/inspect` browser inspector: does it recover state after navigating away?

## 10. Constraint — POC Discipline

- Every section must include a failure or stress scenario. No pure happy-path demos.
- Do not accept "it just works" — send invalid events, break guards, skip cleanup, measure cost.
- Read the XState source for any behavior not immediately obvious from the API.
- `src/core/xstate.ts` is mandatory — build and understand it before using the library.
- Do not move on from any section until you can predict what will happen before running the code.
