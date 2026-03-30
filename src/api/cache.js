const DEBUG = import.meta.env.DEV

/**
 * Simple in-memory key/value cache with Time-To-Live expiry.
 * Avoids redundant API calls for data that doesn't change often.
 *
 * @example
 * const cache = new CacheManager(5 * 60 * 1000) // 5-minute TTL
 * cache.set('pokemon:25', pikachuData)
 * cache.get('pokemon:25') // returns pikachuData or null if expired
 */
class CacheManager {
  /**
   * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
   */
  constructor(ttl = 5 * 60 * 1000) {
    this._cache = new Map()
    this._ttl   = ttl
  }

  /**
   * Returns cached data for a key, or null if missing/expired.
   * @param {string} key
   * @returns {*|null}
   */
  get(key) {
    const entry = this._cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > this._ttl) {
      this._cache.delete(key)
      return null
    }

    if (DEBUG) console.log(`[cache] HIT  ${key}`)
    return entry.data
  }

  /**
   * Stores data under a key with the current timestamp.
   * @param {string} key
   * @param {*}      data
   */
  set(key, data) {
    if (DEBUG) console.log(`[cache] SET  ${key}`)
    this._cache.set(key, { data, timestamp: Date.now() })
  }

  /** Removes all cached entries. */
  clear() {
    this._cache.clear()
    if (DEBUG) console.log('[cache] CLEARED')
  }

  /** @returns {number} Number of live (non-expired) entries. */
  get size() {
    return this._cache.size
  }
}

export const apiCache = new CacheManager()