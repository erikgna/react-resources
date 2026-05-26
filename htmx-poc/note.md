# HTMX POC — Personal Notes

## Surprises & Non-Obvious Behavior

(fill in as you work through experiments)

### Settlement Algorithm
- Source: `settleImmediately()` ~line ??? in htmx.js
- WHY it exists:
- What .htmx-settling class timing is:

### hx-boost vs hx-get diff
- Source: `boostElement()` ~line ??? in htmx.js
- Behavioral difference observed:

### JS Event Listeners on Swapped Nodes
- Observed behavior:
- Source reference:

### Concurrent Request Handling
- Default behavior (no hx-sync):
- With hx-sync="this:replace":
- Source: `hx-sync` logic ~line ???

### CSP + Script Tags
- `htmx.config.allowScriptTags` default:
- Observed: scripts in swapped HTML execute? Y/N
- Source:

### OOB Swap Decision Rule
- Use OOB when:
- Use multiple requests when:

## Questions That Emerged
(add as you go)

## Source Reading Log
- [ ] `processNode` — read and understood
- [ ] `issueAjaxRequest` — read and understood
- [ ] `handleAjaxResponse` — read and understood
- [ ] `swap` function — read and understood
- [ ] `settleImmediately` — read and understood
- [ ] `boostElement` — read and understood
- [ ] SSE extension (~200 lines) — read and understood
- [ ] WS extension (~200 lines) — read and understood

## Mini-HTMX Repetitions
- [ ] impl_1 (with reference)
- [ ] impl_2 (from memory)
- [ ] impl_3 (from memory)
- [ ] impl_4 (from memory)
- [ ] impl_5 (from memory)
- [ ] impl_6 (from memory)
- [ ] impl_7 (from memory)
- [ ] impl_8 (from memory)
- [ ] impl_9 (from memory)
- [ ] impl_10 (from memory, must be cleaner than impl_1)
