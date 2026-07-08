/**
 * STARTING POINT — fetches on every mount, no caching.
 *
 * Navigate away and back — you'll see the loading spinner every time.
 * Notice the fetchCount in the console. This is what you're fixing.
 *
 * Don't modify this file. Use it as the baseline to compare against
 * your cached versions in Part A and Part B.
 */

import React, { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { fetchUser } from './mockApi'
import { User } from './types'

export default function ProfileScreenNaive({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchUser(userId)
      .then(setUser)
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return <ActivityIndicator style={styles.center} size="large" />

  if (!user) return null

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.bio}>{user.bio}</Text>
      <View style={styles.stats}>
        <Stat label="Posts" value={user.postCount} />
        <Stat label="Followers" value={user.followerCount} />
        <Stat label="Following" value={user.followingCount} />
      </View>
    </View>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value.toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, padding: 24, gap: 12 },
  name: { fontSize: 24, fontWeight: '700' },
  bio: { color: '#6b7280', fontSize: 16 },
  stats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  stat: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 13, color: '#6b7280' },
})
