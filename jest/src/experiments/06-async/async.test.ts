// ── 4.6 Async Testing ─────────────────────────────────────────────────────────

function fetchUser(id: number): Promise<{ id: number; name: string }> {
  if (id < 0) return Promise.reject(new Error(`Invalid ID: ${id}`))
  return Promise.resolve({ id, name: id === 1 ? 'Alice' : `User${id}` })
}

function fetchWithCallback(
  id: number,
  cb: (err: Error | null, data: { id: number; name: string } | null) => void,
): void {
  setTimeout(() => {
    if (id < 0) cb(new Error(`Invalid ID`), null)
    else cb(null, { id, name: 'Alice' })
  }, 10)
}

// ── done callback ─────────────────────────────────────────────────────────────

describe('done callback (legacy pattern)', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  test('correct pattern: done with try/catch', (done) => {
    fetchWithCallback(1, (err, data) => {
      try {
        expect(err).toBeNull()
        expect(data?.name).toBe('Alice')
        done()
      } catch (e) {
        done(e as Error)
      }
    })
    jest.runAllTimers()
  })

  test('done called with error fails the test', (done) => {
    // We can't test the anti-pattern directly, but we can show done(error) works
    const error = new Error('something failed')
    // In a real failing test: done(error) would mark it failed
    // Here we demonstrate the mechanism by checking done is callable
    expect(typeof done).toBe('function')
    done()
  })
})

// ── Return Promise ────────────────────────────────────────────────────────────

describe('return a Promise', () => {
  test('jest waits for returned promise to resolve', () => {
    return fetchUser(1).then(user => {
      expect(user.name).toBe('Alice')
    })
  })

  test('rejected promise fails the test', () => {
    return expect(fetchUser(-1)).rejects.toThrow('Invalid ID')
  })
})

// ── async/await ───────────────────────────────────────────────────────────────

describe('async/await', () => {
  test('awaited result is assertable', async () => {
    const user = await fetchUser(1)
    expect(user.name).toBe('Alice')
    expect(user.id).toBe(1)
  })

  test('awaited rejection surfaces as throw', async () => {
    await expect(fetchUser(-1)).rejects.toThrow('Invalid ID')
  })

  test('try/catch for error inspection', async () => {
    expect.assertions(1)
    try {
      await fetchUser(-1)
    } catch (e) {
      expect((e as Error).message).toMatch('Invalid ID')
    }
  })

  test('Promise.allSettled', async () => {
    const results = await Promise.allSettled([fetchUser(1), fetchUser(-5)])
    expect(results[0].status).toBe('fulfilled')
    expect(results[1].status).toBe('rejected')
  })
})

// ── .resolves / .rejects ─────────────────────────────────────────────────────

describe('.resolves and .rejects matchers', () => {
  test('.resolves.toEqual', async () => {
    await expect(fetchUser(1)).resolves.toEqual({ id: 1, name: 'Alice' })
  })

  test('.resolves.toMatchObject', async () => {
    await expect(fetchUser(1)).resolves.toMatchObject({ name: 'Alice' })
  })

  test('.rejects.toThrow', async () => {
    await expect(fetchUser(-1)).rejects.toThrow('Invalid ID')
  })

  test('.rejects.toBeInstanceOf', async () => {
    await expect(fetchUser(-1)).rejects.toBeInstanceOf(Error)
  })

  test('.rejects — match error message pattern', async () => {
    await expect(fetchUser(-99)).rejects.toThrow(/Invalid ID/)
  })
})

// ── expect.assertions ────────────────────────────────────────────────────────

describe('expect.assertions(n)', () => {
  test('guards against skipped assertions in conditional paths', async () => {
    expect.assertions(1)
    const result = await fetchUser(1)
    if (result.name === 'Alice') {
      expect(result.id).toBe(1)
    }
  })

  test('expect.hasAssertions() — at least one assertion ran', async () => {
    expect.hasAssertions()
    const user = await fetchUser(2)
    expect(user.name).toBe('User2')
  })
})

// ── Concurrent tests ──────────────────────────────────────────────────────────

describe('concurrent tests', () => {
  test.concurrent('two async tests run in parallel', async () => {
    const user = await fetchUser(1)
    expect(user.name).toBe('Alice')
  })

  test.concurrent('second concurrent test', async () => {
    await expect(fetchUser(3)).resolves.toMatchObject({ id: 3 })
  })
})
