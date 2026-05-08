// ── 4.1 Matchers ─────────────────────────────────────────────────────────────
export {}

// ── Built-in ──────────────────────────────────────────────────────────────────

describe('toBe', () => {
  test('uses Object.is for equality', () => {
    expect(1 + 1).toBe(2)
    expect('hello').toBe('hello')
  })

  test('handles NaN correctly (Object.is)', () => {
    expect(NaN).toBe(NaN)           // Object.is(NaN, NaN) === true
    expect(NaN - 1).toBe(NaN)       // NaN - 1 is still NaN
    expect(NaN).not.toBe(0)
  })

  test('distinguishes -0 from 0', () => {
    expect(-0).not.toBe(0)
    expect(-0).toBe(-0)
  })

  test('fails on different object references', () => {
    const a = { x: 1 }
    const b = { x: 1 }
    expect(a).not.toBe(b)
    expect(a).toBe(a)
  })
})

describe('toEqual', () => {
  test('deep compares primitives and nested structures', () => {
    expect({ x: 1, y: [2, 3] }).toEqual({ x: 1, y: [2, 3] })
  })

  test('ignores undefined properties', () => {
    expect({ a: 1, b: undefined }).toEqual({ a: 1 })
  })

  test('compares arrays by value', () => {
    expect([1, 2, 3]).toEqual([1, 2, 3])
    expect([1, 2]).not.toEqual([1, 2, 3])
  })
})

describe('toStrictEqual', () => {
  test('fails when undefined property is missing', () => {
    expect({ a: undefined }).not.toStrictEqual({})
  })

  test('distinguishes class instances from plain objects', () => {
    class Foo { x = 1 }
    expect(new Foo()).not.toStrictEqual({ x: 1 })
  })

  test('passes for identical structures', () => {
    expect({ a: 1, b: 2 }).toStrictEqual({ a: 1, b: 2 })
  })
})

// ── Asymmetric Matchers ───────────────────────────────────────────────────────

describe('asymmetric matchers', () => {
  test('objectContaining — partial match', () => {
    const user = { id: 99, name: 'Alice', createdAt: Date.now(), role: 'admin' }
    expect(user).toEqual(expect.objectContaining({ name: 'Alice', role: 'admin' }))
  })

  test('arrayContaining — subset, any order', () => {
    expect([1, 2, 3, 4, 5]).toEqual(expect.arrayContaining([2, 4]))
    expect([3, 1, 2]).toEqual(expect.arrayContaining([1, 2, 3]))
  })

  test('expect.any — type check', () => {
    expect(42).toEqual(expect.any(Number))
    expect('text').toEqual(expect.any(String))
    expect(new Date()).toEqual(expect.any(Date))
    expect(() => {}).toEqual(expect.any(Function))
  })

  test('expect.stringMatching — regex', () => {
    expect('hello world').toEqual(expect.stringMatching(/world/))
    expect('user@example.com').toEqual(expect.stringMatching('@'))
  })

  test('composing inside arrays', () => {
    const items = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
    expect(items).toEqual([
      expect.objectContaining({ name: 'Alice' }),
      expect.objectContaining({ name: 'Bob' }),
    ])
  })

  test('expect.not.objectContaining', () => {
    expect({ a: 1 }).toEqual(expect.not.objectContaining({ b: 2 }))
  })
})

// ── Custom Matchers ───────────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R
      toBeValidEmail(): R
    }
  }
}

expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling
    return {
      pass,
      message: () => pass
        ? `expected ${received} not to be within [${floor}, ${ceiling}]`
        : `expected ${received} to be within [${floor}, ${ceiling}]`,
    }
  },
  toBeValidEmail(received: string) {
    const pass = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(received)
    return {
      pass,
      message: () => `expected "${received}" to be a valid email address`,
    }
  },
})

describe('custom matchers via expect.extend()', () => {
  test('toBeWithinRange — in range', () => {
    expect(5).toBeWithinRange(1, 10)
    expect(1).toBeWithinRange(1, 10)
    expect(10).toBeWithinRange(1, 10)
  })

  test('toBeWithinRange — out of range', () => {
    expect(0).not.toBeWithinRange(1, 10)
    expect(11).not.toBeWithinRange(1, 10)
  })

  test('toBeValidEmail', () => {
    expect('user@example.com').toBeValidEmail()
    expect('a@b.io').toBeValidEmail()
  })

  test('toBeValidEmail — invalid', () => {
    expect('not-an-email').not.toBeValidEmail()
    expect('missing@domain').not.toBeValidEmail()
  })
})

// ── Probe: toThrow variants ───────────────────────────────────────────────────

describe('toThrow', () => {
  const boom = () => { throw new Error('Something went wrong') }
  const safe = () => 42

  test('detects thrown error', () => {
    expect(boom).toThrow()
  })

  test('matches error message substring', () => {
    expect(boom).toThrow('went wrong')
  })

  test('matches error message regex', () => {
    expect(boom).toThrow(/Something/)
  })

  test('matches error class', () => {
    expect(boom).toThrow(Error)
  })

  test('not.toThrow for safe functions', () => {
    expect(safe).not.toThrow()
  })
})
