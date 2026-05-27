// exp09 — Performance Benchmark
// Compare: typed-html JSX vs raw template literal string
// Tool: Bun.nanoseconds() for high-resolution timing
// Target: ≥ 50,000 renders/sec for typed-html
import * as elements from 'typed-html'

const RENDER_COUNT = 10_000

interface BenchmarkResult {
  experiment: string
  renders: number
  typedHtml: {
    totalNs: number
    throughputPerSec: number
    avgNsPerRender: number
  }
  templateLiteral: {
    totalNs: number
    throughputPerSec: number
    avgNsPerRender: number
  }
  overheadFactor: string
}

// typed-html renderer — 3-node JSX template
function typedHtmlRender(i: number): string {
  return (
    <div class="item" data-index={i}>
      <h3>Item {i}</h3>
      <p>Content for item number {i}</p>
    </div>
  )
}

// Equivalent template literal renderer
function templateLiteralRender(i: number): string {
  return `<div class="item" data-index="${i}"><h3>Item ${i}</h3><p>Content for item number ${i}</p></div>`
}

export async function exp09(): Promise<BenchmarkResult> {
  // Warmup to avoid JIT bias
  for (let i = 0; i < 100; i++) {
    typedHtmlRender(i)
    templateLiteralRender(i)
  }

  // Benchmark typed-html
  const thStart = Bun.nanoseconds()
  for (let i = 0; i < RENDER_COUNT; i++) {
    typedHtmlRender(i)
  }
  const thTotal = Bun.nanoseconds() - thStart

  // Benchmark template literal
  const tlStart = Bun.nanoseconds()
  for (let i = 0; i < RENDER_COUNT; i++) {
    templateLiteralRender(i)
  }
  const tlTotal = Bun.nanoseconds() - tlStart

  const thPerSec = Math.round(RENDER_COUNT / (thTotal / 1_000_000_000))
  const tlPerSec = Math.round(RENDER_COUNT / (tlTotal / 1_000_000_000))

  return {
    experiment: 'exp09-benchmark',
    renders: RENDER_COUNT,
    typedHtml: {
      totalNs: thTotal,
      throughputPerSec: thPerSec,
      avgNsPerRender: Math.round(thTotal / RENDER_COUNT),
    },
    templateLiteral: {
      totalNs: tlTotal,
      throughputPerSec: tlPerSec,
      avgNsPerRender: Math.round(tlTotal / RENDER_COUNT),
    },
    overheadFactor: (thTotal / tlTotal).toFixed(2) + 'x slower than template literal',
  }
}
