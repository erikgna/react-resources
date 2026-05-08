// ── 4.7 Coverage ──────────────────────────────────────────────────────────────

import { classify, getLabel, processUser, isAdmin, divide, range, partiallyTested } from './counter'
// Note: neverCalled() is excluded via /* istanbul ignore next */
// Note: partiallyTested() branch B is intentionally not covered to show gap in report

describe('classify — ternary branch coverage', () => {
  test('positive', () => expect(classify(5)).toBe('positive'))
  test('negative', () => expect(classify(-3)).toBe('negative'))
  test('zero', () => expect(classify(0)).toBe('zero'))
})

describe('getLabel — nullish coalescing (??) branches', () => {
  test('returns value when defined', () => {
    expect(getLabel('hello')).toBe('hello')
    expect(getLabel('')).toBe('')         // empty string is NOT nullish
  })

  test('returns default when null', () => {
    expect(getLabel(null)).toBe('default')
  })

  test('returns default when undefined', () => {
    expect(getLabel(undefined)).toBe('default')
  })
})

describe('processUser — optional chaining + nullish coalescing', () => {
  test('returns name when user and name exist', () => {
    expect(processUser({ name: 'Alice' })).toBe('Alice')
  })

  test('returns anonymous when user is null', () => {
    expect(processUser(null)).toBe('anonymous')
  })

  test('returns anonymous when name is undefined', () => {
    expect(processUser({ role: 'admin' })).toBe('anonymous')
  })
})

describe('isAdmin — logical AND chain', () => {
  test('true for admin role', () => {
    expect(isAdmin({ role: 'admin' })).toBe(true)
  })

  test('false for non-admin role', () => {
    expect(isAdmin({ role: 'user' })).toBe(false)
  })

  test('false for null user', () => {
    expect(isAdmin(null)).toBe(false)
  })
})

describe('divide — if branch coverage', () => {
  test('divides normally', () => {
    expect(divide(10, 2)).toBe(5)
    expect(divide(7, 2)).toBe(3.5)
  })

  test('throws on division by zero', () => {
    expect(() => divide(1, 0)).toThrow('Division by zero')
  })
})

describe('range — loop coverage', () => {
  test('generates range', () => {
    expect(range(1, 5)).toEqual([1, 2, 3, 4, 5])
  })

  test('empty when start > end', () => {
    expect(range(5, 1)).toEqual([])
  })

  test('single element', () => {
    expect(range(3, 3)).toEqual([3])
  })
})

describe('partiallyTested — intentional branch gap', () => {
  // Only testing branch A — branch B (false case) intentionally left out
  // Run npm run test:coverage to see this in the coverage report
  test('branch A only', () => {
    expect(partiallyTested(true)).toBe('branch A')
  })
})
