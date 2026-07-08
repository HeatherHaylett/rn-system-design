# Mobile Non-Functional Requirements (NFRs)

## What They Are

Non-functional requirements describe *how* a system behaves rather than *what* it does. Functional requirements are the features ("users can add items to a cart"). NFRs are the constraints those features must operate within ("the cart must load in under 200ms even on a 3G connection").

In a system design interview, NFRs are what separate a senior answer from a junior one. Anyone can describe the happy path. The question is whether your design holds up under real-world constraints.

## Why Mobile Is Different

Mobile apps face constraints that backend or web systems don't:

**Battery** — Every network request, background task, and CPU-heavy operation drains the battery. A design that polls the server every second might work fine on desktop but is unacceptable on mobile. You need to think about polling intervals, batching requests, and whether a push notification can replace a poll.

**Network variability** — Mobile users move between WiFi, LTE, 3G, and no signal. Your app needs to handle all of these gracefully. A request that takes 50ms on WiFi might take 3 seconds on 3G or fail entirely in a tunnel.

**Intermittent connectivity** — Users don't just have slow connections; they lose them entirely. A subway commute, a flight, a dead zone. If your app requires a network connection to function at all, it will fail these users. Offline capability is an NFR, not a bonus feature.

**Memory limits** — Mobile devices have less RAM than servers. Caching too aggressively can get your app killed by the OS. You need eviction strategies.

**Device fragmentation** — Your app runs on a 3-year-old mid-range Android and a brand-new iPhone 16. Performance characteristics vary wildly.

**Security** — Mobile devices are lost and stolen. Data stored on device needs to be encrypted. Auth tokens need to be stored in secure storage (not AsyncStorage). Sensitive data shouldn't appear in screenshots or the app switcher.

## The Standard NFRs to Address

In any mobile system design interview, you should proactively address these:

| NFR | What to cover |
|-----|---------------|
| **Latency** | What's the acceptable response time? How do you handle slow connections? |
| **Availability** | What happens when the server is down? Can the app still function? |
| **Offline support** | Which features work offline? Which degrade gracefully? Which are blocked? |
| **Battery efficiency** | Are you polling or using push? Are background tasks bounded? |
| **Security** | Where is sensitive data stored? Is it encrypted? What happens on logout? |
| **Scalability** | If the user has 10,000 items in a list, does your design still work? |
| **Performance** | What's your strategy for large lists, heavy images, slow renders? |

You don't need to solve all of them deeply — but you need to *name* them and explain the tradeoff you're making. "I'm choosing to not support offline for the payment flow because the risk of a failed payment showing as successful is too high" is a good answer.

## A Real Interview Scenario

**Question:** Design a Twitter-like feed for a mobile app.

A weak answer jumps straight to: "I'll use a FlatList, fetch tweets from the API, display them."

A strong answer starts with NFRs:
- "Before I design anything, I want to nail down the constraints. Latency: the feed should appear in under 500ms — I'll want to cache the last-seen feed locally so the user sees something immediately even before the network responds. Offline: I'll show cached content with a banner indicating it may be stale, rather than a blank screen. Battery: I'll use push notifications for new tweet alerts rather than polling. Scalability: the feed could have thousands of items — I'll need cursor-based pagination and a virtualized list. Security: tweet draft content shouldn't be stored in plain text if the user has sensitive DMs."

That framing shows the interviewer you think at the system level, not just the component level.

## Key Tradeoffs to Know

- **Freshness vs battery**: More frequent syncing = fresher data but more battery drain. The right tradeoff depends on the feature (stock prices need freshness; a photo album doesn't).
- **Offline capability vs complexity**: Supporting offline requires local storage, sync logic, and conflict resolution — significant engineering cost. Be intentional about which features justify it.
- **Cache size vs memory**: Caching more data improves perceived performance but risks OOM kills. Set explicit cache size limits with eviction policies.
- **Security vs convenience**: Requiring biometric auth on every app open is secure but annoying. Requiring it only for sensitive actions (payments, account changes) is a reasonable tradeoff.

## What's Next

Now that you know what NFRs are and why they matter on mobile, the next concept covers how you organize your code to *meet* those NFRs — layered architecture.
