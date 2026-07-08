/**
 * Mock API that simulates network delay and stock conflicts.
 *
 * CONFLICT_RATE controls how often add/update operations fail with a stock
 * conflict. Set to 0 to test the happy path, 0.8 to stress-test rollback.
 */

import { CartItem } from './types'

const NETWORK_DELAY_MS = 600
const CONFLICT_RATE = 0.3 // 30% of mutations will conflict

let serverCart: CartItem[] = [
  {
    id: 'cart-item-1',
    productId: 'p-001',
    name: 'Wireless Headphones',
    price: 249.99,
    quantity: 1,
    maxQuantity: 3,
  },
]

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function shouldConflict() {
  return Math.random() < CONFLICT_RATE
}

export async function fetchCart(): Promise<CartItem[]> {
  await delay(NETWORK_DELAY_MS)
  return JSON.parse(JSON.stringify(serverCart))
}

export async function addItem(
  productId: string,
  name: string,
  price: number,
): Promise<CartItem> {
  await delay(NETWORK_DELAY_MS)

  if (shouldConflict()) {
    throw new ConflictError(`${name} is out of stock`)
  }

  const existing = serverCart.find(i => i.productId === productId)
  if (existing) {
    existing.quantity += 1
    return { ...existing }
  }

  const newItem: CartItem = {
    id: `cart-item-${Date.now()}`,
    productId,
    name,
    price,
    quantity: 1,
    maxQuantity: 5,
  }
  serverCart.push(newItem)
  return { ...newItem }
}

export async function updateQuantity(
  itemId: string,
  quantity: number,
): Promise<CartItem> {
  await delay(NETWORK_DELAY_MS)

  const item = serverCart.find(i => i.id === itemId)
  if (!item) throw new Error(`Item ${itemId} not found in cart`)

  if (shouldConflict() && quantity > item.maxQuantity) {
    throw new ConflictError(
      `Only ${item.maxQuantity} units of ${item.name} remaining`,
    )
  }

  item.quantity = quantity
  return { ...item }
}

export async function removeItem(itemId: string): Promise<void> {
  await delay(NETWORK_DELAY_MS)
  serverCart = serverCart.filter(i => i.id !== itemId)
}

export async function validateCart(): Promise<CartItem[]> {
  await delay(NETWORK_DELAY_MS)
  // Simulate some items going out of stock since last fetch
  return serverCart.map(item => ({
    ...item,
    maxQuantity: Math.random() > 0.7 ? 0 : item.maxQuantity, // 30% chance item is now out of stock
  }))
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
  }
}
