// Seeder — seeds 9 shows (3 types × 3 dates) and their seats into the registry.
// try/catch guards protect against hot-reload duplicate-add errors.

import { InventoryRegistry } from './registry'
import { createShow } from './factory'
import type { ShowType, Seat } from './types'

const registry = InventoryRegistry.getInstance()

interface ShowSeed {
  type: ShowType
  name: string
  venueId: string
  venueName: string
  date: string
}

const SEEDS: ShowSeed[] = [
  { type: 'concert', name: 'Taylor Swift — Eras Tour', venueId: 'v1', venueName: 'Madison Square Garden', date: '2026-08-15' },
  { type: 'concert', name: 'Coldplay — Music of the Spheres', venueId: 'v1', venueName: 'Madison Square Garden', date: '2026-09-20' },
  { type: 'concert', name: 'Billie Eilish — Hit Me Hard', venueId: 'v2', venueName: 'The Forum', date: '2026-10-05' },
  { type: 'sports', name: 'NBA Finals Game 1', venueId: 'v3', venueName: 'Chase Center', date: '2026-06-10' },
  { type: 'sports', name: 'World Series Game 7', venueId: 'v4', venueName: 'Dodger Stadium', date: '2026-11-01' },
  { type: 'sports', name: 'Super Bowl LXI', venueId: 'v5', venueName: 'SoFi Stadium', date: '2027-02-08' },
  { type: 'theater', name: 'Hamilton', venueId: 'v6', venueName: 'Richard Rodgers Theatre', date: '2026-07-18' },
  { type: 'theater', name: 'The Lion King', venueId: 'v7', venueName: 'Minskoff Theatre', date: '2026-08-22' },
  { type: 'theater', name: 'Wicked', venueId: 'v8', venueName: 'Gershwin Theatre', date: '2026-09-30' },
]

function seedSeats(showId: string, zoneId: string, zoneType: 'vip' | 'premium' | 'general', rows: string[], seatsPerRow: number): void {
  for (const row of rows) {
    for (let n = 1; n <= seatsPerRow; n++) {
      const seat: Seat = Object.freeze({
        id: `${showId}-${zoneId}-${row}${n}`,
        showId,
        zoneId,
        zoneType,
        row,
        number: n,
        status: 'available',
      })
      try {
        registry.addSeat(seat)
      } catch { /* already seeded */ }
    }
  }
}

function seed(): void {
  let seeded = 0
  for (const s of SEEDS) {
    const showId = `${s.type}-${s.date}`
    try {
      const show = createShow(s.type, { id: showId, name: s.name, date: s.date, venueId: s.venueId, venueName: s.venueName })
      registry.addShow(show)
      seeded++

      // Seed a manageable number of seats per zone for the POC UI
      for (const zone of show.zones) {
        const rows = ['A', 'B', 'C', 'D', 'E']
        const seatsPerRow = zone.type === 'vip' ? 5 : zone.type === 'premium' ? 8 : 10
        seedSeats(showId, zone.id, zone.type, rows, seatsPerRow)
      }
    } catch {
      // already seeded on hot-reload
    }
  }
  console.log(JSON.stringify({ event: 'INVENTORY_SEEDED', showCount: registry.count(), newShows: seeded, ts: new Date().toISOString() }))
}

seed()

export { registry }
