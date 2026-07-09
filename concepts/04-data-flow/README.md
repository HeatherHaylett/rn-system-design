# Data Flow & Reactive Programming

## What It Is

Unidirectional data flow is the architectural pattern React (and React Native) is built on. Data moves in one direction through your app — from a single source of truth down to the UI. User actions move in the opposite direction — from the UI back up to the data source, triggering updates that flow back down.

This is not a library feature or a pattern you opt into. It's the fundamental model of how React works. Understanding it deeply is what separates engineers who fight React from engineers who work with it.

## The Core Loop

```
┌─────────────────────────────────────────────┐
│                                             │
│   State / Data Source                       │
│   (useState, useReducer, Zustand, React     │
│    Query cache, Context)                    │
│                │                            │
│                │ data flows DOWN            │
│                ▼                            │
│   UI (React Native components)              │
│   renders based on current state            │
│                │                            │
│                │ user actions flow UP       │
│                ▼                            │
│   Event Handlers                            │
│   (onPress, onChangeText, onScroll)         │
│                │                            │
│                │ trigger state updates      │
│                ▼                            │
│   State / Data Source  ◄── back to top     │
│                                             │
└─────────────────────────────────────────────┘
```

Data always flows down: from state to components via props and context.
Actions always flow up: from components to state via callbacks and event handlers.
The UI is always a pure function of the current state — same state, same UI.

## A Concrete Example

```typescript
// State lives at the top (the single source of truth)
function SearchScreen() {
  const [query, setQuery] = useState('')
  const results = useSearchResults(query)  // derived from state

  return (
    // Data flows DOWN as props
    <SearchBar
      value={query}          // ← data going down
      onChange={setQuery}    // ← callback going up
    />
    <ResultsList
      results={results}      // ← data going down
    />
  )
}

// Child component is "dumb" — it receives data and emits events
function SearchBar({ value, onChange }: Props) {
  return (
    <TextInput
      value={value}                    // display current state
      onChangeText={text => onChange(text)}  // user action goes UP
    />
  )
}
```

`SearchBar` never holds its own copy of the query. It renders whatever `value` it receives, and when the user types it calls `onChange` to tell the parent. The parent updates state, which flows back down as a new `value` prop. The loop is complete.

## Why Unidirectional — What It Prevents

The alternative is **bidirectional data flow**, where components can directly mutate shared state. This is how older frameworks (Angular 1, classic MVC) worked. The problem: when anything can change state from anywhere, bugs become nearly impossible to trace. You change one thing and something unrelated breaks, and you have no clear path to find why.

With unidirectional flow:
- There is always **one place** where a piece of state lives
- To understand why the UI looks a certain way, you look at the state
- To understand why state changed, you find the event handler that called `setState`
- The data trail is always traceable: user action → event handler → state update → re-render

## Reactive Programming

Reactive programming is the paradigm that underpins unidirectional data flow. The idea: instead of imperatively updating the UI ("go find the text field and set its value to X"), you **declare** what the UI should look like for a given state, and the framework reacts to state changes by re-rendering automatically.

```typescript
// Imperative (not React's model)
const label = document.getElementById('count')
label.textContent = count + 1  // manually update the DOM

// Reactive (React's model)
function Counter() {
  const [count, setCount] = useState(0)
  return <Text>{count}</Text>  // UI is a declaration of what to show given current state
  // when count changes, React re-renders automatically
}
```

In the reactive model, your components are functions from state to UI. You don't manually manage what updates when. React tracks dependencies and re-renders what's necessary.

### Reactivity at Different Scales

**Component level:** `useState` / `useReducer` — component re-renders when its own state changes.

**Cross-component level:** Context, Zustand, Redux — subscribers re-render when the store slice they depend on changes.

**Server state level:** React Query — components re-render when the query result changes (new data fetched, cache updated, background re-fetch completes).

**Animation level:** `react-native-reanimated` uses shared values that update on the UI thread without going through React's re-render cycle at all — for animations that need to run at 60 FPS without JS thread involvement.

## Props Down, Callbacks Up

This phrase summarizes the pattern for how parent and child components communicate:

**Props down:** the parent passes data to the child as props. The child can read it but cannot change the parent's copy.

**Callbacks up:** the parent passes a function (callback) to the child. When the user does something, the child calls the callback. The parent's handler runs and updates state. The updated state flows back down.

```typescript
// Parent owns the state
function ParentScreen() {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <ItemList
      items={items}              // props DOWN
      selectedId={selected}      // props DOWN
      onSelect={setSelected}     // callback UP
    />
  )
}

// Child is stateless — it just renders and reports events
function ItemList({ items, selectedId, onSelect }: Props) {
  return items.map(item => (
    <Pressable
      key={item.id}
      onPress={() => onSelect(item.id)}   // calls UP to parent
      style={item.id === selectedId ? styles.selected : styles.default}
    >
      <Text>{item.name}</Text>
    </Pressable>
  ))
}
```

`ItemList` never calls `setSelected` directly — it doesn't have access to it. It just fires `onSelect` and trusts the parent to handle it. This keeps `ItemList` reusable: you can put it anywhere, pass it a different `onSelect`, and it works correctly.

## Lifting State Up

When two sibling components need to share state, the state moves to their common parent. This is "lifting state up."

```
Before (broken — each has its own copy, they're out of sync):

  TabBar (owns selectedTab)       Content (owns selectedTab)
      ↓                               ↓
  renders tabs                    renders content

After (correct — single source of truth in the parent):

        Screen (owns selectedTab)
        /                    \
  TabBar                   Content
  (receives selectedTab     (receives selectedTab
   + onTabChange callback)   as prop, renders matching content)
```

The rule: find the lowest common ancestor of all components that need a piece of state, and put it there. No higher, no lower.

## Derived State

If a value can be computed from existing state, it should be computed — not stored as its own piece of state.

```typescript
// ❌ Storing derived state — now you have two sources of truth that can diverge
const [items, setItems] = useState<CartItem[]>([])
const [total, setTotal] = useState(0)  // must remember to update this every time items change

// ✅ Deriving it — always consistent, never stale
const [items, setItems] = useState<CartItem[]>([])
const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
```

Storing derived state creates synchronization bugs. You update `items` and forget to update `total`. One source of truth, derive everything else from it.

For expensive derivations, wrap in `useMemo` so it only recomputes when dependencies change.

## Side Effects Are Explicit

In the reactive model, side effects (network requests, timers, subscriptions) are not triggered inline in render functions. They're declared explicitly in `useEffect`, with their dependencies stated.

```typescript
// ❌ Side effect in render (wrong)
function UserProfile({ userId }: Props) {
  fetch(`/users/${userId}`)  // fires on every render
  ...
}

// ✅ Side effect in useEffect (correct)
function UserProfile({ userId }: Props) {
  useEffect(() => {
    fetchUser(userId).then(setUser)
  }, [userId])  // only re-runs when userId changes
  ...
}
```

The dependency array is a declaration of "what this effect reacts to." When those values change, the effect re-runs. When the component unmounts, the cleanup function runs. This makes side effects predictable and traceable.

In practice, for server data you'll use React Query instead of raw `useEffect` — it implements this pattern correctly and handles the edge cases (race conditions, cleanup, stale responses) for you.

## Data Flow Across the Full Stack

Unidirectional flow applies not just within a component tree, but across the whole app:

```
Server (source of truth)
      │
      │  network request
      ▼
React Query cache (local cache of server state)
      │
      │  query hooks
      ▼
Components (render server state as UI)
      │
      │  user action triggers mutation
      ▼
React Query mutation → API call → server update
      │
      │  cache invalidation
      ▼
React Query cache refreshes → components re-render with fresh data
```

The loop is the same at every scale. The server is just another data source that the client reacts to.

## In an Interview

When an interviewer asks "how does data flow in your design?", walk through the loop explicitly:

> "Data flows unidirectionally. The server is the source of truth — React Query caches it locally. Components subscribe to slices of that cache via query hooks and re-render reactively when the cache updates. User actions call mutation handlers, which send requests to the server and then invalidate the relevant cache entries. That invalidation triggers a background re-fetch, and the updated data flows back down to all subscribed components. Nothing in the UI layer directly mutates state — it always goes through the handler layer and back around the loop."

## What's Next

You now understand how state is managed and how data flows through the app. The next concept covers the framework for communicating this design in a 45-minute interview: RADIO.
