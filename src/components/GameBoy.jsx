import React, { useEffect, useCallback, useRef, useState, useMemo, useTransition } from 'react'
import { useStore } from '../store/StoreContext'
import {
  fetchList, fetchDetail, searchInList, prefetchNext,
  CATEGORIES, getPokemonSprite, rateLimiter,
} from '../api/index'
import TopScreen from './TopScreen'
import SearchBar from './SearchBar'
import { useSwipe } from '../hooks/useSwipe'

export default function GameBoy() {
  const { state, dispatch } = useStore()
  const { category, categoryIndex, list, selected, listLoading, view, favorites } = state

  const [searchQuery, setSearchQuery]   = useState('')
  const [isPending, startTransition]    = useTransition()

  // FIX #2: rateLimitPercentage reactivo con state propio
  const [rateInfo, setRateInfo] = useState({
    percentage: rateLimiter.getPercentage(),
    remaining:  rateLimiter.getRemaining(),
  })

  useEffect(() => {
    const id = setInterval(() => {
      setRateInfo({
        percentage: rateLimiter.getPercentage(),
        remaining:  rateLimiter.getRemaining(),
      })
    }, 500)
    return () => clearInterval(id)
  }, [])

  const trackRequest = useCallback(() => {
    rateLimiter.addRequest()
    setRateInfo({
      percentage: rateLimiter.getPercentage(),
      remaining:  rateLimiter.getRemaining(),
    })
  }, [])

  const activeRef  = useRef(null)
  const shellRef   = useRef(null)

  /* ── Load list when category changes ── */
  useEffect(() => {
    let dead = false
    ;(async () => {
      try {
        dispatch({ type: 'LIST_LOADING' })
        const items = await fetchList(category)
        trackRequest()
        if (!dead) dispatch({ type: 'SET_LIST', payload: items })
      } catch (e) {
        if (!dead) dispatch({ type: 'SET_ERROR', payload: e.message })
      }
    })()
    return () => { dead = true }
  }, [category, dispatch, trackRequest])

  // FIX #1: filteredList con useMemo — isSearching usa isPending de useTransition
  const filteredList = useMemo(
    () => searchInList(list, searchQuery),
    [list, searchQuery]
  )

  /* ── Load detail when selected changes ── */
  useEffect(() => {
    if (!selected) return
    let dead = false
    ;(async () => {
      try {
        dispatch({ type: 'DETAIL_LOADING' })
        const data = await fetchDetail(category, selected.id)
        trackRequest()
        if (!dead) {
          dispatch({ type: 'SET_DETAIL', payload: data })
          prefetchNext(category, list, selected.id)
        }
      } catch (e) {
        if (!dead) dispatch({ type: 'SET_ERROR', payload: e.message })
      }
    })()
    return () => { dead = true }
  }, [selected?.id, category, list, dispatch, trackRequest])

  /* Scroll to active item */
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selected?.id])

  /* ── Button handlers ── */
  const selectItem = useCallback(
    item => dispatch({ type: 'SET_SELECTED', payload: item }),
    [dispatch]
  )

  const navigate = useCallback(dir => {
    if (!filteredList.length) return
    const idx  = filteredList.findIndex(i => i.id === selected?.id)
    const next = idx + dir
    if (next >= 0 && next < filteredList.length) selectItem(filteredList[next])
    else if (idx === -1) selectItem(filteredList[0])
  }, [filteredList, selected, selectItem])

  const btnA = useCallback(() => {
    if (!selected) return
    dispatch({
      type: 'TOGGLE_FAV',
      payload: {
        id: selected.id, name: selected.name, category,
        sprite: category === 'pokemon' ? getPokemonSprite(selected.id) : null,
      },
    })
  }, [selected, category, dispatch])

  const changeCategory = useCallback(dir => {
    const next = (categoryIndex + dir + CATEGORIES.length) % CATEGORIES.length
    dispatch({ type: 'SET_CATEGORY', id: CATEGORIES[next].id, index: next })
    startTransition(() => {})   // resetea búsqueda de forma limpia
  }, [categoryIndex, dispatch])

  const btnB = useCallback(() => {
    dispatch({ type: 'SET_VIEW',     payload: 'list' })
    dispatch({ type: 'SET_DETAIL',   payload: null })
    dispatch({ type: 'SET_SELECTED', payload: null })
  }, [dispatch])

  const btnStart = useCallback(() => {
    dispatch({ type: 'SET_VIEW', payload: view === 'favorites' ? 'list' : 'favorites' })
  }, [view, dispatch])

  const btnSelect = useCallback(() => {
    if (filteredList.length)
      selectItem(filteredList[Math.floor(Math.random() * filteredList.length)])
  }, [filteredList, selectItem])

  /* Keyboard */
  useEffect(() => {
    const h = e => {
      if (e.key === 'ArrowUp')                navigate(-1)
      if (e.key === 'ArrowDown')              navigate(1)
      if (e.key === 'ArrowLeft')              changeCategory(-1)
      if (e.key === 'ArrowRight')             changeCategory(1)
      if (e.key === 'a' || e.key === 'A')     btnA()
      if (e.key === 'b' || e.key === 'B')     btnB()
      if (e.key === 'Enter')                  btnStart()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [navigate, changeCategory, btnA, btnB, btnStart])

  /* Mobile swipe gestures */
  useSwipe(shellRef, {
    onSwipeLeft:  () => changeCategory(1),
    onSwipeRight: () => changeCategory(-1),
    onSwipeUp:    () => navigate(1),
    onSwipeDown:  () => navigate(-1),
    threshold: 60,
  })

  /* Search handler — usa startTransition para que isPending funcione */
  const handleSearch = useCallback(query => {
    startTransition(() => setSearchQuery(query))
  }, [])

  const curCat = CATEGORIES[categoryIndex]
  const isFav  = selected
    ? favorites.some(f => f.id === selected.id && f.category === category)
    : false

  return (
    <div className="shell" ref={shellRef}>

      {/* ═══════════ TOP: Pokéballs + pantalla ═══════════ */}
      <div className="top-half">

        <div className="top-deco">
          <div className="top-deco-line" />
          <div className="top-pokeball">
            <div className="pkb-t" /><div className="pkb-m" /><div className="pkb-b" />
          </div>
          <div className="azul-label">• Pokedéx •</div>
          <div className="top-pokeball">
            <div className="pkb-t" /><div className="pkb-m" /><div className="pkb-b" />
          </div>
          <div className="top-deco-line" />
        </div>

        <div className="screen-zone">

          <div className="side-l">
            <div className="side-circle">
              <img
                src={getPokemonSprite(4)} alt="Charmander"
                style={{ width: 60, height: 60, imageRendering: 'pixelated' }}
              />
            </div>
            <div className="leds">
              <div className="led led-g" />
              <div className="led led-b" />
            </div>
            <span style={{ fontSize: 30 }}>🌙</span>
          </div>

          <div className="screen-outer">
            <div className="screen-inner">
              <div className="scanlines" />
              <TopScreen />
            </div>
          </div>

          <div className="side-r">
            <div className="side-circle">
              <img
                src={getPokemonSprite(9)} alt="Blastoise"
                style={{ width: 40, height: 40, imageRendering: 'pixelated' }}
              />
            </div>
            <button className="ab-btn a-btn" onClick={btnA} title="A = Favorito">A</button>
            <button className="ab-btn b-btn" onClick={btnB} title="B = Volver">B</button>
          </div>
        </div>

        <div className="bot-pokeball-row">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="pkball-sm" style={{ animationDelay: `${i * 0.2}s` }}>
              <div className="pkb-t" /><div className="pkb-m" /><div className="pkb-b" />
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════ BOTTOM ═══════════ */}
      <div className="bot-half">
        <div className="bot-grid">

          {/* ── LEFT: D-Pad + mini card ── */}
          <div className="bot-left">
            <div className="dpad">
              <div className="dpad-row">
                <button className="dp dp-active" onClick={() => navigate(-1)} title="Anterior">▲</button>
              </div>
              <div className="dpad-mid">
                <button className="dp dp-active" onClick={() => changeCategory(-1)} title="◄ Categoría anterior">◄</button>
                <div className="dp-center" />
                <button className="dp dp-active" onClick={() => changeCategory(1)}  title="► Categoría siguiente">►</button>
              </div>
              <div className="dpad-row">
                <button className="dp dp-active" onClick={() => navigate(1)}  title="Siguiente">▼</button>
              </div>
            </div>

            {selected ? (
              <div className="mini-card">
                {category === 'pokemon'
                  ? <img src={getPokemonSprite(selected.id)} alt={selected.name} className="mini-img" />
                  : <span className="mini-emoji">{curCat.emoji}</span>
                }
                <div className="mini-text">
                  <div className="mini-cat">{curCat.label}</div>
                  <div className="mini-name">{selected.name.toUpperCase()}</div>
                </div>
                <button className={`mini-fav ${isFav ? 'on' : ''}`} onClick={btnA}>
                  {isFav ? '❤' : '♡'}
                </button>
              </div>
            ) : (
              <div className="mini-card mini-empty">
                <p className="mini-hint">Elige<br />un item</p>
              </div>
            )}
          </div>

          {/* ── RIGHT: Búsqueda + categorías + lista ── */}
          <div className="bot-right">

            {/* FIX #1: onSearch usa handleSearch con startTransition */}
            <SearchBar
              onSearch={handleSearch}
              totalResults={filteredList.length}
              isSearching={isPending}
            />

            <div className="cat-row">
              {CATEGORIES.map((cat, i) => (
                <button
                  key={cat.id}
                  className={`cat-btn ${category === cat.id ? 'active' : ''}`}
                  onClick={() => dispatch({ type: 'SET_CATEGORY', id: cat.id, index: i })}
                >
                  <span className="cat-emoji">{cat.emoji}</span>
                  <span className="cat-label">{cat.label}</span>
                </button>
              ))}
            </div>

            {/* FIX #2: rate limit bar ahora es reactiva */}
            <div
              className="rate-limit-bar"
              title={`${rateInfo.remaining} requests restantes`}
            >
              <div
                className="rate-limit-fill"
                style={{ width: `${rateInfo.percentage}%` }}
              />
            </div>

            <div className="item-list">
              {listLoading && (
                <div className="list-spin-wrap">
                  <div className="list-spinner" />
                  <span className="list-loading-txt">Cargando...</span>
                </div>
              )}

              {!listLoading && filteredList.map(item => {
                const active = selected?.id === item.id
                const faved  = favorites.some(f => f.id === item.id && f.category === category)
                return (
                  <div
                    key={item.id}
                    ref={active ? activeRef : null}
                    className={`item-row ${active ? 'active' : ''} ${faved ? 'faved' : ''}`}
                    onClick={() => selectItem(item)}
                  >
                    {category === 'pokemon'
                      ? <img src={getPokemonSprite(item.id)} alt={item.name} className="row-sprite" />
                      : <span className="row-emoji">{curCat.emoji}</span>
                    }
                    <span className="row-num">#{String(item.id).padStart(3, '0')}</span>
                    <span className="row-name">{item.name.toUpperCase()}</span>
                    {faved && <span className="row-fav-dot">❤</span>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="btn-bar">
          <div className="sys-wrap">
            <button className="sys-btn" onClick={btnStart} title="START = Favoritos">
              {view === 'favorites' ? '◄ LISTA' : '❤ FAVS'}
            </button>
            <button className="sys-btn" onClick={btnSelect} title="SELECT = Aleatorio">
              ⚄ RANDOM
            </button>
          </div>
          <div className="key-legend">
            A=FAV · B=BACK · ↑↓=NAV · 🔍=BUSCAR
          </div>
          <div className="speaker">
            {Array.from({ length: 9 }, (_, i) => <div key={i} className="sp-dot" />)}
          </div>
        </div>
      </div>
    </div>
  )
}