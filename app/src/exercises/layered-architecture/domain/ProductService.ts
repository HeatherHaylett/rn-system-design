import {createProductRepository} from '../data/ProductRepository';
import { Product } from '../types';

export type ProductRepository = {
    fetchProduct: (productId: string) => Promise<Product>
}

export function createProductService(repo: ProductRepository) {
    return {
        getProduct: async (id: string) => {
            return await repo.fetchProduct(id); 
        }
    }
}

export const productService = createProductService(createProductRepository());