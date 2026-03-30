/**
 * Reads a JSON value from localStorage with a safe fallback.
 * @template T
 * @param {string} key
 * @param {T} fallback
 * @returns {T}
 */
export const loadFromStorage = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback
  } catch {
    return fallback
  }
}

/**
 * Writes a JSON value to localStorage.
 * @param {string} key
 * @param {*} value
 */
export const saveToStorage = (key, value) =>
  localStorage.setItem(key, JSON.stringify(value))