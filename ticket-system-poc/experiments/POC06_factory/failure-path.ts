// POC06 — Factory Method: Failure Paths

import type { Show, ShowType, Zone, ZoneType } from '../../domain/types'

function makeZone(type: ZoneType, cap: number, price: number, id: string): Zone {
  return Object.freeze({ id: `${id}-${type}`, type, capacity: cap, pricePerSeat: price, soldCount: 0 })
}

abstract class ShowFactory {
  createShow(id: string, name: string, date: string): Show {
    if (new Date(date) <= new Date()) throw new Error(`Date must be future: ${date}`)
    const zones = this.defaultZones(id)
    return Object.freeze({ id, name, type: this.showType(), date, venueId: 'V1', venueName: 'Venue', zones: Object.freeze(zones) })
  }
  protected abstract showType(): ShowType
  protected abstract defaultZones(id: string): Zone[]
}

class ConcertShowFactory extends ShowFactory {
  protected showType() { return 'concert' as const }
  protected defaultZones(id: string) { return [makeZone('vip', 100, 150, id)] }
}

const FACTORY_MAP: Record<ShowType, ShowFactory> = {
  concert: new ConcertShowFactory(),
  sports: new ConcertShowFactory(),  // stub
  theater: new ConcertShowFactory(), // stub
}

function createShow(type: string, id: string, name: string, date: string): Show {
  const factory = (FACTORY_MAP as Record<string, ShowFactory>)[type]
  if (!factory) throw new Error(`No factory for show type: ${type}`)
  return factory.createShow(id, name, date)
}

// 1. Unknown show type
try { createShow('festival', 'F1', 'Coachella', '2026-04-01') }
catch (e) { console.log(`[OK] Unknown type: ${(e as Error).message}`) }

// 2. Past date
try { createShow('concert', 'C1', 'Old Show', '2020-01-01') }
catch (e) { console.log(`[OK] Past date: ${(e as Error).message}`) }

// 3. Two instances from same factory are independent
const s1 = createShow('concert', 'C1', 'Show 1', '2026-08-01')
const s2 = createShow('concert', 'C2', 'Show 2', '2026-09-01')
console.log(`[OK] Independent objects: s1 !== s2 = ${s1 !== s2}`)
console.log(`[OK] Zones isolated: s1.zones !== s2.zones = ${s1.zones !== s2.zones}`)

console.log('[INFO] Factory hides zone config — callers only specify type, not zone structure')
