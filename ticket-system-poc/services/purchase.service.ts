import '@/domain/store'
import { InventoryRegistry } from '@/domain/registry'
import { ticketingFacade } from '@/domain/facade'
import { validateOrder } from '@/domain/validation'
import type { PurchaseOrder, ValidationResult, Ticket } from '@/domain/types'

const registry = InventoryRegistry.getInstance()

export function validatePurchaseOrder(order: PurchaseOrder): ValidationResult {
  return validateOrder(order, registry)
}

export function executePurchase(order: PurchaseOrder): { tickets: readonly Ticket[]; totalPrice: number } {
  return ticketingFacade.purchaseTickets(order)
}

export function cancelTicket(ticketId: string): Ticket {
  return ticketingFacade.cancelTicket(ticketId)
}

export function getTicket(ticketId: string): Ticket | undefined {
  return registry.getTicket(ticketId)
}
