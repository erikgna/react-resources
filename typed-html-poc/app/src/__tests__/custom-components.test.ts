import { describe, test, expect } from 'bun:test'
import * as elements from 'typed-html'
import type { Attributes, Children, CustomElementHandler } from 'typed-html'

describe('CustomElementHandler', () => {
  test('function component receives attrs and contents', () => {
    const received: { attrs: unknown; contents: unknown } = { attrs: null, contents: null }
    const Comp: CustomElementHandler = (attrs, contents) => {
      received.attrs = attrs
      received.contents = contents
      return 'rendered'
    }
    elements.createElement(Comp, { id: 'test', foo: 'bar' }, 'child1', 'child2')
    expect((received.attrs as Record<string, unknown>)['id']).toBe('test')
    expect((received.attrs as Record<string, unknown>)['foo']).toBe('bar')
    expect(received.contents).toEqual(['child1', 'child2'])
  })

  test('children merged into attrs object', () => {
    const Comp: CustomElementHandler = (attrs) => {
      return String(attrs.children)
    }
    // When contents exist, they are merged as children into attrs
    const result = elements.createElement(Comp, {}, 'my-child')
    expect(result).toContain('my-child')
  })

  test('component return value used as HTML', () => {
    const Header: CustomElementHandler = (_attrs, contents) => (
      `<header><h1>${contents[0]}</h1></header>`
    )
    const result = elements.createElement(Header, {}, 'Page Title')
    expect(result).toBe('<header><h1>Page Title</h1></header>')
  })

  test('component with no children', () => {
    const Icon: CustomElementHandler = (attrs) => {
      const name = attrs['name'] as string
      return `<svg aria-label="${name}"></svg>`
    }
    const result = elements.createElement(Icon, { name: 'star' })
    expect(result).toBe('<svg aria-label="star"></svg>')
  })

  test('AttributeValue types accepted without error', () => {
    const Debug: CustomElementHandler = (attrs) => JSON.stringify(attrs)
    const d = new Date('2026-01-01')
    const result = elements.createElement(Debug, {
      str: 'hello',
      num: 42,
      bool: true,
      date: d,
      arr: ['a', 'b'],
    })
    const parsed = JSON.parse(result)
    expect(parsed.str).toBe('hello')
    expect(parsed.num).toBe(42)
    expect(parsed.bool).toBe(true)
  })

  test('nested custom components', () => {
    const Inner: CustomElementHandler = (_attrs, contents) => `<inner>${contents[0]}</inner>`
    const Outer: CustomElementHandler = (_attrs, contents) => `<outer>${contents[0]}</outer>`

    const innerResult = elements.createElement(Inner, {}, 'deep')
    const result = elements.createElement(Outer, {}, innerResult)
    expect(result).toBe('<outer><inner>deep</inner></outer>')
  })
})
