/**
 * Ride-hailing routes — simulates location updates and driver matching.
 *
 * This is the SSE case study: driver location pushes to client one-way.
 * You'll use EventSource / fetch with a streaming response on the client.
 */

import { Router } from 'express'

export const rideRouter = Router()

const activeRides = new Map() // rideId → ride state

function randomNearbyLocation(base) {
  return {
    lat: base.lat + (Math.random() - 0.5) * 0.01,
    lng: base.lng + (Math.random() - 0.5) * 0.01,
  }
}

rideRouter.post('/request', (req, res) => {
  const { pickup_lat, pickup_lng } = req.body ?? {}
  if (!pickup_lat || !pickup_lng) {
    return res.status(400).json({ error: { code: 'MISSING_LOCATION', message: 'pickup_lat and pickup_lng required' } })
  }

  const rideId = `ride-${Date.now()}`
  activeRides.set(rideId, {
    ride_id: rideId,
    status: 'matching',
    driver: null,
    pickup: { lat: pickup_lat, lng: pickup_lng },
    created_at: new Date().toISOString(),
  })

  // Simulate driver match after 3–6 seconds
  setTimeout(() => {
    const ride = activeRides.get(rideId)
    if (!ride) return
    ride.status = 'driver_assigned'
    ride.driver = {
      driver_id: 'driver-001',
      name: 'Alex T.',
      vehicle: 'Toyota Camry · ABC 1234',
      rating: 4.8,
      location: randomNearbyLocation({ lat: pickup_lat, lng: pickup_lng }),
    }
  }, 3000 + Math.random() * 3000)

  res.status(201).json({ data: { ride_id: rideId } })
})

// SSE endpoint — driver location streams to client
rideRouter.get('/:rideId/location', (req, res) => {
  const ride = activeRides.get(req.params.rideId)
  if (!ride) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ride not found' } })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  function sendUpdate() {
    const current = activeRides.get(req.params.rideId)
    if (!current) return

    if (current.driver?.location) {
      // Simulate driver moving toward pickup
      current.driver.location = randomNearbyLocation(current.driver.location)
    }

    const payload = JSON.stringify({
      ride_id: current.ride_id,
      status: current.status,
      driver: current.driver,
      timestamp: new Date().toISOString(),
    })

    res.write(`data: ${payload}\n\n`)
  }

  const interval = setInterval(sendUpdate, 2000)
  sendUpdate()

  req.on('close', () => {
    clearInterval(interval)
  })
})

rideRouter.post('/:rideId/cancel', (req, res) => {
  activeRides.delete(req.params.rideId)
  res.status(204).send()
})
