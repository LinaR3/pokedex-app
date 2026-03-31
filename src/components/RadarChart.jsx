import React, { useEffect, useRef, useState } from 'react'

// ── Stat metadata ─────────────────────────────────────────────────────────────
// Each stat has a label, a role description, and a color
// Colors are tuned for the GameBoy green screen (#9bbc0f background)
const STAT_META = {
  'hp': {
    label: 'HP',
    role:  'Vida',
    color: '#1a6b1a',   // deep green
  },
  'attack': {
    label: 'ATK',
    role:  'Ataque',
    color: '#7a1a1a',   // deep red
  },
  'defense': {
    label: 'DEF',
    role:  'Defensa',
    color: '#1a3b7a',   // deep blue
  },
  'special-attack': {
    label: 'SP.A',
    role:  'Esp. Atq',
    color: '#7a4a1a',   // deep orange
  },
  'special-defense': {
    label: 'SP.D',
    role:  'Esp. Def',
    color: '#1a5a5a',   // deep teal
  },
  'speed': {
    label: 'SPD',
    role:  'Velocidad',
    color: '#5a1a7a',   // deep purple
  },
}

const SIDES    = 6
const MAX_STAT = 255

// Rating thresholds
const getRating = (value) => {
  if (value >= 150) return { label: 'MÁXIMO', dots: 5 }
  if (value >= 110) return { label: 'EXCELENTE', dots: 4 }
  if (value >= 80)  return { label: 'BUENO', dots: 3 }
  if (value >= 50)  return { label: 'REGULAR', dots: 2 }
  return               { label: 'BAJO', dots: 1 }
}

// ── Geometry helpers ──────────────────────────────────────────────────────────
function polarToXY(index, value, cx, cy, radius) {
  const angle = (Math.PI * 2 * index) / SIDES - Math.PI / 2
  return {
    x: cx + radius * value * Math.cos(angle),
    y: cy + radius * value * Math.sin(angle),
  }
}

function makePolygon(cx, cy, radius) {
  const pts = Array.from({ length: SIDES }, (_, i) => polarToXY(i, 1, cx, cy, radius))
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ') + ' Z'
}

function makeStatsPath(stats, cx, cy, radius, progress) {
  const pts = stats.map((s, i) =>
    polarToXY(i, (s.value / MAX_STAT) * progress, cx, cy, radius)
  )
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ') + ' Z'
}

// ── Component ─────────────────────────────────────────────────────────────────
/**
 * Improved hexagonal radar chart with stat context.
 * Shows labels, values, color-coded dots, and a stat summary bar.
 *
 * @param {{ name: string, value: number }[]} stats  - 6 stat objects from PokéAPI
 * @param {number}  size      - Width of the SVG hex (default 140)
 * @param {boolean} animated  - Animate on mount
 */
export default function RadarChart({ stats = [], size = 140, animated = true }) {
  const [progress, setProgress] = useState(animated ? 0 : 1)
  const rafRef   = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    if (!animated) { setProgress(1); return }
    setProgress(0)
    startRef.current = null

    const tick = (ts) => {
      if (!startRef.current) startRef.current = ts
      const t = Math.min((ts - startRef.current) / 900, 1)
      setProgress(1 - Math.pow(1 - t, 3))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [stats, animated])

  if (!stats.length) return null

  const cx          = size / 2
  const cy          = size / 2
  const radius      = size * 0.30
  const labelRadius = size * 0.46

  // Find best stat for highlight
  const bestStat = stats.reduce((best, s) => s.value > best.value ? s : best, stats[0])

  // Compute total (for the "OFENSIVO / DEFENSIVO / EQUILIBRADO" tag)
  const offStats = stats.filter(s => s.name === 'attack' || s.name === 'special-attack')
  const defStats = stats.filter(s => s.name === 'defense' || s.name === 'special-defense' || s.name === 'hp')
  const offTotal = offStats.reduce((a, s) => a + s.value, 0)
  const defTotal = defStats.reduce((a, s) => a + s.value, 0)
  const speedStat = stats.find(s => s.name === 'speed')

  let profileLabel = 'EQUILIBRADO'
  if (speedStat?.value >= 100) profileLabel = 'VELOZ'
  else if (offTotal > defTotal * 1.2) profileLabel = 'OFENSIVO'
  else if (defTotal > offTotal * 1.2) profileLabel = 'DEFENSIVO'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>

      {/* ── Hex SVG ── */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: 'visible', display: 'block' }}
      >
        {/* Grid rings */}
        {[0.25, 0.5, 0.75, 1].map((level) => (
          <path
            key={level}
            d={makePolygon(cx, cy, radius * level)}
            fill="none"
            stroke="rgba(15, 56, 15, 0.18)"
            strokeWidth="0.6"
            strokeDasharray={level < 1 ? '2 2' : 'none'}
          />
        ))}

        {/* Spokes */}
        {Array.from({ length: SIDES }, (_, i) => {
          const outer = polarToXY(i, 1, cx, cy, radius)
          return (
            <line
              key={i}
              x1={cx} y1={cy} x2={outer.x} y2={outer.y}
              stroke="rgba(15, 56, 15, 0.14)"
              strokeWidth="0.6"
            />
          )
        })}

        {/* Stats polygon fill */}
        <path
          d={makeStatsPath(stats, cx, cy, radius, progress)}
          fill="rgba(15, 56, 15, 0.28)"
          stroke="#306230"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* Colored vertex dot per stat */}
        {stats.map((s, i) => {
          const meta = STAT_META[s.name] || { color: '#306230' }
          const pt   = polarToXY(i, (s.value / MAX_STAT) * progress, cx, cy, radius)
          const isBest = s.name === bestStat.name

          return (
            <g key={i}>
              {/* Glow ring on best stat */}
              {isBest && (
                <circle
                  cx={pt.x} cy={pt.y} r={6}
                  fill={`${meta.color}44`}
                  stroke={meta.color}
                  strokeWidth="1"
                />
              )}
              <circle
                cx={pt.x} cy={pt.y} r={isBest ? 3.5 : 2.5}
                fill={meta.color}
                stroke="rgba(155,188,15,0.6)"
                strokeWidth="0.8"
              />
            </g>
          )
        })}

        {/* Labels: abbrev + animated value */}
        {stats.map((s, i) => {
          const meta   = STAT_META[s.name] || { label: '?', color: '#306230' }
          const pt     = polarToXY(i, 1, cx, cy, labelRadius)
          const val    = Math.round(s.value * progress)
          const anchor = pt.x < cx - 3 ? 'end' : pt.x > cx + 3 ? 'start' : 'middle'
          const isBest = s.name === bestStat.name
          const fs     = Math.max(size * 0.031, 4)

          return (
            <g key={i}>
              <text
                x={pt.x} y={pt.y - 1}
                textAnchor={anchor}
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: `${fs}px`,
                  fill: isBest ? meta.color : '#0f380f',
                  opacity: isBest ? 1 : 0.65,
                  fontWeight: isBest ? 'bold' : 'normal',
                }}
              >
                {meta.label}
              </text>
              <text
                x={pt.x} y={pt.y + fs * 2.2}
                textAnchor={anchor}
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: `${fs * 1.15}px`,
                  fill: isBest ? meta.color : '#306230',
                  fontWeight: 'bold',
                }}
              >
                {val}
              </text>
            </g>
          )
        })}
      </svg>

      {/* ── Profile tag ── */}
      <div style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '5px',
        color: '#0f380f',
        background: 'rgba(15,56,15,0.15)',
        border: '1px solid rgba(15,56,15,0.25)',
        borderRadius: 3,
        padding: '2px 6px',
        letterSpacing: '0.5px',
      }}>
        {profileLabel}
      </div>

      {/* ── Stat bars ── */}
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        marginTop: 2,
      }}>
        {stats.map((s) => {
          const meta   = STAT_META[s.name] || { label: '?', color: '#306230' }
          const rating = getRating(s.value)
          const pct    = Math.round((s.value / MAX_STAT) * 100 * progress)
          const isBest = s.name === bestStat.name

          return (
            <div
              key={s.name}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {/* Stat name */}
              <span style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '4.5px',
                color: isBest ? meta.color : '#0f380f',
                width: 26,
                flexShrink: 0,
                fontWeight: isBest ? 'bold' : 'normal',
              }}>
                {meta.label}
              </span>

              {/* Bar */}
              <div style={{
                flex: 1,
                height: 5,
                background: 'rgba(15,56,15,0.15)',
                borderRadius: 2,
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: meta.color,
                  borderRadius: 2,
                  transition: 'width 0.1s',
                  opacity: isBest ? 1 : 0.75,
                }} />
              </div>

              {/* Value */}
              <span style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '4.5px',
                color: isBest ? meta.color : '#306230',
                width: 18,
                textAlign: 'right',
                flexShrink: 0,
                fontWeight: isBest ? 'bold' : 'normal',
              }}>
                {Math.round(s.value * progress)}
              </span>

              {/* Dots rating */}
              <span style={{
                fontSize: '5px',
                flexShrink: 0,
                letterSpacing: '-1px',
              }}>
                {Array.from({ length: 5 }, (_, d) => (
                  <span
                    key={d}
                    style={{ color: d < rating.dots ? meta.color : 'rgba(15,56,15,0.2)' }}
                  >
                    ●
                  </span>
                ))}
              </span>
            </div>
          )
        })}
      </div>

    </div>
  )
}