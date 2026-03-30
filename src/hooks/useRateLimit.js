import { useState, useEffect, useCallback } from 'react'
import { rateLimiter } from '../api/index'

/**
 * Reactive wrapper around the singleton RateLimiter.
 * The raw rateLimiter.getPercentage() call is not reactive —
 * this hook syncs it to React state every `intervalMs` milliseconds.
 *
 * @param {number} intervalMs - Polling interval in ms (default: 500)
 * @returns {{ percentage: number, remaining: number, trackRequest: () => void }}
 */
export function useRateLimit(intervalMs = 500) {
  const [percentage, setPercentage] = useState(() => rateLimiter.getPercentage())
  const [remaining, setRemaining]   = useState(() => rateLimiter.getRemaining())

  const sync = useCallback(() => {
    setPercentage(rateLimiter.getPercentage())
    setRemaining(rateLimiter.getRemaining())
  }, [])

  useEffect(() => {
    const id = setInterval(sync, intervalMs)
    return () => clearInterval(id)
  }, [sync, intervalMs])

  /** Call after every API request to get an immediate UI update. */
  const trackRequest = useCallback(() => {
    rateLimiter.addRequest()
    sync()
  }, [sync])

  return { percentage, remaining, trackRequest }
}