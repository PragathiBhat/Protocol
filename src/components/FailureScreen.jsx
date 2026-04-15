import { useState, useEffect } from 'react'

const AMBER = '#BA7517'

const DATA = {
  people: {
    headline: 'The streets remember no one.',
    body: 'You struggled to see the people around you. In your Alexanderplatz, the crowds have thinned to nothing. The plaza that once buzzed with a million footsteps now echoes only with yours.',
  },
  environment: {
    headline: 'The air has turned against you.',
    body: 'You lost sight of the environment around you. The city has paid the price. Smog sits heavy over the plaza, the trees stand bare, and the river runs dark. Everything feels unwell.',
  },
  economy: {
    headline: 'Money means nothing here anymore.',
    body: 'You could not read the economy fast enough. The market has collapsed in your absence. Banknotes fall from the sky like confetti — worthless paper drifting through a broken city.',
  },
  infrastructure: {
    headline: 'The city is falling apart.',
    body: 'Infrastructure held the city together and you let it slip. Roads have crumbled, buildings stand in ruin, and nothing moves as it should. The city groans under its own neglect.',
  },
  memory: {
    headline: 'No one remembers what this place was.',
    body: 'Memory was the hardest thing to hold. Without it, the city lost its identity. The TV Tower is gone. Every building looks the same. Alexanderplatz has forgotten itself.',
  },
}

/* ── Pure-CSS icons ── */
function PeopleIcon() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'5px', height:'64px', justifyContent:'center' }}>
      <div style={{ width:'20px', height:'20px', borderRadius:'50%', border:'2px solid #888' }} />
      <div style={{ width:'30px', height:'36px', border:'2px solid #888', borderRadius:'4px 4px 0 0' }} />
    </div>
  )
}

function EnvironmentIcon() {
  return (
    <div style={{ position:'relative', width:'64px', height:'64px', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{
        width:'36px', height:'36px',
        border:'2.5px solid #9aaa44',
        borderRadius:'0 60% 0 60%',
        transform:'rotate(45deg)',
      }} />
    </div>
  )
}

function EconomyIcon() {
  return (
    <div style={{
      width:'64px', height:'34px',
      border:'2px solid #22aa44',
      borderRadius:'4px',
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      <div style={{ width:'28px', height:'16px', border:'1.5px solid #22aa44', borderRadius:'2px' }} />
    </div>
  )
}

function InfrastructureIcon() {
  return (
    <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
      <div style={{ width:'22px', height:'38px', border:'2px solid #BA7517', borderRadius:'2px', transform:'rotate(6deg)', transformOrigin:'bottom center' }} />
      <div style={{ width:'22px', height:'38px', border:'2px solid #BA7517', borderRadius:'2px', transform:'rotate(-6deg)', transformOrigin:'bottom center' }} />
    </div>
  )
}

function MemoryIcon() {
  const opacities = [1, 0.2, 1, 0.2, 1, 0.2, 1, 0.2, 1]
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'5px', width:'52px', height:'52px' }}>
      {opacities.map((op, i) => (
        <div key={i} style={{ background:'#cccccc', opacity:op, borderRadius:'1px' }} />
      ))}
    </div>
  )
}

const ICONS = { people: PeopleIcon, environment: EnvironmentIcon, economy: EconomyIcon, infrastructure: InfrastructureIcon, memory: MemoryIcon }

export default function FailureScreen({ slowest, slowestTime, onDone }) {
  const [fadingOut, setFadingOut] = useState(false)

  const d    = DATA[slowest]  || DATA.people
  const Icon = ICONS[slowest] || PeopleIcon
  const secs = slowestTime ? Math.round(slowestTime / 1000) : 0

  const dismiss = () => {
    if (fadingOut) return
    setFadingOut(true)
    setTimeout(onDone, 650)
  }

  /* Auto-dismiss after 4 seconds */
  useEffect(() => {
    const t = setTimeout(dismiss, 4000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0a0a0a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '22px',
      animation: fadingOut ? 'fs-fade-out 0.65s ease forwards' : 'fs-fade-in 0.6s ease forwards',
      padding: '40px 20px',
    }}>

      <style>{`
        @keyframes fs-fade-in  { from { opacity:0 } to { opacity:1 } }
        @keyframes fs-fade-out { from { opacity:1 } to { opacity:0 } }
      `}</style>

      {/* Top line */}
      <div style={{
        fontFamily: 'Courier New, monospace',
        fontSize: '10px', letterSpacing: '5px',
        color: '#888', fontVariant: 'small-caps',
        textTransform: 'uppercase',
      }}>
        Alexanderplatz — 2047
      </div>

      {/* Icon */}
      <Icon />

      {/* Headline */}
      <div style={{
        fontFamily: 'Courier New, monospace',
        fontSize: '22px', fontWeight: 500,
        color: '#ffffff', letterSpacing: '1px',
        textAlign: 'center', maxWidth: '480px',
        lineHeight: 1.4,
      }}>
        {d.headline}
      </div>

      {/* Body */}
      <p style={{
        fontFamily: 'Courier New, monospace',
        fontSize: '13px', color: '#aaaaaa',
        maxWidth: '420px', lineHeight: 1.8,
        textAlign: 'center', margin: 0, letterSpacing: '0.3px',
      }}>
        {d.body}
      </p>

      {/* Amber rule */}
      <div style={{ width: '60px', height: '1px', background: AMBER }} />

      {/* Time callout */}
      <div style={{
        fontFamily: 'Courier New, monospace',
        fontSize: '12px', color: '#888', letterSpacing: '2px',
      }}>
        You spent <span style={{ color: AMBER }}>{secs} seconds</span> here
      </div>

      {/* Enter button */}
      <button
        onClick={dismiss}
        style={{
          background: 'transparent',
          border: `0.5px solid ${AMBER}`,
          color: AMBER,
          fontFamily: 'Courier New, monospace',
          fontSize: '11px', letterSpacing: '3px',
          padding: '10px 28px', cursor: 'pointer',
          transition: 'background 0.2s, color 0.2s',
          marginTop: '8px',
        }}
        onMouseEnter={e => { e.target.style.background = AMBER; e.target.style.color = '#0a0a0a' }}
        onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = AMBER }}
      >
        Enter the city →
      </button>

    </div>
  )
}
