import { PageTitle, Subtitle, Section, Label, Title, Code, Note, Divider } from '../shared'

export default function TimersExperiment() {
  return (
    <div>
      <PageTitle>Fake Timers</PageTitle>
      <Subtitle>
        jest.useFakeTimers() replaces setTimeout, setInterval, Date, and more.
        Control time without actually waiting.
      </Subtitle>

      <Section>
        <Label>4.4.1 — useFakeTimers</Label>
        <Title>Installing fake timers</Title>
        <Note>
          Fake timers replace global timer functions with Jest-controlled stubs.
          Time only advances when you explicitly call <code>advanceTimersByTime()</code> or <code>runAllTimers()</code>.
          Always restore with <code>jest.useRealTimers()</code> in <code>afterAll</code>.
        </Note>
        <Code>{`beforeAll(() => jest.useFakeTimers())
afterAll(() => jest.useRealTimers())

test('setTimeout does not fire until advanced', () => {
  const callback = jest.fn()
  setTimeout(callback, 1000)

  expect(callback).not.toHaveBeenCalled()

  jest.advanceTimersByTime(999)
  expect(callback).not.toHaveBeenCalled()

  jest.advanceTimersByTime(1)
  expect(callback).toHaveBeenCalledTimes(1)
})`}</Code>
      </Section>

      <Divider />

      <Section>
        <Label>4.4.2 — Advance controls</Label>
        <Title>advanceTimersByTime / runAllTimers / runAllTicks</Title>
        <Code>{`// advanceTimersByTime(ms) — advance clock by N milliseconds
// Fires any timers that would have elapsed in that window
jest.advanceTimersByTime(5000)

// runAllTimers() — run all pending timers including recursive ones
// WARNING: will loop infinitely on setInterval without a clear
jest.runAllTimers()

// runOnlyPendingTimers() — run only currently queued timers
// Safe for intervals: runs one "tick" then stops
jest.runOnlyPendingTimers()

// runAllTicks() — drain the microtask queue (Promise.resolve chains)
jest.runAllTicks()

// advanceTimersByTimeAsync(ms) — same as advanceTimersByTime but
// also awaits resolved Promises between timer firings
await jest.advanceTimersByTimeAsync(1000)`}</Code>
      </Section>

      <Divider />

      <Section>
        <Label>4.4.3 — Controlling Date</Label>
        <Title>jest.setSystemTime()</Title>
        <Note>
          By default, <code>jest.useFakeTimers()</code> replaces <code>Date</code> with a fake clock.
          Use <code>setSystemTime()</code> to freeze time to a specific instant.
        </Note>
        <Code>{`jest.useFakeTimers()
jest.setSystemTime(new Date('2024-01-15T12:00:00.000Z'))

test('Date.now() returns frozen time', () => {
  expect(Date.now()).toBe(new Date('2024-01-15T12:00:00.000Z').getTime())
  expect(new Date().toISOString()).toBe('2024-01-15T12:00:00.000Z')
})

test('time advances with advanceTimersByTime', () => {
  jest.advanceTimersByTime(5000)   // +5 seconds
  expect(Date.now()).toBe(
    new Date('2024-01-15T12:00:05.000Z').getTime()
  )
})`}</Code>
      </Section>

      <Divider />

      <Section>
        <Label>4.4.4 — Timers + Promises</Label>
        <Title>Microtask queue interaction</Title>
        <Note>
          <code>runAllTimers()</code> does not drain the microtask queue. If a timer callback resolves a Promise,
          you need to <code>await</code> or use <code>advanceTimersByTimeAsync()</code> to let the chain settle.
        </Note>
        <Code>{`function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

test('timers that resolve Promises need awaiting', async () => {
  jest.useFakeTimers()
  let settled = false

  delay(100).then(() => { settled = true })

  jest.advanceTimersByTime(100)  // fires setTimeout
  // settled is still false — Promise microtask pending
  await Promise.resolve()         // drain microtask queue
  expect(settled).toBe(true)

  // Simpler: use advanceTimersByTimeAsync
  settled = false
  delay(100).then(() => { settled = true })
  await jest.advanceTimersByTimeAsync(100)  // fires + drains
  expect(settled).toBe(true)
})`}</Code>
      </Section>

      <Divider />

      <Section>
        <Label>4.4.5 — legacyFakeTimers</Label>
        <Title>Probe: old vs new timer API</Title>
        <Code>{`// Modern (default since Jest 27): uses @sinonjs/fake-timers
jest.useFakeTimers()

// Legacy: uses Jest's own implementation (pre-27 behavior)
jest.useFakeTimers({ legacyFakeTimers: true })

// Differences:
// - Modern: replaces Date, queueMicrotask, performance.now
// - Legacy: does NOT replace Date by default
// - Modern: supports advanceTimersByTimeAsync
// - Legacy: lacks advanceTimersByTimeAsync
// - Modern: jest.setSystemTime() works
// - Legacy: jest.setSystemTime() is a no-op`}</Code>
      </Section>
    </div>
  )
}
