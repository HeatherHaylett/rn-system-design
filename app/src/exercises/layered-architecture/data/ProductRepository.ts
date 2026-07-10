import { Product } from '../types';
// ─── Mock API (pretend this is a real network call) ───────────────────────────

const MOCK_PRODUCTS: Record<string, Product> = {
    'p-001': {
        id: 'p-001',
        name: 'Wireless Headphones',
        description: 'Premium noise-cancelling headphones with 30-hour battery life.',
        price: 249.99,
        inStock: true,
        stockCount: 3,
    },
    'p-002': {
        id: 'p-002',
        name: 'Mechanical Keyboard',
        description: 'Compact 65% layout with tactile switches.',
        price: 129.99,
        inStock: false,
        stockCount: 0,
    },
}

export function createProductRepository() {
    return {
        fetchProduct: async (id: string): Promise<Product> => {
            await new Promise(resolve => setTimeout(resolve, 800)) // simulate network
            const product = MOCK_PRODUCTS[id]
            return new Promise((resolve, reject) => {
                if (!product) {
                    return reject(new Error(`Product ${id} not found`));
                }
                resolve(product);
            });
        }
    }
}

