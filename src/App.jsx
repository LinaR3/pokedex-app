import React from 'react'
import GameBoyShell from './components/GameBoyShell'
import { usePokemon } from './hooks/usePokemon'

export default function App() {
  const pokemonState = usePokemon()

  return (
    <div className="app-bg">
      <GameBoyShell {...pokemonState} />
    </div>
  )
}
