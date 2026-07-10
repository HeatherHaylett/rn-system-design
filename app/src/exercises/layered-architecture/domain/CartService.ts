// domain/CartService.ts
//import { createCartRepository } from '../data/CartRepository'
import type { Product } from '../types'

export type CartRepository = {
    addItem: (productId: string, quantity: number) => Promise<void>
}

export function createCartService(repo: CartRepository) {
    return {
        addToCart: async (product: Product, quantity: number) => {
            if (quantity < 1 || quantity > 99) throw new Error('Quantity must be between 1 and 99.')
            if (!product.inStock) throw new Error('This item is not available.')
            await repo.addItem(product.id, quantity)
        },
    }
}

export const CartService = createCartService({ addItem: async () => { } })