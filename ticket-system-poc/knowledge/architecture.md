# Ticket System POC — Architecture

## 5.1 Overall Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Server Component (ShowListPage, ShowDetailShell)         │   │
│  │  · Renders HTML on server — zero client JS for list      │   │
│  │  · Calls domain services directly (no fetch)             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Client Component (SeatPickerClient, CartPage)            │   │
│  │  · useShowDetail → TanStack Query → GET /api/shows/[id]  │   │
│  │  · useShowSeats  → TanStack Query → GET .../seats        │   │
│  │  · useCart       → Zustand (local, no API)               │   │
│  │  · usePurchase   → useMutation → POST /api/purchase      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                          │ HTTP
┌─────────────────────────────────────────────────────────────────┐
│  Next.js API Routes (server-only adapters)                       │
│                                                                  │
│  GET  /api/shows              → show.service.ts                  │
│  GET  /api/shows/[id]         → show.service.ts                  │
│  GET  /api/shows/[id]/seats   → seat.service.ts                  │
│  POST /api/purchase           → purchase.service.ts              │
│  POST /api/purchase/cancel    → purchase.service.ts              │
│  GET  /api/tickets/[id]       → purchase.service.ts              │
└─────────────────────────────────────────────────────────────────┘
                          │ direct call
┌─────────────────────────────────────────────────────────────────┐
│  Services (thin adapters over domain)                            │
│  show.service / seat.service / purchase.service                  │
└─────────────────────────────────────────────────────────────────┘
                          │ direct call
┌─────────────────────────────────────────────────────────────────┐
│  Domain (pure TypeScript — zero React/Next.js imports)           │
│                                                                  │
│  TicketingFacade (POC10)                                         │
│    ├── validateOrder → TicketValidator (POC09 Template Method)   │
│    ├── calculatePrice → PricingStrategy (POC03 Strategy)         │
│    ├── CommandInvoker (POC07 Command)                            │
│    │     └── PurchaseCommand / CancelCommand                     │
│    └── capacityBus.emit → CapacityEventBus (POC04 Observer)      │
│                                                                  │
│  InventoryRegistry (POC08 Singleton)                             │
│    ├── shows: Map<ShowId, Show>  (seeded by factory)             │
│    ├── seats: Map<SeatId, Seat>  (mutable)                       │
│    └── tickets: Map<TicketId, Ticket> (mutable)                  │
│                                                                  │
│  TicketStateMachine (POC01 State)                                │
│    available → reserved → confirmed → cancelled                  │
│              └──────────────────────→ expired                    │
│                                                                  │
│  TicketOrderBuilder (POC02 Builder)                              │
│  ShowFactory (POC06 Factory Method)                              │
│  VenueComposite (POC05 Composite)                                │
└─────────────────────────────────────────────────────────────────┘
```

## 5.2 Deployment

```
Developer machine
  └── bun run dev
        └── Next.js (turbopack) on localhost:3000
              ├── Node.js process (server components + API routes)
              │     └── InventoryRegistry singleton in process memory
              └── Browser (React client components)
```

No external services. State resets on process restart (by design for POC).

## 5.3 Use Cases

```
┌─────────────────────────────────────────────────────────────────┐
│  Ticket System                                                    │
│                                                                  │
│  Buyer ──── UC1: Browse shows list                               │
│         │   UC2: View show detail + zone availability            │
│         │   UC3: Select zone (VIP / Premium / General)           │
│         │   UC4: Choose seats (click seat grid)                  │
│         │   UC5: View cart summary + price preview               │
│         │   UC6: Purchase tickets                                │
│         │   UC7: View confirmation + ticket IDs                  │
│         └── UC8: Cancel tickets (demonstrates Command undo)      │
└─────────────────────────────────────────────────────────────────┘
```

## Ticket State Machine

```
  available ──reserve()──→ reserved ──confirm()──→ confirmed
      │                       │                        │
  expire()               cancel()              cancel()
      │                       │                        │
      ↓                       ↓                        ↓
  expired              cancelled               cancelled
  (terminal)           (terminal)              (terminal)
```

## Zone Capacity Thresholds (Observer events)

```
0%         80%        100%
|──────────|──────────|
           ↑          ↑
    THRESHOLD_80   ZONE_FULL
```
