// YOUR DOMAIN MODELS GO HERE
//
// Design types that are shaped for the UI — not the API.
// The screen should never need to know what the raw API looks like.
//
// You need:
//   Product        — clean product ready for display
//   ProductListPage — paginated list of products with cursor
//   ProductUI      — Product + client-only fields (isAddingToCart, error)

export type Product = {
    id: string,
    name: string,
    price: string,
    inStock: boolean,
    displayCategory: string,
}

export type ProductListPage = {
    products: Product[]
    nextCursor: string | null
    totalCount: number
}

export type ProductUI = {
    product: Product,
    isAddingToCart: boolean,
    error: string
}
