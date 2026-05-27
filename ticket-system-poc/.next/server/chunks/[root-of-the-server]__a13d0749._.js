module.exports = [
"[project]/.next-internal/server/app/api/shows/[id]/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

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
"[project]/domain/observer.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// POC04 — Observer pattern
// CapacityEventBus fires typed events when seat counts cross thresholds.
// Bus catches observer exceptions — publisher is never crashed by a subscriber.
__turbopack_context__.s([
    "CapacityEventBus",
    ()=>CapacityEventBus,
    "LoggingObserver",
    ()=>LoggingObserver,
    "capacityBus",
    ()=>capacityBus
]);
class CapacityEventBus {
    observers = new Set();
    subscribe(observer) {
        this.observers.add(observer);
        return ()=>this.observers.delete(observer);
    }
    emit(event) {
        for (const observer of this.observers){
            try {
                observer.onCapacityEvent(event);
            } catch  {
            // Observer failure must never crash the publisher
            }
        }
    }
}
class LoggingObserver {
    onCapacityEvent(event) {
        console.log(JSON.stringify({
            ...event,
            ts: new Date().toISOString()
        }));
    }
}
const capacityBus = new CapacityEventBus();
capacityBus.subscribe(new LoggingObserver());
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/domain/command.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// POC07 — Command pattern with undo
// PurchaseCommand stores issuedTicketIds[] for targeted undo — no full registry scan needed.
// CommandInvoker maintains a LIFO history stack.
__turbopack_context__.s([
    "CancelCommand",
    ()=>CancelCommand,
    "CommandInvoker",
    ()=>CommandInvoker,
    "PurchaseCommand",
    ()=>PurchaseCommand
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$domain$2f$observer$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/domain/observer.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
;
;
class PurchaseCommand {
    registry;
    order;
    issuedTicketIds;
    reservedSeatIds;
    constructor(registry, order){
        this.registry = registry;
        this.order = order;
        this.issuedTicketIds = [];
        this.reservedSeatIds = [];
    }
    execute() {
        const show = this.registry.getShow(this.order.showId);
        if (!show) throw new Error(`Show not found: ${this.order.showId}`);
        const zone = show.zones.find((z)=>z.type === this.order.zoneType);
        if (!zone) throw new Error(`Zone not found: ${this.order.zoneType}`);
        for (const seatId of this.order.seatIds){
            const seat = this.registry.getSeat(seatId);
            if (!seat) throw new Error(`Seat not found: ${seatId}`);
            if (seat.status !== 'available') throw new Error(`Seat not available: ${seatId}`);
            this.registry.updateSeatStatus(seatId, 'sold');
            this.reservedSeatIds.push(seatId);
            const updatedShow = this.registry.incrementZoneSoldCount(this.order.showId, zone.id);
            const updatedZone = updatedShow.zones.find((z)=>z.id === zone.id);
            const ticket = this.registry.createTicket(Object.freeze({
                id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])(),
                showId: this.order.showId,
                seatId,
                zoneType: this.order.zoneType,
                priceCharged: zone.pricePerSeat,
                status: 'confirmed',
                createdAt: new Date().toISOString()
            }));
            this.issuedTicketIds.push(ticket.id);
            __TURBOPACK__imported__module__$5b$project$5d2f$domain$2f$observer$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["capacityBus"].emit({
                type: 'SEAT_SOLD',
                showId: this.order.showId,
                seatId,
                zoneId: zone.id
            });
            const soldPct = updatedZone.soldCount / updatedZone.capacity;
            if (soldPct >= 1) {
                __TURBOPACK__imported__module__$5b$project$5d2f$domain$2f$observer$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["capacityBus"].emit({
                    type: 'ZONE_FULL',
                    showId: this.order.showId,
                    zoneId: zone.id,
                    capacity: updatedZone.capacity
                });
            } else if (soldPct >= 0.8 && updatedZone.soldCount - 1 < updatedZone.capacity * 0.8) {
                __TURBOPACK__imported__module__$5b$project$5d2f$domain$2f$observer$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["capacityBus"].emit({
                    type: 'THRESHOLD_80',
                    showId: this.order.showId,
                    zoneId: zone.id,
                    soldCount: updatedZone.soldCount,
                    capacity: updatedZone.capacity
                });
            }
        }
    }
    undo() {
        const show = this.registry.getShow(this.order.showId);
        if (!show) return;
        const zone = show.zones.find((z)=>z.type === this.order.zoneType);
        if (!zone) return;
        for (const seatId of this.reservedSeatIds){
            try {
                this.registry.updateSeatStatus(seatId, 'available');
                this.registry.decrementZoneSoldCount(this.order.showId, zone.id);
            } catch  {}
        }
        for (const ticketId of this.issuedTicketIds){
            this.registry.removeTicket(ticketId);
        }
        this.issuedTicketIds = [];
        this.reservedSeatIds = [];
    }
    getIssuedTicketIds() {
        return this.issuedTicketIds;
    }
}
class CancelCommand {
    registry;
    ticketId;
    previousSeatStatus;
    affectedSeatId;
    constructor(registry, ticketId){
        this.registry = registry;
        this.ticketId = ticketId;
        this.previousSeatStatus = null;
        this.affectedSeatId = null;
    }
    execute() {
        const ticket = this.registry.getTicket(this.ticketId);
        if (!ticket) throw new Error(`Ticket not found: ${this.ticketId}`);
        const seat = this.registry.getSeat(ticket.seatId);
        if (seat) {
            this.previousSeatStatus = seat.status;
            this.affectedSeatId = seat.id;
            this.registry.updateSeatStatus(seat.id, 'available');
            const show = this.registry.getShow(ticket.showId);
            if (show) {
                const zone = show.zones.find((z)=>z.type === ticket.zoneType);
                if (zone) this.registry.decrementZoneSoldCount(ticket.showId, zone.id);
            }
        }
        this.registry.updateTicketStatus(this.ticketId, 'cancelled');
        __TURBOPACK__imported__module__$5b$project$5d2f$domain$2f$observer$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["capacityBus"].emit({
            type: 'TICKET_CANCELLED',
            showId: ticket.showId,
            ticketId: this.ticketId
        });
    }
    undo() {
        const ticket = this.registry.getTicket(this.ticketId);
        if (!ticket) return;
        this.registry.updateTicketStatus(this.ticketId, 'confirmed');
        if (this.affectedSeatId && this.previousSeatStatus) {
            try {
                this.registry.updateSeatStatus(this.affectedSeatId, this.previousSeatStatus);
                const show = this.registry.getShow(ticket.showId);
                if (show) {
                    const zone = show.zones.find((z)=>z.type === ticket.zoneType);
                    if (zone) this.registry.incrementZoneSoldCount(ticket.showId, zone.id);
                }
            } catch  {}
        }
    }
}
class CommandInvoker {
    history = [];
    execute(cmd) {
        cmd.execute();
        this.history.push(cmd);
    }
    undoLast() {
        const cmd = this.history.pop();
        if (!cmd) return;
        cmd.undo();
    }
    historyLength() {
        return this.history.length;
    }
}
}),
"[project]/domain/validation.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// POC09 — Template Method pattern
// validate() skeleton is fixed: checkCapacity → checkDateValidity → checkZoneRules.
// Subclasses only override checkZoneRules — they cannot alter the algorithm skeleton.
__turbopack_context__.s([
    "getValidator",
    ()=>getValidator,
    "validateOrder",
    ()=>validateOrder
]);
class TicketValidator {
    validate(order, registry) {
        const errors = [];
        this.checkCapacity(order, registry, errors);
        this.checkDateValidity(order, errors);
        this.checkZoneRules(order, registry, errors);
        return Object.freeze({
            valid: errors.length === 0,
            errors: Object.freeze(errors)
        });
    }
    checkCapacity(order, registry, errors) {
        const show = registry.getShow(order.showId);
        if (!show) {
            errors.push(`Show not found: ${order.showId}`);
            return;
        }
        const zone = show.zones.find((z)=>z.type === order.zoneType);
        if (!zone) {
            errors.push(`Zone not found: ${order.zoneType}`);
            return;
        }
        const available = zone.capacity - zone.soldCount;
        if (order.quantity > available) {
            errors.push(`Insufficient capacity: ${available} seats available, ${order.quantity} requested`);
        }
        for (const seatId of order.seatIds){
            const seat = registry.getSeat(seatId);
            if (!seat) {
                errors.push(`Seat not found: ${seatId}`);
                continue;
            }
            if (seat.status !== 'available') {
                errors.push(`Seat not available: ${seatId} (status: ${seat.status})`);
            }
        }
    }
    checkDateValidity(order, errors) {
        if (new Date(order.date) <= new Date()) {
            errors.push(`Show date must be in the future: ${order.date}`);
        }
    }
}
class ConcertTicketValidator extends TicketValidator {
    checkZoneRules(order, _registry, errors) {
        // General Admission: no seat assignments (quantity > 0, seatIds must be empty)
        if (order.zoneType === 'general' && order.seatIds.length > 0) {
            errors.push('General Admission zone does not use seat assignments');
        }
    }
}
class SportsTicketValidator extends TicketValidator {
    checkZoneRules(order, _registry, errors) {
        if (order.zoneType === 'vip' && order.quantity > 4) {
            errors.push('VIP zone maximum is 4 tickets per order');
        }
    }
}
class TheaterTicketValidator extends TicketValidator {
    checkZoneRules(order, _registry, errors) {
        if (order.quantity > 6) {
            errors.push('Maximum 6 tickets per order for theater shows');
        }
    }
}
const VALIDATOR_MAP = {
    concert: new ConcertTicketValidator(),
    sports: new SportsTicketValidator(),
    theater: new TheaterTicketValidator()
};
function getValidator(showType) {
    return VALIDATOR_MAP[showType];
}
function validateOrder(order, registry) {
    const show = registry.getShow(order.showId);
    if (!show) return Object.freeze({
        valid: false,
        errors: [
            `Show not found: ${order.showId}`
        ]
    });
    const validator = getValidator(show.type);
    return validator.validate(order, registry);
}
}),
"[project]/domain/pricing.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// POC03 — Strategy pattern
// PricingStrategy per zone — map dispatch vs switch. Adding a new zone = new entry in map only.
__turbopack_context__.s([
    "calculatePrice",
    ()=>calculatePrice
]);
class VipPricingStrategy {
    calculate(basePrice, quantity) {
        if (basePrice < 0) throw new Error('base price must be non-negative');
        return basePrice * 1.5 * quantity;
    }
}
class PremiumPricingStrategy {
    calculate(basePrice, quantity) {
        if (basePrice < 0) throw new Error('base price must be non-negative');
        return basePrice * 1.2 * quantity;
    }
}
class GeneralPricingStrategy {
    calculate(basePrice, quantity) {
        if (basePrice < 0) throw new Error('base price must be non-negative');
        return basePrice * 1.0 * quantity;
    }
}
const PRICING_STRATEGIES = {
    vip: new VipPricingStrategy(),
    premium: new PremiumPricingStrategy(),
    general: new GeneralPricingStrategy()
};
function calculatePrice(zone, basePrice, quantity) {
    const strategy = PRICING_STRATEGIES[zone];
    if (!strategy) throw new Error(`No pricing strategy for zone: ${zone}`);
    return strategy.calculate(basePrice, quantity);
}
}),
"[project]/domain/facade.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// POC10 — Facade pattern
// TicketingFacade is the single entry point for all ticketing operations.
// It orchestrates: validate → price → command → observe.
// API routes never call subsystems directly.
__turbopack_context__.s([
    "TicketingFacade",
    ()=>TicketingFacade,
    "ticketingFacade",
    ()=>ticketingFacade
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$domain$2f$registry$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/domain/registry.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$domain$2f$command$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/domain/command.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$domain$2f$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/domain/validation.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$domain$2f$pricing$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/domain/pricing.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$domain$2f$observer$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/domain/observer.ts [app-route] (ecmascript)");
;
;
;
;
;
class TicketingFacade {
    registry;
    invoker;
    constructor(registry, invoker){
        this.registry = registry;
        this.invoker = invoker;
    }
    purchaseTickets(order) {
        // 1. Validate (Template Method)
        const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$domain$2f$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateOrder"])(order, this.registry);
        if (!result.valid) throw new Error(`Purchase validation failed: ${result.errors.join('; ')}`);
        // 2. Price (Strategy)
        const show = this.registry.getShow(order.showId);
        const zone = show.zones.find((z)=>z.type === order.zoneType);
        const totalPrice = (0, __TURBOPACK__imported__module__$5b$project$5d2f$domain$2f$pricing$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["calculatePrice"])(order.zoneType, zone.pricePerSeat, order.quantity);
        // 3. Execute Command (Command pattern — reserve seats + create tickets)
        const cmd = new __TURBOPACK__imported__module__$5b$project$5d2f$domain$2f$command$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PurchaseCommand"](this.registry, order);
        this.invoker.execute(cmd);
        // 4. Notify (Observer)
        __TURBOPACK__imported__module__$5b$project$5d2f$domain$2f$observer$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["capacityBus"].emit({
            type: 'PURCHASE_COMPLETE',
            showId: order.showId,
            ticketCount: order.quantity,
            total: totalPrice
        });
        const tickets = cmd.getIssuedTicketIds().map((id)=>this.registry.getTicket(id));
        return {
            tickets,
            totalPrice
        };
    }
    cancelTicket(ticketId) {
        const ticket = this.registry.getTicket(ticketId);
        if (!ticket) throw new Error(`Ticket not found: ${ticketId}`);
        if (ticket.status === 'cancelled') throw new Error('Ticket already cancelled');
        const cmd = new __TURBOPACK__imported__module__$5b$project$5d2f$domain$2f$command$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CancelCommand"](this.registry, ticketId);
        this.invoker.execute(cmd);
        return this.registry.getTicket(ticketId);
    }
    undoLastAction() {
        this.invoker.undoLast();
    }
    getShowAvailability(showId) {
        const show = this.registry.getShow(showId);
        if (!show) throw new Error(`Show not found: ${showId}`);
        return show.zones.map((z)=>Object.freeze({
                zoneId: z.id,
                zoneType: z.type,
                available: z.capacity - z.soldCount,
                capacity: z.capacity,
                soldCount: z.soldCount,
                pricePerSeat: z.pricePerSeat
            }));
    }
}
const ticketingFacade = new TicketingFacade(__TURBOPACK__imported__module__$5b$project$5d2f$domain$2f$registry$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["InventoryRegistry"].getInstance(), new __TURBOPACK__imported__module__$5b$project$5d2f$domain$2f$command$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CommandInvoker"]());
}),
"[project]/services/show.service.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getShowAvailability",
    ()=>getShowAvailability,
    "getShowById",
    ()=>getShowById,
    "listShows",
    ()=>listShows
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$domain$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/domain/store.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$domain$2f$registry$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/domain/registry.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$domain$2f$facade$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/domain/facade.ts [app-route] (ecmascript)");
;
;
;
const registry = __TURBOPACK__imported__module__$5b$project$5d2f$domain$2f$registry$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["InventoryRegistry"].getInstance();
function listShows(type) {
    const all = registry.listShows();
    return type ? all.filter((s)=>s.type === type) : all;
}
function getShowById(id) {
    return registry.getShow(id);
}
function getShowAvailability(id) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$domain$2f$facade$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ticketingFacade"].getShowAvailability(id);
}
}),
"[project]/app/api/shows/[id]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$show$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/services/show.service.ts [app-route] (ecmascript)");
;
;
const dynamic = 'force-dynamic';
async function GET(_req, { params }) {
    const { id } = await params;
    const show = (0, __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$show$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getShowById"])(id);
    if (!show) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: 'Show not found'
    }, {
        status: 404
    });
    const availability = (0, __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$show$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getShowAvailability"])(id);
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        show,
        availability
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__a13d0749._.js.map