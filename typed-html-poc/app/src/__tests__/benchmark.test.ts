import { describe, test, expect } from 'bun:test'
import { exp09 } from '../routes/exp09'

describe('performance thresholds', () => {
  test('typed-html throughput ≥ 50,000 renders/sec', async () => {
    const result = await exp09()
    expect(result.typedHtml.throughputPerSec).toBeGreaterThanOrEqual(50_000)
  })
})
