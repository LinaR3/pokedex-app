import React, { useState, useEffect } from 'react'

const TYPE_COLORS = {
  fire: '#FF6B35',
  water: '#4FC3F7',
  grass: '#66BB6A',
  electric: '#FFEE58',
  psychic: '#EC407A',
  ice: '#80DEEA',
  dragon: '#7E57C2',
  dark: '#546E7A',
  fairy: '#F48FB1',
  normal: '#A5B4BC',
  fighting: '#FF7043',
  flying: '#90CAF9',
  poison: '#AB47BC',
  ground: '#D4A054',
  rock: '#9E9E9E',
  bug: '#9CCC65',
  ghost: '#5C6BC0',
  steel: '#B0BEC5',
  unknown: '#78909C',
  shadow: '#37474F',
}

export default function Screen({ pokemon, loading, error, dayMode }) {
  const [showShiny, setShowShiny] = useState(false)
  const [bounce, setBounce] = useState(false)

  useEffect(() => {
    if (pokemon) {
      setBounce(true)
      const t = setTimeout(() => setBounce(false), 600)
      return () => clearTimeout(t)
    }
  }, [pokemon?.id])

  return (
    <div className={`gba-screen ${dayMode ? 'day' : 'night'}`}>
      {/* Screen scanlines effect */}
      <div className="scanlines" />

      {loading && (
        <div className="screen-loading">
          <div className="pokeball-spin">
            <div className="pokeball-icon">⬤</div>
          </div>
          <p className="pixel-text">Cargando...</p>
        </div>
      )}

      {error && !loading && (
        <div className="screen-error">
          <p className="pixel-text">⚠️ {error}</p>
        </div>
      )}

      {pokemon && !loading && (
        <div className="screen-content">
          {/* Top bar */}
          <div className="screen-topbar">
            <span className="pixel-text small">#{String(pokemon.id).padStart(3, '0')}</span>
            <span className="pixel-text small pokemon-name-screen">{pokemon.name.toUpperCase()}</span>
            <div className="type-badges">
              {pokemon.types.map(type => (
                <span
                  key={type}
                  className="type-badge pixel-text"
                  style={{ background: TYPE_COLORS[type] || '#78909C' }}
                >
                  {type.toUpperCase()}
                </span>
              ))}
            </div>
          </div>

          {/* Pokémon sprite area */}
          <div className="sprite-area">
            <div
              className={`sprite-container ${bounce ? 'bounce' : ''}`}
              onClick={() => setShowShiny(!showShiny)}
              title="Click para ver shiny"
            >
              <img
                className="pokemon-sprite"
                src={showShiny ? pokemon.spriteShiny : pokemon.animated || pokemon.sprite}
                alt={pokemon.name}
              />
              {showShiny && <span className="shiny-badge pixel-text">✨ SHINY</span>}
            </div>

            {/* Stats bars */}
            <div className="stats-panel">
              {pokemon.stats.slice(0, 4).map(stat => (
                <div key={stat.name} className="stat-row">
                  <span className="stat-name pixel-text">{stat.name.replace('special-', 'sp.').replace('-', ' ').slice(0, 6).toUpperCase()}</span>
                  <div className="stat-bar-bg">
                    <div
                      className="stat-bar-fill"
                      style={{
                        width: `${Math.min((stat.value / 255) * 100, 100)}%`,
                        background: stat.value > 100 ? '#4FC3F7' : stat.value > 60 ? '#66BB6A' : '#FF6B35'
                      }}
                    />
                  </div>
                  <span className="stat-value pixel-text">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Flavor text */}
          <div className="flavor-text-area">
            <p className="flavor-text pixel-text">{pokemon.flavorText}</p>
          </div>
        </div>
      )}

      {!pokemon && !loading && !error && (
        <div className="screen-idle">
          <p className="pixel-text">POKÉMON</p>
          <p className="pixel-text small">Edición Azul</p>
          <p className="pixel-text tiny">© 1996-1999 GAME FREAK</p>
        </div>
      )}
    </div>
  )
}
