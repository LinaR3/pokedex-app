import { apiCache } from './cache'

const POKE = 'https://pokeapi.co/api/v2'

/* ════════════════════════════════════════
   CATEGORIES
════════════════════════════════════════ */
export const CATEGORIES = [
  { id: 'pokemon',         label: 'POKÉMON',     emoji: '🔴', limit: 151 },
  { id: 'pokemon-species', label: 'PERSONAJES',  emoji: '👾', limit: 151 },
  { id: 'type',            label: 'TIPOS',       emoji: '🌀', limit: 18  },
  { id: 'version',         label: 'VERSIONES',   emoji: '🎮', limit: 30  },
]

export const TYPE_COLORS = {
  normal:'#A8A878', fire:'#F08030', water:'#6890F0', electric:'#F8D030',
  grass:'#78C850', ice:'#98D8D8', fighting:'#C03028', poison:'#A040A0',
  ground:'#E0C068', flying:'#A890F0', psychic:'#F85888', bug:'#A8B820',
  rock:'#B8A038', ghost:'#705898', dragon:'#7038F8', dark:'#705848',
  steel:'#B8B8D0', fairy:'#EE99AC',
}

export const getPokemonSprite  = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
export const getPokemonArtwork = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
export const getAnimatedSprite = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`

/* ════════════════════════════════════════
   MEJORA #5: RETRY con Exponential Backoff
════════════════════════════════════════ */
async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(url)
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r
    } catch (e) {
      if (i === retries - 1) throw e
      console.log(`⚠️ Retry ${i + 1}/${retries} after ${delay}ms...`)
      await new Promise(res => setTimeout(res, delay))
      delay *= 2
    }
  }
}

/* ════════════════════════════════════════
   MEJORA #2: CACHE - Fetch List
════════════════════════════════════════ */
export async function fetchList(categoryId) {
  const cacheKey = `list:${categoryId}`
  const cached = apiCache.get(cacheKey)
  if (cached) return cached

  const cat = CATEGORIES.find(c => c.id === categoryId)
  if (!cat) throw new Error('Categoría no encontrada')
  
  const r = await fetchWithRetry(`${POKE}/${cat.id}?limit=${cat.limit}&offset=0`)
  const d = await r.json()
  
  const list = (d.results || []).map(item => {
    const parts = item.url.replace(/\/$/, '').split('/')
    const id = parts[parts.length - 1]
    return { id, name: item.name, url: item.url }
  })

  apiCache.set(cacheKey, list)
  return list
}

/* ════════════════════════════════════════
   MEJORA #4: PARALLEL FETCH - Detail
   Pokémon + Species + Evolution en paralelo
════════════════════════════════════════ */
export async function fetchDetail(categoryId, id) {
  const cacheKey = `detail:${categoryId}:${id}`
  const cached = apiCache.get(cacheKey)
  if (cached) return cached

  const r = await fetchWithRetry(`${POKE}/${categoryId}/${id}`)
  const data = await r.json()

  if (categoryId === 'pokemon' && data.species?.url) {
    try {
      const [speciesData, evolutionData] = await Promise.all([
        fetchWithRetry(data.species.url).then(r => r.json()),
        fetchWithRetry(data.species.url)
          .then(r => r.json())
          .then(sp => sp.evolution_chain?.url 
            ? fetchWithRetry(sp.evolution_chain.url).then(r => r.json())
            : null
          )
      ])

      const flavor = (
        speciesData.flavor_text_entries.find(e => e.language.name === 'es') ||
        speciesData.flavor_text_entries.find(e => e.language.name === 'en')
      )?.flavor_text?.replace(/[\f\n\r]/g, ' ') || ''

      const genus = (
        speciesData.genera?.find(g => g.language.name === 'es') ||
        speciesData.genera?.find(g => g.language.name === 'en')
      )?.genus || ''

      const result = { 
        ...data, 
        _flavorText: flavor, 
        _genus: genus, 
        _evolutionChain: evolutionData,
        _category: 'pokemon' 
      }
      
      apiCache.set(cacheKey, result)
      return result
    } catch (e) {
      console.warn('⚠️ Parallel fetch failed:', e)
    }
  }

  const result = { ...data, _category: categoryId }
  apiCache.set(cacheKey, result)
  return result
}

/* ════════════════════════════════════════
   MEJORA #1: BÚSQUEDA INTELIGENTE
════════════════════════════════════════ */
export function searchInList(list, query) {
  if (!query) return list
  const q = query.toLowerCase().trim()
  
  return list.filter(item => {
    const numMatch = q.replace(/^#/, '')
    if (!isNaN(numMatch) && item.id === numMatch) return true
    return item.name.toLowerCase().includes(q)
  })
}

/* ════════════════════════════════════════
   MEJORA #3: PREFETCH siguiente item
════════════════════════════════════════ */
export async function prefetchNext(categoryId, list, currentId) {
  const idx = list.findIndex(i => i.id === currentId)
  if (idx === -1 || idx >= list.length - 1) return
  
  const nextId = list[idx + 1].id
  const cacheKey = `detail:${categoryId}:${nextId}`
  
  if (!apiCache.get(cacheKey)) {
    console.log(`🔮 Prefetching: ${categoryId}/${nextId}`)
    try {
      await fetchDetail(categoryId, nextId)
    } catch (e) {
      console.warn('Prefetch failed:', e)
    }
  }
}

/* ════════════════════════════════════════
   MEJORA #5: RATE LIMITER visual
════════════════════════════════════════ */
export class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.requests = []
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  addRequest() {
    const now = Date.now()
    this.requests.push(now)
    this.requests = this.requests.filter(t => now - t < this.windowMs)
  }

  getRemaining() {
    const now = Date.now()
    this.requests = this.requests.filter(t => now - t < this.windowMs)
    return Math.max(0, this.maxRequests - this.requests.length)
  }

  getPercentage() {
    return (this.getRemaining() / this.maxRequests) * 100
  }
}

export const rateLimiter = new RateLimiter()