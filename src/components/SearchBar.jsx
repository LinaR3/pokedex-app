import React, { useState, useEffect } from 'react'

/* ════════════════════════════════════════
   MEJORA #1: Debounce Hook
   Espera 400ms antes de buscar
════════════════════════════════════════ */
function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

export default function SearchBar({ onSearch, totalResults, isSearching }) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 400)

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
          onChange={e => setQuery(e.target.value)}
        />
        {query && (
          <button className="search-clear" onClick={() => setQuery('')}>✕</button>
        )}
      </div>
      {isSearching && <div className="search-spinner" />}
      <div className="search-results">
        {totalResults} resultado{totalResults !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
