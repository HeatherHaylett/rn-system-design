# Auth Flows on Mobile

## What It Is

Auth on mobile covers how users prove their identity to the app, how the app stores credentials securely, and what happens when those credentials expire. Mobile has unique challenges compared to web: there's no HttpOnly cookie jar, no browser-managed session, and the device can be physically stolen.

## The Token Model

Most mobile apps use token-based auth:

1. User logs in with credentials
2. Server validates and returns an **access token** (short-lived, e.g. 15 minutes) and a **refresh token** (long-lived, e.g. 30 days)
3. App stores both tokens securely on device
4. Every API request includes the access token in the `Authorization` header
5. When the access token expires, the app uses the refresh token to get a new one silently
6. When the refresh token expires, the user is logged out

```
Client                         Server
  |  POST /auth/login            |
  |  { email, password }         |
  |─────────────────────────►   |
  |  { accessToken, refreshToken}|
  |◄─────────────────────────   |
  |                              |
  |  GET /user/profile           |
  |  Authorization: Bearer <at>  |
  |─────────────────────────►   |
  |  200 OK { ...profile }       |
  |◄─────────────────────────   |
  |                              |
  |  (access token expires)      |
  |                              |
  |  POST /auth/refresh          |
  |  { refreshToken }            |
  |─────────────────────────►   |
  |  { newAccessToken }          |
  |◄─────────────────────────   |
```

## Where to Store Tokens

This is a common interview question. The answer matters — wrong storage is a security vulnerability.

| Storage | Security | Notes |
|---------|----------|-------|
| **Expo SecureStore / Keychain** | ✅ Best | Encrypted, hardware-backed on supported devices. Use this for tokens. |
| **AsyncStorage** | ❌ Never for tokens | Unencrypted, accessible to other apps on rooted devices |
| **In-memory only** | ⚠️ Acceptable for access token | Lost on app restart, forces re-login |

```typescript
import * as SecureStore from 'expo-secure-store'

// Store
await SecureStore.setItemAsync('refreshToken', token)

// Read
const token = await SecureStore.getItemAsync('refreshToken')

// Delete (on logout)
await SecureStore.deleteItemAsync('refreshToken')
```

**Rule of thumb:** refresh tokens in SecureStore (they're long-lived and high-value). Access tokens can live in memory only — they're short-lived and losing them on app restart just triggers a silent refresh.

## Silent Token Refresh

The user should never see a loading state because an access token expired. Implement silent refresh transparently in your API client:

```typescript
async function apiRequest(url: string, options: RequestInit) {
  let response = await fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${accessToken}` },
  })

  if (response.status === 401) {
    // Access token expired — try to refresh
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      // Retry the original request with the new token
      response = await fetch(url, {
        ...options,
        headers: { ...options.headers, Authorization: `Bearer ${refreshed}` },
      })
    } else {
      // Refresh token also expired — log out
      logout()
      return
    }
  }

  return response
}
```

Handle the race condition: if multiple requests fire simultaneously and all get 401s, only one refresh request should go out. Use a promise that all pending requests wait on:

```typescript
let refreshPromise: Promise<string | null> | null = null

async function getValidAccessToken(): Promise<string | null> {
  if (!isTokenExpired(accessToken)) return accessToken

  // Only one refresh in flight at a time
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}
```

## Deep Link Re-entry

Mobile apps can be opened from a deep link (e.g., a push notification, a link in an email). If the user isn't authenticated when the link fires, you need to:

1. Store the intended destination
2. Show the login screen
3. After successful login, navigate to the stored destination

```typescript
// In your linking config
const linking = {
  prefixes: ['myapp://'],
  config: { screens: { Order: 'orders/:orderId' } },
}

// In your auth flow
if (!isAuthenticated) {
  navigation.navigate('Login', { redirectTo: targetRoute })
}

// After login
const redirectTo = route.params?.redirectTo
if (redirectTo) navigation.navigate(redirectTo)
```

## Biometric Auth

For apps with sensitive data, biometric auth (Face ID, fingerprint) adds a layer on top of token auth:

- User authenticates with biometrics to unlock the app (or re-authenticate after backgrounding)
- This doesn't replace server-side tokens — it just gates access to the device's stored tokens
- Use `expo-local-authentication` for the biometric prompt

**When to require biometrics:**
- On every app open (high security, high friction — financial apps)
- After a timeout period (e.g., after 5 minutes of inactivity)
- Only for sensitive actions (payments, viewing account numbers)

## Logout

Logout must be thorough:

```typescript
async function logout() {
  // 1. Invalidate the refresh token server-side
  await api.post('/auth/logout', { refreshToken })

  // 2. Clear all stored credentials
  await SecureStore.deleteItemAsync('refreshToken')
  accessToken = null

  // 3. Clear any cached user data
  await localDB.clearUserData()

  // 4. Navigate to login
  navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
}
```

Don't just navigate away. If you don't clear SecureStore, a future user of the device can still access the account.

## What Interviewers Look For

- Token storage: do you name SecureStore? Do you know why AsyncStorage is wrong?
- Silent refresh: do you handle the 401 retry flow? Do you handle the race condition?
- Refresh token expiry: what happens when the refresh token expires? (log out, don't crash)
- Logout: do you invalidate server-side or just clear local state?
- Deep link re-entry: do you handle unauthenticated deep links?

## What's Next

Auth is the last mobile-specific concern in Tier 3. Tier 4 covers performance — how to keep your app fast at scale.
