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
