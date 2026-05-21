---
name: erik-frontend-architect
description: >
  Frontend architecture reviews and code generation grounded in Erik's
  principles: analysis before implementation, tradeoffs explicit, deep platform
  knowledge, TypeScript-first React. Use when creating components, hooks, services,
  state management, or reviewing frontend architecture for violations.
  Triggers on: "review frontend", "frontend architecture", "react component",
  "state management", "frontend design", "create hook", "create service".
---

Apply these principles when generating, reviewing, or advising on frontend code.

## Core Philosophy (Non-negotiable)

**Analysis before implementation.** For any non-trivial task, state the tradeoffs
before writing code. Never jump to solution without naming the constraints.

**Go deep.** Understand what the framework does under the hood. When using React hooks,
know the reconciler. When using state libraries, know the reactive model. Shallow usage
is a liability.

**Hacker mindset.** Raise the bar. If the existing pattern is wrong, say so and propose
a better one. Never just replicate bad patterns.

**Extreme ownership.** The frontend is a system. Performance, accessibility, security,
observability — all owned, never delegated.

## TypeScript

- TypeScript always. No `any`. No `@ts-ignore` without a comment explaining why.
- Effective TypeScript patterns: discriminated unions, mapped types, template literals.
- Clean Code with TypeScript: meaningful names, small functions, single responsibility.

## React Architecture

Data flow is unidirectional and layered:

```
Component → Hook → Service → API Client → Backend
```

- **Components**: render only. No direct API calls. No business logic.
- **Hooks**: orchestrate state + service calls. One concern per hook.
- **Services**: pure functions. API calls only. No state, no UI.
- **API Client**: HTTP concerns (headers, auth tokens, retries, error normalization).

Custom hooks extract ALL stateful logic from components. If a component has `useState`
+ `useEffect` doing a fetch, extract it.

## State Management Selection (always justify choice)

| Scenario | Pick |
|---|---|
| Server state, cache, sync | TanStack Query |
| Simple local/global UI state | Jotai (atomic) or Zustand |
| Complex state machines, explicit transitions | XState |
| Reactive observable streams | MobX or RxJS |
| Large-scale with time-travel debug needs | Redux Toolkit |

Never use Context API for high-frequency updates. Context is for low-churn config
(theme, locale, auth user).

## Module Federation / Micro-Frontend

When Module Federation is in scope:
- Each remote is an independently deployable unit with its own routing scope.
- Shared dependencies (`react`, `react-dom`) must be pinned to singleton singletons
  in the host shell config.
- Remote components must not assume host store shape — use props/events boundary.
- Versioning strategy must be decided before wiring: strict semver pinning or dynamic
  range loading.
- Always name tradeoff: build-time federation vs runtime federation.

## Performance (always on radar)

- Profile before optimizing. Use React DevTools Profiler to identify actual bottlenecks.
- `useMemo` / `useCallback` only where benchmark shows regression, not preemptively.
- Code-split at route and at heavy component boundaries (`React.lazy` + `Suspense`).
- Intersection Observer for lazy loading. Never load off-screen heavy content eagerly.
- Bundle size: audit with webpack-monitor or bundlephobia before adding a dependency.

## Web Platform APIs (know and prefer when sufficient)

Before reaching for a library, check: Service Workers, Web Components, IndexedDB,
Intersection Observer, Mutation Observer, Canvas API, Drag and Drop API, LocalStorage
vs SessionStorage vs Cookies vs IndexedDB (know the tradeoffs).

## Testing (all levels required)

| Level | Tool | Rule |
|---|---|---|
| Unit / component | Jest + React Testing Library | Test behavior, not implementation |
| Integration | Jest + RTL | Test user flows end-to-end within the component tree |
| E2E | Playwright or Cypress | Cover critical user journeys |

High coverage is table stakes. Error paths, negative cases, edge cases matter more
than happy-path coverage percentage. Test failure modes.

## Accessibility (non-optional)

- Semantic HTML first. ARIA only when native elements cannot express the role.
- Keyboard navigation must work for all interactive elements.
- Color contrast must meet WCAG AA minimum.
- Screen reader test before marking a component done.

## UX Awareness

- Apply Design Systems / Atomic Design thinking: atoms → molecules → organisms.
- Microinteractions matter. Loading states, empty states, error states are part of
  the feature — not afterthoughts.
- Usability: "Don't Make Me Think" — if it needs a tooltip to explain, redesign it.
- CSP (Content Security Policy): know the impact of inline styles/scripts.

## Observability on the Frontend

- Errors are not normal. Every uncaught exception should surface somewhere.
- Instrument key user flows (page load, interaction latency) not just errors.
- Use A/B testing / feature flags consciously — measure outcomes, not outputs.

## Code Review Checklist

When reviewing frontend code flag these immediately:
1. Component doing direct fetch (missing service/hook layer)
2. Token stored in localStorage
3. `any` without justification
4. `useEffect` with missing or incorrect deps array
5. No error boundary around async/remote components
6. Deep prop drilling instead of appropriate state solution
7. Missing loading + error + empty states
8. No keyboard/accessibility consideration
9. New dependency added without bundle impact check
10. Module Federation remote not isolated from host store

## Modernization Mindset

Always evaluate: can this be done with a better runtime (Bun/Deno), a better framework
(Next.js, Astro, SolidJS), or a simpler approach (HTMX where React is overkill)?
Recommend modernization when the current choice is clearly the wrong fit — not for
churn, but for fitness.
