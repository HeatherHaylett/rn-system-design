/**
 * RAW API TYPES AND MOCK RESPONSES — do not modify this file.
 *
 * This represents what the backend actually returns. It's yours to
 * understand and map — not to clean up at the source.
 */

export type RawProduct = {
  product_id: string
  product_name: string         // may have leading/trailing whitespace
  unit_price: number           // in cents (e.g. 24999 = $249.99)
  inventory_count: number | null  // null means unknown — treat as 0
  is_active: boolean
  category_slug: string        // e.g. "consumer-electronics"
  created_ts: number           // unix timestamp in seconds
  meta: {
    weight_grams: number
    sku: string
    tags: string[]
  }
}

export type RawProductListResponse = {
  products: RawProduct[]
  next_cursor: string | null
  total_count: number
}

// ─── Mock fetch functions ─────────────────────────────────────────────────────

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const RAW_PRODUCTS: RawProduct[] = [
  {
    product_id: 'p-001',
    product_name: '  Wireless Headphones  ',
    unit_price: 24999,
    inventory_count: 3,
    is_active: true,
    category_slug: 'consumer-electronics',
    created_ts: 1710000000,
    meta: { weight_grams: 280, sku: 'WH-2024-BLK', tags: ['audio', 'wireless'] },
  },
  {
    product_id: 'p-002',
    product_name: 'Mechanical Keyboard',
    unit_price: 12999,
    inventory_count: 0,
    is_active: true,
    category_slug: 'peripherals',
    created_ts: 1709900000,
    meta: { weight_grams: 950, sku: 'KB-65-BLU', tags: ['keyboard', 'mechanical'] },
  },
  {
    product_id: 'p-003',
    product_name: 'USB-C Hub',
    unit_price: 4999,
    inventory_count: null,   // backend returned null — treat as out of stock
    is_active: true,
    category_slug: 'peripherals',
    created_ts: 1709800000,
    meta: { weight_grams: 120, sku: 'HUB-7P-SLV', tags: ['hub', 'usb-c'] },
  },
  {
    product_id: 'p-004',
    product_name: 'Webcam 4K',
    unit_price: 8999,
    inventory_count: 12,
    is_active: false,         // discontinued — is_active false means out of stock regardless
    category_slug: 'consumer-electronics',
    created_ts: 1709700000,
    meta: { weight_grams: 200, sku: 'CAM-4K-BLK', tags: ['webcam', 'video'] },
  },
]

export async function fetchProducts(cursor?: string): Promise<RawProductListResponse> {
  await delay(600)
  return {
    products: RAW_PRODUCTS,
    next_cursor: null,
    total_count: RAW_PRODUCTS.length,
  }
}
