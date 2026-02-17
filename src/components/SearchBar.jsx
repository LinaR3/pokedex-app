import React from 'react'

export default function SearchBar({ query, onChange, total, current }) {
  return (
    <div className="search-container">
      <div className="search-input-wrap">
        <span className="search-icon pixel-text">🔍</span>
        <input
          className="search-input pixel-text"
          type="text"
          placeholder="Buscar..."
          value={query}
          onChange={e => onChange(e.target.value)}
          aria-label="Buscar Pokémon"
        />
        {query && (
          <button className="search-clear pixel-text" onClick={() => onChange('')}>✕</button>
        )}
      </div>
      <div className="search-counter pixel-text">
        <span>{String(current + 1).padStart(3, '0')}</span>
        <span>/</span>
        <span>{total}</span>
      </div>
    </div>
  )
}
