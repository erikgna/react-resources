---
name: erik-poc
description: >
  Enforces Erik's POC depth standards when building or evaluating a
  proof of concept. Shallow POCs ("just call the methods") are rejected.
  Deep POCs debug internals, read source code, test failure conditions, compare
  approaches. Triggers on: "build a poc", "proof of concept", "explore this lib",
  "try this approach", "experiment with", "spike on".
---

A POC is a lab. Its purpose is to learn something true about a technology, approach,
or idea — not to produce a demo. Apply these standards.

## What Makes a POC Deep (Required)

A deep POC does ALL of the following:

**Debug internals**
- Set breakpoints inside the library/framework, not just your code.
- Write down class names, call stacks, and internal flows as you trace.
- Draw diagrams of what you discover.

**Read source code**
- Read the source of the library or framework being tested.
- Do not rely solely on documentation or tutorials — docs lie, source doesn't.
- Identify the key abstractions and how they compose.

**Test multiple conditions**
- Happy path is the minimum. Also test: error conditions, boundary values,
  concurrent access, resource exhaustion, partial failures.
- What happens when a dep is unavailable? When input is malformed? When limits hit?

**Research and compare**
- What patterns do other teams use for this? Are there idiomatic approaches?
- Compare at least two implementations or approaches. Benchmark if performance matters.
- Read papers and official docs (not just tutorials).

**Challenge yourself**
- If it feels too easy, the POC is too shallow. Push further.
- Consider building a small version of the thing itself (a mini parser, a mini renderer,
  a mini scheduler) to truly understand the problem domain.

## What a Shallow POC Looks Like (Reject These)

- Calls a few public API methods, prints the result, stops.
- Only covers the happy path.
- No debugging into the library internals.
- No failure condition testing.
- Author cannot explain what happens under the hood.
- Copied from a tutorial without modification or deeper exploration.

## POC File Structure

Repeat each implementation multiple times from memory:
```
src/POC01_impl_1.ts   ← first attempt (can look at reference)
src/POC01_impl_2.ts   ← from memory
src/POC01_impl_3.ts   ← from memory, no peeking
...
src/POC01_impl_10.ts  ← should be cleaner/better than impl_1
```
10 repetitions minimum before moving to the next concept.
Repetition builds real understanding, not recognition.

## POC Presentation Requirements

When presenting a POC for review:
1. Explain the problem being explored.
2. Walk through the code line by line — no skipping.
3. Call out what was hard to understand.
4. Show the parts that were surprising or non-obvious.
5. Propose at least one refactoring improvement.
6. Ask for feedback on what was missed.

## Improvement Loop

After completing a POC:
- Share with others and ask for feedback.
- Search for better/different ways to solve the same problem.
- Read source code of large real-world projects using the same technology
  (React, Node.js, Spring, Linux kernel — whatever is relevant).
- Document what you learned: text explaining what, why, and why it matters.
- Good POCs take hours, days, sometimes weeks. That is expected and correct.

## Anti-patterns to Flag

| Anti-pattern | Why it fails |
|---|---|
| Tutorial copy-paste | Teaches recognition, not understanding |
| No error handling exploration | Misses 50% of real behavior |
| Single implementation | No muscle memory, no improvement |
| No source code reading | Understanding stays surface-level |
| "It works" as conclusion | Doesn't answer *why* it works or *when* it breaks |
