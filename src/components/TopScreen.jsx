import React from 'react'
import { useStore } from '../store/StoreContext'
import { TYPE_COLORS, getPokemonSprite, CATEGORIES } from '../api/index'
import EvolutionTree from './EvolutionTree'
import RadarChart from './RadarChart'

const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ') : ''
const unk = v => (!v || v === 'unknown' || v === 'n/a') ? '???' : v

export default function TopScreen() {
  const { state, dispatch } = useStore()
  const { detail, selected, detailLoading, error, view, favorites, category } = state

  const isFav = selected
    ? favorites.some(f => f.id === selected.id && f.category === category)
    : false

  const toggleFav = () => {
    if (!selected) return
    dispatch({
      type: 'TOGGLE_FAV',
      payload: {
        id: selected.id, name: selected.name, category,
        sprite: category === 'pokemon' ? getPokemonSprite(selected.id) : null,
      },
    })
  }

  /* ── IDLE ── */
  if (!detail && !detailLoading && view !== 'favorites') {
    return (
      <div className="sc sc-idle">
        <div className="idle-logo">POKéMON</div>
        <div className="idle-sub">Edición Azul</div>
        <div className="idle-hint">↑ ↓  Navegar &nbsp;·&nbsp; A = Favorito</div>
        <div className="idle-copy">© 1996-1999 GAME FREAK inc.</div>
      </div>
    )
  }

  /* ── FAVORITES ── */
  if (view === 'favorites') {
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
          {favorites.map(f => (
            <div
              key={`${f.category}-${f.id}`}
              className="fav-item"
              onClick={() => {
                const idx = CATEGORIES.findIndex(c => c.id === f.category)
                dispatch({ type: 'SET_CATEGORY', id: f.category, index: idx >= 0 ? idx : 0 })
                dispatch({ type: 'SET_SELECTED', payload: f })
              }}
            >
              {f.sprite
                ? <img src={f.sprite} alt={f.name} className="fav-item-img" />
                : <span className="fav-item-emoji">👾</span>
              }
              <div>
                <div className="fav-item-name">{f.name.toUpperCase()}</div>
                <div className="fav-item-cat">{f.category}</div>
              </div>
              <button
                className="fav-item-del"
                onClick={e => {
                  e.stopPropagation()
                  dispatch({ type: 'REMOVE_FAV', id: f.id, category: f.category })
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  /* ── LOADING ── */
  if (detailLoading) {
    return (
      <div className="sc sc-loading">
        <div className="loader">
          <div className="l-t" /><div className="l-m" /><div className="l-b" />
        </div>
        <p className="loader-txt">Cargando datos...</p>
      </div>
    )
  }

  /* ── ERROR ── */
  if (error) {
    return (
      <div className="sc sc-error">
        <p className="error-icon">⚠</p>
        <p className="error-msg">{error}</p>
      </div>
    )
  }

  if (!detail) return null

  /* ══════════════ POKÉMON ══════════════ */
  if (detail._category === 'pokemon') {
    return (
      <div className="sc sc-poke">

        <div className="pk-header">
          <span className="pk-num">#{String(detail.id).padStart(3, '0')}</span>
          <span className="pk-name">{detail.name.toUpperCase()}</span>
          <div className="pk-types">
            {detail.types.map(t => (
              <span
                key={t.type.name}
                className="type-badge"
                style={{ background: TYPE_COLORS[t.type.name] || '#888' }}
              >
                {t.type.name.toUpperCase()}
              </span>
            ))}
          </div>
          <button className={`fav-sc-btn ${isFav ? 'on' : ''}`} onClick={toggleFav}>
            {isFav ? '❤' : '♡'}
          </button>
        </div>

        <div className="pk-body">
          <div className="pk-left">
            {/* FIX #4: SpriteWithFallback sin useEffect redundante */}
            <SpriteWithFallback
              key={detail.id}
              numId={detail.id}
              fallback={detail.sprites?.front_default}
              name={detail.name}
            />
            {detail._genus && <div className="pk-genus">{detail._genus}</div>}
            <div className="pk-hw">
              {(detail.height * 0.1).toFixed(1)}m · {(detail.weight * 0.1).toFixed(1)}kg
            </div>
          </div>

          {/* Radar chart en lugar de barras planas */}
          <div className="pk-stats">
            <RadarChart
              stats={detail.stats.slice(0, 6).map(s => ({
                name: s.stat.name,
                value: s.base_stat,
              }))}
              size={150}
              color="#3b82f6"
              animated
            />
            <div className="pk-abilities">
              {detail.abilities.map(a => cap(a.ability.name)).join(' · ')}
            </div>
          </div>
        </div>

        {/* Cadena evolutiva */}
        {detail._evolutionChain?.chain && (
          <EvolutionTree
            chain={detail._evolutionChain.chain}
            currentId={String(detail.id)}
            onSelect={item => dispatch({ type: 'SET_SELECTED', payload: item })}
          />
        )}

        {detail._flavorText && (
          <div className="pk-flavor"><p>{detail._flavorText}</p></div>
        )}
      </div>
    )
  }

  /* ══════════════ PERSONAJES (species) ══════════════ */
  if (detail._category === 'pokemon-species') {
    const flavorText = (
      detail.flavor_text_entries?.find(e => e.language.name === 'es') ||
      detail.flavor_text_entries?.find(e => e.language.name === 'en')
    )?.flavor_text?.replace(/[\f\n\r]/g, ' ')

    const genus = (
      detail.genera?.find(g => g.language.name === 'es') ||
      detail.genera?.find(g => g.language.name === 'en')
    )?.genus

    const nameEs = detail.names?.find(n => n.language.name === 'es')?.name || detail.name

    return (
      <div className="sc sc-species">
        <div className="sp-header">
          <span className="sp-num">#{String(detail.id).padStart(3, '0')}</span>
          <span className="sp-name">{nameEs.toUpperCase()}</span>
          <button className={`fav-sc-btn ${isFav ? 'on' : ''}`} onClick={toggleFav}>
            {isFav ? '❤' : '♡'}
          </button>
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
              <InfoTag label="COLOR"     value={cap(detail.color?.name)} />
              <InfoTag label="HÁBITAT"   value={cap(unk(detail.habitat?.name))} />
              <InfoTag label="FORMA"     value={detail.shape ? cap(detail.shape.name) : '???'} />
              <InfoTag label="FELICIDAD" value={detail.base_happiness ?? '???'} />
            </div>
            <div className="sp-flags">
              {detail.is_legendary && <span className="flag f-legend">⭐ LEGENDARIO</span>}
              {detail.is_mythical  && <span className="flag f-mythic">✨ MÍTICO</span>}
              {detail.is_baby      && <span className="flag f-baby">🍼 BEBÉ</span>}
            </div>
          </div>
        </div>

        {flavorText && (
          <div className="sp-flavor"><p>{flavorText}</p></div>
        )}
      </div>
    )
  }

  /* ══════════════ TIPOS ══════════════ */
  if (detail._category === 'type') {
    const dmg   = detail.damage_relations
    const color = TYPE_COLORS[detail.name] || '#888'
    return (
      <div className="sc sc-type">
        <div className="tp-header">
          <span className="tp-badge" style={{ background: color }}>
            {detail.name.toUpperCase()}
          </span>
          <span className="tp-sub">TIPO · {detail.pokemon?.length ?? 0} Pokémon</span>
          <button className={`fav-sc-btn ${isFav ? 'on' : ''}`} onClick={toggleFav}>
            {isFav ? '❤' : '♡'}
          </button>
        </div>

        <div className="tp-chart">
          <TypeRow label="✅ Fuerte contra"  types={dmg?.double_damage_to}   clr="#66BB6A" />
          <TypeRow label="💪 Débil contra"   types={dmg?.half_damage_to}     clr="#FF7043" />
          <TypeRow label="⬆ Recibe 2x daño"  types={dmg?.double_damage_from} clr="#FF7043" />
          <TypeRow label="⬇ Recibe 0.5x"     types={dmg?.half_damage_from}   clr="#4FC3F7" />
          <TypeRow label="🚫 Sin efecto en"   types={dmg?.no_damage_to}       clr="#999" />
        </div>
      </div>
    )
  }

  /* ══════════════ VERSIONES ══════════════ */
  if (detail._category === 'version') {
    const nameEs =
      detail.names?.find(n => n.language.name === 'es')?.name ||
      detail.names?.find(n => n.language.name === 'en')?.name ||
      cap(detail.name)

    return (
      <div className="sc sc-version">
        <div className="vr-header">
          <span className="vr-icon">🎮</span>
          <div>
            <div className="vr-name">{nameEs.toUpperCase()}</div>
            <div className="vr-group">{cap(detail.version_group?.name)}</div>
          </div>
          <button className={`fav-sc-btn ${isFav ? 'on' : ''}`} onClick={toggleFav}>
            {isFav ? '❤' : '♡'}
          </button>
        </div>
        <div className="vr-body">
          <p className="vr-desc">Una de las ediciones clásicas de la saga Pokémon.</p>
        </div>
      </div>
    )
  }

  return null
}

/* ════════════════════════════════════════
   FIX #4: SpriteWithFallback sin useEffect
   El key={detail.id} en el padre ya fuerza
   remount — el effect era redundante y causaba
   double-load en race condition.
════════════════════════════════════════ */
function SpriteWithFallback({ numId, fallback, name }) {
  const gifUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${numId}.gif`

  const [src, setSrc]                   = React.useState(gifUrl)
  const [triedFallback, setTriedFallback] = React.useState(false)

  const handleError = () => {
    if (!triedFallback) {
      setTriedFallback(true)
      setSrc(fallback || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${numId}.png`)
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

/* ── Sub-components ── */
function InfoTag({ label, value }) {
  return (
    <div className="info-tag">
      <div className="info-tag-l">{label}</div>
      <div className="info-tag-v">{String(value)}</div>
    </div>
  )
}

function TypeRow({ label, types, clr }) {
  if (!types?.length) return null
  return (
    <div className="tp-rel-row">
      <span className="tp-rel-lbl" style={{ color: clr }}>{label}</span>
      <div className="tp-rel-pills">
        {types.map(t => (
          <span
            key={t.name}
            className="type-badge sm"
            style={{ background: TYPE_COLORS[t.name] || '#888' }}
          >
            {t.name.toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  )
}