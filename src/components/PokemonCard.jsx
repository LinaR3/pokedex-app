import React from 'react'

export default function PokemonCard({ pokemon, isSelected, isFavorite, onClick, onFavorite }) {
  return (
    <div
      className={`pokemon-card ${isSelected ? 'selected' : ''} ${isFavorite ? 'favorite' : ''}`}
      onClick={onClick}
    >
      <div className="card-inner">
        <img
          className="card-sprite"
          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
          alt={pokemon.name}
          loading="lazy"
        />
        <div className="card-info">
          <span className="card-id pixel-text">#{String(pokemon.id).padStart(3, '0')}</span>
          <span className="card-name pixel-text">{pokemon.name.toUpperCase()}</span>
        </div>
        <button
          className={`fav-btn ${isFavorite ? 'active' : ''}`}
          onClick={e => { e.stopPropagation(); onFavorite(pokemon.id) }}
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        >
          {isFavorite ? '❤️' : '🤍'}
        </button>
      </div>
    </div>
  )
}
