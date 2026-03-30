import React, { createContext, useContext, useReducer } from 'react'
import { loadFromStorage, saveToStorage } from '../utils/storage'
import { favKey } from '../utils/format'
import { ACTIONS } from './actions'

const FAVORITES_STORAGE_KEY = 'gba-favorites'

// ── Initial state ─────────────────────────────────────────────────────────────
const initialState = {
  favorites:     loadFromStorage(FAVORITES_STORAGE_KEY, []),
  category:      'pokemon',
  categoryIndex: 0,
  list:          [],
  selected:      null,
  detail:        null,
  listLoading:   false,
  detailLoading: false,
  error:         null,
  view:          'list', // 'list' | 'detail' | 'favorites'
}

// ── Reducer ───────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {

    case ACTIONS.SET_CATEGORY:
      return {
        ...state,
        category:      action.id,
        categoryIndex: action.index,
        list:          [],
        selected:      null,
        detail:        null,
        view:          'list',
        error:         null,
      }

    case ACTIONS.LIST_LOADING:
      return { ...state, listLoading: true, error: null }

    case ACTIONS.SET_LIST:
      return { ...state, list: action.payload, listLoading: false }

    case ACTIONS.SET_SELECTED:
      if (action.payload === null) {
        return { ...state, selected: null, detail: null, view: 'list' }
      }
      return { ...state, selected: action.payload, detail: null, view: 'detail' }

    case ACTIONS.DETAIL_LOADING:
      return { ...state, detailLoading: true, error: null }

    case ACTIONS.SET_DETAIL:
      return { ...state, detail: action.payload, detailLoading: false }

    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, listLoading: false, detailLoading: false }

    case ACTIONS.SET_VIEW:
      return { ...state, view: action.payload }

    case ACTIONS.TOGGLE_FAV: {
      const item    = action.payload
      const key     = favKey(item.category, item.id)
      const exists  = state.favorites.some((f) => favKey(f.category, f.id) === key)
      const updated = exists
        ? state.favorites.filter((f) => favKey(f.category, f.id) !== key)
        : [...state.favorites, item]

      saveToStorage(FAVORITES_STORAGE_KEY, updated)
      return { ...state, favorites: updated }
    }

    case ACTIONS.REMOVE_FAV: {
      const updated = state.favorites.filter(
        (f) => !(f.id === action.id && f.category === action.category)
      )
      saveToStorage(FAVORITES_STORAGE_KEY, updated)
      return { ...state, favorites: updated }
    }

    default:
      return state
  }
}

// ── Context & Provider ────────────────────────────────────────────────────────
const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => useContext(StoreContext)