import { useState, useEffect, useRef } from 'react'

const TRACKS = [
  { name: 'CINEMATIC', desc: 'Dark orchestral' },
  { name: 'MYSTERY',   desc: 'Floating sparse'  },
  { name: 'VOID',      desc: 'Deep space'        },
]

/* ── Shared helpers ── */
const mkOsc  = (ctx, type, freq) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; return o }
const mkGain = (ctx, val)         => { const g = ctx.createGain(); g.gain.value = val; return g }
const mkFilt = (ctx, type, freq, q=1) => { const f = ctx.createBiquadFilter(); f.type=type; f.frequency.value=freq; f.Q.value=q; return f }
const mkDelay = (ctx, t) => { const d = ctx.createDelay(2); d.delayTime.value = t; return d }

/* ── Simulated reverb (feedback delay network) ── */
function makeReverb(ctx, master) {
  const wet   = mkGain(ctx, 0.28)
  const dry   = mkGain(ctx, 0.72)
  const d1    = mkDelay(ctx, 0.32)
  const d2    = mkDelay(ctx, 0.47)
  const fb1   = mkGain(ctx, 0.28)
  const fb2   = mkGain(ctx, 0.22)
  const lpf   = mkFilt(ctx, 'lowpass', 3200)
  d1.connect(fb1); fb1.connect(d1); d1.connect(lpf)
  d2.connect(fb2); fb2.connect(d2); d2.connect(lpf)
  lpf.connect(wet); wet.connect(master)
  // Returns an input node that routes to both dry + reverb
  const input = mkGain(ctx, 1)
  input.connect(dry);   dry.connect(master)
  input.connect(d1);    input.connect(d2)
  return input
}

/* ══════════════════════════════════════════════════════
   TRACK 1 — CINEMATIC
   Dark orchestral: A-minor pad swells + deep bass + shimmer
   ══════════════════════════════════════════════════════ */
function buildCinematic(ctx, master) {
  const nodes = []
  const timers = []
  const rev = makeReverb(ctx, master)

  // Deep bass foundation — A1 55Hz
  const bass = mkOsc(ctx, 'sine', 55); const bassG = mkGain(ctx, 0)
  bassG.gain.setTargetAtTime(0.18, ctx.currentTime, 2)
  bass.connect(bassG); bassG.connect(master); bass.start(); nodes.push(bass)

  // A-minor chord — A2 C3 E3 A3 (110 / 130.8 / 164.8 / 220 Hz)
  ;[
    [110,   0.09, 'triangle', 0.032],
    [130.8, 0.07, 'triangle', 0.025],
    [164.8, 0.06, 'sine',     0.02 ],
    [220,   0.04, 'sine',     0.015],
  ].forEach(([freq, amp, type, lfoD], i) => {
    const o   = mkOsc(ctx, type, freq)
    const g   = mkGain(ctx, 0)
    const lfo = mkOsc(ctx, 'sine', 0.03 + i * 0.007)
    const lG  = mkGain(ctx, lfoD)
    lfo.connect(lG); lG.connect(g.gain)
    g.gain.setTargetAtTime(amp, ctx.currentTime, 3 + i * 0.5)
    o.connect(g); g.connect(rev); o.start(); lfo.start()
    nodes.push(o, lfo)
  })

  // Cinematic string-like swell: slow Am arpeggio
  const swellNotes = [220, 261.6, 329.6, 440, 329.6, 261.6]
  let swellIdx = 0
  function swell() {
    const freq = swellNotes[swellIdx % swellNotes.length]
    swellIdx++
    const o = mkOsc(ctx, 'triangle', freq)
    const g = mkGain(ctx, 0)
    const rise = 2.2, hold = 1.8, fall = 3.5
    g.gain.setValueAtTime(0, ctx.currentTime)
    g.gain.linearRampToValueAtTime(0.06, ctx.currentTime + rise)
    g.gain.setValueAtTime(0.06, ctx.currentTime + rise + hold)
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + rise + hold + fall)
    o.connect(g); g.connect(rev)
    o.start(); o.stop(ctx.currentTime + rise + hold + fall + 0.1)
    timers.push(setTimeout(swell, (rise + hold + fall * 0.5) * 1000))
  }
  timers.push(setTimeout(swell, 1000))
  timers.push(setTimeout(swell, 4500))

  // High shimmer A5 — very faint
  const shim = mkOsc(ctx, 'sine', 880); const shimG = mkGain(ctx, 0)
  shimG.gain.setTargetAtTime(0.016, ctx.currentTime, 4)
  const shimLfo = mkOsc(ctx, 'sine', 0.08); const shimLG = mkGain(ctx, 0.015)
  shimLfo.connect(shimLG); shimLG.connect(shimG.gain)
  shim.connect(shimG); shimG.connect(rev); shim.start(); shimLfo.start()
  nodes.push(shim, shimLfo)

  return () => {
    nodes.forEach(n => { try { n.stop() } catch (_) {} })
    timers.forEach(t => clearTimeout(t))
  }
}

/* ══════════════════════════════════════════════════════
   TRACK 2 — MYSTERY
   Sparse floating notes in D-minor, long silences
   ══════════════════════════════════════════════════════ */
function buildMystery(ctx, master) {
  const nodes = []
  const timers = []
  const rev = makeReverb(ctx, master)

  // Sub bass D1 — barely audible foundation
  const sub = mkOsc(ctx, 'sine', 36.7); const subG = mkGain(ctx, 0)
  subG.gain.setTargetAtTime(0.10, ctx.currentTime, 3)
  sub.connect(subG); subG.connect(master); sub.start(); nodes.push(sub)

  // Slow low pad D2 F2 A2
  ;[[73.4, 0.07], [87.3, 0.05], [110, 0.04]].forEach(([freq, amp], i) => {
    const o   = mkOsc(ctx, 'sine', freq)
    const g   = mkGain(ctx, 0)
    const lfo = mkOsc(ctx, 'sine', 0.02 + i * 0.006)
    const lG  = mkGain(ctx, amp * 0.5)
    lfo.connect(lG); lG.connect(g.gain)
    g.gain.setTargetAtTime(amp, ctx.currentTime, 4)
    o.connect(g); g.connect(rev); o.start(); lfo.start()
    nodes.push(o, lfo)
  })

  // D natural minor scale: D E F G A Bb C D
  const minor = [293.7, 329.6, 349.2, 392.0, 440.0, 466.2, 523.3, 587.3]
  function floatNote() {
    const freq = minor[Math.floor(Math.random() * minor.length)]
    const o = mkOsc(ctx, 'sine', freq)
    const g = mkGain(ctx, 0)
    const attack = 1.8 + Math.random() * 1.5
    const decay  = 4.0 + Math.random() * 3.0
    g.gain.setValueAtTime(0, ctx.currentTime)
    g.gain.linearRampToValueAtTime(0.07, ctx.currentTime + attack)
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + attack + decay)
    o.connect(g); g.connect(rev)
    o.start(); o.stop(ctx.currentTime + attack + decay + 0.1)
    // Long gaps — 3 to 9 seconds between notes
    const gap = 3000 + Math.random() * 6000
    timers.push(setTimeout(floatNote, gap))
  }
  timers.push(setTimeout(floatNote, 500))
  timers.push(setTimeout(floatNote, 3800))
  timers.push(setTimeout(floatNote, 7200))

  return () => {
    nodes.forEach(n => { try { n.stop() } catch (_) {} })
    timers.forEach(t => clearTimeout(t))
  }
}

/* ══════════════════════════════════════════════════════
   TRACK 3 — VOID
   Deep space / urban desolation: slow filter sweep + harmonic shimmer
   ══════════════════════════════════════════════════════ */
function buildVoid(ctx, master) {
  const nodes = []
  const rev = makeReverb(ctx, master)

  // Very deep root G1 49 Hz
  const root = mkOsc(ctx, 'sine', 49); const rootG = mkGain(ctx, 0)
  rootG.gain.setTargetAtTime(0.20, ctx.currentTime, 2.5)
  root.connect(rootG); rootG.connect(master); root.start(); nodes.push(root)

  // Filtered mid layer — slowly sweeping
  ;[[98, 0.07], [147, 0.05], [196, 0.04]].forEach(([freq, amp], i) => {
    const o    = mkOsc(ctx, 'triangle', freq)
    const filt = mkFilt(ctx, 'lowpass', 600, 1.5)
    const g    = mkGain(ctx, 0)

    // Very slow filter LFO sweep
    const fLfo  = mkOsc(ctx, 'sine', 0.018 + i * 0.005)
    const fLfoG = mkGain(ctx, 280)
    fLfo.connect(fLfoG); fLfoG.connect(filt.frequency)

    g.gain.setTargetAtTime(amp, ctx.currentTime, 3)
    o.connect(filt); filt.connect(g); g.connect(rev)
    o.start(); fLfo.start()
    nodes.push(o, fLfo)
  })

  // G-minor shimmer: G4 Bb4 D5
  ;[[392, 0.022], [466.2, 0.016], [587.3, 0.012]].forEach(([freq, amp], i) => {
    const o   = mkOsc(ctx, 'sine', freq)
    const g   = mkGain(ctx, 0)
    const lfo = mkOsc(ctx, 'sine', 0.05 + i * 0.012)
    const lG  = mkGain(ctx, amp * 0.8)
    lfo.connect(lG); lG.connect(g.gain)
    g.gain.setTargetAtTime(amp, ctx.currentTime, 5 + i)
    o.connect(g); g.connect(rev); o.start(); lfo.start()
    nodes.push(o, lfo)
  })

  return () => nodes.forEach(n => { try { n.stop() } catch (_) {} })
}

const BUILDERS = [buildCinematic, buildMystery, buildVoid]

/* ══════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════ */
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
      master.gain.value = 0.40
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
      newMuted ? 0 : 0.40,
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
