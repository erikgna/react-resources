---
name: erik-arch-doc
description: >
  Produces architecture documentation following Erik's 12-section design
  doc template. Use when asked to design a system, write an architecture doc,
  create a technical proposal, or review an architecture for completeness.
  Triggers on: "design this system", "write arch doc", "architecture document",
  "technical design", "system design", "design proposal".
---

When producing or reviewing architecture documentation, enforce this exact 12-section
structure. Every section is required. Missing sections = incomplete doc.

## Section 1 — Problem Statement and Context

One clear paragraph: what is the problem, what is the context.
No solution yet. Problem only.

## Section 2 — Goals

5–10 bullet points. Measurable where possible.
Example format: "Performance: all operations < 1ms p99"

## Section 3 — Non-Goals

5–10 bullet points. Explicitly name what is OUT of scope and WHY.
Non-goals prevent scope creep. Missing non-goals = underspecified doc.

## Section 4 — Principles

5–10 design principles that constrain all decisions.
Examples: Low Coupling, Observability, Testability, Cache Efficiency, Security at rest+transit.
Principles are not goals — they are constraints on HOW to achieve goals.

## Section 5 — Diagrams

Three required diagrams:
- **5.1 Overall Architecture**: macro components and their relationships
- **5.2 Deployment**: infrastructure big picture
- **5.3 Use Cases**: one macro use case diagram covering main capabilities

Use UML or clear labeled boxes/arrows. No diagram = no architecture.

## Section 6 — Tradeoffs

Two parts:

**Major Decisions list** — enumerate each significant architectural choice.

**Tradeoff analysis** for each decision:
```
Decision: React Native vs Flutter vs Native
PROS (+)
  * Single codebase: one team, one deploy pipeline, lower maintenance cost.
CONS (-)
  * Performance ceiling: cannot match native rendering for heavy animations.
```
Every major decision needs explicit PROS and CONS with justification.
Do not confuse the problem with the explanation.

## Section 7 — Per-Component Design

For each major component (service, UI, batch job, event stream, 3rd party integration):
- **7.1 Class Diagram**: UML with attributes and methods
- **7.2 Contract**: operations, inputs, outputs
- **7.3 Persistence Model**: schema, partitioning, main queries
- **7.4 Algorithms/Data Structures**: specific algorithms and data structures required

## Section 8 — Migration Strategy

If migrations are required: describe the strategy with diagrams, text, and tradeoffs.
Green migration principles: smooth, observable, no critical bugs, no surprises.
If no migration: state explicitly "No migration required because X."

## Section 9 — Testing Strategy

Specify:
- Types of tests: unit, integration, E2E, chaos, performance, security, property-based, mutation, fuzzy, smoke, stress
- How test data will be mocked/generated
- Chaos engineering goals and assumptions
- Specific pass/coverage targets per component

## Section 10 — Observability Strategy

Specify:
- What gets logged and at what level
- Key metrics exposed per component (success counters, error counters, latency)
- Dashboard design: what panels, what alerts, what thresholds
- Error budget and SLO targets if applicable

## Section 11 — Data Store Designs

For each data store (Postgres, Redis, S3, Elasticsearch, etc.):
- Schema or data model
- What is stored there and why (fitness for purpose)
- Main queries / access patterns
- Performance expectations

## Section 12 — Technology Stack

- Databases, servers, frameworks, libraries
- What is explicitly excluded and why
- UI/mobile approach
- Cloud provider and key managed services

---

## Review Checklist

Flag these as blockers in any arch doc review:
1. Problem statement contains solution language
2. Goals are not measurable
3. Non-goals section missing
4. Tradeoffs present no CONS (means analysis is shallow)
5. No diagrams
6. Testing strategy is "we'll write unit tests" with no further detail
7. Observability section absent or says "we'll add metrics later"
8. Data store section missing schema details
9. Migration section absent when migrations are clearly needed
10. Stack section lists tools without justification
