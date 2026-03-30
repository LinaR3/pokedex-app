/**
 * Capitalizes a string and replaces hyphens with spaces.
 * @param {string} str
 * @returns {string}
 */
export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ') : ''

/**
 * Returns '???' for unknown / missing / n/a values.
 * @param {*} value
 * @returns {string | *}
 */
export const unknown = (value) =>
  !value || value === 'unknown' || value === 'n/a' ? '???' : value

/**
 * Zero-pads a Pokédex ID to 3 digits.
 * @param {string | number} id
 * @returns {string}  e.g. '007'
 */
export const padId = (id) => String(id).padStart(3, '0')

/**
 * Unique string key for a favorite item (category + id).
 * Used to compare favorites without ambiguity.
 * @param {string} category
 * @param {string} id
 * @returns {string}  e.g. 'pokemon::25'
 */
export const favKey = (category, id) => `${category}::${id}`