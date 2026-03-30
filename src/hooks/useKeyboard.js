import { useEffect } from 'react'

/**
 * Binds keyboard shortcuts for the GameBoy shell.
 * Extracted from GameBoy.jsx — input handling belongs in its own hook.
 *
 * @param {object} handlers
 * @param {() => void} handlers.onUp
 * @param {() => void} handlers.onDown
 * @param {() => void} handlers.onLeft
 * @param {() => void} handlers.onRight
 * @param {() => void} handlers.onA
 * @param {() => void} handlers.onB
 * @param {() => void} handlers.onStart
 */
export function useKeyboard({ onUp, onDown, onLeft, onRight, onA, onB, onStart }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ignore shortcuts while the user is typing in an input
      if (event.target.tagName === 'INPUT') return

      switch (event.key) {
        case 'ArrowUp':    return onUp?.()
        case 'ArrowDown':  return onDown?.()
        case 'ArrowLeft':  return onLeft?.()
        case 'ArrowRight': return onRight?.()
        case 'a': case 'A': return onA?.()
        case 'b': case 'B': return onB?.()
        case 'Enter':      return onStart?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onUp, onDown, onLeft, onRight, onA, onB, onStart])
}