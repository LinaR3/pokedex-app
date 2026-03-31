import React, { useState, useEffect } from 'react'
import { getPokemonSprite } from '../api/index'

// ─────────────────────────────────────────────
// PARSING
// ─────────────────────────────────────────────

/**
 * Extracts the numeric ID from a PokéAPI species URL.
 * e.g. "https://pokeapi.co/api/v2/pokemon-species/25/" → "25"
 */
function idFromUrl(url) {
  return url.replace(/\/$/, '').split('/').pop()
}

/**
 * Converts a PokéAPI evolution_detail object into a short human label.
 * Returned as { icon, text } for richer display.
 */
function getTrigger(detail) {
  if (!detail) return null

  if (detail.min_level)
    return { icon: '▲', text: `Nv. ${detail.min_level}` }

  if (detail.item?.name)
    return { icon: '◆', text: detail.item.name.replace(/-/g, ' ') }

  if (detail.trigger?.name === 'trade')
    return { icon: '↔', text: 'Intercambio' }

  if (detail.min_happiness)
    return { icon: '♥', text: 'Amistad' }

  if (detail.time_of_day === 'day')
    return { icon: '☀', text: 'Día' }

  if (detail.time_of_day === 'night')
    return { icon: '◑', text: 'Noche' }

  if (detail.known_move?.name)
    return { icon: '✦', text: detail.known_move.name.replace(/-/g, ' ') }

  if (detail.held_item?.name)
    return { icon: '◈', text: detail.held_item.name.replace(/-/g, ' ') }

  return { icon: '→', text: detail.trigger?.name?.replace(/-/g, ' ') ?? '' }
}

/**
 * Recursively parses the PokéAPI chain node into a plain tree:
 * { id, name, trigger, branches[] }
 *
 * The `trigger` on each node is how to evolve INTO it from its parent.
 */
function parseNode(apiNode, trigger = null) {
  if (!apiNode) return null
  const id = idFromUrl(apiNode.species.url)
  return {
    id,
    name:     apiNode.species.name,
    trigger,
    branches: (apiNode.evolves_to ?? []).map((child) =>
      parseNode(child, getTrigger(child.evolution_details?.[0]))
    ),
  }
}

/**
 * Returns true when every node in the subtree has at most 1 branch.
 * Linear chains can be rendered as a simple horizontal row.
 */
function isLinear(node) {
  if (!node || node.branches.length === 0) return true
  if (node.branches.length > 1)            return false
  return isLinear(node.branches[0])
}

/**
 * Flattens a linear chain into an ordered array of nodes.
 */
function flattenLinear(node, acc = []) {
  if (!node) return acc
  acc.push(node)
  if (node.branches.length === 1) flattenLinear(node.branches[0], acc)
  return acc
}

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

/** Small badge showing what triggers the evolution. */
function TriggerBadge({ trigger }) {
  if (!trigger) return null
  return (
    <div className="evo-trigger-badge">
      <span className="evo-trigger-icon">{trigger.icon}</span>
      <span className="evo-trigger-text">{trigger.text}</span>
    </div>
  )
}

/** A single Pokémon stage — sprite + name + active highlight. */
function Stage({ node, currentId, onSelect, animDelay = 0 }) {
  const isActive = node.id === currentId

  return (
    <button
      className={`evo-stage ${isActive ? 'evo-active' : ''}`}
      onClick={() => onSelect({ id: node.id, name: node.name })}
      title={node.name}
      style={{ animationDelay: `${animDelay}ms` }}
    >
      <img
        src={getPokemonSprite(node.id)}
        alt={node.name}
        className="evo-sprite"
        loading="lazy"
      />
      <span className="evo-pokemon-name">{node.name.replace(/-/g, ' ')}</span>
      <span className="evo-pokemon-id">#{node.id.padStart(3, '0')}</span>
    </button>
  )
}

/** Arrow column: connector line + trigger badge + chevron. */
function Arrow({ trigger }) {
  return (
    <div className="evo-arrow-col">
      <div className="evo-connector-line" />
      <TriggerBadge trigger={trigger} />
      <span className="evo-chevron">▶</span>
    </div>
  )
}

// ─────────────────────────────────────────────
// LAYOUT: LINEAR
// A → B → C rendered as a horizontal flex row.
// ─────────────────────────────────────────────

function LinearChain({ root, currentId, onSelect }) {
  const stages = flattenLinear(root)
  return (
    <div className="evo-linear">
      {stages.map((stage, i) => (
        <React.Fragment key={stage.id}>
          {i > 0 && <Arrow trigger={stage.trigger} />}
          <Stage
            node={stage}
            currentId={currentId}
            onSelect={onSelect}
            animDelay={i * 60}
          />
        </React.Fragment>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// LAYOUT: BRANCHING
// Base on the left, branches stacked on the right.
//
//              [Vaporeon]
// [Eevee] →── [Jolteon ]
//              [Flareon ]
//
// If branches have their own sub-branches (Wurmple),
// each branch is itself rendered as a LinearChain.
// ─────────────────────────────────────────────

function BranchingChain({ root, currentId, onSelect }) {
  // Walk linear prefix before the fork
  const prefix = []
  let forkNode  = root

  while (forkNode.branches.length === 1) {
    prefix.push(forkNode)
    forkNode = forkNode.branches[0]
  }
  // forkNode is now the branching node
  prefix.push(forkNode)

  return (
    <div className="evo-branching">
      {/* Linear prefix leading to the fork */}
      <div className="evo-prefix-row">
        {prefix.map((stage, i) => (
          <React.Fragment key={stage.id}>
            {i > 0 && <Arrow trigger={stage.trigger} />}
            <Stage
              node={stage}
              currentId={currentId}
              onSelect={onSelect}
              animDelay={i * 60}
            />
          </React.Fragment>
        ))}
        {/* Connector from the fork node to the branches column */}
        <div className="evo-fork-line" />
      </div>

      {/* Branch column */}
      <div className="evo-branches-col">
        {forkNode.branches.map((branch, i) => (
          <div key={branch.id} className="evo-branch-row">
            <div className="evo-branch-arrow">
              <TriggerBadge trigger={branch.trigger} />
              <span className="evo-chevron">▶</span>
            </div>
            {/* Each branch may itself be a short linear chain (e.g. Wurmple) */}
            {isLinear(branch) && branch.branches.length > 0 ? (
              <LinearChain root={branch} currentId={currentId} onSelect={onSelect} />
            ) : (
              <Stage
                node={branch}
                currentId={currentId}
                onSelect={onSelect}
                animDelay={100 + i * 50}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

/**
 * Renders the full evolution chain for a Pokémon.
 *
 * @param {object}   chain      — detail._evolutionChain.chain (PokéAPI node)
 * @param {string}   currentId  — id of the currently displayed Pokémon
 * @param {function} onSelect   — called with { id, name } when a stage is clicked
 */
export default function EvolutionTree({ chain, currentId, onSelect }) {
  const [visible, setVisible] = useState(false)

  // Trigger fade-in on mount or when chain changes
  useEffect(() => {
    setVisible(false)
    const id = setTimeout(() => setVisible(true), 30)
    return () => clearTimeout(id)
  }, [chain])

  if (!chain) return null

  const root = parseNode(chain)

  // Nothing to show if there are no evolutions at all
  const totalNodes = countNodes(root)
  if (totalNodes <= 1) return null

  const Layout = isLinear(root) ? LinearChain : BranchingChain

  return (
    <div className={`evo-tree ${visible ? 'evo-tree-visible' : ''}`}>
      <div className="evo-tree-label">Cadena evolutiva</div>
      <Layout root={root} currentId={currentId} onSelect={onSelect} />
    </div>
  )
}

/** Counts total nodes in a tree (used to detect single-node chains). */
function countNodes(node) {
  if (!node) return 0
  return 1 + node.branches.reduce((sum, b) => sum + countNodes(b), 0)
}