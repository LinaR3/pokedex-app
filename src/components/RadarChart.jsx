import React from 'react'

export default function RadarChart({ stats, size = 150, color = "#3b82f6", animated = true }) {
  // Componente temporal vacío
  return (
    <div style={{ 
      width: size, 
      height: size, 
      background: 'rgba(0,0,0,0.15)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
      color: '#0f380f',
      textAlign: 'center'
    }}>
      Radar Chart<br />(temporal)
    </div>
  )
}