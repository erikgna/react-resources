// Mini Jest — reimplementation of describe/it/expect/fn/beforeEach/afterEach/run

type TestFn = () => void | Promise<void>
type HookFn = () => void | Promise<void>

export interface TestResult {
  name: string
  fullName: string
  status: 'pass' | 'fail'
  error?: Error
  duration: number
}

interface RegisteredTest {
  name: string
  fn: TestFn
}

interface Suite {
  name: string
  tests: RegisteredTest[]
  beforeEachs: HookFn[]
  afterEachs: HookFn[]
  beforeAlls: HookFn[]
  afterAlls: HookFn[]
  children: Suite[]
  parent?: Suite
}

// ── Global state reset between run() calls ──────────────────────────────────

function makeRoot(): Suite {
  return { name: '__root__', tests: [], beforeEachs: [], afterEachs: [], beforeAlls: [], afterAlls: [], children: [] }
}

let root = makeRoot()
let current = root

// ── Registration API ─────────────────────────────────────────────────────────

export function describe(name: string, fn: () => void): void {
  const suite: Suite = { name, tests: [], beforeEachs: [], afterEachs: [], beforeAlls: [], afterAlls: [], children: [], parent: current }
  current.children.push(suite)
  const prev = current
  current = suite
  fn()
  current = prev
}

export function it(name: string, fn: TestFn): void {
  current.tests.push({ name, fn })
}

export const test = it

export function beforeEach(fn: HookFn): void {
  current.beforeEachs.push(fn)
}

export function afterEach(fn: HookFn): void {
  current.afterEachs.push(fn)
}

export function beforeAll(fn: HookFn): void {
  current.beforeAlls.push(fn)
}

export function afterAll(fn: HookFn): void {
  current.afterAlls.push(fn)
}

// ── Matchers ─────────────────────────────────────────────────────────────────

interface Matchers {
  toBe(expected: unknown): void
  toEqual(expected: unknown): void
  toThrow(msg?: string): void
  toHaveBeenCalled(): void
  toHaveBeenCalledWith(...args: unknown[]): void
  toBeTruthy(): void
  toBeFalsy(): void
  toContain(item: unknown): void
  not: Matchers
}

function fail(msg: string): never {
  throw new Error(msg)
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function buildMatchers(received: unknown, negated = false): Matchers {
  const assert = (condition: boolean, msg: string) => {
    if (negated ? condition : !condition) fail(msg)
  }

  return {
    toBe(expected) {
      assert(
        Object.is(received, expected),
        negated
          ? `Expected NOT ${String(expected)}, but got it`
          : `Expected ${String(expected)}, received ${String(received)}`,
      )
    },
    toEqual(expected) {
      assert(
        deepEqual(received, expected),
        negated
          ? `Expected values NOT to be equal`
          : `Expected ${JSON.stringify(expected)}, received ${JSON.stringify(received)}`,
      )
    },
    toThrow(msg?: string) {
      let threw = false
      let thrownMsg = ''
      try { (received as () => void)() } catch (e) { threw = true; thrownMsg = (e as Error).message }
      assert(threw, 'Expected function to throw but it did not')
      if (!negated && msg && !thrownMsg.includes(msg)) {
        fail(`Expected throw message to include "${msg}", got "${thrownMsg}"`)
      }
    },
    toHaveBeenCalled() {
      const mock = received as MockFn<unknown[], unknown>
      assert(mock.mock.calls.length > 0, 'Expected mock to have been called')
    },
    toHaveBeenCalledWith(...args) {
      const mock = received as MockFn<unknown[], unknown>
      const found = mock.mock.calls.some(c => deepEqual(c, args))
      assert(found, `Expected mock called with ${JSON.stringify(args)}`)
    },
    toBeTruthy() {
      assert(!!received, `Expected truthy, got ${String(received)}`)
    },
    toBeFalsy() {
      assert(!received, `Expected falsy, got ${String(received)}`)
    },
    toContain(item) {
      const arr = received as unknown[]
      assert(arr.includes(item), `Expected array to contain ${JSON.stringify(item)}`)
    },
    get not() { return buildMatchers(received, !negated) },
  }
}

export function expect(received: unknown): Matchers {
  return buildMatchers(received)
}

// ── Mock function ─────────────────────────────────────────────────────────────

interface MockCall<A extends unknown[]> {
  args: A
  returnValue: unknown
}

export interface MockFn<A extends unknown[] = unknown[], R = unknown> {
  (...args: A): R
  mock: { calls: A[]; results: Array<{ type: 'return' | 'throw'; value: unknown }> }
  mockReturnValue(v: R): MockFn<A, R>
  mockResolvedValue(v: Awaited<R>): MockFn<A, R>
  mockImplementation(impl: (...args: A) => R): MockFn<A, R>
  mockImplementationOnce(impl: (...args: A) => R): MockFn<A, R>
  mockClear(): MockFn<A, R>
  mockReset(): MockFn<A, R>
}

export function fn<A extends unknown[] = unknown[], R = undefined>(
  impl?: (...args: A) => R,
): MockFn<A, R> {
  const calls: A[] = []
  const results: Array<{ type: 'return' | 'throw'; value: unknown }> = []
  let _impl: ((...args: A) => R) | null = impl ?? null
  const _onceQueue: Array<(...args: A) => R> = []

  const mockFn = function (...args: A): R {
    calls.push(args)
    const currentImpl = _onceQueue.length > 0 ? _onceQueue.shift()! : _impl
    try {
      const value = currentImpl ? currentImpl(...args) : undefined
      results.push({ type: 'return', value })
      return value as R
    } catch (e) {
      results.push({ type: 'throw', value: e })
      throw e
    }
  } as MockFn<A, R>

  Object.defineProperty(mockFn, 'mock', { get: () => ({ calls, results }) })

  mockFn.mockReturnValue = (v: R) => { _impl = () => v; return mockFn }
  mockFn.mockResolvedValue = (v: Awaited<R>) => { _impl = () => Promise.resolve(v) as unknown as R; return mockFn }
  mockFn.mockImplementation = (f: (...args: A) => R) => { _impl = f; return mockFn }
  mockFn.mockImplementationOnce = (f: (...args: A) => R) => { _onceQueue.push(f); return mockFn }
  mockFn.mockClear = () => { calls.length = 0; results.length = 0; return mockFn }
  mockFn.mockReset = () => { calls.length = 0; results.length = 0; _impl = null; _onceQueue.length = 0; return mockFn }

  return mockFn
}

// ── Runner ────────────────────────────────────────────────────────────────────

async function runSuite(
  suite: Suite,
  ancestorBefores: HookFn[] = [],
  ancestorAfters: HookFn[] = [],
  prefix = '',
): Promise<TestResult[]> {
  const results: TestResult[] = []

  for (const h of suite.beforeAlls) await h()

  const befores = [...ancestorBefores, ...suite.beforeEachs]
  const afters = [...ancestorAfters, ...suite.afterEachs]
  const suiteName = suite.name === '__root__' ? '' : (prefix ? `${prefix} > ${suite.name}` : suite.name)

  for (const { name, fn: testFn } of suite.tests) {
    const fullName = suiteName ? `${suiteName} > ${name}` : name
    const start = performance.now()
    try {
      for (const h of befores) await h()
      await testFn()
      for (const h of afters) await h()
      results.push({ name, fullName, status: 'pass', duration: performance.now() - start })
    } catch (error) {
      try { for (const h of afters) await h() } catch {}
      results.push({ name, fullName, status: 'fail', error: error as Error, duration: performance.now() - start })
    }
  }

  for (const child of suite.children) {
    results.push(...await runSuite(child, befores, afters, suiteName))
  }

  for (const h of suite.afterAlls) await h()

  return results
}

export async function run(): Promise<TestResult[]> {
  const results = await runSuite(root)
  root = makeRoot()
  current = root
  return results
}
