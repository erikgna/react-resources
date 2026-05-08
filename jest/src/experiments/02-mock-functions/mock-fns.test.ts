// ── 4.2 Mock Functions ────────────────────────────────────────────────────────

describe('jest.fn() — basics', () => {
  test('records calls in .mock.calls', () => {
    const greet = jest.fn((name: string) => `Hello, ${name}`)
    greet('Alice')
    greet('Bob')

    expect(greet.mock.calls).toEqual([['Alice'], ['Bob']])
    expect(greet.mock.calls[0][0]).toBe('Alice')
    expect(greet).toHaveBeenCalledTimes(2)
    expect(greet).toHaveBeenCalledWith('Alice')
    expect(greet).toHaveBeenLastCalledWith('Bob')
  })

  test('records return values in .mock.results', () => {
    const add = jest.fn((a: number, b: number) => a + b)
    add(1, 2)
    add(3, 4)

    expect(add.mock.results[0]).toEqual({ type: 'return', value: 3 })
    expect(add.mock.results[1]).toEqual({ type: 'return', value: 7 })
  })

  test('records thrown errors as type: throw', () => {
    const boom = jest.fn(() => { throw new Error('fail') })
    expect(boom).toThrow()

    expect(boom.mock.results[0].type).toBe('throw')
    expect((boom.mock.results[0].value as Error).message).toBe('fail')
  })

  test('no implementation returns undefined', () => {
    const noop = jest.fn()
    expect(noop()).toBeUndefined()
  })
})

describe('return value control', () => {
  test('mockReturnValue — fixed synchronous return', () => {
    const fn = jest.fn().mockReturnValue(42)
    expect(fn()).toBe(42)
    expect(fn()).toBe(42)
  })

  test('mockResolvedValue — fixed resolved promise', async () => {
    const fetchUser = jest.fn().mockResolvedValue({ id: 1, name: 'Alice' })
    const result = await fetchUser()
    expect(result).toEqual({ id: 1, name: 'Alice' })
  })

  test('mockRejectedValue — fixed rejected promise', async () => {
    const fetchUser = jest.fn().mockRejectedValue(new Error('Network error'))
    await expect(fetchUser()).rejects.toThrow('Network error')
  })

  test('mockImplementation — full override', () => {
    const fn = jest.fn().mockImplementation((x: number) => x * 2)
    expect(fn(5)).toBe(10)
    expect(fn(3)).toBe(6)
  })

  test('mockImplementationOnce — sequential return values', () => {
    const fn = jest.fn()
      .mockImplementationOnce(() => 'first')
      .mockImplementationOnce(() => 'second')
      .mockImplementation(() => 'fallback')

    expect(fn()).toBe('first')
    expect(fn()).toBe('second')
    expect(fn()).toBe('fallback')
    expect(fn()).toBe('fallback')
  })

  test('mockReturnValueOnce — sequential scalars', () => {
    const fn = jest.fn()
      .mockReturnValueOnce(1)
      .mockReturnValueOnce(2)
      .mockReturnValue(0)

    expect(fn()).toBe(1)
    expect(fn()).toBe(2)
    expect(fn()).toBe(0)
  })
})

describe('jest.spyOn()', () => {
  const service = {
    compute(x: number) { return x * 2 },
    async load(id: number) { return { id, data: 'real' } },
  }

  afterEach(() => jest.restoreAllMocks())

  test('spy observes calls without replacing implementation', () => {
    const spy = jest.spyOn(service, 'compute')
    const result = service.compute(5)

    expect(result).toBe(10)                      // real impl runs
    expect(spy).toHaveBeenCalledWith(5)
    expect(spy).toHaveReturnedWith(10)
  })

  test('spy can override implementation', () => {
    const spy = jest.spyOn(service, 'compute').mockImplementation(() => 999)
    expect(service.compute(5)).toBe(999)
    spy.mockRestore()
    expect(service.compute(5)).toBe(10)          // real impl restored
  })

  test('spyOn async methods', async () => {
    const spy = jest.spyOn(service, 'load').mockResolvedValue({ id: 99, data: 'mocked' })
    const result = await service.load(1)

    expect(result).toEqual({ id: 99, data: 'mocked' })
    expect(spy).toHaveBeenCalledWith(1)
  })
})

describe('reset strategies', () => {
  test('mockClear resets call history but keeps implementation', () => {
    const fn = jest.fn().mockReturnValue(42)
    fn()
    fn()

    fn.mockClear()

    expect(fn.mock.calls).toHaveLength(0)
    expect(fn()).toBe(42)           // implementation still active
  })

  test('mockReset resets call history AND removes implementation', () => {
    const fn = jest.fn().mockReturnValue(42)
    fn()

    fn.mockReset()

    expect(fn.mock.calls).toHaveLength(0)
    expect(fn()).toBeUndefined()    // implementation gone
  })

  test('jest.clearAllMocks() targets all mocks in the module', () => {
    const a = jest.fn()
    const b = jest.fn()
    a('x'); b('y')

    jest.clearAllMocks()

    expect(a.mock.calls).toHaveLength(0)
    expect(b.mock.calls).toHaveLength(0)
  })
})

// ── Probe: instances tracking ─────────────────────────────────────────────────

describe('mock instances — constructor calls', () => {
  test('.mock.instances tracks new calls', () => {
    const MockClass = jest.fn()
    const a = new MockClass('arg1')
    const b = new MockClass('arg2')

    expect(MockClass.mock.instances).toHaveLength(2)
    expect(MockClass.mock.instances[0]).toBe(a)
    expect(MockClass.mock.instances[1]).toBe(b)
    expect(MockClass.mock.calls[0]).toEqual(['arg1'])
  })
})
