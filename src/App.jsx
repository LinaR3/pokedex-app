import React from 'react'
import { StoreProvider } from './store/StoreContext'
import GameBoy from './components/GameBoy'
import './styles/gameboy.css'

export default function App() {
  return (
    <StoreProvider>
      <div className="app-bg">
        <GameBoy />
      </div>
    </StoreProvider>
  )
}
