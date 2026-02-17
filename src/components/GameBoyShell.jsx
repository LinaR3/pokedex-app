import React, { useRef } from 'react'
import Screen from './Screen'
import Dpad from './Dpad'
import SearchBar from './SearchBar'
import PokemonCard from './PokemonCard'

const POKEBALL_COUNT = 8

export default function GameBoyShell({
  pokemon,
  pokemonList,
  filteredList,
  loading,
  error,
  dayMode,
  setDayMode,
  currentIndex,
  searchQuery,
  setSearchQuery,
  favorites,
  toggleFavorite,
  fetchPokemonDetail,
  navigatePokemon,
  totalPokemon,
}) {
  const listRef = useRef(null)

  const pokeballs = Array.from({ length: POKEBALL_COUNT }, (_, i) => i)

  return (
    <div className={`gameboy-shell ${dayMode ? 'day' : 'night'}`}>
      {/* ══════════════ TOP HALF ══════════════ */}
      <div className="gba-top">
        {/* Decorative pokéballs row */}
        <div className="pokeball-row top-balls">
          {pokeballs.map(i => (
            <div key={i} className="pokeball-deco" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="pball-top" />
              <div className="pball-mid" />
              <div className="pball-bot" />
            </div>
          ))}
        </div>

        {/* AZUL logo */}
        <div className="azul-logo pixel-text">AZUL</div>

        {/* Side panels */}
        <div className="side-panel left-panel">
          <div className="led-green" />
          <div className="led-blue" />
          <div className="moon-icon">🌙</div>
          <label className="day-night-toggle" title="Day/Night Mode">
            <span className="pixel-text tiny">Day/Night</span>
            <div className={`toggle-switch ${dayMode ? '' : 'on'}`} onClick={() => setDayMode(!dayMode)}>
              <div className="toggle-knob" />
            </div>
          </label>
        </div>

        {/* Main screen */}
        <div className="screen-frame">
          <Screen pokemon={pokemon} loading={loading} error={error} dayMode={dayMode} />
        </div>

        {/* Right panel - A/B buttons */}
        <div className="side-panel right-panel">
          <button
            className="gba-btn btn-a pixel-text"
            onClick={() => pokemon && toggleFavorite(pokemon.id)}
            title="Favorito"
          >A</button>
          <button
            className="gba-btn btn-b pixel-text"
            onClick={() => navigatePokemon(-1)}
            title="Anterior"
          >B</button>
        </div>

        {/* Bottom pokéballs row */}
        <div className="pokeball-row bottom-balls">
          {pokeballs.map(i => (
            <div key={i} className="pokeball-deco small" style={{ animationDelay: `${i * 0.12}s` }}>
              <div className="pball-top" />
              <div className="pball-mid" />
              <div className="pball-bot" />
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════ HINGE ══════════════ */}
      <div className="gba-hinge">
        <div className="hinge-dot" />
        <div className="hinge-dot" />
        <div className="hinge-dot" />
      </div>

      {/* ══════════════ BOTTOM HALF ══════════════ */}
      <div className="gba-bottom">
        <div className="bottom-grid">
          {/* D-Pad area */}
          <div className="bottom-left">
            <Dpad onNavigate={navigatePokemon} />

            {/* Selected Pokémon mini display */}
            {pokemon && (
              <div className="selected-mini">
                <img
                  src={pokemon.sprite}
                  alt={pokemon.name}
                  className="mini-sprite"
                />
                <div>
                  <div className="pixel-text small">#{String(pokemon.id).padStart(3, '0')}</div>
                  <div className="pixel-text tiny">{pokemon.name.toUpperCase()}</div>
                </div>
                <button
                  className="mini-fav"
                  onClick={() => toggleFavorite(pokemon.id)}
                >
                  {favorites.includes(pokemon.id) ? '❤️' : '🤍'}
                </button>
              </div>
            )}
          </div>

          {/* Pokémon list */}
          <div className="bottom-right">
            <SearchBar
              query={searchQuery}
              onChange={setSearchQuery}
              total={totalPokemon}
              current={currentIndex}
            />
            <div className="pokemon-list" ref={listRef}>
              {filteredList.map(p => (
                <PokemonCard
                  key={p.id}
                  pokemon={p}
                  isSelected={pokemon?.id === p.id}
                  isFavorite={favorites.includes(p.id)}
                  onClick={() => fetchPokemonDetail(p.id)}
                  onFavorite={toggleFavorite}
                />
              ))}
              {filteredList.length === 0 && (
                <div className="no-results pixel-text">Sin resultados...</div>
              )}
            </div>
          </div>
        </div>

        {/* Start/Select */}
        <div className="bottom-controls">
          <button className="sys-btn pixel-text tiny" onClick={() => setSearchQuery('')}>START</button>
          <button className="sys-btn pixel-text tiny" onClick={() => fetchPokemonDetail(Math.ceil(Math.random() * 151))}>SELECT</button>
          <div className="speaker">
            {Array.from({ length: 6 }, (_, i) => <div key={i} className="speaker-hole" />)}
          </div>
        </div>
      </div>
    </div>
  )
}
