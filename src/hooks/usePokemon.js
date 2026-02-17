import { useState, useEffect, useCallback } from 'react'

const POKEAPI_BASE = 'https://pokeapi.co/api/v2'
const TOTAL_POKEMON = 151 // Gen 1 only (Azul edition!)

export function usePokemon() {
  const [pokemonList, setPokemonList] = useState([])
  const [selectedPokemon, setSelectedPokemon] = useState(null)
  const [loading, setLoading] = useState(false)
  const [listLoading, setListLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('pokedex-favorites')
    return saved ? JSON.parse(saved) : []
  })
  const [dayMode, setDayMode] = useState(true)

  // Load Gen 1 list on mount
  useEffect(() => {
    const fetchList = async () => {
      try {
        setListLoading(true)
        const res = await fetch(`${POKEAPI_BASE}/pokemon?limit=${TOTAL_POKEMON}&offset=0`)
        const data = await res.json()
        const list = data.results.map((p, i) => ({
          id: i + 1,
          name: p.name,
          url: p.url,
        }))
        setPokemonList(list)
        // Auto-load first pokemon
        fetchPokemonDetail(1)
      } catch (err) {
        setError('Error cargando la lista de Pokémon')
      } finally {
        setListLoading(false)
      }
    }
    fetchList()
  }, [])

  const fetchPokemonDetail = useCallback(async (idOrName) => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`${POKEAPI_BASE}/pokemon/${idOrName}`)
      if (!res.ok) throw new Error('Pokémon no encontrado')
      const data = await res.json()

      // Fetch species for flavor text
      const speciesRes = await fetch(data.species.url)
      const speciesData = await speciesRes.json()
      const flavorEntry = speciesData.flavor_text_entries.find(
        e => e.language.name === 'es'
      ) || speciesData.flavor_text_entries.find(
        e => e.language.name === 'en'
      )

      const pokemon = {
        id: data.id,
        name: data.name,
        height: data.height,
        weight: data.weight,
        types: data.types.map(t => t.type.name),
        stats: data.stats.map(s => ({ name: s.stat.name, value: s.base_stat })),
        sprite: data.sprites.front_default,
        spriteShiny: data.sprites.front_shiny,
        spriteBack: data.sprites.back_default,
        artworkUrl: data.sprites.other['official-artwork'].front_default,
        animated:
          data.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default ||
          data.sprites.front_default,
        abilities: data.abilities.map(a => a.ability.name),
        flavorText: flavorEntry?.flavor_text?.replace(/\f/g, ' ') || 'Datos no disponibles.',
        genus: speciesData.genera.find(g => g.language.name === 'es')?.genus ||
               speciesData.genera.find(g => g.language.name === 'en')?.genus || '',
        color: speciesData.color.name,
        baseExperience: data.base_experience,
      }

      setSelectedPokemon(pokemon)
      setCurrentIndex(pokemon.id - 1)
    } catch (err) {
      setError(err.message || 'Error al cargar el Pokémon')
    } finally {
      setLoading(false)
    }
  }, [])

  const navigatePokemon = useCallback((direction) => {
    const newIndex = currentIndex + direction
    if (newIndex >= 0 && newIndex < TOTAL_POKEMON) {
      fetchPokemonDetail(newIndex + 1)
    }
  }, [currentIndex, fetchPokemonDetail])

  const toggleFavorite = useCallback((id) => {
    setFavorites(prev => {
      const newFavs = prev.includes(id)
        ? prev.filter(f => f !== id)
        : [...prev, id]
      localStorage.setItem('pokedex-favorites', JSON.stringify(newFavs))
      return newFavs
    })
  }, [])

  const filteredList = pokemonList.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(p.id).padStart(3, '0').includes(searchQuery)
  )

  return {
    pokemonList,
    filteredList,
    selectedPokemon,
    loading,
    listLoading,
    error,
    currentIndex,
    searchQuery,
    setSearchQuery,
    favorites,
    toggleFavorite,
    dayMode,
    setDayMode,
    fetchPokemonDetail,
    navigatePokemon,
    totalPokemon: TOTAL_POKEMON,
  }
}
