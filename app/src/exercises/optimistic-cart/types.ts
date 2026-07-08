export type CartItem = {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  maxQuantity: number // current stock level from server
}

// CartItem extended with client-side state for optimistic UI
export type CartItemUI = CartItem & {
  isOptimistic: boolean  // true while server hasn't confirmed this item
  error: string | null   // inline error to show on this item
}

export type Cart = {
  items: CartItemUI[]
  lastFetchedAt: number  // unix timestamp
}
