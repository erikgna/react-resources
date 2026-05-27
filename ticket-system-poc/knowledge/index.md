# Ticket System POC — Knowledge Index

## OOAD Pattern → File Map

| Pattern | Domain File | Experiment | Key Insight |
|---|---|---|---|
| 01 State | `domain/state.ts` | `experiments/POC01_state/` | `STATE_MAP` O(1) dispatch — zero switch/if in callers |
| 02 Builder | `domain/builder.ts` | `experiments/POC02_builder/` | `seat()` is additive (array); `build()` validates all at once |
| 03 Strategy | `domain/pricing.ts` | `experiments/POC03_strategy/` | Map dispatch vs switch — open/closed; adding zone = 1 file |
| 04 Observer | `domain/observer.ts` | `experiments/POC04_observer/` | Bus catches observer throws; unsubscribe via returned fn |
| 05 Composite | `domain/composite.ts` | `experiments/POC05_composite/` | Same `totalCapacity()/availableSeats()` on leaf and root |
| 06 Factory Method | `domain/factory.ts` | `experiments/POC06_factory/` | `defaultZones()` is the only variation point |
| 07 Command | `domain/command.ts` | `experiments/POC07_command/` | Stores `issuedTicketIds[]` — targeted undo, no scan |
| 08 Singleton | `domain/registry.ts` | `experiments/POC08_singleton/` | `private constructor`; `resetForTests()` escape hatch |
| 09 Template Method | `domain/validation.ts` | `experiments/POC09_template/` | `validate()` skeleton guaranteed; subclass = `checkZoneRules()` only |
| 10 Facade | `domain/facade.ts` | `experiments/POC10_facade/` | Validate→Price→Command→Observe; zero logic in facade itself |

## Data Flow

```
Component → Hook → Service → Domain
  └─ SeatPickerClient.tsx
       └─ useShowDetail / useCart / usePurchase
            └─ show.service / seat.service / purchase.service
                 └─ InventoryRegistry (Singleton)
                      ↑ TicketingFacade (Facade)
                      ↑ TicketValidator (Template Method)
                      ↑ PurchaseCommand / CancelCommand (Command)
                      ↑ PricingStrategy (Strategy)
                      ↑ CapacityEventBus (Observer)
```

## Key Findings

### State Pattern
- `TicketState` objects are stateless — they only implement transition logic
- `Ticket` record is the carrier; states are the dispatch table
- Pattern prevents illegal transitions at the source — no guard clauses scattered across callers

### Builder Pattern
- `seat()` being additive vs overwriting is the crucial design choice for multi-seat orders
- `build()` batches all validation — partial construction is always valid; invalid state only surfaced at build time

### Observer Pattern
- Bus exception isolation is non-negotiable: `emit()` wraps each observer call in try/catch
- `subscribe()` returning an unsubscribe function (vs `.unsubscribe(observer)`) avoids reference-holding issues

### Singleton vs Module-Level Export
- `const inventoryStore = new InventoryStore()` (guitar-factory-poc style) is simpler but cannot be reset between tests
- `getInstance()` with static field + `resetForTests()` enables isolated unit tests
- Both approaches survive Next.js hot-reload since they live in Node.js process memory

### Template Method vs Strategy for Validation
- Template Method: skeleton guaranteed, subclass cannot skip steps — rigidity is the feature
- Strategy: more flexible, but caller must select the validator — puts responsibility in wrong place
- Template Method fits validation where the sequence `checkCapacity → checkDate → checkZoneRules` is invariant

### Facade
- Every real logic lives in a subsystem — Facade adds zero business logic
- Validation short-circuits before pricing or commands — fast failure with no side effects
- Failure in Facade.purchaseTickets() before the command step = no seats reserved, no events fired

## Run Experiments

```bash
# From ticket-system-poc/ directory
npx tsx experiments/POC01_state/impl_1.ts
npx tsx experiments/POC01_state/failure-path.ts
# ... through POC10
```

All output lines must start with `[OK]` or `[INFO]`. Any `[FAIL]` or unhandled exception = broken failure path.
