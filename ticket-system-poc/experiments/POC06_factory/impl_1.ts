// POC06 — Factory Method Pattern: ShowFactory
// Key insight: defaultZones() is the variation point.
// createShow() skeleton is identical for all types — only zone config differs.
// FACTORY_MAP dispatch: adding new type = new subclass + 1 map entry.

import type { Show, ShowType, Zone, ZoneType } from '../../domain/types'

function makeZone(type: ZoneType, capacity: number, price: number, showId: string): Zone {
  return Object.freeze({ id: `${showId}-${type}`, type, capacity, pricePerSeat: price, soldCount: 0 })
}

abstract class ShowFactory {
  createShow(id: string, name: string, date: string): Show {
    if (new Date(date) <= new Date()) throw new Error(`Date must be future: ${date}`)
    const zones = this.defaultZones(id)
    return Object.freeze({ id, name, type: this.showType(), date, venueId: 'V1', venueName: 'Test Venue', zones: Object.freeze(zones) })
  }
  protected abstract showType(): ShowType
  protected abstract defaultZones(showId: string): Zone[]
}

class ConcertShowFactory extends ShowFactory {
  protected showType() { return 'concert' as const }
  protected defaultZones(id: string) {
    return [makeZone('vip', 100, 150, id), makeZone('premium', 200, 90, id), makeZone('general', 400, 50, id)]
  }
}
class SportsShowFactory extends ShowFactory {
  protected showType() { return 'sports' as const }
  protected defaultZones(id: string) {
    return [makeZone('vip', 50, 200, id), makeZone('premium', 300, 100, id), makeZone('general', 500, 40, id)]
  }
}
class TheaterShowFactory extends ShowFactory {
  protected showType() { return 'theater' as const }
  protected defaultZones(id: string) {
    return [makeZone('vip', 80, 180, id), makeZone('premium', 200, 110, id), makeZone('general', 300, 60, id)]
  }
}

const FACTORY_MAP: Record<ShowType, ShowFactory> = {
  concert: new ConcertShowFactory(),
  sports: new SportsShowFactory(),
  theater: new TheaterShowFactory(),
}

function createShow(type: ShowType, id: string, name: string, date: string): Show {
  const factory = FACTORY_MAP[type]
  if (!factory) throw new Error(`No factory for: ${type}`)
  return factory.createShow(id, name, date)
}

const concert = createShow('concert', 'C1', 'Taylor Swift', '2026-10-01')
const sports = createShow('sports', 'S1', 'NBA Finals', '2026-06-10')

console.log(`[OK] Concert zones: ${concert.zones.map(z => `${z.type}(${z.capacity})`).join(', ')}`)
console.log(`[OK] Sports zones: ${sports.zones.map(z => `${z.type}(${z.capacity})`).join(', ')}`)

const concert2 = createShow('concert', 'C2', 'Coldplay', '2026-11-01')
console.log(`[OK] Two concerts are independent objects: ${concert !== concert2}`)
console.log(`[OK] Zones are isolated: ${concert.zones[0] !== concert2.zones[0]}`)
