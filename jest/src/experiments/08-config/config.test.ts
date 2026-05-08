// ── 4.8 Config ────────────────────────────────────────────────────────────────

// ── test.each — table-driven tests ───────────────────────────────────────────

function add(a: number, b: number): number { return a + b }
function multiply(a: number, b: number): number { return a * b }

describe('test.each — array table', () => {
  test.each([
    [1, 1, 2],
    [2, 3, 5],
    [0, -1, -1],
    [-2, -3, -5],
  ])('add(%i, %i) === %i', (a, b, expected) => {
    expect(add(a, b)).toBe(expected)
  })
})

describe('test.each — object table', () => {
  test.each([
    { a: 2, b: 3, expected: 6 },
    { a: 0, b: 5, expected: 0 },
    { a: -2, b: 4, expected: -8 },
  ])('multiply($a, $b) === $expected', ({ a, b, expected }) => {
    expect(multiply(a, b)).toBe(expected)
  })
})

describe('test.each — template literal table', () => {
  test.each`
    input           | expected
    ${'hello'}      | ${5}
    ${''}           | ${0}
    ${'world!'}     | ${6}
  `('length of "$input" is $expected', ({ input, expected }: { input: string; expected: number }) => {
    expect(input.length).toBe(expected)
  })
})

// ── describe.each ─────────────────────────────────────────────────────────────

describe.each([
  { name: 'Array', collection: [1, 2, 3] },
  { name: 'Set',   collection: new Set([1, 2, 3]) },
])('$name has size 3', ({ collection }) => {
  test('size property', () => {
    if (Array.isArray(collection)) expect(collection.length).toBe(3)
    else expect(collection.size).toBe(3)
  })
})

// ── test.todo / test.skip / test.only ────────────────────────────────────────

describe('test lifecycle modifiers', () => {
  test('active test — runs normally', () => {
    expect(1 + 1).toBe(2)
  })

  test.skip('skipped test — does not run', () => {
    expect(true).toBe(false)  // would fail if it ran
  })

  test.todo('todo: implement payment integration test')

  // test.only() — runs ONLY this test in the file (use in isolation, never commit)
  // test.only('focused test', () => { ... })
})

// ── jest.setTimeout ───────────────────────────────────────────────────────────

describe('jest.setTimeout()', () => {
  test('default timeout is 5000ms', () => {
    // This test would fail if it took > 5000ms
    expect(1).toBe(1)
  })

  test('override per-test timeout', async () => {
    jest.setTimeout(10000)   // extend to 10s for this test
    await new Promise(r => setTimeout(r, 10))
    jest.setTimeout(5000)    // restore default
  }, 10000)  // also set via third arg to test()
})

// ── Environment detection ─────────────────────────────────────────────────────

describe('environment (jsdom)', () => {
  test('window is defined in jsdom', () => {
    expect(typeof window).toBe('object')
  })

  test('document is defined in jsdom', () => {
    expect(typeof document).toBe('object')
    expect(document.body).toBeTruthy()
  })

  test('navigator.userAgent is set', () => {
    expect(typeof navigator.userAgent).toBe('string')
  })
})

// ── globalSetup / setupFilesAfterEnv execution order proof ───────────────────

describe('setup file evidence', () => {
  test('jest-dom matchers are available (from setupFilesAfterEnv)', () => {
    // @testing-library/jest-dom is imported in src/test-setup.ts
    // which runs via setupFilesAfterEnv
    const el = document.createElement('button')
    el.disabled = true
    expect(el).toBeDisabled()
  })

  test('expect is available as a global', () => {
    expect(typeof expect).toBe('function')
    expect(typeof jest).toBe('object')
  })
})
