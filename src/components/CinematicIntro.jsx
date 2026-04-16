import { useState, useRef, useEffect } from 'react'

// The voiceover script — each line is spoken aloud and shown on screen
const SCRIPT = [
  "Berlin. Alexanderplatz.",
  "An urban control system — gone critical.",
  "Five networks govern this city.",
  "People. Memory. Environment. Economy. Infrastructure.",
  "All five — collapsing simultaneously.",
  "The operators have abandoned their posts.",
  "You are the last one here.",
  "You have sixty minutes.",
  "Configure the systems.",
  "Choose what this city becomes.",
  "This — is PROTOCOL.",
]

// Pick the best available voice (prefers a deep English male voice)
function selectVoice() {
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find(v => v.name === 'Google UK English Male') ||
    voices.find(v => v.name.includes('David') && v.lang.startsWith('en')) ||
    voices.find(v => v.name === 'Alex') ||
    voices.find(v => v.lang === 'en-GB') ||
    voices.find(v => v.lang.startsWith('en')) ||
    null
  )
}

// Speak a single line — returns a Promise that resolves when speech ends
function speakLine(text) {
  return new Promise(resolve => {
    const synth = window.speechSynthesis
    synth.cancel()

    const u = new SpeechSynthesisUtterance(text)
    u.rate  = 0.78   // slightly slower than normal — more dramatic
    u.pitch = 0.55   // lower pitch — robotic / authoritative
    u.volume = 0.9

    const voice = selectVoice()
    if (voice) u.voice = voice

    let finished = false
    function done() { if (!finished) { finished = true; resolve() } }

    u.onend  = done
    u.onerror = done
    // Safety fallback: ~10 chars/sec + 1.3s buffer so we never get stuck
    setTimeout(done, Math.ceil(text.length / 10) * 1000 + 1300)

    synth.speak(u)
  })
}

function pause(ms) { return new Promise(r => setTimeout(r, ms)) }

export default function CinematicIntro({ onComplete }) {
  const [phase, setPhase]           = useState('waiting')  // 'waiting' | 'playing' | 'title'
  const [shownLines, setShownLines] = useState([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [fadeOut, setFadeOut]       = useState(false)
  const cancelRef = useRef(false)

  // Cleanup: cancel speech if the component is removed
  useEffect(() => {
    return () => {
      cancelRef.current = true
      window.speechSynthesis.cancel()
    }
  }, [])

  async function runSequence() {
    cancelRef.current = false

    // Chrome loads voices asynchronously — wait up to 1.5 s
    if (window.speechSynthesis.getVoices().length === 0) {
      await new Promise(r => {
        window.speechSynthesis.onvoiceschanged = r
        setTimeout(r, 1500)
      })
    }

    for (let i = 0; i < SCRIPT.length; i++) {
      if (cancelRef.current) return
      setActiveIndex(i)
      setShownLines(SCRIPT.slice(0, i + 1))
      await speakLine(SCRIPT[i])
      if (cancelRef.current) return
      await pause(340)
    }

    // All lines done — flash the PROTOCOL title
    setPhase('title')
    await pause(2800)
    if (cancelRef.current) return

    setFadeOut(true)
    await pause(1000)
    onComplete()
  }

  function handleStart() {
    setPhase('playing')
    runSequence()
  }

  function handleSkip() {
    cancelRef.current = true
    window.speechSynthesis.cancel()
    setFadeOut(true)
    setTimeout(onComplete, 700)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Courier New', monospace",
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 1s ease',
    }}>

      {/* ── WAITING: click to begin ── */}
      {phase === 'waiting' && (
        <div onClick={handleStart} style={{ cursor: 'pointer', textAlign: 'center' }}>
          <div style={{
            fontSize: '64px', letterSpacing: '20px', color: '#ff69b4',
            textShadow: '0 0 60px rgba(255,105,180,0.25)',
            marginBottom: 44,
            userSelect: 'none',
          }}>
            PROTOCOL
          </div>
          <div style={{
            fontSize: '11px', letterSpacing: '5px',
            color: 'rgba(255,105,180,0.55)',
            animation: 'cin-blink 2s ease-in-out infinite',
          }}>
            ◈ CLICK ANYWHERE TO BEGIN ◈
          </div>
        </div>
      )}

      {/* ── PLAYING: lines appear one by one ── */}
      {phase === 'playing' && (
        <div style={{
          maxWidth: 700, width: '90%', textAlign: 'center',
          display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center',
        }}>
          {shownLines.map((line, i) => {
            const isActive = i === activeIndex
            return (
              <div key={i} style={{
                color: isActive ? '#ffffff' : 'rgba(255,255,255,0.13)',
                fontSize: isActive ? '24px' : '13px',
                letterSpacing: isActive ? '3px' : '2px',
                textShadow: isActive ? '0 0 32px rgba(255,255,255,0.85)' : 'none',
                transition: 'all 0.65s ease',
                lineHeight: 1.5,
              }}>
                {line}
              </div>
            )
          })}
        </div>
      )}

      {/* ── TITLE: PROTOCOL blazes in pink ── */}
      {phase === 'title' && (
        <div style={{
          fontSize: '80px', letterSpacing: '22px', color: '#ff69b4',
          textShadow: '0 0 80px rgba(255,105,180,1), 0 0 40px rgba(255,105,180,0.5)',
          animation: 'cin-title-in 0.8s ease forwards',
          userSelect: 'none',
        }}>
          PROTOCOL
        </div>
      )}

      {/* SKIP button — only visible while playing */}
      {phase === 'playing' && (
        <button onClick={handleSkip} style={{
          position: 'absolute', bottom: 28, right: 28,
          background: 'none', border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.28)', fontSize: '10px',
          letterSpacing: '3px', padding: '7px 14px',
          cursor: 'pointer', fontFamily: "'Courier New', monospace",
          transition: 'color 0.2s, border-color 0.2s',
        }}
          onMouseEnter={e => { e.target.style.color = 'rgba(255,255,255,0.7)'; e.target.style.borderColor = 'rgba(255,255,255,0.4)' }}
          onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,0.28)'; e.target.style.borderColor = 'rgba(255,255,255,0.12)' }}
        >
          SKIP ▶
        </button>
      )}

      <style>{`
        @keyframes cin-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.15; }
        }
        @keyframes cin-title-in {
          0%   { opacity: 0; transform: scale(0.82); filter: blur(14px); }
          100% { opacity: 1; transform: scale(1);    filter: blur(0);    }
        }
      `}</style>
    </div>
  )
}
