// YOUR MAPPING FUNCTIONS GO HERE
//
import { RawProduct, RawProductListResponse } from './rawApi'
import { Product, ProductListPage } from './types'
//
// Business rules to encode:
//   - unit_price is in cents → convert to dollars
//   - inStock = is_active AND inventory_count > 0 (null counts as 0)
//   - displayCategory should be title-cased ('consumer-electronics' → 'Consumer Electronics')
//   - product_name should be trimmed

export function toProduct(api: RawProduct): Product {
    return {
        id: api.product_id,
        name: api.product_name.trim(),
        price: (api.unit_price / 100).toFixed(2),
        inStock: api.is_active && (api.inventory_count || 0) > 0,
        displayCategory: api.category_slug.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' '),
    }
}

export function toProductListPage(api: RawProductListResponse): ProductListPage {
    return {
        products: api.products.map(p => toProduct(p)),
        nextCursor: api.next_cursor,
        totalCount: api.products.length
    }
}
