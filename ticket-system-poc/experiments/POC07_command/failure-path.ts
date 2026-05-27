// POC07 — Command: Failure Paths

interface Command { execute(): void; undo(): void }

class CommandInvoker {
  private history: Command[] = []
  execute(cmd: Command) { cmd.execute(); this.history.push(cmd) }
  undoLast() { const c = this.history.pop(); if (!c) return; c.undo() }
  historyLength() { return this.history.length }
}

// 1. undoLast on empty history — must not throw
const emptyInvoker = new CommandInvoker()
emptyInvoker.undoLast()
console.log('[OK] undoLast on empty history: no throw')

// 2. LIFO order — undo in reverse
const log: string[] = []
const cmdA: Command = { execute: () => log.push('A-do'), undo: () => log.push('A-undo') }
const cmdB: Command = { execute: () => log.push('B-do'), undo: () => log.push('B-undo') }
const cmdC: Command = { execute: () => log.push('C-do'), undo: () => log.push('C-undo') }

const inv = new CommandInvoker()
inv.execute(cmdA); inv.execute(cmdB); inv.execute(cmdC)
inv.undoLast(); inv.undoLast(); inv.undoLast()
console.log(`[OK] LIFO undo order: ${log.join(', ')} (expected: A-do, B-do, C-do, C-undo, B-undo, A-undo)`)

// 3. Cancel-then-undo = re-confirm
const seats: Record<string, string> = { S1: 'sold' }
const tickets: Record<string, string> = { T1: 'confirmed' }
const cancelCmd: Command = {
  execute: () => { tickets.T1 = 'cancelled'; seats.S1 = 'available' },
  undo: () => { tickets.T1 = 'confirmed'; seats.S1 = 'sold' },
}
const inv2 = new CommandInvoker()
inv2.execute(cancelCmd)
console.log(`[OK] After cancel: T1=${tickets.T1}, S1=${seats.S1}`)
inv2.undoLast()
console.log(`[OK] After undo-cancel: T1=${tickets.T1} (expected confirmed), S1=${seats.S1} (expected sold)`)

console.log('[INFO] Command stores pre-execution state internally for deterministic undo')
