---
name: erik-review
description: >
  Applies Erik AI-era code review standards: all pressure is on the
  reviewer, not the generator. Every line must be understood. AI-generated code
  that hasn't been deeply reviewed is rejected. Use when reviewing PRs, code
  submissions, or any code produced with AI assistance.
  Triggers on: "review this code", "review this pr", "code review", "check this",
  "review my changes", "/review".
---

In the AI era, producing code is trivial. The entire quality bar now rests on the
reviewer. Apply these standards without compromise.

## Core Principle

Submitting code you don't fully understand is equivalent to submitting a blank PR.
The generator (human or AI) is irrelevant. The reviewer's job is to verify deep
understanding, not just functional correctness.

## Before Flagging Code for Review (Author Checklist)

The author must be able to answer YES to all of these before submitting:

- Every line: do you know what it does and why?
- Every language feature or token used: can you explain it without looking it up?
- Every algorithm or technique referenced: have you read about it, done a POC, or read the source?
- Every dependency added: do you know its internals, its failure modes, its bundle cost?
- Every external API call: do you know the contract, the error cases, the rate limits?
- Have you tested all failure paths, not just the happy path?
- Have you run it yourself and traced the execution?

If the answer is NO to any of the above: learn it first, then submit.

## Reviewer Standards

When reviewing, enforce these rules:

### 1. Demand Understanding
If the author cannot explain a block of code in a PR review, reject it.
"The AI wrote it" is not an explanation. "I copied it from a blog" is not an explanation.
Understanding is the only acceptable state.

### 2. Flag AI-Slop Patterns
Common signs of unreviewed AI-generated code:
- Overly verbose boilerplate that adds no value
- Generic variable names (`data`, `result`, `temp`, `item`)
- Error handling that swallows exceptions silently
- Comments that describe WHAT the code does instead of WHY
- Unused imports or variables
- Inconsistent style with the surrounding codebase
- Functions that do more than one thing
- Missing edge case handling for inputs the AI "assumed" would be valid

### 3. Verify Depth, Not Just Correctness

Correct code that the author doesn't understand is a liability.
Next sprint, when it breaks, no one can fix it.
Ask: "Walk me through this function" — if the author stumbles, that's a review failure.

### 4. Test Coverage is Non-Optional

Every PR must include tests. Missing tests = incomplete PR, not "to be added later."
Check: are error paths tested? Are edge cases tested? Is the coverage higher than before?

### 5. Performance and Bundle Impact

For frontend: did any new dependency get added? Check bundle cost before approving.
For backend: is there a new query? Check the execution plan.
No "we'll optimize later" on code that's clearly going to be called in a hot path.

### 6. Observability Check

Does the new code emit the right logs and metrics?
Are errors surfaced, not swallowed?
Is there a way to know in production if this code is working or broken?

### 7. Security Surface Check

- Are there new inputs from users or external systems? Are they validated?
- Are there new secrets or tokens? Are they stored correctly?
- Are there new endpoints? Are they authenticated and authorized?
- Is user-generated content rendered anywhere? Is it escaped?

## Review Comment Format

One line per issue: location, problem, fix required.

```
auth/middleware.ts:42 — token stored in localStorage, moves to httpOnly cookie
api/users.ts:17 — no input validation on email field, add zod schema at boundary
CartItem.tsx:88 — direct API call in component, extract to useCartItem hook
```

No softening. No "maybe consider". State the problem and the fix.

## Delivery Standards (AI Era)

Track your own performance. Know your numbers:
- PRs merged per week
- Tests written per PR
- Bugs introduced vs bugs caught in review
- Features delivered vs estimated

Calibration: zero stories delivered per sprint is unacceptable.
Lack of feedback from a manager is not positive feedback.
You are accountable for your own performance metrics.
