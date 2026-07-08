/**
 * STARTER FILE — UI shell is here, optimistic logic is yours to build.
 *
 * The mock API is wired up in mockApi.ts. Read it to understand what
 * succeeds, what fails, and how conflicts are signalled.
 *
 * Work through the acceptance criteria in README.md in order:
 *   1. Optimistic add-to-cart
 *   2. Optimistic quantity update
 *   3. Re-validate on checkout attempt
 *   4. Re-validate on foreground
 *
 * Hints are inline where the tricky parts are.
 */

import { AppState, AppStateStatus } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import * as mockApi from './mockApi'
import { Cart, CartItemUI } from './types'

// Products the user can add to their cart from this screen
const AVAILABLE_PRODUCTS = [
  { productId: 'p-002', name: 'Mechanical Keyboard', price: 129.99 },
  { productId: 'p-003', name: 'USB-C Hub', price: 49.99 },
]

const REVALIDATE_AFTER_MS = 60_000

export default function CartScreen() {
  const [cart, setCart] = useState<Cart>({ items: [], lastFetchedAt: 0 })
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)

  // TODO: Load the cart on mount using mockApi.fetchCart()

  // TODO: Re-validate on foreground using AppState.addEventListener
  // Hint: only re-fetch if Date.now() - cart.lastFetchedAt > REVALIDATE_AFTER_MS

  async function handleAddItem(productId: string, name: string, price: number) {
    // TODO: Implement optimistic add
    //
    // Steps:
    // 1. Snapshot current cart items (for rollback)
    // 2. Add a new CartItemUI to local state with isOptimistic: true, error: null
    // 3. Call mockApi.addItem()
    // 4. On success: update the item in state with the server response, set isOptimistic: false
    // 5. On ConflictError: rollback to snapshot, show a toast
    // 6. On other errors: rollback to snapshot, show a generic error toast
    //
    // Hint: guard against double-tap by checking if the product is already
    // in the cart with isOptimistic: true before applying the optimistic update
  }

  async function handleQuantityChange(itemId: string, newQuantity: number) {
    // TODO: Implement optimistic quantity update
    //
    // Steps:
    // 1. Snapshot current items
    // 2. Update the item's quantity in local state immediately
    // 3. Call mockApi.updateQuantity()
    // 4. On success: clear any error on the item, set isOptimistic: false
    // 5. On ConflictError: rollback quantity, set error message on the item
    // 6. On other errors: rollback, show toast
  }

  async function handleRemoveItem(itemId: string) {
    // TODO: Implement optimistic remove
    // This one is simpler — remove failures are rare and rollback is cheap
  }

  async function handleCheckout() {
    // TODO: Re-validate the cart before proceeding
    //
    // Steps:
    // 1. Set validating: true, show a loading state on the button
    // 2. Call mockApi.validateCart()
    // 3. Compare the response against current cart items
    // 4. For any item where maxQuantity === 0: set error 'Out of stock'
    // 5. For any item where quantity > maxQuantity: set error 'Only X remaining'
    // 6. If there are any errors: don't proceed, let the user see them inline
    // 7. If no errors: proceed to checkout (Alert.alert for now)
  }

  if (loading) {
    return <ActivityIndicator style={styles.center} size="large" />
  }

  const hasErrors = cart.items.some(i => i.error !== null)
  const total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Your Cart</Text>

      {cart.items.length === 0 ? (
        <Text style={styles.emptyText}>Your cart is empty</Text>
      ) : (
        cart.items.map(item => (
          <View key={item.id} style={styles.cartItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>
                {item.name}
                {item.isOptimistic && (
                  <Text style={styles.pendingBadge}> (saving...)</Text>
                )}
              </Text>
              <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
              {item.error && (
                <Text style={styles.itemError}>{item.error}</Text>
              )}
            </View>

            <View style={styles.quantityRow}>
              <Pressable
                style={styles.qtyButton}
                onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
              >
                <Text style={styles.qtyButtonText}>−</Text>
              </Pressable>
              <Text style={styles.qtyValue}>{item.quantity}</Text>
              <Pressable
                style={styles.qtyButton}
                onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
              >
                <Text style={styles.qtyButtonText}>+</Text>
              </Pressable>
              <Pressable
                style={styles.removeButton}
                onPress={() => handleRemoveItem(item.id)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

      <View style={styles.divider} />

      <Text style={styles.heading}>Add Items</Text>
      {AVAILABLE_PRODUCTS.map(p => (
        <Pressable
          key={p.productId}
          style={styles.addButton}
          onPress={() => handleAddItem(p.productId, p.name, p.price)}
        >
          <Text style={styles.addButtonText}>+ {p.name} (${p.price})</Text>
        </Pressable>
      ))}

      <View style={styles.divider} />

      <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>

      <Pressable
        style={[
          styles.checkoutButton,
          (hasErrors || validating) && styles.checkoutButtonDisabled,
        ]}
        onPress={handleCheckout}
        disabled={validating || cart.items.length === 0}
      >
        <Text style={styles.checkoutButtonText}>
          {validating ? 'Checking availability...' : 'Proceed to Checkout'}
        </Text>
      </Pressable>

      {hasErrors && (
        <Text style={styles.errorBanner}>
          Some items have issues — review them above before checking out.
        </Text>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 20, gap: 12 },
  heading: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  emptyText: { color: '#6b7280', textAlign: 'center', marginVertical: 24 },
  cartItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemInfo: { gap: 2 },
  itemName: { fontSize: 16, fontWeight: '600' },
  itemPrice: { fontSize: 14, color: '#6b7280' },
  itemError: { fontSize: 13, color: '#dc2626', marginTop: 4 },
  pendingBadge: { color: '#9ca3af', fontWeight: '400', fontSize: 13 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonText: { fontSize: 18, fontWeight: '600', color: '#111827' },
  qtyValue: { fontSize: 16, fontWeight: '600', minWidth: 24, textAlign: 'center' },
  removeButton: { marginLeft: 'auto' },
  removeButtonText: { color: '#dc2626', fontSize: 14 },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 8 },
  addButton: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  addButtonText: { color: '#2563eb', fontWeight: '500' },
  total: { fontSize: 18, fontWeight: '700', textAlign: 'right' },
  checkoutButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  checkoutButtonDisabled: { backgroundColor: '#9ca3af' },
  checkoutButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  errorBanner: { color: '#dc2626', fontSize: 13, textAlign: 'center' },
})
