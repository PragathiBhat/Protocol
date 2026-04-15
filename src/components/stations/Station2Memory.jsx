import { useState, useEffect } from 'react'

/* ══════════════════════════════════════════════════
   ALEXANDERPLATZ LANDMARKS
══════════════════════════════════════════════════ */
const LANDMARKS = [
  {
    id: 'fernsehturm',
    name: 'FERNSEHTURM',
    sub: 'TV Tower · 1969',
    color: '#aa44ff',
    desc: 'The needle that orients the city',
  },
  {
    id: 'weltzeituhr',
    name: 'WELTZEITUHR',
    sub: 'World Clock · 1969',
    color: '#00d4ff',
    desc: 'Every time zone, one centre',
  },
  {
    id: 'neptunbrunnen',
    name: 'NEPTUNBRUNNEN',
    sub: 'Neptune Fountain · 1891',
    color: '#00ff88',
    desc: 'Water anchors the plaza',
  },
  {
    id: 'park-inn',
    name: 'PARK INN',
    sub: 'Hotel Tower · 1970',
    color: '#ffaa00',
    desc: 'The grid sentinel over the square',
  },
  {
    id: 'rathaus',
    name: 'ROTES RATHAUS',
    sub: 'Red Town Hall · 1869',
    color: '#ff6644',
    desc: 'Brick and authority, unchanged',
  },
  {
    id: 'ubahn',
    name: 'U+S BAHNHOF',
    sub: 'Transit Hub · 1882',
    color: '#ff1a8a',
    desc: 'The invisible grid beneath your feet',
  },
]

/* Stable back-face characters — same on every card, every render */
const BACK_CHARS = ['?','#','⊗','1','▲','░','◉','0','≋','■','⌗','▪','×','▒','◆','⚠']

/* ══════════════════════════════════════════════════
   SVG LANDMARK ICONS
   Each takes a `c` (color) prop
══════════════════════════════════════════════════ */

/* Fernsehturm — sphere + spire + tapered legs */
const Fernsehturm = ({ c }) => (
  <svg viewBox="0 0 40 100" className="lm-svg" xmlns="http://www.w3.org/2000/svg">
    <rect x="19.5" y="2"  width="1.5" height="22" fill={c} />
    <circle cx="20"  cy="32" r="10"  fill={c} opacity=".9" />
    <ellipse cx="20" cy="42" rx="12" ry="2.5" fill={c} opacity=".3" />
    <path d="M13,44 L27,44 L30,100 L10,100 Z" fill={c} opacity=".7" />
    <ellipse cx="20" cy="100" rx="18" ry="3" fill={c} opacity=".2" />
    {/* observation deck ring */}
    <rect x="13" y="38" width="14" height="3" rx="1" fill={c} opacity=".5" />
  </svg>
)

/* Weltzeituhr — revolving clock disc + column + radiating lines */
const Weltzeituhr = ({ c }) => (
  <svg viewBox="0 0 80 100" className="lm-svg" xmlns="http://www.w3.org/2000/svg">
    {/* column */}
    <rect x="37" y="50" width="6" height="48" fill={c} opacity=".65" />
    {/* disc outline */}
    <ellipse cx="40" cy="28" rx="30" ry="8" fill="none" stroke={c} strokeWidth="2.5" />
    {/* spokes */}
    {Array.from({ length: 12 }, (_, i) => {
      const a = (i * 30 * Math.PI) / 180
      return (
        <line key={i}
          x1="40" y1="28"
          x2={40 + 28 * Math.sin(a)}
          y2={28 + 8 * Math.cos(a) - 8}
          stroke={c} strokeWidth="1.4" opacity=".5"
        />
      )
    })}
    {/* inner hub */}
    <ellipse cx="40" cy="28" rx="8"  ry="2.4" fill={c} opacity=".75" />
    {/* base flare */}
    <ellipse cx="40" cy="50" rx="7"  ry="2.2" fill={c} opacity=".45" />
  </svg>
)

/* Neptunbrunnen — tiered fountain with splash lines */
const Neptunbrunnen = ({ c }) => (
  <svg viewBox="0 0 80 90" className="lm-svg" xmlns="http://www.w3.org/2000/svg">
    {/* figure on top */}
    <rect x="39" y="4"  width="2"  height="16" fill={c} />
    <circle cx="40" cy="3" r="3" fill={c} opacity=".8" />
    {/* upper bowl */}
    <ellipse cx="40" cy="24" rx="10" ry="3" fill={c} opacity=".55" />
    <rect x="38" y="27"  width="4"  height="20" fill={c} opacity=".65" />
    {/* middle basin */}
    <ellipse cx="40" cy="50" rx="20" ry="5.5" fill="none" stroke={c} strokeWidth="2.2" />
    {/* splash lines from middle */}
    {[-14, -7, 0, 7, 14].map(x => (
      <line key={x}
        x1={40 + x} y1="48"
        x2={40 + x * 1.45} y2="39"
        stroke={c} strokeWidth=".9" opacity=".4"
      />
    ))}
    {/* outer basin */}
    <ellipse cx="40" cy="68" rx="34" ry="9" fill="none" stroke={c} strokeWidth="2.8" />
    {/* base */}
    <rect x="34" y="77" width="12" height="13" fill={c} opacity=".55" />
  </svg>
)

/* Park Inn Berlin — tall rectangular grid tower */
const ParkInn = ({ c }) => (
  <svg viewBox="0 0 50 100" className="lm-svg" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="4" width="34" height="94" fill={c} opacity=".72" />
    {/* window grid */}
    {Array.from({ length: 7 }, (_, row) =>
      Array.from({ length: 3 }, (_, col) => (
        <rect
          key={`${row}-${col}`}
          x={12 + col * 10} y={10 + row * 11}
          width="7" height="8"
          fill={c} opacity=".35" rx=".5"
        />
      ))
    )}
    {/* roof antenna */}
    <rect x="23" y="1" width="4" height="3" fill={c} opacity=".9" />
    {/* ground level */}
    <rect x="6"  y="90" width="38" height="8" fill={c} opacity=".5" />
  </svg>
)

/* Rotes Rathaus — brick building, centre tower, arched windows */
const RotesRathaus = ({ c }) => (
  <svg viewBox="0 0 100 100" className="lm-svg" xmlns="http://www.w3.org/2000/svg">
    {/* main body */}
    <rect x="5"  y="52" width="90" height="48" fill={c} opacity=".62" />
    {/* centre tower */}
    <rect x="36" y="28" width="28" height="24" fill={c} opacity=".82" />
    {/* triangular pediment */}
    <polygon points="50,10 36,28 64,28" fill={c} />
    {/* clock face circle on tower */}
    <circle cx="50" cy="38" r="5" fill={c} opacity=".35" />
    <circle cx="50" cy="38" r="5" fill="none" stroke={c} strokeWidth="1" opacity=".7" />
    {/* ground floor arched windows */}
    {[0, 1, 2, 3].map(i => (
      <rect key={i} x={10 + i * 22} y="62" width="14" height="18" rx="7 7 0 0" fill={c} opacity=".28" />
    ))}
    {/* tower windows */}
    <rect x="43" y="33" width="6" height="10" rx="3 3 0 0" fill={c} opacity=".35" />
    {/* door */}
    <rect x="43" y="78" width="14" height="22" rx="7 7 0 0" fill={c} opacity=".5" />
  </svg>
)

/* U+S Bahnhof — the blue U and green S signs + platform lines */
const UBahnhof = ({ c }) => (
  <svg viewBox="0 0 80 80" className="lm-svg" xmlns="http://www.w3.org/2000/svg">
    {/* U sign */}
    <rect x="4"  y="4"  width="32" height="32" rx="6" fill={c} opacity=".9" />
    <text x="20" y="29" textAnchor="middle" fontSize="22" fontWeight="bold"
      fill="#06030e" fontFamily="'Space Mono',system-ui,sans-serif">U</text>
    {/* S sign */}
    <rect x="44" y="4"  width="32" height="32" rx="6" fill={c} opacity=".9" />
    <text x="60" y="29" textAnchor="middle" fontSize="22" fontWeight="bold"
      fill="#06030e" fontFamily="'Space Mono',system-ui,sans-serif">S</text>
    {/* platform tracks */}
    <rect x="4" y="50" width="72" height="4" fill={c} opacity=".42" />
    <rect x="4" y="60" width="72" height="4" fill={c} opacity=".26" />
    <rect x="4" y="70" width="72" height="4" fill={c} opacity=".14" />
  </svg>
)

const ICON_MAP = {
  fernsehturm:  Fernsehturm,
  weltzeituhr:  Weltzeituhr,
  neptunbrunnen: Neptunbrunnen,
  'park-inn':   ParkInn,
  rathaus:      RotesRathaus,
  ubahn:        UBahnhof,
}

/* ══════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════ */
function makeCards() {
  const pairs = LANDMARKS.flatMap(lm => [
    { landmarkId: lm.id },
    { landmarkId: lm.id },
  ])
  /* Fisher-Yates shuffle */
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]]
  }
  return pairs
}

/* ══════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════ */
export default function Station2Memory({ onComplete }) {
  const [cards]     = useState(makeCards)
  const [flipped,   setFlipped]   = useState([])     // indices currently face-up & unmatched
  const [matched,   setMatched]   = useState(new Set()) // landmark ids fully matched
  const [wrong,     setWrong]     = useState([])     // indices briefly highlighted red
  const [lockBoard, setLockBoard] = useState(false)
  const [moves,     setMoves]     = useState(0)
  const [done,      setDone]      = useState(false)

  /* Detect completion */
  useEffect(() => {
    if (matched.size === LANDMARKS.length) {
      const t = setTimeout(() => setDone(true), 600)
      return () => clearTimeout(t)
    }
  }, [matched.size])

  const handleCard = (idx) => {
    if (lockBoard)                           return
    if (flipped.includes(idx))               return
    if (matched.has(cards[idx].landmarkId))  return

    const next = [...flipped, idx]
    setFlipped(next)

    if (next.length < 2) return

    /* Two cards flipped — check for match */
    setMoves(m => m + 1)
    const [a, b] = next

    if (cards[a].landmarkId === cards[b].landmarkId) {
      /* MATCH */
      setMatched(prev => new Set([...prev, cards[a].landmarkId]))
      setFlipped([])
    } else {
      /* MISMATCH — show red briefly, then flip back */
      setLockBoard(true)
      setWrong(next)
      setTimeout(() => {
        setFlipped([])
        setWrong([])
        setLockBoard(false)
      }, 950)
    }
  }

  const isFaceUp = idx => flipped.includes(idx) || matched.has(cards[idx].landmarkId)
  const isMatched = idx => matched.has(cards[idx].landmarkId)
  const isWrong   = idx => wrong.includes(idx)

  const progress = (matched.size / LANDMARKS.length) * 100

  return (
    <div className="station-memory">
      <p className="station-instruction">
        Flip tiles to find matching landmarks. Every unmatched pair keeps Alexanderplatz disorienting —
        an identical confusion of blocks. Match all six to restore the city's memory.
      </p>

      {/* Progress bar */}
      <div className="mem-progress">
        <div className="mem-prog-bar">
          <div className="mem-prog-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="mem-prog-text">{matched.size} / {LANDMARKS.length} FOUND</div>
      </div>

      {/* Completion message */}
      {done && (
        <div className="mem-complete">
          <div className="mem-complete-title">MEMORY RESTORED</div>
          <div className="mem-complete-sub">
            All six landmarks identified.<br />
            You know where you are. Alexanderplatz recognised.
          </div>
        </div>
      )}

      {/* Card grid */}
      {!done && (
        <div className="mem-grid">
          {cards.map((card, idx) => {
            const lm   = LANDMARKS.find(l => l.id === card.landmarkId)
            const Icon = ICON_MAP[card.landmarkId]

            return (
              <div
                key={idx}
                className={[
                  'mem-card',
                  isFaceUp(idx)  ? 'is-flipped' : '',
                  isMatched(idx) ? 'is-matched'  : '',
                  isWrong(idx)   ? 'is-wrong'    : '',
                  lockBoard && !isFaceUp(idx) ? 'is-locked' : '',
                ].join(' ')}
                onClick={() => handleCard(idx)}
              >
                <div className="mem-card-inner">

                  {/* BACK FACE — confusing identical pattern */}
                  <div className="mem-back">
                    <div className="mem-back-grid">
                      {BACK_CHARS.map((ch, i) => (
                        <div
                          key={i}
                          className="mbp-cell"
                          style={{ animationDelay: `${i * 0.28}s` }}
                        >
                          {ch}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FRONT FACE — landmark revealed */}
                  <div className="mem-front">
                    <div className="lm-svg-wrap">
                      <Icon c={lm.color} />
                    </div>
                    <div className="lm-name" style={{ color: lm.color }}>{lm.name}</div>
                    <div className="lm-sub">{lm.sub}</div>
                  </div>

                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Stats row */}
      <div className="mem-stats">
        <span>MOVES: {moves}</span>
        <span style={{ color: matched.size === LANDMARKS.length ? 'var(--green)' : 'var(--dim)' }}>
          {matched.size === LANDMARKS.length
            ? '✓ ALL LANDMARKS IDENTIFIED'
            : `LANDMARKS: ${matched.size} / ${LANDMARKS.length}`}
        </span>
      </div>

      <button
        className="confirm-btn"
        disabled={!done}
        onClick={() => onComplete('preserve')}
      >
        {done
          ? 'COMMIT MEMORY TO ARCHIVE'
          : `MATCH ALL LANDMARKS TO UNLOCK  (${matched.size}/${LANDMARKS.length})`}
      </button>
    </div>
  )
}
