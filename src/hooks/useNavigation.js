import { useCallback } from 'react'
import { useStore } from '../store/StoreContext'
import { ACTIONS } from '../store/actions'
import { CATEGORIES, getPokemonSprite } from '../api/index'

/**
 * Encapsulates all navigation and button logic for the GameBoy shell.
 * Extracted from GameBoy.jsx to keep that component focused on layout only.
 *
 * @param {object[]} filteredList - Current visible list (post-search filter)
 * @returns Navigation handlers and derived state
 */
export function useNavigation(filteredList) {
  const { state, dispatch } = useStore()
  const { selected, category, categoryIndex, view } = state

  const selectItem = useCallback(
    (item) => dispatch({ type: ACTIONS.SET_SELECTED, payload: item }),
    [dispatch]
  )

  /** Move up (-1) or down (+1) in the filtered list */
  const navigate = useCallback(
    (direction) => {
      if (!filteredList.length) return
      const currentIndex = filteredList.findIndex((i) => i.id === selected?.id)
      const nextIndex = currentIndex + direction

      if (nextIndex >= 0 && nextIndex < filteredList.length) {
        selectItem(filteredList[nextIndex])
      } else if (currentIndex === -1) {
        selectItem(filteredList[0])
      }
    },
    [filteredList, selected, selectItem]
  )

  /** Cycle through categories left (-1) or right (+1) */
  const changeCategory = useCallback(
    (direction) => {
      const nextIndex = (categoryIndex + direction + CATEGORIES.length) % CATEGORIES.length
      dispatch({
        type: ACTIONS.SET_CATEGORY,
        id: CATEGORIES[nextIndex].id,
        index: nextIndex,
      })
    },
    [categoryIndex, dispatch]
  )

  /** A button — toggle favorite on the selected item */
  const handleFavorite = useCallback(() => {
    if (!selected) return
    dispatch({
      type: ACTIONS.TOGGLE_FAV,
      payload: {
        id:       selected.id,
        name:     selected.name,
        category,
        sprite:   category === 'pokemon' ? getPokemonSprite(selected.id) : null,
      },
    })
  }, [selected, category, dispatch])

  /** B button — clear selection and go back to list */
  const handleBack = useCallback(() => {
    dispatch({ type: ACTIONS.SET_VIEW,     payload: 'list' })
    dispatch({ type: ACTIONS.SET_DETAIL,   payload: null })
    dispatch({ type: ACTIONS.SET_SELECTED, payload: null })
  }, [dispatch])

  /** START button — toggle favorites view */
  const handleToggleFavorites = useCallback(() => {
    dispatch({
      type:    ACTIONS.SET_VIEW,
      payload: view === 'favorites' ? 'list' : 'favorites',
    })
  }, [view, dispatch])

  /** SELECT button — pick a random item */
  const handleRandom = useCallback(() => {
    if (!filteredList.length) return
    selectItem(filteredList[Math.floor(Math.random() * filteredList.length)])
  }, [filteredList, selectItem])

  return {
    selectItem,
    navigate,
    changeCategory,
    handleFavorite,
    handleBack,
    handleToggleFavorites,
    handleRandom,
  }
}