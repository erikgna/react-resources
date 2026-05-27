// POC03 — Strategy: Failure Paths

import type { ZoneType } from '../../domain/types'

interface PricingStrategy { calculate(base: number, qty: number): number }

const PRICING_STRATEGIES: Record<ZoneType, PricingStrategy> = {
  vip: { calculate: (b, q) => { if (b < 0) throw new Error('base price must be non-negative'); return b * 1.5 * q } },
  premium: { calculate: (b, q) => { if (b < 0) throw new Error('base price must be non-negative'); return b * 1.2 * q } },
  general: { calculate: (b, q) => { if (b < 0) throw new Error('base price must be non-negative'); return b * 1.0 * q } },
}

function calculatePrice(zone: string, base: number, qty: number): number {
  const strategy = (PRICING_STRATEGIES as Record<string, PricingStrategy>)[zone]
  if (!strategy) throw new Error(`No pricing strategy for zone: ${zone}`)
  return strategy.calculate(base, qty)
}

// 1. Unknown zone type (runtime — TypeScript catches at compile time)
try { calculatePrice('backstage', 100, 1) }
catch (e) { console.log(`[OK] Unknown zone: ${(e as Error).message}`) }

// 2. Negative base price
try { calculatePrice('vip', -50, 1) }
catch (e) { console.log(`[OK] Negative price: ${(e as Error).message}`) }

// 3. Zero quantity is valid
console.log(`[OK] Zero qty VIP: $${calculatePrice('vip', 100, 0)} (valid)`)

console.log('[INFO] Strategy map fails fast on unknown zone; individual strategies validate their own constraints')
