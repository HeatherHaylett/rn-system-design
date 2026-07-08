/**
 * STARTING POINT — everything is in one place.
 *
 * This component fetches a product, enforces business rules, and renders the
 * result all in one file. It works, but it's hard to test, hard to reuse,
 * and hard to add offline support to later.
 *
 * Your task: refactor this into three layers.
 * See README.md for what to build and where.
 *
 * Don't delete this file — your refactored ProductScreen goes in
 * presentation/ProductScreen.tsx. This is the before-state for reference.
 */

import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Product } from './types'

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

async function fetchProduct(id: string): Promise<Product> {
  await new Promise(resolve => setTimeout(resolve, 800)) // simulate network
  const product = MOCK_PRODUCTS[id]
  if (!product) throw new Error(`Product ${id} not found`)
  return product
}

// ─── The unlayered component ──────────────────────────────────────────────────

type Props = { productId: string }

export default function ProductScreen({ productId }: Props) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    fetchProduct(productId)
      .then(setProduct)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [productId])

  async function handleAddToCart() {
    if (!product) return

    // Business rule: quantity must be 1–99
    if (quantity < 1 || quantity > 99) {
      Alert.alert('Invalid quantity', 'Quantity must be between 1 and 99.')
      return
    }

    // Business rule: can't add out-of-stock item
    if (!product.inStock) {
      Alert.alert('Out of stock', 'This item is not available.')
      return
    }

    setAddingToCart(true)
    try {
      // Pretend we're writing to AsyncStorage / sending to server
      await new Promise(resolve => setTimeout(resolve, 400))
      Alert.alert('Added to cart', `${quantity}x ${product.name}`)
    } catch {
      Alert.alert('Error', 'Failed to add to cart. Please try again.')
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) return <ActivityIndicator style={styles.center} />

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load product: {error}</Text>
      </View>
    )
  }

  if (!product) return null

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.price}>${product.price.toFixed(2)}</Text>
      <Text style={styles.stock}>
        {product.inStock ? `In stock (${product.stockCount} left)` : 'Out of stock'}
      </Text>
      <Text style={styles.description}>{product.description}</Text>

      <View style={styles.quantityRow}>
        <Pressable
          style={styles.qtyButton}
          onPress={() => setQuantity(q => Math.max(1, q - 1))}
        >
          <Text style={styles.qtyButtonText}>−</Text>
        </Pressable>
        <Text style={styles.qtyValue}>{quantity}</Text>
        <Pressable
          style={styles.qtyButton}
          onPress={() => setQuantity(q => Math.min(99, q + 1))}
        >
          <Text style={styles.qtyButtonText}>+</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.addButton, (!product.inStock || addingToCart) && styles.addButtonDisabled]}
        onPress={handleAddToCart}
        disabled={!product.inStock || addingToCart}
      >
        <Text style={styles.addButtonText}>
          {addingToCart ? 'Adding...' : 'Add to Cart'}
        </Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 20, gap: 12 },
  name: { fontSize: 24, fontWeight: '700' },
  price: { fontSize: 20, color: '#2563eb' },
  stock: { fontSize: 14, color: '#6b7280' },
  description: { fontSize: 16, lineHeight: 24, marginTop: 8 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
  qtyButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  qtyButtonText: { fontSize: 20, fontWeight: '600' },
  qtyValue: { fontSize: 18, fontWeight: '600', minWidth: 30, textAlign: 'center' },
  addButton: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  addButtonDisabled: { backgroundColor: '#9ca3af' },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  errorText: { color: '#dc2626', textAlign: 'center' },
})
