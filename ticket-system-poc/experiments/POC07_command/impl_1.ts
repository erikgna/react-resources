// POC07 — Command Pattern with Undo
// Key insight: PurchaseCommand stores which ticket IDs it created — targeted undo, no registry scan.
// CommandInvoker maintains LIFO history stack.
// Undo of cancel = re-confirm.

interface Command { execute(): void; undo(): void }

// Minimal in-memory store for isolation
type SeatStatus = 'available' | 'sold'
type TicketStatus = 'confirmed' | 'cancelled'
const seatStore: Record<string, SeatStatus> = { A1: 'available', A2: 'available', A3: 'available' }
const ticketStore: Record<string, { seatId: string; status: TicketStatus }> = {}
let idSeq = 0

class PurchaseCommand implements Command {
  private issuedIds: string[] = []

  constructor(private seatIds: string[]) {}

  execute() {
    for (const seatId of this.seatIds) {
      if (seatStore[seatId] !== 'available') throw new Error(`Seat not available: ${seatId}`)
      seatStore[seatId] = 'sold'
      const id = `T${++idSeq}`
      ticketStore[id] = { seatId, status: 'confirmed' }
      this.issuedIds.push(id)
    }
  }

  undo() {
    for (const seatId of this.seatIds) seatStore[seatId] = 'available'
    for (const id of this.issuedIds) delete ticketStore[id]
    this.issuedIds = []
  }

  getIssuedIds() { return [...this.issuedIds] }
}

class CancelCommand implements Command {
  private prevStatus: SeatStatus | null = null

  constructor(private ticketId: string) {}

  execute() {
    const ticket = ticketStore[this.ticketId]
    if (!ticket) throw new Error(`Ticket not found: ${this.ticketId}`)
    this.prevStatus = seatStore[ticket.seatId]
    seatStore[ticket.seatId] = 'available'
    ticketStore[this.ticketId] = { ...ticket, status: 'cancelled' }
  }

  undo() {
    const ticket = ticketStore[this.ticketId]
    if (!ticket) return
    ticketStore[this.ticketId] = { ...ticket, status: 'confirmed' }
    if (this.prevStatus) seatStore[ticket.seatId] = this.prevStatus
  }
}

class CommandInvoker {
  private history: Command[] = []
  execute(cmd: Command) { cmd.execute(); this.history.push(cmd) }
  undoLast() { const c = this.history.pop(); c?.undo() }
}

const invoker = new CommandInvoker()

// Purchase A1, A2
const purchase = new PurchaseCommand(['A1', 'A2'])
invoker.execute(purchase)
const ticketIds = purchase.getIssuedIds()
console.log(`[OK] Purchased: ${ticketIds.join(',')} | seats: A1=${seatStore.A1}, A2=${seatStore.A2}`)

// Cancel T1
const cancelCmd = new CancelCommand(ticketIds[0])
invoker.execute(cancelCmd)
console.log(`[OK] Cancelled ${ticketIds[0]}: status=${ticketStore[ticketIds[0]].status}, seat A1=${seatStore.A1}`)

// Undo cancel — ticket returns to confirmed
invoker.undoLast()
console.log(`[OK] Undo cancel: ${ticketIds[0]} status=${ticketStore[ticketIds[0]].status}, A1=${seatStore.A1}`)

// Undo purchase
invoker.undoLast()
invoker.undoLast() // the purchase (undo of undo-cancel is cancel re-execute at this point)
console.log(`[OK] After undo purchase: A1=${seatStore.A1}, A2=${seatStore.A2}`)
console.log(`[OK] Tickets removed: T1 exists=${!!ticketStore['T1']}`)
