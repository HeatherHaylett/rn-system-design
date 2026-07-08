# Case Study: Ride Hailing

**Tier:** 5 — Real server required (`cd server && npm run dev`)
**Difficulty:** Advanced
**Time:** 90–120 min

## The Problem

Design and build the rider side of a ride-hailing app. The user requests a ride, waits for a driver to be matched, then watches the driver's location update in real time until pickup.

This is the SSE case study — the server pushes location updates one-way to the client. You don't need to send anything back after the initial request.

## Constraints

- Driver location updates every 2 seconds — UI must stay smooth (don't update state too aggressively)
- SSE stream must reconnect automatically if it drops
- App must handle the full state machine: requesting → matching → driver assigned → en route → arrived
- Cancellation must clean up the SSE stream cleanly

## Design First

**S — System Requirements**
```
Functional:


Non-functional:
```

**C — Design Considerations**
```
Protocol choice and why SSE over WebSocket here:

How will you handle SSE reconnection on mobile?
(Note: React Native doesn't have a native EventSource — you'll use fetch with a streaming response or a library)

How will you throttle location updates to avoid over-rendering?
```

**A — Architecture**
```
State machine — draw the ride states and transitions:
  idle → requesting → matching → driver_assigned → en_route → arrived → idle

Presentation:

Domain (RideService — owns the state machine):

Data (SSE connection manager):
```

**D — API Contract**
```
POST /ride/request
  Body: { pickup_lat, pickup_lng }
  Response: { data: { ride_id } }

GET /ride/:rideId/location   ← SSE stream
  Each event: { ride_id, status, driver: { name, vehicle, location: { lat, lng } }, timestamp }

POST /ride/:rideId/cancel → 204

How will you parse the SSE stream in React Native?
(There is no native EventSource. Options: fetch with ReadableStream, react-native-sse library, or polling as fallback)
```

**E — Evaluate NFRs**
```
What happens if the SSE stream drops mid-ride?

What happens if the user backgrounds the app during a ride?

How do you prevent the map from re-rendering on every 2-second location update?
(Hint: consider throttling state updates or using a ref for the map marker position)
```

**T — Tradeoffs**
```
I chose ___ over ___ because ___. The cost is ___.

I chose ___ over ___ because ___. The cost is ___.

I chose ___ over ___ because ___. The cost is ___.
```

## Build It

Create `RideScreen.tsx` in this directory.

Requirements:
- [ ] Request a ride with hardcoded pickup coordinates (real GPS not required)
- [ ] Show "Finding driver..." state during matching (server takes 3–6 seconds)
- [ ] When driver assigned: show driver name, vehicle, and a location dot on a simple coordinate display (full map not required — just lat/lng text updating is fine)
- [ ] Location updates every 2 seconds from SSE stream
- [ ] Cancel button cleans up the SSE connection and calls DELETE
- [ ] SSE reconnects if the stream drops
- [ ] State machine prevents invalid transitions (can't cancel after driver arrives)

## Observe and Break

- Kill the server after driver is assigned — does the SSE reconnect? What does the UI show?
- Cancel mid-ride — verify the SSE stream closes (check server console — it should log the connection close)
- Set `CHAOS_LEVEL=high` — the server will occasionally 503 your ride request. How does your UI handle that?
- Watch the React DevTools Profiler during location updates — is your location display component re-rendering every 2 seconds? Is anything else re-rendering that shouldn't be?

## Record Your Observations

```
SSE parsing approach:
- Which method did you use to consume the SSE stream in React Native?
- Did you consider a library or roll it yourself?


State machine transitions — list every transition you implemented:
  idle →
  requesting →
  matching →
  driver_assigned →


Location update frequency vs render frequency:
- How often did the server send updates?
- How often did your UI re-render?
- Did you throttle? How?


Server restart mid-ride:
- What did the SSE client do when the stream dropped?
- What did the UI show during the gap?
- Did the ride state survive the reconnect?


One thing the real server revealed that the mock didn't:
```
