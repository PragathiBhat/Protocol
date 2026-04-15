import { useState, useEffect } from 'react'

function LiveTimer({ startTime }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [startTime])

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const display = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`

  return (
    <div className="modal-timer">
      <span className="modal-timer-label">TIME</span>
      <span className="modal-timer-value">{display}</span>
    </div>
  )
}

export default function StationModal({ stationLabel, stationColor, startTime, onClose, children }) {
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        className="modal-panel"
        style={{ '--station-color': stationColor }}
      >
        <div className="modal-header">
          <div className="modal-title">STATION :: {stationLabel}</div>
          {startTime && <LiveTimer startTime={startTime} />}
          <button className="modal-close" onClick={onClose}>✕ CLOSE</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  )
}
