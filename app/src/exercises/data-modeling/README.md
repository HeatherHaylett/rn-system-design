# Exercise: Data Modeling

**Concept:** [06 — Data Modeling](../../../../concepts/06-data-modeling/README.md)
**Difficulty:** Intermediate
**Time:** 35–45 minutes

## The Scenario

You've just been handed a raw API response from a backend team. It's ugly: snake_case keys, prices in cents, nested objects with fields the UI doesn't need, and booleans that require combining two fields to get the actual meaning.

Your job is to define the domain model and the mapping functions before writing a single component.

## What's Already Here

- `rawApi.ts` — the raw API responses exactly as the backend sends them. Do not modify this file.
- `types.ts` — empty file where your domain models go.
- `mappers.ts` — empty file where your mapping functions go.
- `ProductListScreen.tsx` — a screen that needs to render products. It currently imports directly from `rawApi.ts` and the code is littered with inline transformations. Refactor it to use your domain models.

## What You Need to Build

### 1. Define domain models in `types.ts`

Look at the raw API types in `rawApi.ts` and design cleaner types for:
- `Product` — a product ready to display in the UI
- `ProductListPage` — a page of products with cursor pagination
- `ProductUI` — Product extended with client-only fields (is it being added to cart? does it have an error?)

### 2. Write mapping functions in `mappers.ts`

- `toProduct(raw: RawProduct): Product` — transforms a raw product into a domain model
- `toProductListPage(raw: RawProductListResponse): ProductListPage` — transforms the paginated response

The mapping functions must encode these business rules:
- Price is stored in cents on the server — convert to dollars
- A product is `inStock` only when both `is_active` is true AND `inventory_count > 0`
- `displayCategory` should be title-cased (e.g., `"electronics"` → `"Electronics"`)

### 3. Refactor `ProductListScreen.tsx`

Replace the inline transformations with your mapper functions. After refactoring, the screen should import from `types.ts` and `mappers.ts`, not from `rawApi.ts` directly.

## Acceptance Criteria

- [ ] `types.ts` has `Product`, `ProductListPage`, and `ProductUI` with no raw API types leaking in
- [ ] `mappers.ts` has `toProduct` and `toProductListPage`
- [ ] Price displays in dollars, not cents
- [ ] Out-of-stock products show the correct status regardless of which raw field caused it
- [ ] `ProductListScreen` contains no inline transformations — all mapping goes through `mappers.ts`
- [ ] Adding `displayCategory` to a product requires changing only `mappers.ts`, not the screen

## Edge Cases to Handle

- `inventory_count` is sometimes `null` from the API — treat as 0
- `product_name` can have leading/trailing whitespace — trim it
- The `nextCursor` field is `null` when there are no more pages

## The Question This Prepares You For

> "How would you model the data layer for a product listing feature?"

After this exercise you should be able to describe the separation between raw API types and domain models, where mapping functions live and why, and how client-only state extends the domain model without polluting it.
