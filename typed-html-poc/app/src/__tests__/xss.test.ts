import { describe, test, expect } from 'bun:test'
import * as elements from 'typed-html'

// ACTUAL XSS behavior documented (verified by running tests):
// - Text content: NOT escaped — script tags pass through raw
// - Attribute values: & → &amp;, " → &quot;, nbsp → &nbsp; (partial escaping)
// - Attribute < >: NOT escaped — only & " nbsp in escapeAttrNodeValue
// - null/undefined children: rendered as '' (empty) via .join() coercion
// - false children: rendered as 'false' string (FOOTGUN)
// - Bun.escapeHTML() is the correct remediation for content XSS

describe('XSS behavior (document, not fix)', () => {
  test('content NOT escaped — script tag passes through', () => {
    const payload = '<script>alert(1)</script>'
    const result = elements.createElement('div', {}, payload)
    expect(result).toContain('<script>alert(1)</script>')
  })

  test('HTML injection in content is raw', () => {
    const payload = '<b>injected</b>'
    const result = elements.createElement('p', {}, payload)
    expect(result).toContain('<b>injected</b>')
  })

  test('attribute & → escaped', () => {
    const result = elements.createElement('div', { title: 'AT&T' } as never)
    expect(result).toContain('&amp;')
    expect(result).not.toContain('title="AT&T"')
  })

  test('attribute " → escaped', () => {
    const result = elements.createElement('div', { title: '"val"' } as never)
    expect(result).toContain('&quot;')
  })

  test('attribute < is NOT escaped — partial protection only', () => {
    // escapeAttrNodeValue regex: /(&)|(")|( )/g — only & " nbsp
    const result = elements.createElement('div', { title: '<dangerous>' } as never)
    expect(result).toContain('<dangerous>')
  })

  test('Bun.escapeHTML() remediates content XSS', () => {
    const payload = '<script>alert(1)</script>'
    const safe = Bun.escapeHTML(payload)
    const result = elements.createElement('div', {}, safe)
    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;script&gt;')
  })

  test('false child → renders as string "false" (FOOTGUN: not empty)', () => {
    // [false].join('\n') = 'false' — boolean coerced to string by Array.join
    const result = elements.createElement('div', {}, false as unknown as string)
    expect(result).toContain('false')
  })

  test('null child → renders as "" empty (join coerces null to empty)', () => {
    // [null].join('\n') = '' — Array.join converts null to ''
    const result = elements.createElement('div', {}, null as unknown as string)
    expect(result).not.toContain('null')
    expect(result).toBe('<div ></div>')
  })

  test('undefined child → renders as "" empty (join coerces undefined to empty)', () => {
    // [undefined].join('\n') = '' — Array.join converts undefined to ''
    const result = elements.createElement('div', {}, undefined as unknown as string)
    expect(result).not.toContain('undefined')
    expect(result).toBe('<div ></div>')
  })
})
