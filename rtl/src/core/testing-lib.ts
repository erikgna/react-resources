// Hand-rolled minimal reimplementation of @testing-library/react core concepts.
// Purpose: understand what render/screen/waitFor actually do before using the real library.
// This runs in the browser (no jsdom) — it uses the real DOM.

import { createElement, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BoundQueries {
  getByText: (text: string) => Element
  queryByText: (text: string) => Element | null
  getByRole: (role: string, opts?: { name?: string }) => Element
  queryByRole: (role: string, opts?: { name?: string }) => Element | null
  getByTestId: (testId: string) => Element
  queryByTestId: (testId: string) => Element | null
  getAllByText: (text: string) => Element[]
}

export interface RenderResult extends BoundQueries {
  container: HTMLElement
  unmount: () => void
  rerender: (ui: ReactElement) => void
}

// ─── DOM text walker ──────────────────────────────────────────────────────────
// RTL walks the DOM tree looking for exact text matches in text nodes.
// This is intentionally different from querySelector('[data-text="..."]').

function hasText(element: Element, text: string): boolean {
  const content = element.textContent ?? ''
  return content.trim() === text || content.includes(text)
}

function walkForText(root: Element, text: string): Element | null {
  // Check children first (deepest match preferred — mirrors real RTL behavior)
  for (const child of Array.from(root.children)) {
    const found = walkForText(child, text)
    if (found) return found
  }
  if (hasText(root, text) && root.children.length === 0) return root
  if (hasText(root, text)) return root
  return null
}

function walkAllForText(root: Element, text: string): Element[] {
  const results: Element[] = []
  for (const child of Array.from(root.querySelectorAll('*'))) {
    if (hasText(child, text) && !Array.from(child.children).some(c => hasText(c, text))) {
      results.push(child)
    }
  }
  return results
}

// ─── Role resolution ──────────────────────────────────────────────────────────
// Simplified ARIA role mapping. Real RTL uses aria-query for the full spec.

const IMPLICIT_ROLES: Record<string, string[]> = {
  button:     ['button'],
  a:          ['link'],
  input:      ['textbox', 'checkbox', 'radio', 'spinbutton', 'combobox'],
  select:     ['combobox', 'listbox'],
  textarea:   ['textbox'],
  h1: ['heading'], h2: ['heading'], h3: ['heading'],
  h4: ['heading'], h5: ['heading'], h6: ['heading'],
  img:        ['img'],
  ul:         ['list'],
  ol:         ['list'],
  li:         ['listitem'],
  nav:        ['navigation'],
  main:       ['main'],
  form:       ['form'],
  table:      ['table'],
  dialog:     ['dialog'],
}

function getImplicitRole(element: Element): string {
  const tag = element.tagName.toLowerCase()
  const attrRole = element.getAttribute('role')
  if (attrRole) return attrRole
  const roles = IMPLICIT_ROLES[tag]
  if (!roles) return ''
  if (tag === 'input') {
    const type = element.getAttribute('type') ?? 'text'
    if (type === 'checkbox') return 'checkbox'
    if (type === 'radio') return 'radio'
    if (type === 'number') return 'spinbutton'
    return 'textbox'
  }
  return roles[0]
}

function getAccessibleName(element: Element): string {
  // aria-label > aria-labelledby > label[for] > placeholder > text content
  const ariaLabel = element.getAttribute('aria-label')
  if (ariaLabel) return ariaLabel

  const labelledBy = element.getAttribute('aria-labelledby')
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy)
    if (labelEl) return labelEl.textContent ?? ''
  }

  const id = element.getAttribute('id')
  if (id) {
    const labelEl = document.querySelector(`label[for="${id}"]`)
    if (labelEl) return labelEl.textContent ?? ''
  }

  const placeholder = element.getAttribute('placeholder')
  if (placeholder) return placeholder

  return element.textContent ?? ''
}

// ─── Query builders ───────────────────────────────────────────────────────────

function buildQueries(container: Element): BoundQueries {
  return {
    getByText(text) {
      const el = walkForText(container, text)
      if (!el) throw new Error(`Unable to find element with text: "${text}"`)
      return el
    },
    queryByText(text) {
      return walkForText(container, text)
    },
    getAllByText(text) {
      const els = walkAllForText(container, text)
      if (els.length === 0) throw new Error(`Unable to find any elements with text: "${text}"`)
      return els
    },
    getByRole(role, opts = {}) {
      const all = Array.from(container.querySelectorAll('*'))
      const matches = all.filter(el => {
        if (getImplicitRole(el) !== role) return false
        if (opts.name) {
          const name = getAccessibleName(el).trim()
          return name === opts.name || name.includes(opts.name)
        }
        return true
      })
      if (matches.length === 0) throw new Error(`Unable to find role "${role}"${opts.name ? ` with name "${opts.name}"` : ''}`)
      if (matches.length > 1 && opts.name) return matches[0]
      return matches[0]
    },
    queryByRole(role, opts = {}) {
      try { return buildQueries(container).getByRole(role, opts) }
      catch { return null }
    },
    getByTestId(testId) {
      const el = container.querySelector(`[data-testid="${testId}"]`)
      if (!el) throw new Error(`Unable to find element with data-testid: "${testId}"`)
      return el
    },
    queryByTestId(testId) {
      return container.querySelector(`[data-testid="${testId}"]`)
    },
  }
}

// ─── render ───────────────────────────────────────────────────────────────────
// What RTL render() does: mount the component into a detached div, then return
// query helpers bound to that container.

const mounted: Array<{ root: Root; container: HTMLElement }> = []

export function render(ui: ReactElement): RenderResult {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)

  // React 19 createRoot is synchronous for initial render in test environments
  root.render(ui)

  const result = mounted.find(m => m.container === container)
  if (!result) mounted.push({ root, container })

  return {
    container,
    unmount() {
      root.unmount()
      container.remove()
    },
    rerender(newUi: ReactElement) {
      root.render(newUi)
    },
    ...buildQueries(container),
  }
}

// ─── cleanup ─────────────────────────────────────────────────────────────────
// RTL registers cleanup via afterEach automatically. We expose it manually here.

export function cleanup() {
  mounted.forEach(({ root, container }) => {
    root.unmount()
    container.remove()
  })
  mounted.length = 0
}

// ─── fireEvent ────────────────────────────────────────────────────────────────
// Dispatches real DOM events. Note: bubbles:true is critical — React uses
// event delegation at the root, so events that don't bubble never reach handlers.

export const fireEvent = {
  click(element: Element) {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  },
  change(element: Element, value: string) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    if (nativeInputValueSetter) nativeInputValueSetter.call(element, value)
    element.dispatchEvent(new Event('input', { bubbles: true }))
    element.dispatchEvent(new Event('change', { bubbles: true }))
  },
  submit(element: Element) {
    element.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  },
  focus(element: Element) {
    (element as HTMLElement).focus()
    element.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
  },
  blur(element: Element) {
    (element as HTMLElement).blur()
    element.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
  },
  keyDown(element: Element, key: string) {
    element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  },
}

// ─── waitFor ─────────────────────────────────────────────────────────────────
// Polls a callback until it stops throwing (or times out).
// Real RTL uses MutationObserver + microtask flushing for tighter coupling.

export function waitFor<T>(
  callback: () => T,
  options: { timeout?: number; interval?: number } = {},
): Promise<T> {
  const timeout = options.timeout ?? 1000
  const interval = options.interval ?? 50
  const start = Date.now()

  return new Promise((resolve, reject) => {
    function attempt() {
      try {
        resolve(callback())
      } catch (err) {
        if (Date.now() - start > timeout) {
          reject(err)
        } else {
          setTimeout(attempt, interval)
        }
      }
    }
    attempt()
  })
}
