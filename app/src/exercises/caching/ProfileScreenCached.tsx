import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { fetchUser } from './mockApi'
import { User } from './types'
import { cacheService } from './cache'

export default function ProfileScreenCached({ userId }: { userId: string }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [updated, setUpdated] = useState("");

    useEffect(() => {
        const cachedUser: User | null = cacheService.get(userId) || null;
        if (cachedUser) {
            setLoading(false)
            setUser(cachedUser)
        } else {
            setLoading(true)
        }
        fetchUser(userId)
            .then((res) => {
                cacheService.set(userId, res)
                setUser(res)
                setUpdated("Updated now")
                setTimeout(() => {
                    setUpdated("")
                }, 2000)
            })
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
            <View>
                <Text>{updated}</Text>
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
