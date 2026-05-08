import React, { useEffect, useRef, useState, useMemo, useTransition } from 'react'
import { useStore } from '../store/StoreContext'
import { ACTIONS } from '../store/actions'
import { fetchList, fetchDetail, searchInList, prefetchNext, CATEGORIES, getPokemonSprite } from '../api/index'
import { useNavigation } from '../hooks/useNavigation'
import { useKeyboard } from '../hooks/useKeyboard'
import { useRateLimit } from '../hooks/useRateLimit'
import { useSwipe } from '../hooks/useSwipe'
import { favKey } from '../utils/format'
import TopScreen from './TopScreen'
import SearchBar from './SearchBar'
import ErrorBoundary from './ErrorBoundary'

export default function GameBoy() {
  const { state, dispatch } = useStore()
  const { category, categoryIndex, list, selected, listLoading, view, favorites } = state

  const [searchQuery, setSearchQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const { percentage, remaining, trackRequest } = useRateLimit()

  const activeRef = useRef(null)
  const shellRef = useRef(null)

  const filteredList = useMemo(
    () => searchInList(list, searchQuery),
    [list, searchQuery]
  )

  const {
    selectItem,
    navigate,
    changeCategory,
    handleFavorite,
    handleBack,
    handleToggleFavorites,
    handleRandom,
  } = useNavigation(filteredList)

  useKeyboard({
    onUp: () => navigate(-1),
    onDown: () => navigate(1),
    onLeft: () => changeCategory(-1),
    onRight: () => changeCategory(1),
    onA: handleFavorite,
    onB: handleBack,
    onStart: handleToggleFavorites,
  })

  useSwipe(shellRef, {
    onSwipeLeft: () => changeCategory(1),
    onSwipeRight: () => changeCategory(-1),
    onSwipeUp: () => navigate(1),
    onSwipeDown: () => navigate(-1),
    threshold: 60,
  })

  // Load list when category changes
  useEffect(() => {
    let cancelled = false
      ; (async () => {
        try {
          dispatch({ type: ACTIONS.LIST_LOADING })
          const items = await fetchList(category)
          trackRequest()
          if (!cancelled) dispatch({ type: ACTIONS.SET_LIST, payload: items })
        } catch (error) {
          if (!cancelled) dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
        }
      })()
    return () => { cancelled = true }
  }, [category, dispatch, trackRequest])

  // Load detail when selected item changes
  useEffect(() => {
    if (!selected) return
    let cancelled = false
      ; (async () => {
        try {
          dispatch({ type: ACTIONS.DETAIL_LOADING })
          const data = await fetchDetail(category, selected.id)
          trackRequest()
          if (!cancelled) {
            dispatch({ type: ACTIONS.SET_DETAIL, payload: data })
            prefetchNext(category, list, selected.id)
          }
        } catch (error) {
          if (!cancelled) dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
        }
      })()
    return () => { cancelled = true }
  }, [selected?.id, category, list, dispatch, trackRequest])

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selected?.id])

  const handleSearch = (query) => startTransition(() => setSearchQuery(query))

  const currentCategory = CATEGORIES[categoryIndex]
  const isSelectedFavorite = selected
    ? favorites.some((f) => favKey(f.category, f.id) === favKey(category, selected.id))
    : false

  return (
    <div className="shell" ref={shellRef}>
      <TopHalf
        categoryIndex={categoryIndex}
        onFavorite={handleFavorite}
        onBack={handleBack}
      />

      <BottomHalf
        filteredList={filteredList}
        selected={selected}
        favorites={favorites}
        category={category}
        currentCategory={currentCategory}
        listLoading={listLoading}
        view={view}
        isSelectedFavorite={isSelectedFavorite}
        rateLimitPercentage={percentage}
        rateLimitRemaining={remaining}
        activeRef={activeRef}
        isPending={isPending}
        onSearch={handleSearch}
        onNavigate={navigate}
        onChangeCategory={changeCategory}
        onSelectItem={selectItem}
        onFavorite={handleFavorite}
        onBack={handleBack}
        onToggleFavorites={handleToggleFavorites}
        onRandom={handleRandom}
        dispatch={dispatch}
      />
    </div>
  )
}

// ── Top half — screen + decorations ─────────────────────────────────────────
function TopHalf({ categoryIndex, onFavorite, onBack }) {
  return (
    <div className="top-half">
      <DecoRow />

      <div className="screen-zone">
        <SidePanel pokemon={4} name="Charmander" size={60} />

        <div className="screen-outer">
          <div className="screen-inner">
            <div className="scanlines" />
            <ErrorBoundary>
              <TopScreen />
            </ErrorBoundary>
          </div>
        </div>

        <SidePanel pokemon={9} name="Blastoise" size={40} side="right">
          <button className="ab-btn a-btn" onClick={onFavorite} title="A = Favorito">A</button>
          <button className="ab-btn b-btn" onClick={onBack} title="B = Volver">B</button>
        </SidePanel>
      </div>

      <PokeballRow count={2} />
    </div>
  )
}

// ── Bottom half — controls + list ────────────────────────────────────────────
function BottomHalf({
  filteredList, selected, favorites, category, currentCategory,
  listLoading, view, isSelectedFavorite, rateLimitPercentage, rateLimitRemaining,
  activeRef, isPending, onSearch, onNavigate, onChangeCategory, onSelectItem,
  onFavorite, onBack, onToggleFavorites, onRandom, dispatch,
}) {
  return (
    <div className="bot-half">
      <div className="bot-grid">

        <div className="bot-left">
          <DPad
            onUp={() => onNavigate(-1)}
            onDown={() => onNavigate(1)}
            onLeft={() => onChangeCategory(-1)}
            onRight={() => onChangeCategory(1)}
          />
          <MiniCard
            selected={selected}
            category={category}
            currentCategory={currentCategory}
            isFavorite={isSelectedFavorite}
            onFavorite={onFavorite}
          />
        </div>

        <div className="bot-right">
          <SearchBar
            onSearch={onSearch}
            totalResults={filteredList.length}
            isSearching={isPending}
          />

          <div className="cat-row">
            {CATEGORIES.map((cat, i) => (
              <button
                key={cat.id}
                className={`cat-btn ${category === cat.id ? 'active' : ''}`}
                onClick={() => dispatch({ type: ACTIONS.SET_CATEGORY, id: cat.id, index: i })}
              >
                <span className="cat-emoji">{cat.emoji}</span>
                <span className="cat-label">{cat.label}</span>
              </button>
            ))}
          </div>

          <div className="rate-limit-bar" title={`${rateLimitRemaining} requests restantes`}>
            <div className="rate-limit-fill" style={{ width: `${rateLimitPercentage}%` }} />
          </div>

          <ItemList
            items={filteredList}
            selected={selected}
            favorites={favorites}
            category={category}
            currentCategory={currentCategory}
            loading={listLoading}
            activeRef={activeRef}
            onSelect={onSelectItem}
          />
        </div>
      </div>

      <div className="btn-bar">
        <div className="sys-wrap">
          <button className="sys-btn" onClick={onToggleFavorites}>
            {view === 'favorites' ? '◄ LISTA' : '❤ FAVS'}
          </button>
          <button className="sys-btn" onClick={onRandom}>
            ⚄ RANDOM
          </button>
        </div>
        <div className="key-legend">A=FAV · B=BACK · ↑↓=NAV · 🔍=BUSCAR</div>
        <Speaker />
      </div>
    </div>
  )
}

// ── Small reusable sub-components ────────────────────────────────────────────

function DecoRow() {
  return (
    <div className="top-deco">
      <div className="top-deco-line" />
      <Pokeball />
      <div className="azul-label">• Pokedéx •</div>
      <Pokeball />
      <div className="top-deco-line" />
    </div>
  )
}

function Pokeball() {
  return (
    <div className="top-pokeball">
      <div className="pkb-t" /><div className="pkb-m" /><div className="pkb-b" />
    </div>
  )
}

function PokeballRow({ count }) {
  return (
    <div className="bot-pokeball-row">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="pkball-sm" style={{ animationDelay: `${i * 0.2}s` }}>
          <div className="pkb-t" /><div className="pkb-m" /><div className="pkb-b" />
        </div>
      ))}
    </div>
  )
}

function SidePanel({ pokemon, name, size, side = 'left', children }) {
  return (
    <div className={`side-${side === 'left' ? 'l' : 'r'}`}>
      <div className="side-circle">
        <img
          src={getPokemonSprite(pokemon)}
          alt={name}
          style={{ width: size, height: size, imageRendering: 'pixelated' }}
        />
      </div>
      {side === 'left' && (
        <>
          <div className="leds">
            <div className="led led-g" />
            <div className="led led-b" />
          </div>
          <span style={{ fontSize: 30 }}>🌙</span>
        </>
      )}
      {children}
    </div>
  )
}

function DPad({ onUp, onDown, onLeft, onRight }) {
  return (
    <div className="dpad">
      <div className="dpad-row">
        <button className="dp dp-active" onClick={onUp}>▲</button>
      </div>
      <div className="dpad-mid">
        <button className="dp dp-active" onClick={onLeft}>◄</button>
        <div className="dp-center" />
        <button className="dp dp-active" onClick={onRight}>►</button>
      </div>
      <div className="dpad-row">
        <button className="dp dp-active" onClick={onDown}>▼</button>
      </div>
    </div>
  )
}

function MiniCard({ selected, category, currentCategory, isFavorite, onFavorite }) {
  if (!selected) {
    return (
      <div className="mini-card mini-empty">
        <p className="mini-hint">Elige<br />un item</p>
      </div>
    )
  }

  return (
    <div className="mini-card">
      {category === 'pokemon'
        ? <img src={getPokemonSprite(selected.id)} alt={selected.name} className="mini-img" />
        : <span className="mini-emoji">{currentCategory.emoji}</span>
      }
      <div className="mini-text">
        <div className="mini-cat">{currentCategory.label}</div>
        <div className="mini-name">{selected.name.toUpperCase()}</div>
      </div>
      <button className={`mini-fav ${isFavorite ? 'on' : ''}`} onClick={onFavorite}>
        {isFavorite ? "♥" : "♡" }
      </button>
    </div>
  )
}

function ItemList({ items, selected, favorites, category, currentCategory, loading, activeRef, onSelect }) {
  if (loading) {
    return (
      <div className="item-list">
        <div className="list-spin-wrap">
          <div className="list-spinner" />
          <span className="list-loading-txt">Cargando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="item-list">
      {items.map((item) => {
        const isActive = selected?.id === item.id
        const isFavorited = favorites.some(
          (f) => favKey(f.category, f.id) === favKey(category, item.id)
        )

        return (
          <div
            key={item.id}
            ref={isActive ? activeRef : null}
            className={`item-row ${isActive ? 'active' : ''} ${isFavorited ? 'faved' : ''}`}
            onClick={() => onSelect(item)}
          >
            {category === 'pokemon'
              ? <img src={getPokemonSprite(item.id)} alt={item.name} className="row-sprite" />
              : <span className="row-emoji">{currentCategory.emoji}</span>
            }
            <span className="row-num">#{String(item.id).padStart(3, '0')}</span>
            <span className="row-name">{item.name.toUpperCase()}</span>
            {isFavorited && <span className="row-fav-dot">❤</span>}
          </div>
        )
      })}
    </div>
  )
}

function Speaker() {
  return (
    <div className="speaker">
      {Array.from({ length: 9 }, (_, i) => <div key={i} className="sp-dot" />)}
    </div>
  )
}