import React, { createContext, useContext, useReducer } from 'react'

/* ─── helpers ─── */
const load = (key, def) => {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? def }
  catch { return def }
}
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val))

/* ─── initial state ─── */
const init = {
  favorites:     load('gba-favorites', []),   // [{ id, name, category, sprite }]
  category:      'pokemon',                   // active category
  categoryIndex: 0,
  list:          [],                          // items for current category
  selected:      null,                        // { id, name, url }
  detail:        null,                        // full API response
  listLoading:   false,
  detailLoading: false,
  error:         null,
  view:          'list',                      // 'list' | 'detail' | 'favorites'
}

/* ─── reducer ─── */
function reducer(s, a) {
  switch (a.type) {

    case 'SET_CATEGORY':
      return {
        ...s,
        category: a.id, categoryIndex: a.index,
        list: [], selected: null, detail: null,
        view: 'list', error: null
      }

    case 'LIST_LOADING':  return { ...s, listLoading: true,   error: null }
    case 'SET_LIST':      return { ...s, list: a.payload,      listLoading: false }

    case 'SET_SELECTED':
      if (a.payload === null) {
        return { ...s, selected: null, detail: null, view: 'list' }
      }
      return { ...s, selected: a.payload, detail: null, view: 'detail' }

    case 'DETAIL_LOADING': return { ...s, detailLoading: true, error: null }
    case 'SET_DETAIL':     return { ...s, detail: a.payload,   detailLoading: false }

    case 'SET_ERROR':
      return { ...s, error: a.payload, listLoading: false, detailLoading: false }

    case 'SET_VIEW':       return { ...s, view: a.payload }

    case 'TOGGLE_FAV': {
      const fav = a.payload                   // { id, name, category, sprite }
      const key = `${fav.category}::${fav.id}`
      const exists = s.favorites.find(f => `${f.category}::${f.id}` === key)
      const next = exists
        ? s.favorites.filter(f => `${f.category}::${f.id}` !== key)
        : [...s.favorites, fav]
      save('gba-favorites', next)
      return { ...s, favorites: next }
    }

    case 'REMOVE_FAV': {
      const next = s.favorites.filter(f => !(f.id === a.id && f.category === a.category))
      save('gba-favorites', next)
      return { ...s, favorites: next }
    }

    default: return s
  }
}

/* ─── context ─── */
const Ctx = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, init)
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)
