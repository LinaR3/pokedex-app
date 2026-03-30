import React, { useState, useEffect } from 'react'
import { useDebounce } from '../hooks/useDebounce'

/**
 * Search input with debounce — notifies the parent only after
 * the user stops typing for 400ms, avoiding per-keystroke filtering.
 *
 * @param {object}   props
 * @param {function} props.onSearch      - Called with the debounced query string
 * @param {number}   props.totalResults  - Count to display below the input
 * @param {boolean}  props.isSearching   - Shows a spinner while React processes the transition
 */
export default function SearchBar({ onSearch, totalResults, isSearching }) {
  const [query, setQuery]       = useState('')
  const debouncedQuery          = useDebounce(query, 400)

  useEffect(() => {
    onSearch(debouncedQuery)
  }, [debouncedQuery, onSearch])

  return (
    <div className="search-bar">
      <div className="search-input-wrap">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          type="text"
          placeholder="Buscar por nombre o #número..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar Pokémon"
        />
        {query && (
          <button
            className="search-clear"
            onClick={() => setQuery('')}
            aria-label="Limpiar búsqueda"
          >
            ✕
          </button>
        )}
      </div>

      {isSearching && <div className="search-spinner" aria-hidden="true" />}

      <div className="search-results" aria-live="polite">
        {totalResults} resultado{totalResults !== 1 ? 's' : ''}
      </div>
    </div>
  )
}