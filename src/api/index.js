const POKE = 'https://pokeapi.co/api/v2'

/* ════════════════════════════
   SOLO 4 CATEGORÍAS
════════════════════════════ */
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

/* ── sprites ── */
export const getPokemonSprite  = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
export const getPokemonArtwork = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
export const getAnimatedSprite = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`

/* ── FETCH LIST ── */
export async function fetchList(categoryId) {
  const cat = CATEGORIES.find(c => c.id === categoryId)
  if (!cat) throw new Error('Categoría no encontrada')
  const r = await fetch(`${POKE}/${cat.id}?limit=${cat.limit}&offset=0`)
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const d = await r.json()
  return (d.results || []).map(item => {
    const parts = item.url.replace(/\/$/, '').split('/')
    const id = parts[parts.length - 1]
    return { id, name: item.name, url: item.url }
  })
}

/* ── FETCH DETAIL ── */
export async function fetchDetail(categoryId, id) {
  const r = await fetch(`${POKE}/${categoryId}/${id}`)
  if (!r.ok) throw new Error(`No encontrado (${r.status})`)
  const data = await r.json()

  /* Pokémon: también traer species para flavor text */
  if (categoryId === 'pokemon' && data.species?.url) {
    try {
      const sr = await fetch(data.species.url)
      const sp = await sr.json()
      const flavor = (
        sp.flavor_text_entries.find(e => e.language.name === 'es') ||
        sp.flavor_text_entries.find(e => e.language.name === 'en')
      )?.flavor_text?.replace(/[\f\n\r]/g, ' ') || ''
      const genus = (
        sp.genera?.find(g => g.language.name === 'es') ||
        sp.genera?.find(g => g.language.name === 'en')
      )?.genus || ''
      return { ...data, _flavorText: flavor, _genus: genus, _category: 'pokemon' }
    } catch { /**/ }
  }

  return { ...data, _category: categoryId }
}
