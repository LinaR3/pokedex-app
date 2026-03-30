import React from 'react'
import { useStore } from '../store/StoreContext'
import { ACTIONS } from '../store/actions'
import { TYPE_COLORS, getPokemonSprite, CATEGORIES } from '../api/index'
import { capitalize, unknown, padId, favKey } from '../utils/format'
import EvolutionTree from './EvolutionTree'
import RadarChart from './RadarChart'

// ── Stat label abbreviations ──────────────────────────────────────────────────
const STAT_LABELS = {
  'hp':              'HP',
  'attack':          'ATK',
  'defense':         'DEF',
  'special-attack':  'SP.A',
  'special-defense': 'SP.D',
  'speed':           'SPD',
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TopScreen() {
  const { state, dispatch } = useStore()
  const { detail, selected, detailLoading, error, view, favorites, category } = state

  const isFavorite = selected
    ? favorites.some((f) => favKey(f.category, f.id) === favKey(category, selected.id))
    : false

  const toggleFavorite = () => {
    if (!selected) return
    dispatch({
      type:    ACTIONS.TOGGLE_FAV,
      payload: {
        id:     selected.id,
        name:   selected.name,
        category,
        sprite: category === 'pokemon' ? getPokemonSprite(selected.id) : null,
      },
    })
  }

  if (!detail && !detailLoading && view !== 'favorites') return <IdleScreen />
  if (view === 'favorites')  return <FavoritesScreen dispatch={dispatch} favorites={favorites} />
  if (detailLoading)         return <LoadingScreen />
  if (error)                 return <ErrorScreen message={error} />
  if (!detail)               return null

  const screenProps = { detail, isFavorite, onToggleFavorite: toggleFavorite, dispatch }

  if (detail._category === 'pokemon')         return <PokemonScreen    {...screenProps} />
  if (detail._category === 'pokemon-species') return <SpeciesScreen    {...screenProps} />
  if (detail._category === 'type')            return <TypeScreen       {...screenProps} />
  if (detail._category === 'version')         return <VersionScreen    {...screenProps} />

  return null
}

// ── Screen: Idle ──────────────────────────────────────────────────────────────
function IdleScreen() {
  return (
    <div className="sc sc-idle">
      <div className="idle-logo">POKéMON</div>
      <div className="idle-sub">Edición Azul</div>
      <div className="idle-hint">↑ ↓  Navegar &nbsp;·&nbsp; A = Favorito</div>
      <div className="idle-copy">© 1996-1999 GAME FREAK inc.</div>
    </div>
  )
}

// ── Screen: Loading ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="sc sc-loading">
      <div className="loader">
        <div className="l-t" /><div className="l-m" /><div className="l-b" />
      </div>
      <p className="loader-txt">Cargando datos...</p>
    </div>
  )
}

// ── Screen: Error ─────────────────────────────────────────────────────────────
function ErrorScreen({ message }) {
  return (
    <div className="sc sc-error">
      <p className="error-icon">⚠</p>
      <p className="error-msg">{message}</p>
    </div>
  )
}

// ── Screen: Favorites ─────────────────────────────────────────────────────────
function FavoritesScreen({ favorites, dispatch }) {
  const navigateToFavorite = (fav) => {
    const idx = CATEGORIES.findIndex((c) => c.id === fav.category)
    dispatch({ type: ACTIONS.SET_CATEGORY, id: fav.category, index: idx >= 0 ? idx : 0 })
    dispatch({ type: ACTIONS.SET_SELECTED, payload: fav })
  }

  return (
    <div className="sc sc-favs">
      <div className="fav-header">
        <span className="fav-title">❤ FAVORITOS</span>
        <span className="fav-badge">{favorites.length}</span>
      </div>

      {favorites.length === 0 && (
        <div className="fav-empty">Sin favoritos aún.<br />Presiona A en cualquier Pokémon.</div>
      )}

      <div className="fav-list">
        {favorites.map((fav) => (
          <div
            key={favKey(fav.category, fav.id)}
            className="fav-item"
            onClick={() => navigateToFavorite(fav)}
          >
            {fav.sprite
              ? <img src={fav.sprite} alt={fav.name} className="fav-item-img" />
              : <span className="fav-item-emoji">👾</span>
            }
            <div>
              <div className="fav-item-name">{fav.name.toUpperCase()}</div>
              <div className="fav-item-cat">{fav.category}</div>
            </div>
            <button
              className="fav-item-del"
              onClick={(e) => {
                e.stopPropagation()
                dispatch({ type: ACTIONS.REMOVE_FAV, id: fav.id, category: fav.category })
              }}
              aria-label={`Eliminar ${fav.name} de favoritos`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Screen: Pokémon ───────────────────────────────────────────────────────────
function PokemonScreen({ detail, isFavorite, onToggleFavorite, dispatch }) {
  const stats = detail.stats.slice(0, 6).map((s) => ({
    name:  s.stat.name,
    value: s.base_stat,
  }))

  return (
    <div className="sc sc-poke">
      <div className="pk-header">
        <span className="pk-num">#{padId(detail.id)}</span>
        <span className="pk-name">{detail.name.toUpperCase()}</span>
        <div className="pk-types">
          {detail.types.map((t) => (
            <TypeBadge key={t.type.name} type={t.type.name} />
          ))}
        </div>
        <FavButton isFavorite={isFavorite} onToggle={onToggleFavorite} />
      </div>

      <div className="pk-body">
        <div className="pk-left">
          <SpriteWithFallback
            key={detail.id}
            id={detail.id}
            fallback={detail.sprites?.front_default}
            name={detail.name}
          />
          {detail._genus && <div className="pk-genus">{detail._genus}</div>}
          <div className="pk-hw">
            {(detail.height * 0.1).toFixed(1)}m · {(detail.weight * 0.1).toFixed(1)}kg
          </div>
        </div>

        <div className="pk-stats">
          <RadarChart stats={stats} size={150} color="#3b82f6" animated />
          <div className="pk-abilities">
            {detail.abilities.map((a) => capitalize(a.ability.name)).join(' · ')}
          </div>
        </div>
      </div>

      {detail._evolutionChain?.chain && (
        <EvolutionTree
          chain={detail._evolutionChain.chain}
          currentId={String(detail.id)}
          onSelect={(item) => dispatch({ type: ACTIONS.SET_SELECTED, payload: item })}
        />
      )}

      {detail._flavorText && (
        <div className="pk-flavor"><p>{detail._flavorText}</p></div>
      )}
    </div>
  )
}

// ── Screen: Species ───────────────────────────────────────────────────────────
function SpeciesScreen({ detail, isFavorite, onToggleFavorite }) {
  const flavorText = (
    detail.flavor_text_entries?.find((e) => e.language.name === 'es') ||
    detail.flavor_text_entries?.find((e) => e.language.name === 'en')
  )?.flavor_text?.replace(/[\f\n\r]/g, ' ')

  const genus  = (
    detail.genera?.find((g) => g.language.name === 'es') ||
    detail.genera?.find((g) => g.language.name === 'en')
  )?.genus

  const nameEs = detail.names?.find((n) => n.language.name === 'es')?.name || detail.name

  return (
    <div className="sc sc-species">
      <div className="sp-header">
        <span className="sp-num">#{padId(detail.id)}</span>
        <span className="sp-name">{nameEs.toUpperCase()}</span>
        <FavButton isFavorite={isFavorite} onToggle={onToggleFavorite} />
      </div>

      <div className="sp-body">
        <img
          key={detail.id}
          className="sp-artwork anim-bounce"
          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${detail.id}.png`}
          alt={detail.name}
        />
        <div className="sp-details">
          {genus && <div className="sp-genus">"{genus}"</div>}
          <div className="sp-grid">
            <InfoTag label="COLOR"     value={capitalize(detail.color?.name)} />
            <InfoTag label="HÁBITAT"   value={capitalize(unknown(detail.habitat?.name))} />
            <InfoTag label="FORMA"     value={detail.shape ? capitalize(detail.shape.name) : '???'} />
            <InfoTag label="FELICIDAD" value={detail.base_happiness ?? '???'} />
          </div>
          <div className="sp-flags">
            {detail.is_legendary && <span className="flag f-legend">⭐ LEGENDARIO</span>}
            {detail.is_mythical  && <span className="flag f-mythic">✨ MÍTICO</span>}
            {detail.is_baby      && <span className="flag f-baby">🍼 BEBÉ</span>}
          </div>
        </div>
      </div>

      {flavorText && <div className="sp-flavor"><p>{flavorText}</p></div>}
    </div>
  )
}

// ── Screen: Type ──────────────────────────────────────────────────────────────
function TypeScreen({ detail, isFavorite, onToggleFavorite }) {
  const dmg   = detail.damage_relations
  const color = TYPE_COLORS[detail.name] || '#888'

  return (
    <div className="sc sc-type">
      <div className="tp-header">
        <span className="tp-badge" style={{ background: color }}>
          {detail.name.toUpperCase()}
        </span>
        <span className="tp-sub">TIPO · {detail.pokemon?.length ?? 0} Pokémon</span>
        <FavButton isFavorite={isFavorite} onToggle={onToggleFavorite} />
      </div>

      <div className="tp-chart">
        <TypeRelationRow label="✅ Fuerte contra"  types={dmg?.double_damage_to}   color="#66BB6A" />
        <TypeRelationRow label="💪 Débil contra"   types={dmg?.half_damage_to}     color="#FF7043" />
        <TypeRelationRow label="⬆ Recibe 2x daño"  types={dmg?.double_damage_from} color="#FF7043" />
        <TypeRelationRow label="⬇ Recibe 0.5x"     types={dmg?.half_damage_from}   color="#4FC3F7" />
        <TypeRelationRow label="🚫 Sin efecto en"   types={dmg?.no_damage_to}       color="#999" />
      </div>
    </div>
  )
}

// ── Screen: Version ───────────────────────────────────────────────────────────
function VersionScreen({ detail, isFavorite, onToggleFavorite }) {
  const name =
    detail.names?.find((n) => n.language.name === 'es')?.name ||
    detail.names?.find((n) => n.language.name === 'en')?.name ||
    capitalize(detail.name)

  return (
    <div className="sc sc-version">
      <div className="vr-header">
        <span className="vr-icon">🎮</span>
        <div>
          <div className="vr-name">{name.toUpperCase()}</div>
          <div className="vr-group">{capitalize(detail.version_group?.name)}</div>
        </div>
        <FavButton isFavorite={isFavorite} onToggle={onToggleFavorite} />
      </div>
      <div className="vr-body">
        <p className="vr-desc">Una de las ediciones clásicas de la saga Pokémon.</p>
      </div>
    </div>
  )
}

// ── Reusable micro-components ─────────────────────────────────────────────────

/** Pokémon sprite with GIF → static fallback on error. */
function SpriteWithFallback({ id, fallback, name }) {
  const gifUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`
  const [src, setSrc]             = React.useState(gifUrl)
  const [usedFallback, setUsed]   = React.useState(false)

  const handleError = () => {
    if (!usedFallback) {
      setUsed(true)
      setSrc(fallback || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`)
    }
  }

  return (
    <img
      className="pk-sprite anim-bounce"
      src={src}
      onError={handleError}
      alt={name}
    />
  )
}

function TypeBadge({ type, small = false }) {
  return (
    <span
      className={`type-badge${small ? ' sm' : ''}`}
      style={{ background: TYPE_COLORS[type] || '#888' }}
    >
      {type.toUpperCase()}
    </span>
  )
}

function FavButton({ isFavorite, onToggle }) {
  return (
    <button
      className={`fav-sc-btn ${isFavorite ? 'on' : ''}`}
      onClick={onToggle}
      aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
    >
      {isFavorite ? '❤' : '♡'}
    </button>
  )
}

function InfoTag({ label, value }) {
  return (
    <div className="info-tag">
      <div className="info-tag-l">{label}</div>
      <div className="info-tag-v">{String(value)}</div>
    </div>
  )
}

function TypeRelationRow({ label, types, color }) {
  if (!types?.length) return null
  return (
    <div className="tp-rel-row">
      <span className="tp-rel-lbl" style={{ color }}>{label}</span>
      <div className="tp-rel-pills">
        {types.map((t) => (
          <TypeBadge key={t.name} type={t.name} small />
        ))}
      </div>
    </div>
  )
}