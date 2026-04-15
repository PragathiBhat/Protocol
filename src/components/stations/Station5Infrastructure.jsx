import { useState, useEffect } from 'react'

export default function Station5Infrastructure({ onComplete }) {
  const [solved, setSolved] = useState(false)

  /* Listen for "maze-solved" posted from the iframe */
  useEffect(() => {
    const handler = e => {
      if (e.data === 'maze-solved') setSolved(true)
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  return (
    <div className="station-infrastructure">
      <p className="station-instruction">
        Hold the mouse button and drag through the corridors to move.
        Walls block your path — find the route from S to EXIT.
      </p>

      <iframe
        className="maze-iframe"
        src={`${import.meta.env.BASE_URL}maze.html`}
        title="Infrastructure Maze"
        scrolling="no"
      />

      {solved && (
        <div className="maze-solved">GRID NAVIGATED — INFRASTRUCTURE ONLINE</div>
      )}

      <button
        className="confirm-btn"
        disabled={!solved}
        onClick={() => onComplete(100)}
      >
        {solved ? 'LOCK IN INFRASTRUCTURE' : 'REACH THE EXIT TO UNLOCK'}
      </button>
    </div>
  )
}
