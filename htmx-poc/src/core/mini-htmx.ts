/**
 * mini-htmx — impl 1 (with reference)
 * Covers: hx-get, hx-post, hx-target, hx-swap (innerHTML/outerHTML/beforeend/afterend)
 * Does NOT cover: triggers, OOB, SSE, WS, history, indicators
 *
 * Repeat this from memory 9 more times (impl_2 through impl_10).
 * Goal: impl_10 should be cleaner and handle more edge cases.
 */

type SwapStrategy = "innerHTML" | "outerHTML" | "beforebegin" | "afterbegin" | "beforeend" | "afterend" | "delete" | "none"

function applySwap(target: Element, html: string, strategy: SwapStrategy): void {
  if (strategy === "innerHTML") {
    target.innerHTML = html
  } else if (strategy === "outerHTML") {
    target.outerHTML = html
  } else if (strategy === "beforebegin") {
    target.insertAdjacentHTML("beforebegin", html)
  } else if (strategy === "afterbegin") {
    target.insertAdjacentHTML("afterbegin", html)
  } else if (strategy === "beforeend") {
    target.insertAdjacentHTML("beforeend", html)
  } else if (strategy === "afterend") {
    target.insertAdjacentHTML("afterend", html)
  } else if (strategy === "delete") {
    target.remove()
  }
  // "none": no DOM change
}

function resolveTarget(el: Element): Element {
  const selector = el.getAttribute("hx-target")
  if (!selector || selector === "this") return el
  if (selector === "closest") return el // simplified
  return document.querySelector(selector) ?? el
}

function getSwap(el: Element): SwapStrategy {
  return (el.getAttribute("hx-swap") as SwapStrategy) ?? "innerHTML"
}

function wireElement(el: Element): void {
  const method = el.hasAttribute("hx-post") ? "POST" : "GET"
  const url = el.getAttribute("hx-get") ?? el.getAttribute("hx-post") ?? ""
  const defaultTrigger = el.tagName === "FORM" ? "submit" : "click"
  const trigger = el.getAttribute("hx-trigger") ?? defaultTrigger

  el.addEventListener(trigger, async (e: Event) => {
    e.preventDefault()

    const target = resolveTarget(el)
    const swap = getSwap(el)

    const res = await fetch(url, {
      method,
      headers: {
        "HX-Request": "true",
        "HX-Target": target.id ?? "",
        "HX-Trigger": el.id ?? "",
      },
    })

    if (!res.ok) return // no swap on error (mirrors HTMX default)

    const html = await res.text()

    target.classList.add("htmx-settling")
    applySwap(target, html, swap)

    // re-process new nodes (mirrors processNode)
    processAll(target)

    requestAnimationFrame(() => {
      target.classList.remove("htmx-settling")
    })
  })
}

function processAll(root: Element | Document = document): void {
  root.querySelectorAll("[hx-get],[hx-post]").forEach(wireElement)
}

// Boot
document.addEventListener("DOMContentLoaded", () => processAll())

export { processAll, applySwap }

/**
 * INTERNALS STUDY NOTES (fill in as you read htmx.js):
 *
 * processNode (htmx.js ~line 2800):
 *   - Called after every swap to wire new hx-* attributes
 *   - Handles attribute inheritance (hx-target, hx-swap can be inherited from parent)
 *
 * issueAjaxRequest (~line 1600):
 *   - Builds XMLHttpRequest (not fetch)
 *   - Sets HX-Request, HX-Current-URL, HX-Target, HX-Trigger, HX-Trigger-Name headers
 *   - Handles hx-params, hx-include, hx-encoding
 *
 * handleAjaxResponse (~line 1900):
 *   - Checks response status against htmx.config.responseHandling
 *   - Default: swap only on 2xx
 *   - Parses HX-Redirect, HX-Refresh, HX-Trigger response headers
 *
 * settleImmediately (~line 1400):
 *   - Called after swap completes
 *   - Removes .htmx-settling class
 *   - Fires htmx:afterSettle event
 *
 * Settlement WHY: CSS transitions need the "before" state to exist briefly.
 *   HTMX adds new content (with .htmx-settling) → CSS transition plays →
 *   then removes class. Without this, transition has no starting state.
 */
