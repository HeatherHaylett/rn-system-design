export type Product = {
  id: string
  name: string
  description: string
  price: number
  inStock: boolean
  stockCount: number
}

export type CartItem = {
  product: Product
  quantity: number
}

export type Result = {
  ok: boolean
  reason?: string
}
