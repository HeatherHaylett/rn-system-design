# Exercise: Auth Flow

**Concept:** [12 — Auth Flows](../../../../concepts/12-auth/README.md)
**Difficulty:** Advanced
**Time:** 50–60 minutes

## The Scenario

You're implementing auth for a mobile app. The starter has a basic login screen that gets an access token and stores it in AsyncStorage. It works — but it has three security and reliability problems you need to fix.

## What's Already Here

- `authApi.ts` — mock auth API: login, refresh, logout, and a protected endpoint that returns 401 when the token expires
- `AuthScreenBroken.tsx` — a working but broken auth implementation
- `types.ts` — AuthTokens and User types

## The Three Problems to Fix

### Problem 1: Tokens stored in AsyncStorage
The access and refresh tokens are stored in `AsyncStorage`. This is unencrypted and accessible on rooted devices. Move them to `expo-secure-store`.

```bash
npx expo install expo-secure-store
```

### Problem 2: No silent token refresh
When a request returns 401, the app shows an error instead of silently refreshing the token and retrying. Implement an API client wrapper that:
- Intercepts 401 responses
- Calls the refresh endpoint
- Retries the original request with the new token
- Handles the race condition: if multiple requests get 401 simultaneously, only one refresh fires and all pending requests wait for it

### Problem 3: Logout doesn't clean up
The current logout clears local state but doesn't:
- Invalidate the refresh token server-side
- Clear SecureStore
- Reset navigation to prevent back-navigation to authenticated screens

## What You Need to Build

### `secureTokenStore.ts`
A module wrapping `expo-secure-store` with:
- `saveTokens(tokens: AuthTokens): Promise<void>`
- `getTokens(): Promise<AuthTokens | null>`
- `clearTokens(): Promise<void>`

### `apiClient.ts`
An `apiFetch` wrapper around `fetch` that:
- Attaches the current access token to every request
- On 401: silently refreshes, retries once
- On refresh failure: calls `logout()` and throws
- Deduplicates concurrent refresh calls with a shared promise

### `AuthScreenFixed.tsx`
Refactor the broken auth screen to use your new modules. The UX should be identical — the fix is entirely in the implementation.

## Acceptance Criteria

- [ ] Tokens stored in SecureStore, not AsyncStorage
- [ ] A 401 response triggers silent refresh + retry, user never sees an error for a simple expiry
- [ ] Two simultaneous 401s result in exactly one refresh call
- [ ] Logout clears SecureStore, invalidates server-side, resets navigation
- [ ] App restores session on launch if a valid refresh token exists in SecureStore

## The Question This Prepares You For

> "Walk me through how you'd handle auth token storage and refresh on mobile."

After this exercise you should be able to describe SecureStore vs AsyncStorage, the refresh interceptor pattern, the concurrent-refresh race condition and its fix, and what a complete logout looks like.

## How to Observe with Tools

**Console — refresh count**

`authApi.ts` exposes `getRefreshCount()`. Add a console log that prints it after any API call. The critical test:

1. Log in
2. Call `simulateTokenExpiry()` from the debug panel (add a button)
3. Fire three protected API calls simultaneously
4. Watch the console — `refreshCount` should increment exactly once, not three times

If it increments three times, your concurrent-refresh deduplication isn't working.

**Console — token lifecycle**

Add `console.log` statements at each stage of your `apiClient.ts`:
- When attaching the access token to a request
- When a 401 is received
- When the refresh call fires
- When the retry fires with the new token

Then trigger a token expiry and make a request. You should see exactly this sequence in the console:
```
[auth] attaching token: access-token-abc123
[auth] 401 received — refreshing
[auth] refresh complete: access-token-refreshed-1
[auth] retrying with new token
[auth] attaching token: access-token-refreshed-1
```

Any deviation from this sequence means something is wrong.

**Expo Dev Tools — SecureStore**

After implementing SecureStore, add a debug button that reads and prints the stored tokens to the console. Confirm:
- After login: tokens are present in SecureStore
- After logout: SecureStore is empty (call `getTokens()` and log the result)
- After app restart: tokens are still in SecureStore (in-memory state is gone but SecureStore persists)

## Record Your Observations

```
Concurrent refresh test:
- How many times did getRefreshCount() increment when 3 requests hit 401 simultaneously?
  Before fix:
  After fix:

- What mechanism did you use to deduplicate? (describe it in one sentence):


Token lifecycle — paste the console sequence you observed for a token-expiry + retry:


SecureStore verification:
- After login, what did getTokens() return?

- After logout, what did getTokens() return?

- After simulating an app restart (reset JS state), were tokens still recoverable?


One thing that surprised me:
```
