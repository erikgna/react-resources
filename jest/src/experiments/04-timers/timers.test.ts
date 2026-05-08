// ── 4.4 Timers ────────────────────────────────────────────────────────────────

// ── setTimeout / setInterval ──────────────────────────────────────────────────

describe('setTimeout with fake timers', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  test('callback does not fire until time is advanced', () => {
    const cb = jest.fn()
    setTimeout(cb, 500)

    expect(cb).not.toHaveBeenCalled()
    jest.advanceTimersByTime(499)
    expect(cb).not.toHaveBeenCalled()
    jest.advanceTimersByTime(1)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  test('multiple timeouts fire in correct order', () => {
    const order: number[] = []
    setTimeout(() => order.push(1), 100)
    setTimeout(() => order.push(2), 200)
    setTimeout(() => order.push(3), 300)

    jest.advanceTimersByTime(350)
    expect(order).toEqual([1, 2, 3])
  })

  test('clearTimeout prevents callback', () => {
    const cb = jest.fn()
    const id = setTimeout(cb, 1000)
    clearTimeout(id)

    jest.runAllTimers()
    expect(cb).not.toHaveBeenCalled()
  })
})

describe('setInterval with fake timers', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  test('fires repeatedly on interval', () => {
    const cb = jest.fn()
    const id = setInterval(cb, 100)

    jest.advanceTimersByTime(350)
    expect(cb).toHaveBeenCalledTimes(3)

    clearInterval(id)
  })

  test('runOnlyPendingTimers fires one tick', () => {
    const cb = jest.fn()
    setInterval(cb, 100)

    jest.runOnlyPendingTimers()
    expect(cb).toHaveBeenCalledTimes(1)

    jest.runOnlyPendingTimers()
    expect(cb).toHaveBeenCalledTimes(2)
  })
})

// ── Date control ──────────────────────────────────────────────────────────────

describe('jest.setSystemTime()', () => {
  const FIXED_DATE = new Date('2024-06-15T10:30:00.000Z')

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(FIXED_DATE)
  })
  afterEach(() => jest.useRealTimers())

  test('Date.now() returns frozen time', () => {
    expect(Date.now()).toBe(FIXED_DATE.getTime())
  })

  test('new Date() returns frozen instant', () => {
    expect(new Date().toISOString()).toBe('2024-06-15T10:30:00.000Z')
  })

  test('time advances with advanceTimersByTime', () => {
    jest.advanceTimersByTime(60_000) // +1 minute
    expect(new Date().toISOString()).toBe('2024-06-15T10:31:00.000Z')
  })
})

// ── Timers + Promises ─────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('timers interacting with Promises', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  test('advanceTimersByTime fires timer but not the Promise microtask', async () => {
    let settled = false
    delay(100).then(() => { settled = true })

    jest.advanceTimersByTime(100)
    expect(settled).toBe(false)     // microtask not yet drained

    await Promise.resolve()          // drain microtask queue
    expect(settled).toBe(true)
  })

  test('advanceTimersByTimeAsync fires timer AND drains microtasks', async () => {
    let settled = false
    delay(100).then(() => { settled = true })

    await jest.advanceTimersByTimeAsync(100)
    expect(settled).toBe(true)
  })

  test('chained delays with advanceTimersByTimeAsync', async () => {
    const log: string[] = []

    async function sequence() {
      await delay(100)
      log.push('first')
      await delay(200)
      log.push('second')
    }

    sequence()

    await jest.advanceTimersByTimeAsync(100)
    expect(log).toEqual(['first'])

    await jest.advanceTimersByTimeAsync(200)
    expect(log).toEqual(['first', 'second'])
  })
})

// ── runAllTimers / pending timer counts ───────────────────────────────────────

describe('timer inspection', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  test('jest.getTimerCount() reports pending timers', () => {
    expect(jest.getTimerCount()).toBe(0)
    setTimeout(() => {}, 100)
    setTimeout(() => {}, 200)
    expect(jest.getTimerCount()).toBe(2)

    jest.runAllTimers()
    expect(jest.getTimerCount()).toBe(0)
  })

  test('jest.clearAllTimers() removes all pending timers', () => {
    const cb = jest.fn()
    setTimeout(cb, 100)
    setTimeout(cb, 200)

    jest.clearAllTimers()
    jest.runAllTimers()

    expect(cb).not.toHaveBeenCalled()
  })
})
