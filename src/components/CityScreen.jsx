import { useState } from 'react'
import SimulationScreen from './SimulationScreen'
import FailureScreen    from './FailureScreen'

const LABELS = {
  people:         'PEOPLE',
  memory:         'MEMORY',
  environment:    'ENVIRONMENT',
  economy:        'ECONOMY',
  infrastructure: 'INFRASTRUCTURE',
}

const WORLD_DESC = {
  people:         'An empty plaza. Silence where crowds should be. Something left — but no one came back.',
  memory:         'Every building identical. Every street the same. The city forgot what made it different.',
  environment:    'Thick haze over the square. The trees are bare. The air is heavy.',
  economy:        'Money falls from the sky and nobody looks up. The prices are unreadable.',
  infrastructure: 'Roads blocked. Buildings half-collapsed. The grid that held things together — gone.',
}

function formatTime(ms) {
  if (!ms) return '—'
  const s = Math.round(ms / 1000)
  return s < 60 ? `${s}s` : `${Math.floor(s/60)}m ${s%60}s`
}

// 'idle' → 'failure' → 'sim'
export default function CityScreen({ scores, times = {}, onRestart }) {
  const [stage, setStage] = useState('idle')

  const entries = Object.entries(times).filter(([,v]) => v !== null && v !== undefined)
  const slowest = entries.length ? entries.sort((a,b) => b[1]-a[1])[0][0] : 'people'
  const slowestTime = times[slowest] ?? 0

  return (
    <>
      {/* ── GATEWAY SCREEN ── */}
      <div className="gateway-screen">

        <div className="gw-header">
          <div className="gw-tagline">ALEXANDERPLATZ — SIMULATION READY</div>
          <div className="gw-title">PROTOCOL</div>
        </div>

        <div className="gw-world-card">
          <div className="gw-world-label">WORLD TRIGGERED BY SLOWEST CATEGORY</div>
          <div className="gw-world-name">{LABELS[slowest]}</div>
          <p className="gw-world-desc">{WORLD_DESC[slowest]}</p>
        </div>

        <div className="gw-times">
          {Object.entries(LABELS).map(([key, label]) => (
            <div key={key} className={`gw-time-row ${key === slowest ? 'gw-row-slow' : ''}`}>
              <span className="gw-row-label">{label}</span>
              <span className="gw-row-score">
                {key === 'memory'
                  ? (scores[key] ?? '—').toString().toUpperCase()
                  : scores[key] !== null && scores[key] !== undefined
                    ? `${scores[key]}%` : '—'}
              </span>
              <span className="gw-row-time">{formatTime(times[key])}</span>
            </div>
          ))}
        </div>

        <div className="gw-actions">
          <button className="confirm-btn" onClick={() => setStage('failure')}>
            ENTER SIMULATION →
          </button>
          <button className="skip-btn" onClick={onRestart}>
            ↩ RUN AGAIN
          </button>
        </div>

      </div>

      {/* ── FAILURE SCREEN (intermediate) ── */}
      {stage === 'failure' && (
        <FailureScreen
          slowest={slowest}
          slowestTime={slowestTime}
          onDone={() => setStage('sim')}
        />
      )}

      {/* ── 3D SIMULATION ── */}
      {stage === 'sim' && (
        <SimulationScreen times={times} onExit={() => setStage('idle')} />
      )}
    </>
  )
}
