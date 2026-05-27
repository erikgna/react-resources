import { describe, test, expect } from 'bun:test'
import * as elements from 'typed-html'

// CRITICAL FINDING: typed-html uses HTML-spec attr names, NOT React camelCase
// className → class-name (NOT class)
// htmlFor → html-for (NOT for)
// typed-html uses actual HTML attribute names in JSX types (class, for, tabindex)
// The camelCase→kebab conversion applies to Attributes index signature only (custom components)

describe('attribute serialization', () => {
  test('boolean true → attribute name only', () => {
    const result = elements.createElement('input', { disabled: true })
    expect(result).toBe('<input disabled>')
  })

  test('boolean false → attribute omitted (but empty attrs still adds space)', () => {
    const result = elements.createElement('input', { disabled: false })
    // disabled=false → omitted, but still have empty attrs space
    expect(result).toBe('<input >')
  })

  test('camelCase → kebab-case (for custom Attributes, not intrinsic elements)', () => {
    // tabIndex is camelCase — gets kebab'd by toKebabCase
    const result = elements.createElement('div', { tabIndex: 1 } as never)
    expect(result).toContain('tab-index="1"')
  })

  test('className → class-name (NOT class — THIS IS THE SURPRISE vs React)', () => {
    // typed-html converts ALL camelCase to kebab — className becomes class-name
    // To set HTML class, use class= directly (or cast to any)
    const result = elements.createElement('div', { className: 'btn' } as never)
    expect(result).toContain('class-name="btn"')
  })

  test('class attribute (correct usage for HTML class)', () => {
    const result = elements.createElement('div', { class: 'btn' } as never)
    expect(result).toContain('class="btn"')
  })

  test('& in attribute value → &amp;', () => {
    const result = elements.createElement('a', { title: 'AT&T' } as never)
    expect(result).toContain('title="AT&amp;T"')
  })

  test('" in attribute value → &quot;', () => {
    const result = elements.createElement('a', { title: '"quoted"' } as never)
    expect(result).toContain('&quot;')
  })

  test('< in attribute value: NOT escaped — partial protection only', () => {
    // escapeAttrNodeValue only handles & " nbsp — NOT < >
    const result = elements.createElement('div', { title: '<danger>' } as never)
    expect(result).toContain('<danger>')
  })

  test('Date attribute → ISO string', () => {
    const d = new Date('2026-01-01T00:00:00Z')
    const result = elements.createElement('time', { datetime: d } as never)
    expect(result).toContain('2026-01-01T00:00:00.000Z')
  })

  test('number attribute → string (via .toString())', () => {
    const result = elements.createElement('input', { tabindex: '5' } as never)
    expect(result).toContain('tabindex="5"')
  })

  test('children key filtered from attributes', () => {
    const result = elements.createElement('div', { id: 'test', children: 'ignored' as never }, 'actual')
    expect(result).not.toContain('children')
    expect(result).toContain('actual')
  })

  test('multiple attrs joined with space', () => {
    const result = elements.createElement('div', { id: 'x', class: 'y' } as never)
    expect(result).toContain('id="x"')
    expect(result).toContain('class="y"')
  })
})
