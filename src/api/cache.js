/* ════════════════════════════════════════
   CACHE MANAGER WITH TTL
   Para demostrar manejo avanzado de APIs
════════════════════════════════════════ */

class CacheManager {
  constructor(ttl = 5 * 60 * 1000) {  // 5 minutos default
    this.cache = new Map()
    this.ttl = ttl
  }

  get(key) {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    const now = Date.now()
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    
    console.log(`✅ CACHE HIT: ${key}`)
    return entry.data
  }

  set(key, data) {
    console.log(`💾 CACHE SET: ${key}`)
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  clear() {
    this.cache.clear()
    console.log('🗑️  Cache cleared')
  }

  size() {
    return this.cache.size
  }
}

export const apiCache = new CacheManager()
