/**
 * Redux-style action type constants for the Pokédex store.
 *
 * Using constants instead of raw strings prevents silent bugs:
 * dispatch({ type: 'SET_DETIAL' }) fails silently — the reducer
 * hits the default case and nothing happens, no error thrown.
 * With constants, the mistake is caught at import time.
 */
export const ACTIONS = {
  // Category
  SET_CATEGORY: 'SET_CATEGORY',

  // List
  LIST_LOADING: 'LIST_LOADING',
  SET_LIST:     'SET_LIST',

  // Selected item
  SET_SELECTED: 'SET_SELECTED',

  // Detail
  DETAIL_LOADING: 'DETAIL_LOADING',
  SET_DETAIL:     'SET_DETAIL',

  // Error
  SET_ERROR: 'SET_ERROR',

  // View
  SET_VIEW: 'SET_VIEW',

  // Favorites
  TOGGLE_FAV: 'TOGGLE_FAV',
  REMOVE_FAV: 'REMOVE_FAV',
}