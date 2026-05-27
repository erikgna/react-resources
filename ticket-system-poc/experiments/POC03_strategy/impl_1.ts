// POC03 — Strategy Pattern: Zone Pricing
// Key insight: PRICING_STRATEGIES map dispatch vs switch dispatch.
// Adding a new ZoneType = new entry in map + new class. Nothing else changes.
// Open/Closed Principle demonstrated explicitly.

import type { ZoneType } from '../../domain/types'

interface PricingStrategy {
  calculate(base: number, qty: number): number
}

class VipPricingStrategy implements PricingStrategy {
  calculate(base: number, qty: number) { return base * 1.5 * qty }
}
class PremiumPricingStrategy implements PricingStrategy {
  calculate(base: number, qty: number) { return base * 1.2 * qty }
}
class GeneralPricingStrategy implements PricingStrategy {
  calculate(base: number, qty: number) { return base * 1.0 * qty }
}

// Map dispatch — no switch statement
const PRICING_STRATEGIES: Record<ZoneType, PricingStrategy> = {
  vip: new VipPricingStrategy(),
  premium: new PremiumPricingStrategy(),
  general: new GeneralPricingStrategy(),
}

function calculatePrice(zone: ZoneType, base: number, qty: number): number {
  const strategy = PRICING_STRATEGIES[zone]
  if (!strategy) throw new Error(`No pricing strategy for zone: ${zone}`)
  if (base < 0) throw new Error('base price must be non-negative')
  return strategy.calculate(base, qty)
}

// Happy paths
const base = 100
console.log(`[OK] VIP     $${base} × 2: $${calculatePrice('vip', base, 2)}   (expected $${base * 1.5 * 2})`)
console.log(`[OK] Premium $${base} × 3: $${calculatePrice('premium', base, 3)} (expected $${base * 1.2 * 3})`)
console.log(`[OK] General $${base} × 4: $${calculatePrice('general', base, 4)} (expected $${base * 4})`)
console.log(`[OK] Zero qty: $${calculatePrice('vip', base, 0)} (valid, returns 0)`)

// Compare vs switch (inline)
function calculatePriceSwitch(zone: ZoneType, base: number, qty: number): number {
  switch (zone) {
    case 'vip': return base * 1.5 * qty
    case 'premium': return base * 1.2 * qty
    case 'general': return base * 1.0 * qty
  }
}
console.log(`[INFO] Switch gives same result: $${calculatePriceSwitch('vip', 100, 2)}`)
console.log('[INFO] Map strategy: adding BackstageZone = new class + 1 map entry. Switch: must edit the switch = violates OCP.')
