# React Architecture POC  
## Restaurant Queue System

### Goal
Demonstrate a **scalable, boundary-driven React architecture** using a small but realistic codebase.

This POC focuses on:
- Clear architectural boundaries
- Explicit state and side-effect handling
- Runtime and browser API awareness
- Behavior-focused testing
- Tradeoff-driven decision making

---

## 1. Domain Description

### Problem
Build a **Restaurant Queue System** capable of:
- Managing incoming dish orders
- Estimating preparation time per dish
- Calculating queue wait time dynamically
- Updating estimates as the queue changes

The system must answer:
> “If I order *Dish X* now, how long will it take?”

---

## 2. Core Functional Scope (Vertical Slice)

### User Flow
1. Staff adds an order (dish + quantity)
2. Orders enter a preparation queue
3. Each dish has a base preparation time
4. Queue recalculates estimated wait times in real time
5. Orders can be completed or canceled
6. UI updates immediately and predictably

---

## 3. Architectural Principles

- **React is a rendering & composition layer**
- Business logic lives outside components
- Side effects are isolated
- State types are explicit
- Features are isolated by domain
- Test behavior, not implementation

---

## 4. Tech Stack (Intentional)

| Concern | Choice | Rationale |
|------|------|-----------|
| Framework | React + Vite | Minimal abstraction |
| Styling | Tailwind CSS | Explicit in curriculum |
| Routing | React Router | Explicit ownership |
| Server State | SWR | Declarative async state |
| HTTP | Fetch | Baseline API |
| Testing | Playwright | Real user flows |
| Linting | ESLint + boundaries | Enforced architecture |

---

## 5. Folder Structure & Boundaries

src/
app/
bootstrap.tsx
router.tsx
providers/

features/
queue/
api.ts
domain.ts
hooks.ts
components/
types.ts
orders/
  api.ts
  domain.ts
  hooks.ts
  components/
  types.ts
  shared/
ui/
hooks/
lib/
types/

infrastructure/
http/
storage/
time/


### Boundary Rules
- `features` cannot import from each other
- `shared` contains pure, dependency-free utilities
- `infrastructure` has no React imports
- Components never contain business rules

---

## 6. Feature Breakdown

### Orders Feature
**Responsibility**
- Create and manage orders
- Persist orders locally (mock backend)

**Key Concepts**
- Order lifecycle: `queued → preparing → done`
- Orders are immutable events, not mutable objects

**Demonstrates**
- Client state vs server state
- Controlled side effects
- Persistence abstraction

---

### Queue Feature
**Responsibility**
- Calculate preparation timelines
- Estimate wait time per order
- React to queue changes

**Core Logic**
- Each dish has:
  - base prep time
  - optional complexity multiplier
- Queue recalculates ETA whenever:
  - new order added
  - order removed
  - order completed

**Important**
> Queue calculation logic lives in `domain.ts`, not in React.

---

## 7. Business Logic Isolation (Critical)

### `queue/domain.ts`
Contains:
- ETA calculation algorithm
- Queue rebalancing rules
- Time estimation strategies

This logic:
- Is pure
- Is deterministic
- Has no React or browser dependencies

React consumes results, never computes them.

---

## 8. Side Effects & Data Flow

**Rules**
- No `fetch` inside components
- No timers inside JSX
- Effects live in hooks or infrastructure

**Example Flow**
UI action
→ hook
→ domain logic
→ API / storage
→ state update
→ re-render

---

## 9. Browser & Runtime Integration

### Required API Usage
**IntersectionObserver**
- Used to lazy-load historical orders

### Optional (Bonus)
- `performance.now()` to measure queue recalculation cost
- Web Worker (documented, not required)

---

## 10. Routing Strategy

/login
/orders
/queue


- Routes owned by features
- Layout handled in `app/`
- Protected routes for staff-only views

---

## 11. Performance Strategy

Demonstrate:
- Memoized queue calculations
- List virtualization (optional)
- Lazy-loaded routes

Explicitly document:
- What was *not* optimized
- Why premature optimization was avoided

---

## 12. State Taxonomy

| State Type | Example |
|----------|--------|
| Server State | Orders list |
| Client State | Auth, filters |
| UI State | Dialogs, loading flags |

Each state type has **one owner**.

---

## 13. Testing Strategy

### Playwright (Required)
One end-to-end test:
1. Add multiple orders
2. Observe ETA changes
3. Complete an order
4. Verify recalculated wait times

### Philosophy
- Minimal mocks
- Test flows
- Confidence > coverage

---

## 14. Non-Goals (Explicit)

This POC intentionally excludes:
- Redux / Zustand
- SSR
- Micro-frontends
- Advanced caching
- Heavy unit testing

These are tradeoffs, not omissions.

---

## 15. Evaluation Criteria

This architecture succeeds if:
- A new dish type can be added without touching UI
- Queue rules can change without breaking components
- A new feature can be added without refactoring
- Tests survive refactors

---

## 16. Timebox

- Day 1: Structure, orders feature, routing
- Day 2: Queue logic, ETA calculation, UI
- Day 3: Tests, performance notes, README

---

## Final Note

This POC is not about “using React correctly”.
It is about **designing systems that happen to use React**.
