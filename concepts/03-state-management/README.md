# State Management

## What It Is

State management is deciding where data lives in your app, who owns it, and how it changes. Every piece of state in a React Native app has a home — the question is whether you've put it in the right one.

Getting this wrong is one of the most common sources of bugs in mobile apps: state that should be local ends up global (causing unnecessary re-renders), state that should be shared ends up duplicated (causing sync bugs), and server data ends up in the same store as UI state (causing stale data problems).

## The Two Kinds of State

Before choosing a tool, identify what kind of state you're dealing with:

**Server state** — data that lives on the server and your app is a cache of. Posts, users, products, orders. It can be stale. It needs to be re-fetched. It can change on the server without your app knowing. It needs loading and error states.

**Client state** — data that only exists in the app. UI state (is this modal open?), form drafts, navigation state, user preferences that never sync. It doesn't go stale. It doesn't need loading states.

The biggest architectural mistake is managing server state with a client state tool. Putting your API data in Redux means you're reinventing a cache — manually handling loading states, invalidation, re-fetching, and staleness. There are better tools for that job.

## The Decision: What Tool for What State

```
What kind of state is this?
│
├── Server state (comes from an API, can go stale)
│   └── React Query / TanStack Query
│       (handles fetching, caching, loading, errors, re-fetching automatically)
│
└── Client state (only exists in the app)
    │
    ├── Used by one component or a small local tree
    │   └── useState / useReducer (keep it local)
    │
    ├── Shared across the app but not complex
    │   └── React Context
    │
    └── Complex, high-frequency updates, or needs middleware
        └── Zustand (or Redux Toolkit if team already uses it)
```

## useState — Local Component State

The default. If state is only needed by one component, it lives there.

```typescript
function Counter() {
  const [count, setCount] = useState(0)
  return <Pressable onPress={() => setCount(c => c + 1)}><Text>{count}</Text></Pressable>
}
```

**Use when:** UI state that doesn't need to be shared. Toggle state, input values, local loading flags.

**Don't use when:** the state needs to be accessed by components that aren't in a parent-child relationship. That's the sign you need to lift it up or reach for Context/Zustand.

## useReducer — Complex Local State

When local state has multiple sub-values that change together, or when the next state depends on the previous state in non-trivial ways, `useReducer` is cleaner than multiple `useState` calls.

```typescript
type CartState = {
  items: CartItem[]
  isLoading: boolean
  error: string | null
}

type CartAction =
  | { type: 'ADD_ITEM'; item: CartItem }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'SET_ERROR'; message: string }
  | { type: 'CLEAR_ERROR' }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.item] }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.id) }
    case 'SET_ERROR':
      return { ...state, error: action.message, isLoading: false }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
  }
}
```

**Use when:** state has multiple fields that update together, you have complex update logic, or you want the state transitions to be explicit and testable. The reducer is a plain function — easy to unit test without rendering anything.

**Don't confuse with Redux:** `useReducer` is local to a component. It doesn't give you global state or a store. To share a reducer's state across the app, you'd pair it with Context.

## React Context — Shared State Without a Library

Context lets you share state across a component tree without prop drilling. The canonical use cases: current user, theme, locale, auth status.

```typescript
type AuthContextValue = {
  user: User | null
  login: (credentials: Credentials) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  async function login(credentials: Credentials) {
    const user = await authService.login(credentials)
    setUser(user)
  }

  function logout() {
    authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

**Use when:** state is stable and changes infrequently (theme, auth, locale). Every consumer re-renders when the context value changes — if you put high-frequency state in Context, you'll cause widespread unnecessary re-renders.

**Don't use Context for:** rapidly changing state (scroll position, animation values, live data). Don't use it as a replacement for a proper state management library — it has no built-in optimization, no selectors, and no middleware.

**Performance tip:** split contexts by update frequency. Auth context (changes rarely) and UI context (theme, changes rarely) should be separate from anything that changes on user interaction.

## React Query / TanStack Query — Server State

React Query is the right tool for server state. It handles everything you'd otherwise write manually: fetching, caching, background re-fetching, loading states, error states, pagination, and optimistic updates.

```typescript
// Fetching
function usePost(id: string) {
  return useQuery({
    queryKey: ['post', id],
    queryFn: () => api.getPost(id),
    staleTime: 2 * 60 * 1000,  // treat as fresh for 2 minutes
  })
}

// Mutating with cache invalidation
function useLikePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (postId: string) => api.likePost(postId),
    onSuccess: (_, postId) => {
      // Invalidate so the post re-fetches with updated like count
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
    },
  })
}

// In a component
function PostScreen({ postId }: { postId: string }) {
  const { data: post, isLoading, error } = usePost(postId)
  const { mutate: likePost } = useLikePost()

  if (isLoading) return <ActivityIndicator />
  if (error) return <ErrorView />
  return <Post post={post} onLike={() => likePost(postId)} />
}
```

**Key concepts:**
- **Query key**: uniquely identifies a piece of server state. `['post', id]` means "the post with this id". React Query uses this as the cache key.
- **staleTime**: how long before the cached data is considered stale and should be re-fetched in the background.
- **invalidateQueries**: marks cached data as stale and triggers a background re-fetch for any active subscribers.

**Use when:** any data that comes from an API. This replaces manual `useState` + `useEffect` + fetch patterns for the vast majority of server data needs.

## Zustand — Lightweight Global Client State

Zustand is a minimal state management library for client state that needs to be shared across the app but doesn't justify Redux's complexity. No providers, no boilerplate, just a store and hooks.

```typescript
import { create } from 'zustand'

type CartStore = {
  items: CartItemUI[]
  addItem: (item: CartItemUI) => void
  removeItem: (id: string) => void
  clearCart: () => void
}

const useCartStore = create<CartStore>((set) => ({
  items: [],
  addItem: (item) => set(state => ({ items: [...state.items, item] })),
  removeItem: (id) => set(state => ({ items: state.items.filter(i => i.id !== id) })),
  clearCart: () => set({ items: [] }),
}))

// In any component, anywhere in the tree — no Provider needed
function CartBadge() {
  const itemCount = useCartStore(state => state.items.length)
  return <Badge count={itemCount} />
}
```

**Use when:** client state is shared across screens, changes frequently, or has update logic complex enough to warrant a store. Common examples: cart state, notification badge counts, app-wide UI state (sidebar open/closed).

**Selector pattern:** `useCartStore(state => state.items.length)` — components only subscribe to the slice of state they use. CartBadge only re-renders when `items.length` changes, not on every cart update.

## Redux Toolkit — When the Team Already Uses Redux

Redux has largely been superseded by React Query (for server state) and Zustand (for client state) in new projects. But many existing apps use Redux, and Redux Toolkit (RTK) is the modern way to write it.

Know it exists and that RTK Query is Redux's answer to React Query. In an interview, mentioning "I'd use Redux Toolkit if the team has an existing Redux setup, otherwise I'd reach for Zustand for client state and React Query for server state" shows you know the landscape.

## State Colocation

The most important principle: **keep state as close as possible to where it's used**.

State that's only used by one component belongs in that component. Only lift it to a parent when a sibling needs it. Only put it in global state when multiple distant parts of the app need it. Only put it in a server state manager when it comes from an API.

The instinct to make everything global is common and wrong. Global state has a cost: it re-renders more components, it's harder to reason about, and it makes components hard to reuse in isolation.

## Form State

Forms are a special case. Controlled inputs with `useState` work fine for simple forms. For complex forms (multi-step, validation, field arrays), reach for `react-hook-form`:

```typescript
import { useForm, Controller } from 'react-hook-form'

function SignupForm() {
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>()

  return (
    <Controller
      control={control}
      name="email"
      rules={{ required: 'Email is required', pattern: { value: /\S+@\S+/, message: 'Invalid email' } }}
      render={({ field: { onChange, value } }) => (
        <TextInput value={value} onChangeText={onChange} />
      )}
    />
  )
}
```

Form state is inherently local — it belongs in the form, not in global state. Exception: multi-step forms where you need to persist values across screens. Even then, consider keeping it in the navigation params or a component-local store rather than global state.

## Navigation State

React Navigation manages its own state internally. You don't need to mirror navigation state in Redux or Zustand. Use:
- **Route params** for data that belongs to a specific screen
- **`navigation.navigate()`** for imperative navigation
- **Deep linking config** for URL-based navigation

Don't store "which screen is active" in your own state — React Navigation already tracks that.

## A Real Interview Scenario

**Question:** Design the state management for a social feed app.

Strong answer:
> "I'd split state into two categories. Server state — the feed posts, user profiles, comments — goes through React Query. It handles caching, background re-fetching, and loading states automatically. My components call `useQuery` hooks and get data, loading, and error states back with no manual fetch logic.
>
> Client state is minimal: auth status lives in an AuthContext since it's stable and app-wide. The notification badge count and any optimistic UI state lives in a Zustand store since it's shared across the tab bar and the notification screen. Everything else — modal open/closed, scroll position, input values — stays local with useState in the components that own it.
>
> I'd specifically avoid putting feed data in Redux or Zustand. That's server state — it needs re-fetching, staleness tracking, and cache invalidation, which React Query handles better than a manual store."

## What's Next

State management answers where data lives. The next concept covers how it moves — unidirectional data flow and reactive programming.
