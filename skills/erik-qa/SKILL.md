---
name: erik-qa
description: >
  Applies Erik's QA manifesto when writing tests, reviewing test suites,
  or defining testing strategies. Enforces engineering-grade QA: automation mandatory,
  errors trend to zero, full test diversity, observability required.
  Triggers on: "write tests", "test strategy", "review tests", "qa plan",
  "test coverage", "testing approach", "add tests".
---

Apply these QA rules when writing, reviewing, or advising on any test suite.

## Rule 1 — QA is Engineering

QA is not clicking buttons. QA reads code, debugs code, writes code.
Every test must be written with the same rigor as production code:
meaningful names, single assertion per test, no magic values, no commented-out tests.

## Rule 2 — Automation is Mandatory

Zero manual test steps in the release process. If a manual step exists, it is a
pending automation task, not a valid sign-off gate. Flag it explicitly.

## Rule 3 — Pass Rate is Everything

Tests must pass 100% of the time. A flaky test is a broken test.
Options: fix it or delete it. Skipping or commenting out is not an option.

## Rule 4 — Test Diversity (required types per system)

A complete test suite covers ALL of these — missing types are gaps to call out:

| Type | Purpose |
|---|---|
| Unit | Function/class behavior in isolation |
| Integration | Cross-module + DB/external interactions |
| E2E | Full user journey through the system |
| Contract | API shape verification between services |
| Performance / Stress | Throughput, latency under load |
| Security | Auth, injection, OWASP top 10 surface |
| Chaos | Failure injection: killed deps, network partition, disk full |
| Snapshot | UI/output regression detection |
| Property-based | Invariants hold across random inputs |
| Mutation | Test suite quality — are tests catching real bugs? |
| Fuzzy | Random/malformed input handling |
| Smoke | Minimal post-deploy sanity check |

Coverage number must grow every release. Track test count per type per release.

## Rule 5 — Errors are Not Normal

Total error/exception count in production must trend to zero.
Every new release: error count goes down or stays zero, never up.
Test for error paths explicitly — they are first-class citizens, not afterthoughts.
Negative tests, edge cases, and failure modes get as much coverage as happy paths.

## Rule 6 — Use Open Source

No proprietary test tooling. Use the same tools as the engineering team.
For JS/TS: Jest, React Testing Library, Playwright, Cypress.
Align tooling with the production stack.

## Rule 7 — Observability in Tests

Tests must validate observability instrumentation too:
- Are the right metrics emitted on success and failure?
- Do error counters increment correctly?
- Does the logging output contain expected structured fields?

## Rule 8 — Testing Interfaces

Push for testing endpoints/interfaces in all services.
Tests should not reach through implementation details.
Contract-first design enables parallel testing.

## Rule 9 — Isolation

Each test is fully isolated. No shared mutable state between tests.
Integration tests own their data setup and teardown.
No tests that deploy to shared environments.

## Rule 10 — Documentation

Bug reports require: screenshots, centralized log links, exact reproduction steps,
environment details. "It broke" is not a bug report.

---

## Code Review Checklist for Tests

Flag these immediately:
1. Test has no assertion (passes vacuously)
2. Test asserts implementation details instead of behavior
3. `describe`/`it` names are vague ("should work", "test 1")
4. Commented-out or `.skip`-ped tests without a linked issue
5. Missing error path coverage when the function can clearly fail
6. Setup/teardown mutates shared state
7. E2E test with no negative/error flow coverage
8. No chaos or performance test for any network-facing code
9. Coverage drops from previous release
10. Observability instrumentation untested
