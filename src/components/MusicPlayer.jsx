import { useState, useEffect, useRef } from 'react'

const TRACKS = [
  { name: 'CHIME',  desc: 'Bell tones'   },
  { name: 'PAD',    desc: 'Soft warmth'  },
  { name: 'DRIFT',  desc: 'Gentle flow'  },
]

/* ── Shared helpers ── */
function mkOsc(ctx, type, freq) {
  const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; return o
}
function mkGain(ctx, val) {
  const g = ctx.createGain(); g.gain.value = val; return g
}

/* ── Track 1: CHIME ── gentle bell tones in C major pentatonic + soft pad */
function buildChime(ctx, master) {
  const nodes = []
  const timers = []

  // Soft C-major pad underneath (C3 E3 G3)
  ;[[130.8, 0.06], [164.8, 0.04], [196.0, 0.04]].forEach(([freq, amp]) => {
    const o = mkOsc(ctx, 'sine', freq)
    const g = mkGain(ctx, 0)
    const lfo = mkOsc(ctx, 'sine', 0.04)
    const lfoG = mkGain(ctx, amp)
    lfo.connect(lfoG); lfoG.connect(g.gain)
    g.gain.setTargetAtTime(amp, ctx.currentTime, 1.5)
    o.connect(g); g.connect(master)
    o.start(); lfo.start()
    nodes.push(o, lfo)
  })

  // Pentatonic scale for bells: C4 D4 E4 G4 A4 C5
  const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]

  function ringBell() {
    const freq = scale[Math.floor(Math.random() * scale.length)]
    const o = mkOsc(ctx, 'sine', freq)
    const g = mkGain(ctx, 0)
    // Bell envelope: fast attack, slow exponential decay
    g.gain.setValueAtTime(0, ctx.currentTime)
    g.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.01)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.5)
    o.connect(g); g.connect(master)
    o.start(); o.stop(ctx.currentTime + 3.6)
    // Schedule next bell (2–6 s gap)
    const delay = 2000 + Math.random() * 4000
    timers.push(setTimeout(ringBell, delay))
  }
  timers.push(setTimeout(ringBell, 800))

  return () => {
    nodes.forEach(n => { try { n.stop() } catch (_) {} })
    timers.forEach(t => clearTimeout(t))
  }
}

/* ── Track 2: PAD ── warm major-7th chord, very soft */
function buildPad(ctx, master) {
  const nodes = []

  // C2 root + C3 + E3 + G3 + B3 (Cmaj7) — gentle and warm
  ;[
    [65.4,  0.12, 0.03],   // C2  deep root
    [130.8, 0.08, 0.05],   // C3
    [164.8, 0.07, 0.04],   // E3
    [196.0, 0.06, 0.035],  // G3
    [246.9, 0.04, 0.025],  // B3
    [392.0, 0.025, 0.02],  // G4 shimmer
  ].forEach(([freq, amp, lfoDepth], i) => {
    const o   = mkOsc(ctx, 'sine', freq)
    const g   = mkGain(ctx, 0)
    const lfo = mkOsc(ctx, 'sine', 0.02 + i * 0.008)
    const lfoG = mkGain(ctx, lfoDepth)
    lfo.connect(lfoG); lfoG.connect(g.gain)
    // Fade in gently
    g.gain.setTargetAtTime(amp, ctx.currentTime, 2)
    o.connect(g); g.connect(master)
    o.start(); lfo.start()
    nodes.push(o, lfo)
  })

  return () => nodes.forEach(n => { try { n.stop() } catch (_) {} })
}

/* ── Track 3: DRIFT ── slowly moving pentatonic swells */
function buildDrift(ctx, master) {
  const nodes = []
  const timers = []

  // Quiet base: G2 + D3
  ;[[98, 0.09], [146.8, 0.06]].forEach(([freq, amp]) => {
    const o   = mkOsc(ctx, 'triangle', freq)
    const g   = mkGain(ctx, 0)
    const lfo = mkOsc(ctx, 'sine', 0.03)
    const lfoG = mkGain(ctx, amp * 0.6)
    lfo.connect(lfoG); lfoG.connect(g.gain)
    g.gain.setTargetAtTime(amp, ctx.currentTime, 2)
    o.connect(g); g.connect(master)
    o.start(); lfo.start()
    nodes.push(o, lfo)
  })

  // Gentle swells on G major pentatonic: G3 A3 B3 D4 E4
  const swell = [196.0, 220.0, 246.9, 293.7, 329.6]

  function doSwell() {
    const freq = swell[Math.floor(Math.random() * swell.length)]
    const o = mkOsc(ctx, 'sine', freq)
    const g = mkGain(ctx, 0)
    const rise = 2.5 + Math.random() * 2
    const hold = 1.5
    const fall = 4
    g.gain.setValueAtTime(0, ctx.currentTime)
    g.gain.linearRampToValueAtTime(0.09, ctx.currentTime + rise)
    g.gain.setValueAtTime(0.09, ctx.currentTime + rise + hold)
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + rise + hold + fall)
    o.connect(g); g.connect(master)
    o.start(); o.stop(ctx.currentTime + rise + hold + fall + 0.1)
    const next = (rise + hold + fall) * 1000 * 0.6
    timers.push(setTimeout(doSwell, next))
  }
  timers.push(setTimeout(doSwell, 600))
  timers.push(setTimeout(doSwell, 3200))

  return () => {
    nodes.forEach(n => { try { n.stop() } catch (_) {} })
    timers.forEach(t => clearTimeout(t))
  }
}

const BUILDERS = [buildChime, buildPad, buildDrift]

export default function MusicPlayer() {
  const [muted,   setMuted]   = useState(false)
  const [track,   setTrack]   = useState(0)
  const [started, setStarted] = useState(false)

  const ctxRef    = useRef(null)
  const masterRef = useRef(null)
  const stopRef   = useRef(null)

  useEffect(() => {
    const start = () => {
      if (ctxRef.current) return
      const ctx    = new (window.AudioContext || window.webkitAudioContext)()
      const master = ctx.createGain()
      master.gain.value = 0.42
      master.connect(ctx.destination)
      ctxRef.current    = ctx
      masterRef.current = master
      stopRef.current   = BUILDERS[0](ctx, master)
      setStarted(true)
    }
    document.addEventListener('click', start, { once: true })
    return () => document.removeEventListener('click', start)
  }, [])

  const switchTrack = (e) => {
    e.stopPropagation()
    if (!ctxRef.current) return
    const next = (track + 1) % TRACKS.length
    if (stopRef.current) stopRef.current()
    stopRef.current = BUILDERS[next](ctxRef.current, masterRef.current)
    setTrack(next)
  }

  const toggleMute = (e) => {
    e.stopPropagation()
    if (!ctxRef.current) return
    const newMuted = !muted
    setMuted(newMuted)
    masterRef.current.gain.setTargetAtTime(
      newMuted ? 0 : 0.42,
      ctxRef.current.currentTime,
      0.5
    )
  }

  return (
    <div className={`music-player ${started ? 'mp-on' : 'mp-off'}`}>
      <div className="mp-indicator" aria-hidden>
        {started && !muted
          ? [0,1,2,3].map(i => <div key={i} className="mp-bar" style={{ animationDelay:`${i*0.18}s` }}/>)
          : <div className="mp-bar mp-bar-flat"/>
        }
      </div>
      <button className="mp-track-btn" onClick={switchTrack} title="Switch track">
        {TRACKS[track].name}
      </button>
      <button className="mp-mute-btn" onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'}>
        {muted ? '[ OFF ]' : '[ ON ]'}
      </button>
    </div>
  )
}
