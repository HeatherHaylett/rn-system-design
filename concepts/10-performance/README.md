# Performance

## What It Is

Performance on mobile means the app feels fast: it starts quickly, scrolls smoothly, responds instantly to taps. Unlike the web, where a janky experience is annoying, on mobile it triggers the app switcher — users close your app and open a competitor's.

The two metrics that matter most in interviews:

- **TTI (Time to Interactive):** How long from app open until the user can do something useful
- **FPS (Frames Per Second):** Does scrolling feel smooth? 60 FPS is the target; below 45 is noticeable

## FlatList at Scale

`FlatList` is the workhorse of mobile list rendering. At small scale it works fine with no configuration. At thousands of items, it needs explicit help.

### The core problem

FlatList uses a virtualized window: it only renders items near the viewport, destroying items that scroll far out of view. But the default configuration is conservative. By the time you have 10,000 items, you may see blank cells, janky scrolling, or sluggish tap responses.

### Key props to know

**`keyExtractor`** — must return a stable, unique string for each item. Never use the array index; if the list reorders or you insert items, React will re-render everything.

```typescript
keyExtractor={(item) => item.id}
```

**`getItemLayout`** — if your items have a fixed height, provide this. It lets FlatList calculate positions without measuring, which is dramatically faster for large lists and enables `scrollToIndex`.

```typescript
getItemLayout={(_, index) => ({
  length: ITEM_HEIGHT,
  offset: ITEM_HEIGHT * index,
  index,
})}
```

**`windowSize`** — how many screen-heights of items to keep rendered above and below the viewport. Default is 21 (10 screens each direction). Reduce for faster scrolling at the cost of more blank cells on fast scroll.

**`maxToRenderPerBatch`** — how many items to render per JS frame during a scroll. Default is 10. Reduce to 5–8 for smoother scrolling on lower-end devices.

**`removeClippedSubviews`** — on Android, unmounts items outside the viewport from the native view hierarchy. Can improve memory on very long lists. Default false; enable on large lists.

### Memoize `renderItem`

Every parent re-render causes `renderItem` to be recreated, which FlatList sees as a new function reference and re-renders all visible items. Wrap with `useCallback`:

```typescript
const renderItem = useCallback(({ item }: { item: Post }) => (
  <PostCard post={item} onLike={handleLike} />
), [handleLike])
```

And memoize the item component itself with `React.memo`:

```typescript
const PostCard = React.memo(({ post, onLike }: Props) => {
  // only re-renders if post or onLike reference changes
})
```

### Variable height items

If items have variable heights (common in social feeds), `getItemLayout` isn't available. Options:
- Estimate a fixed height that covers most items (some blank cell flicker is acceptable)
- Use `CellRendererComponent` to measure heights as items render and cache them
- Consider `FlashList` from Shopify — a drop-in FlatList replacement that handles variable heights with better performance

## Image Performance

Images are the most common cause of memory pressure and slow rendering on mobile.

**Use `expo-image` or `react-native-fast-image`** — the built-in `<Image>` component does not cache to disk. Both of these do, automatically. This alone is a meaningful improvement for image-heavy apps.

**Specify `width` and `height` explicitly** — without dimensions, the image has zero size until it loads, causing layout shifts. Provide them so the layout is stable.

**Progressive loading** — show a placeholder (blur hash, low-res thumbnail, solid color) while the full image loads:

```typescript
<Image
  source={{ uri: photo.url }}
  placeholder={{ blurhash: photo.blurHash }}
  contentFit="cover"
  transition={200}
/>
```

**Downsize on the server** — request images at the display size, not the original resolution. A thumbnail displayed at 80×80 doesn't need to download a 4000×4000 original. Use a CDN that supports on-the-fly resizing (Cloudinary, imgix, CloudFront).

## JS Thread vs UI Thread

React Native runs JavaScript on a separate thread from the UI. The JS thread handles business logic, state updates, and React rendering. The UI thread handles animation and gesture responses.

**The rule:** animations and gesture handlers should never touch the JS thread. Use `react-native-reanimated` and `react-native-gesture-handler` to keep them entirely on the UI thread.

If you do heavy computation in response to a gesture (sorting a list on drag, transforming data in a scroll handler), the UI will stutter. Move that computation to the JS thread asynchronously or offload to a worklet.

## App Startup Time

**What makes startup slow:**
- Large bundle size (JS takes time to parse and execute)
- Synchronous operations at startup (reading SecureStore, making network requests before rendering)
- Heavy module initialization

**What to do:**
- Lazy-load screens — don't import every screen at startup. React Navigation supports lazy rendering by default.
- Defer non-critical work — don't fetch user preferences synchronously. Show the app, then load preferences.
- Show a splash screen (Expo SplashScreen) while async startup work completes. Users accept a loading splash; they don't accept a frozen screen.
- Measure with Flashlight or Perfetto (Android) / Instruments (iOS).

## Memoization

React re-renders components when their props or state change. Unnecessary re-renders are the most common performance issue in React Native apps.

**`React.memo`** — wrap a component to skip re-renders when props haven't changed (by reference equality).

**`useMemo`** — memoize an expensive computed value. Only recompute when dependencies change.
```typescript
const sortedPosts = useMemo(
  () => [...posts].sort((a, b) => b.createdAt - a.createdAt),
  [posts]
)
```

**`useCallback`** — memoize a function reference. Prevents child components from re-rendering due to new function references on each parent render.

**When NOT to memoize:** don't wrap everything in `memo`/`useMemo`/`useCallback` by default. The comparison cost can exceed the render cost for cheap components. Memoize when you have a measured performance problem, not preemptively.

## Profiling Tools

Know these exist and what they do:

- **React DevTools Profiler** — records renders, shows which components re-rendered and why
- **Expo's Performance Monitor** — shows FPS, JS/UI frame drops in development
- **Flashlight** — automated mobile performance testing (like Lighthouse for mobile)
- **Hermes** — Meta's JS engine for React Native. Faster startup and lower memory than V8. Enabled by default in new Expo projects. Worth mentioning in an interview.

## A Real Interview Scenario

**Question:** The feed is slow on lower-end Android devices. How do you diagnose and fix it?

Strong answer:
> "First I'd profile with React DevTools to identify which components are re-rendering unnecessarily. Most common culprits: `renderItem` not wrapped in `useCallback`, item components not memoized with `React.memo`, or state updates in the parent causing the entire list to re-render. I'd also check FlatList configuration — add `getItemLayout` if items are fixed height, reduce `windowSize` and `maxToRenderPerBatch` for lower-end devices, enable `removeClippedSubviews`. If images are the bottleneck, switch to expo-image and make sure we're requesting appropriately sized images from the CDN. If it's startup time, I'd look at bundle size with `expo-bundle-analyzer` and defer non-critical initialization."

## What's Next

You've completed Tiers 1–4. You now have the foundational knowledge for every major topic that comes up in mobile system design interviews. Tier 5 is full case study practice — designing complete systems using SCADET, combining everything you've learned.
