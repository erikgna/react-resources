import { PageTitle, Subtitle, Section, Label, Title, Code, Note, Divider } from '../shared'

export default function MatchersExperiment() {
  return (
    <div>
      <PageTitle>Matchers</PageTitle>
      <Subtitle>Built-in, asymmetric, and custom matchers. Source: <code>expect/build/</code> in node_modules.</Subtitle>

      <Section>
        <Label>4.1.1 — Built-in</Label>
        <Title>toBe vs toEqual vs toStrictEqual</Title>
        <Note>
          <strong>toBe</strong> uses <code>Object.is</code> — same reference for objects, handles NaN and -0 correctly.<br />
          <strong>toEqual</strong> deep-compares recursively, ignores undefined properties.<br />
          <strong>toStrictEqual</strong> deep-compares AND checks undefined properties and object types.
        </Note>
        <Code>{`test('toBe uses Object.is', () => {
  expect(1 + 1).toBe(2)
  expect(NaN).toBe(NaN)          // Object.is(NaN, NaN) === true
  expect(-0).not.toBe(0)         // Object.is(-0, 0) === false
})

test('toEqual deep compares, ignores undefined props', () => {
  expect({ a: 1, b: undefined }).toEqual({ a: 1 })   // passes
  expect([1, 2, 3]).toEqual([1, 2, 3])               // passes
  expect({ a: 1 }).not.toBe({ a: 1 })                // different refs
})

test('toStrictEqual checks undefined and object type', () => {
  expect({ a: undefined }).not.toStrictEqual({})     // fails: missing key
  class Foo { x = 1 }
  expect(new Foo()).not.toStrictEqual({ x: 1 })       // fails: different type
})`}</Code>
      </Section>

      <Divider />

      <Section>
        <Label>4.1.2 — Asymmetric Matchers</Label>
        <Title>Partial matching inside toEqual</Title>
        <Note>
          Asymmetric matchers compose with <code>toEqual</code> to assert shape, not exact value.
          Useful for API responses where some fields (timestamps, IDs) are dynamic.
        </Note>
        <Code>{`test('objectContaining — partial object match', () => {
  const response = { id: 42, name: 'Alice', createdAt: Date.now() }
  expect(response).toEqual(
    expect.objectContaining({ name: 'Alice' })
  )
})

test('arrayContaining — subset match', () => {
  expect([1, 2, 3, 4, 5]).toEqual(expect.arrayContaining([2, 4]))
  // order does not matter:
  expect([3, 1, 2]).toEqual(expect.arrayContaining([1, 2, 3]))
})

test('expect.any — type check', () => {
  expect(42).toEqual(expect.any(Number))
  expect('hello').toEqual(expect.any(String))
  expect(new Date()).toEqual(expect.any(Date))
})

test('expect.stringMatching — regex or substring', () => {
  expect('hello world').toEqual(expect.stringMatching(/world/))
  expect('user@example.com').toEqual(expect.stringMatching('@'))
})

test('composing asymmetric matchers', () => {
  const users = [
    { id: expect.any(Number), name: 'Alice', role: 'admin' },
  ]
  expect([{ id: 1, name: 'Alice', role: 'admin' }]).toEqual(users)
})`}</Code>
      </Section>

      <Divider />

      <Section>
        <Label>4.1.3 — Custom Matchers</Label>
        <Title>expect.extend()</Title>
        <Note>
          <code>expect.extend()</code> adds custom matchers globally. Each matcher returns <code>{'{ pass, message }'}</code>.
          The <code>message</code> function is called only on failure and must handle both the positive and negated case.
        </Note>
        <Code>{`expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling
    return {
      pass,
      message: () => pass
        ? \`expected \${received} not to be within [\${floor}, \${ceiling}]\`
        : \`expected \${received} to be within [\${floor}, \${ceiling}]\`,
    }
  },
  toBeValidEmail(received: string) {
    const pass = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(received)
    return {
      pass,
      message: () => \`expected "\${received}" to be a valid email\`,
    }
  },
})

test('custom: toBeWithinRange', () => {
  expect(5).toBeWithinRange(1, 10)
  expect(15).not.toBeWithinRange(1, 10)
})

test('custom: toBeValidEmail', () => {
  expect('user@example.com').toBeValidEmail()
  expect('not-an-email').not.toBeValidEmail()
})`}</Code>
      </Section>

      <Divider />

      <Section>
        <Label>Source Reading</Label>
        <Title>Where to look</Title>
        <Code>{`node_modules/expect/build/
  index.js         ← expect() factory, extend(), matchers
  matchers.js      ← toBe, toEqual, toThrow implementations
  asymmetricMatchers.js  ← expect.any(), objectContaining()
  utils.js         ← equals(), iterableEquality(), subsetEquality()

node_modules/jest-circus/build/
  run.js           ← test runner loop, beforeEach/afterEach dispatch`}</Code>
        <Note>
          Key insight: <code>toEqual</code> uses <code>equals()</code> from <code>@jest/expect-utils</code> which handles circular refs,
          Set/Map, TypedArrays, and pluggable custom equality testers.
        </Note>
      </Section>
    </div>
  )
}
