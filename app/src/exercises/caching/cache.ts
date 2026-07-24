
type CacheEntry<T> = {
    data: T
    cachedAt: number
    ttl: number       // milliseconds
}

class CacheService {
    private cache = new Map<string, CacheEntry<any>>()
    private ttlDefault = 300000;

    get<T>(key: string): T | undefined {
        const entry = this.cache.get(key);

        if (!entry) return undefined;

        if (Math.floor(Date.now()) - entry.cachedAt > entry.ttl) {
            this.cache.delete(key)
            return undefined;
        }

        return entry.data;
    }

    set<T>(key: string, value: T, ttl: number = this.ttlDefault): void {
        const entry: CacheEntry<T> = {
            data: value,
            cachedAt: Math.floor(Date.now()),
            ttl: ttl,
        }
        this.cache.set(key, entry)
    }
}