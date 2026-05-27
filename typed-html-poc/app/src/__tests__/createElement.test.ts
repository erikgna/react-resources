import { describe, test, expect } from 'bun:test'
import * as elements from 'typed-html'

// ACTUAL BEHAVIOR (discovered by running, not from docs):
// - Empty attrs {} adds trailing space: <br > not <br>
//   Because: attributesToString({}) returns ' ' + [].join(' ') = ' '
// - Single child: no newlines, content concatenated inline
// - Multiple children: joined with '\n' between them, NO outer newlines
// - null/undefined children: .join('\n') converts them to '' (empty string)

describe('createElement internals', () => {
  test('basic element: empty attrs adds trailing space', () => {
    const result = elements.createElement('div', {}, 'hello')
    // Note: empty attrs {} → ' ' prefix, then content inline
    expect(result).toBe('<div >hello</div>')
  })

  test('void element: empty attrs adds trailing space', () => {
    const result = elements.createElement('br', {})
    expect(result).toBe('<br >')
  })

  test('void element with attrs', () => {
    const result = elements.createElement('input', { type: 'text', value: 'test' })
    expect(result).toBe('<input type="text" value="test">')
  })

  test('nested elements: content inline', () => {
    const inner = elements.createElement('span', {}, 'inner')
    const outer = elements.createElement('div', {}, inner)
    // <span > added space, inner inline
    expect(outer).toContain('<span >')
    expect(outer).toContain('inner')
    expect(outer).toContain('</span>')
    expect(outer).toContain('<div >')
  })

  test('camelCase tag name → kebab-case', () => {
    const result = elements.createElement('myCustomTag', {}, 'content')
    expect(result).toContain('my-custom-tag')
  })

  test('multiple children joined with \\n (no outer newlines)', () => {
    const result = elements.createElement('div', {}, 'first', 'second', 'third')
    expect(result).toBe('<div >first\nsecond\nthird</div>')
  })

  test('empty children: no-content div still has closing tag', () => {
    const result = elements.createElement('div', {})
    expect(result).toBe('<div ></div>')
  })

  test('function component called correctly', () => {
    const received: { attrs: unknown; contents: unknown } = { attrs: null, contents: null }
    const Component = (attrs: Record<string, unknown>, contents: string[]) => {
      received.attrs = attrs
      received.contents = contents
      return 'rendered'
    }
    elements.createElement(Component as never, { id: 'test' }, 'child1', 'child2')
    expect((received.attrs as Record<string, unknown>)['id']).toBe('test')
    expect(received.contents).toEqual(['child1', 'child2'])
  })

  test('array children passed inline flattened by join', () => {
    const items = ['a', 'b', 'c']
    const result = elements.createElement('ul', {}, items as never)
    // Array.isArray(items) → items.join('\n') → 'a\nb\nc'
    expect(result).toContain('a')
    expect(result).toContain('b')
    expect(result).toContain('c')
  })

  test('null attrs (not {}) produces no space', () => {
    // When attrs is null/undefined (not {}), attributesToString returns ''
    const result = elements.createElement('div', null as never, 'hello')
    expect(result).toBe('<div>hello</div>')
  })
})
