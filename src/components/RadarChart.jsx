import React, { useEffect, useRef, useState } from 'react'

const SIDES    = 6
const MAX_STAT = 255

const STAT_LABELS = {
  'hp':              'HP',
  'attack':          'ATK',
  'defense':         'DEF',
  'special-attack':  'SP.A',
  'special-defense': 'SP.D',
  'speed':           'SPD',
}

/** Converts a polar index + 0-1 value into an SVG {x, y} point. */
function polarToXY(index, value, cx, cy, radius) {
  const angle = (Math.PI * 2 * index) / SIDES - Math.PI / 2
  return {
    x: cx + radius * value * Math.cos(angle),
    y: cy + radius * value * Math.sin(angle),
  }
}

/** SVG `d` string for a regular hexagon at the given radius. */
function makePolygon(cx, cy, radius) {
  const pts = Array.from({ length: SIDES }, (_, i) => polarToXY(i, 1, cx, cy, radius))
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ') + ' Z'
}

/** SVG `d` string for the stats polygon, scaled by `progress` for animation. */
function makeStatsPath(stats, cx, cy, radius, progress = 1) {
  const pts = stats.map((s, i) =>
    polarToXY(i, (s.value / MAX_STAT) * progress, cx, cy, radius)
  )
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ') + ' Z'
}

/**
 * Hexagonal radar chart for Pokémon base stats.
 *
 * Expects `stats` in the shape that TopScreen already provides:
 *   detail.stats.slice(0,6).map(s => ({ name: s.stat.name, value: s.base_stat }))
 *
 * @param {{ name: string, value: number }[]} stats
 * @param {number}  size          Width/height in px (default 150)
 * @param {string}  color         Fill + stroke color (default '#3b82f6')
 * @param {boolean} animated      Animate fill on mount (default true)
 * @param {{ name: string, value: number }[]} [compareStats]  Optional second Pokémon overlay
 * @param {string}  [compareColor]
 */
export default function RadarChart({
  stats = [],
  size = 150,
  color = '#3b82f6',
  animated = true,
  compareStats = null,
  compareColor = '#ef4444',
}) {
  const [progress, setProgress] = useState(animated ? 0 : 1)
  const rafRef   = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    if (!animated) { setProgress(1); return }
    setProgress(0)
    startRef.current = null

    const tick = (ts) => {
      if (!startRef.current) startRef.current = ts
      const t = Math.min((ts - startRef.current) / 700, 1)
      setProgress(1 - Math.pow(1 - t, 3)) // ease-out cubic
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [stats, animated])

  if (!stats.length) return null

  const cx          = size / 2
  const cy          = size / 2
  const radius      = size * 0.34
  const labelRadius = size * 0.48
  const gridLevels  = [0.25, 0.5, 0.75, 1.0]

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ overflow: 'visible', display: 'block' }}
    >
      {/* Grid hexagons */}
      {gridLevels.map((level) => (
        <path
          key={level}
          d={makePolygon(cx, cy, radius * level)}
          fill="none"
          stroke="rgba(0,0,0,0.12)"
          strokeWidth="0.5"
        />
      ))}

      {/* Radial spokes */}
      {Array.from({ length: SIDES }, (_, i) => {
        const outer = polarToXY(i, 1, cx, cy, radius)
        return (
          <line
            key={i}
            x1={cx} y1={cy} x2={outer.x} y2={outer.y}
            stroke="rgba(0,0,0,0.10)"
            strokeWidth="0.5"
          />
        )
      })}

      {/* Compare overlay (behind main) */}
      {compareStats?.length === SIDES && (
        <path
          d={makeStatsPath(compareStats, cx, cy, radius, progress)}
          fill={`${compareColor}28`}
          stroke={compareColor}
          strokeWidth="1.5"
          strokeLinejoin="round"
          opacity={0.75}
        />
      )}

      {/* Main stats area */}
      <path
        d={makeStatsPath(stats, cx, cy, radius, progress)}
        fill={`${color}38`}
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* Vertex dots */}
      {stats.map((s, i) => {
        const pt = polarToXY(i, (s.value / MAX_STAT) * progress, cx, cy, radius)
        return (
          <circle
            key={i}
            cx={pt.x} cy={pt.y} r={2.5}
            fill={color}
            stroke="rgba(0,0,0,0.15)"
            strokeWidth="0.8"
          />
        )
      })}

      {/* Labels — name abbreviation + animated value */}
      {stats.map((s, i) => {
        const pt    = polarToXY(i, 1, cx, cy, labelRadius)
        const label = STAT_LABELS[s.name] || s.name.slice(0, 3).toUpperCase()
        const val   = Math.round(s.value * progress)
        const anchor = pt.x < cx - 2 ? 'end' : pt.x > cx + 2 ? 'start' : 'middle'
        const nameSize = `${size * 0.033}px`
        const valSize  = `${size * 0.042}px`

        return (
          <g key={i}>
            <text
              x={pt.x} y={pt.y - 3}
              textAnchor={anchor}
              dominantBaseline="auto"
              style={{ fontFamily: "'Press Start 2P', monospace", fontSize: nameSize, fill: 'var(--scr-dk, #0f380f)', opacity: 0.6 }}
            >
              {label}
            </text>
            <text
              x={pt.x} y={pt.y + size * 0.046}
              textAnchor={anchor}
              dominantBaseline="auto"
              style={{ fontFamily: "'Press Start 2P', monospace", fontSize: valSize, fill: 'var(--scr-dk, #0f380f)', fontWeight: 'bold' }}
            >
              {val}
            </text>
          </g>
        )
      })}
    </svg>
  )
}