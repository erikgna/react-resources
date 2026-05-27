// POC06 — Factory Method pattern
// Each ShowFactory subclass defines defaultZones() — the variation point.
// Adding a new show type = new subclass + one entry in FACTORY_MAP. Nothing else changes.

import type { Show, ShowType, Zone, ZoneType } from './types'

interface ShowParams {
  id: string
  name: string
  date: string
  venueId: string
  venueName: string
}

function makeZone(type: ZoneType, capacity: number, pricePerSeat: number, showId: string): Zone {
  return Object.freeze({
    id: `${showId}-zone-${type}`,
    type,
    capacity,
    pricePerSeat,
    soldCount: 0,
  })
}

abstract class ShowFactory {
  createShow(params: ShowParams): Show {
    if (new Date(params.date) <= new Date()) {
      throw new Error(`Show date must be in the future: ${params.date}`)
    }
    const zones = this.defaultZones(params.id)
    return Object.freeze({ ...params, type: this.showType(), zones: Object.freeze(zones) })
  }

  protected abstract showType(): ShowType
  protected abstract defaultZones(showId: string): Zone[]
}

class ConcertShowFactory extends ShowFactory {
  protected showType(): ShowType { return 'concert' }
  protected defaultZones(showId: string): Zone[] {
    return [
      makeZone('vip', 100, 150, showId),
      makeZone('premium', 200, 90, showId),
      makeZone('general', 400, 50, showId),
    ]
  }
}

class SportsShowFactory extends ShowFactory {
  protected showType(): ShowType { return 'sports' }
  protected defaultZones(showId: string): Zone[] {
    return [
      makeZone('vip', 50, 200, showId),
      makeZone('premium', 300, 100, showId),
      makeZone('general', 500, 40, showId),
    ]
  }
}

class TheaterShowFactory extends ShowFactory {
  protected showType(): ShowType { return 'theater' }
  protected defaultZones(showId: string): Zone[] {
    return [
      makeZone('vip', 80, 180, showId),
      makeZone('premium', 200, 110, showId),
      makeZone('general', 300, 60, showId),
    ]
  }
}

const FACTORY_MAP: Record<ShowType, ShowFactory> = {
  concert: new ConcertShowFactory(),
  sports: new SportsShowFactory(),
  theater: new TheaterShowFactory(),
}

export function createShow(type: ShowType, params: ShowParams): Show {
  const factory = FACTORY_MAP[type]
  if (!factory) throw new Error(`No factory for show type: ${type}`)
  return factory.createShow(params)
}
