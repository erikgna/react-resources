SPDD — Structured Prompt-Driven Development

Core idea: Treat prompts as first-class artifacts (version-controlled, reviewed,  
 reused) instead of throwaway chat. A structured prompt captures requirements,  
 design intent, constraints, and task breakdown so AI output is predictable and  
 auditable.

---

The REASONS Canvas

The 7-part structure every prompt must cover:

┌──────────────┬───────────────────────────────────────────────────────────┐  
 │ Letter │ What it captures │  
 ├──────────────┼───────────────────────────────────────────────────────────┤  
 │ Requirements │ Problem + definition of done │
├──────────────┼───────────────────────────────────────────────────────────┤  
 │ Entities │ Domain model & relationships │  
 ├──────────────┼───────────────────────────────────────────────────────────┤  
 │ Approach │ Strategy to meet requirements │  
 ├──────────────┼───────────────────────────────────────────────────────────┤  
 │ Structure │ Where the change fits, components, dependencies │
├──────────────┼───────────────────────────────────────────────────────────┤  
 │ Operations │ Concrete, testable implementation steps │
├──────────────┼───────────────────────────────────────────────────────────┤  
 │ Norms │ Naming, observability, defensive coding standards │
├──────────────┼───────────────────────────────────────────────────────────┤  
 │ Safeguards │ Non-negotiables: invariants, security, performance limits │
└──────────────┴───────────────────────────────────────────────────────────┘

---

Action Points

1. Design before you generate — define objects, boundaries, and responsibilities
   before prompting for code. Skipping this leads to structural drift that shows up as
   expensive rework.
2. Lock intent before writing code — make explicit what the change will and won't  
   do. Align with stakeholders at the requirement level, not the code level.
3. Version control your prompts alongside code — keep prompts in the same repo. A
   prompt that lives only in chat history is already dead.
4. Fix the prompt first, then fix the code — when a logic bug is found, update the
   structured prompt to capture the correct intent, then regenerate. Never patch code
   silently.
5. Sync code changes back to the prompt — after any refactor, run /spdd-sync (or  
   equivalent) to keep the spec accurate. A stale prompt is worse than no prompt.
6. Use iterative review, not one-shot generation — generate → review → correct in
   small loops. Minor code smells are fine early; verify core logic first, then  
   optimize.
7. Know when NOT to use SPDD — poor fit for: hotfixes, exploratory spikes, one-off
   scripts, undefined domains, and pure visual/creative work. Best fit: complex  
   business logic, regulated environments, multi-person teams needing audit trails.

---

The key mental shift

▎ Reviews move away from "spot the bug" toward "check the intent."

The value of developers shifts from typing code to framing problems clearly —  
 abstraction, domain modelling, and knowing what to constrain are the skills that  
 determine how much value you extract from AI.
