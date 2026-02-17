import React, { useCallback } from 'react'

export default function Dpad({ onNavigate }) {
  const handleKey = useCallback((e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') onNavigate(-1)
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') onNavigate(1)
  }, [onNavigate])

  React.useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  return (
    <div className="dpad">
      <div className="dpad-row">
        <button className="dpad-btn dpad-up" onClick={() => onNavigate(-1)} aria-label="Anterior">▲</button>
      </div>
      <div className="dpad-row dpad-middle">
        <button className="dpad-btn dpad-left" onClick={() => onNavigate(-1)} aria-label="Anterior">◄</button>
        <div className="dpad-center" />
        <button className="dpad-btn dpad-right" onClick={() => onNavigate(1)} aria-label="Siguiente">►</button>
      </div>
      <div className="dpad-row">
        <button className="dpad-btn dpad-down" onClick={() => onNavigate(1)} aria-label="Siguiente">▼</button>
      </div>
    </div>
  )
}
