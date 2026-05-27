// POC03 — Strategy pattern
// PricingStrategy per zone — map dispatch vs switch. Adding a new zone = new entry in map only.

import type { ZoneType } from './types'

interface PricingStrategy {
  calculate(basePrice: number, quantity: number): number
}

class VipPricingStrategy implements PricingStrategy {
  calculate(basePrice: number, quantity: number): number {
    if (basePrice < 0) throw new Error('base price must be non-negative')
    return basePrice * 1.5 * quantity
  }
}

class PremiumPricingStrategy implements PricingStrategy {
  calculate(basePrice: number, quantity: number): number {
    if (basePrice < 0) throw new Error('base price must be non-negative')
    return basePrice * 1.2 * quantity
  }
}

class GeneralPricingStrategy implements PricingStrategy {
  calculate(basePrice: number, quantity: number): number {
    if (basePrice < 0) throw new Error('base price must be non-negative')
    return basePrice * 1.0 * quantity
  }
}

const PRICING_STRATEGIES: Record<ZoneType, PricingStrategy> = {
  vip: new VipPricingStrategy(),
  premium: new PremiumPricingStrategy(),
  general: new GeneralPricingStrategy(),
}

export function calculatePrice(zone: ZoneType, basePrice: number, quantity: number): number {
  const strategy = PRICING_STRATEGIES[zone]
  if (!strategy) throw new Error(`No pricing strategy for zone: ${zone}`)
  return strategy.calculate(basePrice, quantity)
}
