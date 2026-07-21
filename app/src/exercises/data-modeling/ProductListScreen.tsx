/**
 * STARTING POINT — imports raw API types directly and transforms inline.
 *
 * Refactor this screen so it:
 *   1. Uses your domain types from types.ts
 *   2. Calls your mapper functions from mappers.ts
 *   3. Contains zero inline data transformations
 *
 * The screen logic itself (loading, error, rendering) should not change —
 * only where the data transformation happens.
 */

import React, { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native'
import { fetchProducts } from './rawApi'
import { Product } from './types'
import { toProductListPage } from './mappers'

export default function ProductListScreen() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
      .then(response => setProducts(toProductListPage(response).products))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <ActivityIndicator style={styles.center} />
  if (error) return <Text style={styles.error}>{error}</Text>

  return (
    <FlatList
      data={products}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        // ❌ Inline transformations — these should all be in mappers.ts
        const name = item.name
        const price = item.price
        const inStock = item.inStock
        const category = item.displayCategory
        return (
          <View style={styles.card}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.category}>{category}</Text>
            <Text style={styles.price}>${price}</Text>
            <Text style={[styles.stock, !inStock && styles.outOfStock]}>
              {inStock ? 'In stock' : 'Out of stock'}
            </Text>
          </View>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#dc2626', padding: 16 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#f9fafb', borderRadius: 12,
    padding: 16, gap: 4,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  name: { fontSize: 16, fontWeight: '600' },
  category: { fontSize: 13, color: '#6b7280' },
  price: { fontSize: 18, color: '#2563eb', fontWeight: '700' },
  stock: { fontSize: 13, color: '#16a34a' },
  outOfStock: { color: '#dc2626' },
})
