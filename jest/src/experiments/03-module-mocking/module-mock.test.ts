// ── 4.3 Module Mocking ────────────────────────────────────────────────────────
// NOTE: only ONE jest.mock() per module per file. Multiple calls for the same
// module are all hoisted; the last factory wins, overriding earlier calls.

// Uses __mocks__/api.ts (manual mock adjacent to api.ts)
jest.mock('./api')

import { fetchUser, formatUser, BASE_URL } from './api'

// ── Manual mock via __mocks__/ ────────────────────────────────────────────────

describe('manual mock via __mocks__/', () => {
  afterEach(() => jest.clearAllMocks())

  test('fetchUser resolves with mock data', async () => {
    const user = await fetchUser(5)
    expect(user).toEqual({ id: 5, name: 'Mock User 5', email: 'user5@mock.test' })
  })

  test('fetchUser records call arguments', async () => {
    await fetchUser(42)
    expect(fetchUser).toHaveBeenCalledWith(42)
    expect(fetchUser).toHaveBeenCalledTimes(1)
  })

  test('formatUser uses mock implementation', async () => {
    const user = await fetchUser(1)
    const label = formatUser(user)
    expect(label).toBe('MOCK: [1] Mock User 1')
  })

  test('BASE_URL is replaced with mock value', () => {
    expect(BASE_URL).toBe('https://mock.api.test')
  })

  test('can override mock per-test with mockResolvedValueOnce', async () => {
    const mockFetchUser = fetchUser as jest.MockedFunction<typeof fetchUser>
    mockFetchUser.mockResolvedValueOnce({ id: 999, name: 'Special', email: 's@test.com' })

    const user = await fetchUser(999)
    expect(user.name).toBe('Special')

    // Next call falls back to original __mocks__/api.ts implementation
    const next = await fetchUser(1)
    expect(next.name).toBe('Mock User 1')
  })

  test('factory pattern (inline, no __mocks__ file needed)', async () => {
    // Can override per-test without a separate file:
    const mockFetchUser = fetchUser as jest.MockedFunction<typeof fetchUser>
    mockFetchUser.mockImplementationOnce(async (id) => ({
      id,
      name: 'Inline Factory User',
      email: 'inline@test.com',
    }))

    const user = await fetchUser(7)
    expect(user.name).toBe('Inline Factory User')
  })
})

// ── jest.requireActual ────────────────────────────────────────────────────────

describe('jest.requireActual()', () => {
  test('bypasses mock and loads real module exports', () => {
    const real = jest.requireActual('./api') as typeof import('./api')
    // The real module has the real BASE_URL value
    expect(real.BASE_URL).toBe('https://api.example.com')
    // The real fetchUser is NOT a jest.fn()
    expect(jest.isMockFunction(real.fetchUser)).toBe(false)
    // But the imported one IS mocked
    expect(jest.isMockFunction(fetchUser)).toBe(true)
  })
})

// ── jest.isMockFunction ───────────────────────────────────────────────────────

describe('jest.isMockFunction()', () => {
  test('identifies mock functions', () => {
    expect(jest.isMockFunction(fetchUser)).toBe(true)
    expect(jest.isMockFunction(formatUser)).toBe(true)
  })

  test('rejects real functions', () => {
    expect(jest.isMockFunction(() => {})).toBe(false)
    expect(jest.isMockFunction(Math.max)).toBe(false)
  })
})

// ── jest.isolateModules ───────────────────────────────────────────────────────

describe('jest.isolateModules() — fresh module instances', () => {
  test('requireActual inside isolateModules gives real module per block', () => {
    let a: Record<string, unknown> = {}
    let b: Record<string, unknown> = {}

    jest.isolateModules(() => {
      a = jest.requireActual('./api')
    })
    jest.isolateModules(() => {
      b = jest.requireActual('./api')
    })

    // Same exports, different module evaluation instances
    expect(a['BASE_URL']).toBe('https://api.example.com')
    expect(b['BASE_URL']).toBe('https://api.example.com')
    // With isolateModules, each block runs the module factory fresh
    expect(a).not.toBe(b)
  })
})

// ── jest.unmock ───────────────────────────────────────────────────────────────

describe('jest.unmock() + jest.requireActual()', () => {
  test('requireActual gives access to real implementation without unmocking', () => {
    // jest.requireActual is the standard way to get the real module
    // when the module is otherwise mocked
    const { formatUser: realFormatUser } = jest.requireActual('./api') as typeof import('./api')
    const result = realFormatUser({ id: 1, name: 'Alice', email: 'a@test.com' })
    expect(result).toBe('[1] Alice <a@test.com>')
  })
})
