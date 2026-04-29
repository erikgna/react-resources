React Context API POC — Action Plan

1. Objective Definition

Target internal mechanics, not usage:

Context propagation model
Re-render triggers and bailout conditions
Context vs prop comparison for rendering cost
Composition and nesting behavior
Performance characteristics under stress

2. Minimal Setup (No abstractions first)

React (no frameworks)
No state libraries

Build from scratch:

createContext
Provider
useContext
Consumer (legacy pattern)

Validate:

Default value behavior (no Provider above tree)
Reference identity and update triggers
Context is not reactive by default — understand why

3. Core Experiments

3.1 Propagation Mechanics

Single context, multiple consumers
Nested providers (inner shadows outer)
Context value referential identity: object vs primitive

Stress:

Provider value changes every render (inline object)
Measure full subtree re-render cost

3.2 Re-render Granularity

Do NOT use memo initially.

Implement:

Multiple consumers at different tree depths
Mix context-dependent and context-independent siblings

Observe:

Which components re-render on context change
Sibling isolation (or lack thereof)

Break:

Trigger unnecessary re-renders via unstable value reference
Quantify cost with React Profiler

3.3 Optimization Techniques

Now introduce optimizations:

useMemo on Provider value
useCallback on dispatched functions
React.memo on consumer components

Analyze:

Bailout conditions: when does React skip re-render
Object.is comparison internals
Splitting one large context vs multiple small contexts

Force issues:

Partial context update that re-renders unrelated consumers
Demonstrate context selector pattern (manual workaround)

3.4 Context + useReducer Pattern

Implement:

State context (read-only)
Dispatch context (stable reference)
Custom hook wrapping both

Test:

Dispatch stability across renders
State shape evolution
Error boundary interaction

3.5 Multiple Context Composition

Implement:

Theme context
Auth context
Locale context

Test:

Provider nesting order impact
Consumer that reads from 2+ contexts
Context collision and naming discipline

3.6 Dynamic Context (Runtime Value Changes)

Stress:

High-frequency updates (e.g., real-time counter, typing input)
Context driving a large list (100–1000 items)

Measure:

Re-render count per update
Frame budget impact
Compare: context vs prop drilling for same scenario

4. Performance Analysis

Measure:

Re-render count per context update
Subtree size impact
Memory overhead vs prop drilling

Tools:

React Profiler (Flamegraph + Ranked)
console.count inside render functions
Custom render counter hook

Scenarios:

High-frequency updates
Deep tree (10+ levels) vs shallow tree
1 large context vs 5 small split contexts

5. Failure Scenarios

Intentionally break:

Mutate context value in place (object property change without new ref)
Consume context outside Provider (verify default value behavior)
Circular context dependency (two contexts reading each other)
Context update inside render function

Observe:

Silent staleness vs re-render
Error surfaces
React's stale closure traps with useContext

6. Advanced Patterns

Implement:

Context selector pattern (manual, no libraries)
Compound component pattern using context for implicit state
Context-driven dependency injection
Lazy context initialization

Compare:

Context vs Zustand for same state shape
Context + useReducer vs Redux (from existing POC)
Cognitive complexity delta

7. Source Code Reading

Inspect:

react/packages/react/src/ReactContext.js
react/packages/react-reconciler/src/ReactFiberNewContext.js
Fiber traversal: how context propagates down the tree

Focus:

How changedBits / calculateChangedBits worked (legacy) and what replaced it
How React determines which consumers to notify
Bailout logic in fiber reconciler

8. Deliverables

Codebase with isolated experiments (Vite + React + TypeScript)
Benchmarks: re-render counts before/after optimizations
Written findings:
  Where Context breaks down
  When it scales well
  Hidden re-render costs

9. Escalation (Deep POC)

Replace Context with custom pub/sub (EventEmitter-style)
Implement a minimal context selector library
Compare with Zustand and Jotai for same problem
Measure cognitive + runtime complexity across all three

10. Constraint

Follow POC discipline:

No shallow usage
No copy-paste patterns
Every abstraction must be broken and inspected
