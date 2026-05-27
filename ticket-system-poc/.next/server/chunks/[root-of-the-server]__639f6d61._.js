module.exports = [
"[project]/.next-internal/server/app/api/shows/[id]/seats/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[project]/domain/registry.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// POC08 — Singleton pattern
// InventoryRegistry is the single source of truth for all show/seat/ticket state.
// Callers never construct this — only getInstance() is public.
__turbopack_context__.s([
    "InventoryRegistry",
    ()=>InventoryRegistry
]);
class InventoryRegistry {
    static instance = null;
    shows = new Map();
    seats = new Map();
    tickets = new Map();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor(){}
    static getInstance() {
        if (!InventoryRegistry.instance) {
            InventoryRegistry.instance = new InventoryRegistry();
        }
        return InventoryRegistry.instance;
    }
    // For test isolation only — never call in production code
    static resetForTests() {
        InventoryRegistry.instance = null;
    }
    // Shows
    addShow(show) {
        if (this.shows.has(show.id)) throw new Error(`Show already exists: ${show.id}`);
        this.shows.set(show.id, Object.freeze({
            ...show
        }));
    }
    getShow(id) {
        return this.shows.get(id);
    }
    listShows() {
        return Array.from(this.shows.values());
    }
    count() {
        return this.shows.size;
    }
    // Seats
    addSeat(seat) {
        this.seats.set(seat.id, Object.freeze({
            ...seat
        }));
    }
    getSeat(id) {
        return this.seats.get(id);
    }
    listSeatsByZone(showId, zoneId) {
        return Array.from(this.seats.values()).filter((s)=>s.showId === showId && s.zoneId === zoneId);
    }
    listSeatsByShow(showId) {
        return Array.from(this.seats.values()).filter((s)=>s.showId === showId);
    }
    updateSeatStatus(id, status) {
        const seat = this.seats.get(id);
        if (!seat) throw new Error(`Seat not found: ${id}`);
        const updated = Object.freeze({
            ...seat,
            status
        });
        this.seats.set(id, updated);
        return updated;
    }
    // Tickets
    createTicket(ticket) {
        const frozen = Object.freeze({
            ...ticket
        });
        this.tickets.set(ticket.id, frozen);
        return frozen;
    }
    getTicket(id) {
        return this.tickets.get(id);
    }
    updateTicketStatus(id, status) {
        const ticket = this.tickets.get(id);
        if (!ticket) throw new Error(`Ticket not found: ${id}`);
        const updated = Object.freeze({
            ...ticket,
            status
        });
        this.tickets.set(id, updated);
        return updated;
    }
    removeTicket(id) {
        this.tickets.delete(id);
    }
    // Zone capacity helpers
    incrementZoneSoldCount(showId, zoneId) {
        const show = this.shows.get(showId);
        if (!show) throw new Error(`Show not found: ${showId}`);
        const updatedZones = show.zones.map((z)=>z.id === zoneId ? Object.freeze({
                ...z,
                soldCount: z.soldCount + 1
            }) : z);
        const updated = Object.freeze({
            ...show,
            zones: Object.freeze(updatedZones)
        });
        this.shows.set(showId, updated);
        return updated;
    }
    decrementZoneSoldCount(showId, zoneId) {
        const show = this.shows.get(showId);
        if (!show) throw new Error(`Show not found: ${showId}`);
        const updatedZones = show.zones.map((z)=>z.id === zoneId ? Object.freeze({
                ...z,
                soldCount: Math.max(0, z.soldCount - 1)
            }) : z);
        const updated = Object.freeze({
            ...show,
            zones: Object.freeze(updatedZones)
        });
        this.shows.set(showId, updated);
        return updated;
    }
}
}),
"[project]/domain/factory.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// POC06 — Factory Method pattern
// Each ShowFactory subclass defines defaultZones() — the variation point.
// Adding a new show type = new subclass + one entry in FACTORY_MAP. Nothing else changes.
__turbopack_context__.s([
    "createShow",
    ()=>createShow
]);
function makeZone(type, capacity, pricePerSeat, showId) {
    return Object.freeze({
        id: `${showId}-zone-${type}`,
        type,
        capacity,
        pricePerSeat,
        soldCount: 0
    });
}
class ShowFactory {
    createShow(params) {
        if (new Date(params.date) <= new Date()) {
            throw new Error(`Show date must be in the future: ${params.date}`);
        }
        const zones = this.defaultZones(params.id);
        return Object.freeze({
            ...params,
            type: this.showType(),
            zones: Object.freeze(zones)
        });
    }
}
class ConcertShowFactory extends ShowFactory {
    showType() {
        return 'concert';
    }
    defaultZones(showId) {
        return [
            makeZone('vip', 100, 150, showId),
            makeZone('premium', 200, 90, showId),
            makeZone('general', 400, 50, showId)
        ];
    }
}
class SportsShowFactory extends ShowFactory {
    showType() {
        return 'sports';
    }
    defaultZones(showId) {
        return [
            makeZone('vip', 50, 200, showId),
            makeZone('premium', 300, 100, showId),
            makeZone('general', 500, 40, showId)
        ];
    }
}
class TheaterShowFactory extends ShowFactory {
    showType() {
        return 'theater';
    }
    defaultZones(showId) {
        return [
            makeZone('vip', 80, 180, showId),
            makeZone('premium', 200, 110, showId),
            makeZone('general', 300, 60, showId)
        ];
    }
}
const FACTORY_MAP = {
    concert: new ConcertShowFactory(),
    sports: new SportsShowFactory(),
    theater: new TheaterShowFactory()
};
function createShow(type, params) {
    const factory = FACTORY_MAP[type];
    if (!factory) throw new Error(`No factory for show type: ${type}`);
    return factory.createShow(params);
}
}),
"[project]/domain/store.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Seeder — seeds 9 shows (3 types × 3 dates) and their seats into the registry.
// try/catch guards protect against hot-reload duplicate-add errors.
__turbopack_context__.s([
    "registry",
    ()=>registry
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$domain$2f$registry$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/domain/registry.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$domain$2f$factory$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/domain/factory.ts [app-route] (ecmascript)");
;
;
const registry = __TURBOPACK__imported__module__$5b$project$5d2f$domain$2f$registry$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["InventoryRegistry"].getInstance();
const SEEDS = [
    {
        type: 'concert',
        name: 'Taylor Swift — Eras Tour',
        venueId: 'v1',
        venueName: 'Madison Square Garden',
        date: '2026-08-15'
    },
    {
        type: 'concert',
        name: 'Coldplay — Music of the Spheres',
        venueId: 'v1',
        venueName: 'Madison Square Garden',
        date: '2026-09-20'
    },
    {
        type: 'concert',
        name: 'Billie Eilish — Hit Me Hard',
        venueId: 'v2',
        venueName: 'The Forum',
        date: '2026-10-05'
    },
    {
        type: 'sports',
        name: 'NBA Finals Game 1',
        venueId: 'v3',
        venueName: 'Chase Center',
        date: '2026-06-10'
    },
    {
        type: 'sports',
        name: 'World Series Game 7',
        venueId: 'v4',
        venueName: 'Dodger Stadium',
        date: '2026-11-01'
    },
    {
        type: 'sports',
        name: 'Super Bowl LXI',
        venueId: 'v5',
        venueName: 'SoFi Stadium',
        date: '2027-02-08'
    },
    {
        type: 'theater',
        name: 'Hamilton',
        venueId: 'v6',
        venueName: 'Richard Rodgers Theatre',
        date: '2026-07-18'
    },
    {
        type: 'theater',
        name: 'The Lion King',
        venueId: 'v7',
        venueName: 'Minskoff Theatre',
        date: '2026-08-22'
    },
    {
        type: 'theater',
        name: 'Wicked',
        venueId: 'v8',
        venueName: 'Gershwin Theatre',
        date: '2026-09-30'
    }
];
function seedSeats(showId, zoneId, zoneType, rows, seatsPerRow) {
    for (const row of rows){
        for(let n = 1; n <= seatsPerRow; n++){
            const seat = Object.freeze({
                id: `${showId}-${zoneId}-${row}${n}`,
                showId,
                zoneId,
                zoneType,
                row,
                number: n,
                status: 'available'
            });
            try {
                registry.addSeat(seat);
            } catch  {}
        }
    }
}
function seed() {
    let seeded = 0;
    for (const s of SEEDS){
        const showId = `${s.type}-${s.date}`;
        try {
            const show = (0, __TURBOPACK__imported__module__$5b$project$5d2f$domain$2f$factory$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createShow"])(s.type, {
                id: showId,
                name: s.name,
                date: s.date,
                venueId: s.venueId,
                venueName: s.venueName
            });
            registry.addShow(show);
            seeded++;
            // Seed a manageable number of seats per zone for the POC UI
            for (const zone of show.zones){
                const rows = [
                    'A',
                    'B',
                    'C',
                    'D',
                    'E'
                ];
                const seatsPerRow = zone.type === 'vip' ? 5 : zone.type === 'premium' ? 8 : 10;
                seedSeats(showId, zone.id, zone.type, rows, seatsPerRow);
            }
        } catch  {
        // already seeded on hot-reload
        }
    }
    console.log(JSON.stringify({
        event: 'INVENTORY_SEEDED',
        showCount: registry.count(),
        newShows: seeded,
        ts: new Date().toISOString()
    }));
}
seed();
;
}),
"[project]/services/seat.service.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "listSeatsByShow",
    ()=>listSeatsByShow,
    "listSeatsByZone",
    ()=>listSeatsByZone
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$domain$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/domain/store.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$domain$2f$registry$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/domain/registry.ts [app-route] (ecmascript)");
;
;
const registry = __TURBOPACK__imported__module__$5b$project$5d2f$domain$2f$registry$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["InventoryRegistry"].getInstance();
function listSeatsByZone(showId, zoneId) {
    return registry.listSeatsByZone(showId, zoneId);
}
function listSeatsByShow(showId) {
    return registry.listSeatsByShow(showId);
}
}),
"[project]/app/api/shows/[id]/seats/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$seat$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/services/seat.service.ts [app-route] (ecmascript)");
;
;
const dynamic = 'force-dynamic';
async function GET(req, { params }) {
    const { id } = await params;
    const zoneId = req.nextUrl.searchParams.get('zoneId');
    const seats = zoneId ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$seat$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["listSeatsByZone"])(id, zoneId) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$seat$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["listSeatsByShow"])(id);
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(seats);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__639f6d61._.js.map