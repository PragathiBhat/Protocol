import { useState, useEffect, useRef } from 'react'

/* ── Soundscape definitions ── */
const TRACKS = [
  { name: 'AMBIENT',  desc: 'Dark drone'   },
  { name: 'TENSION',  desc: 'Pulse static' },
  { name: 'MINIMAL',  desc: 'Cold silence' },
]

function buildAmbient(ctx, master) {
  const nodes = []

  function osc(type, freq) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; return o
  }
  function gain(val) {
    const g = ctx.createGain(); g.gain.value = val; return g
  }
  function filter(type, freq, q = 1) {
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; return f
  }

  // Deep bass drone 55 Hz
  const bass = osc('sine', 55);     const bassG = gain(0.22)
  const bassLfo = osc('sine', 0.06); const bassLfoG = gain(2)
  bassLfo.connect(bassLfoG); bassLfoG.connect(bass.frequency)
  bass.connect(bassG); bassG.connect(master)

  // Octave 110 Hz
  const mid = osc('sine', 110);    const midG = gain(0.10)
  const midLfo = osc('sine', 0.04); const midLfoG = gain(1.5)
  midLfo.connect(midLfoG); midLfoG.connect(mid.frequency)
  mid.connect(midG); midG.connect(master)

  // Filtered sawtooth pad 220 Hz
  const saw = osc('sawtooth', 220); const sawFilt = filter('lowpass', 350, 3); const sawG = gain(0.04)
  const filtLfo = osc('sine', 0.025); const filtLfoG = gain(250)
  filtLfo.connect(filtLfoG); filtLfoG.connect(sawFilt.frequency)
  saw.connect(sawFilt); sawFilt.connect(sawG); sawG.connect(master)

  // High shimmer 880 Hz
  const shimmer = osc('sine', 882);  const shimG = gain(0.018)
  const shimLfo = osc('sine', 0.11); const shimLfoG = gain(4)
  shimLfo.connect(shimLfoG); shimLfoG.connect(shimmer.frequency)
  shimmer.connect(shimG); shimG.connect(master)

  // Slow pulse 82.5 Hz
  const pulse = osc('sine', 82.5);  const pulseG = gain(0.08)
  const pulseLfo = osc('sine', 0.18); const pulseLfoG = gain(0.07)
  pulseLfo.connect(pulseLfoG); pulseLfoG.connect(pulseG.gain)
  pulse.connect(pulseG); pulseG.connect(master)

  ;[bass, bassLfo, mid, midLfo, saw, filtLfo, shimmer, shimLfo, pulse, pulseLfo].forEach(n => { n.start(); nodes.push(n) })
  return () => nodes.forEach(n => { try { n.stop() } catch (_) {} })
}

function buildTension(ctx, master) {
  const nodes = []

  function osc(type, freq) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; return o
  }
  function gain(val) { const g = ctx.createGain(); g.gain.value = val; return g }

  // Dissonant tritone drones 55 + 77.8 Hz
  const d1 = osc('sine', 55);   const g1 = gain(0.18); d1.connect(g1); g1.connect(master)
  const d2 = osc('sine', 77.8); const g2 = gain(0.14); d2.connect(g2); g2.connect(master)

  // Faster pulsing beat 1 Hz
  const beat = osc('sine', 110); const beatG = gain(0.12)
  const beatLfo = osc('sine', 1.0); const beatLfoG = gain(0.11)
  beatLfo.connect(beatLfoG); beatLfoG.connect(beatG.gain)
  beat.connect(beatG); beatG.connect(master)

  // High tension whine 660 Hz + slight detune
  const whine = osc('sawtooth', 659); const whineG = gain(0.025)
  const whineLfo = osc('sine', 0.22); const whineLfoG = gain(8)
  whineLfo.connect(whineLfoG); whineLfoG.connect(whine.frequency)
  whine.connect(whineG); whineG.connect(master)

  // Sub rumble 27.5 Hz
  const sub = osc('sine', 27.5); const subG = gain(0.14)
  const subLfo = osc('sine', 0.07); const subLfoG = gain(1.5)
  subLfo.connect(subLfoG); subLfoG.connect(sub.frequency)
  sub.connect(subG); subG.connect(master)

  ;[d1, d2, beat, beatLfo, whine, whineLfo, sub, subLfo].forEach(n => { n.start(); nodes.push(n) })
  return () => nodes.forEach(n => { try { n.stop() } catch (_) {} })
}

function buildMinimal(ctx, master) {
  const nodes = []

  function osc(type, freq) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; return o
  }
  function gain(val) { const g = ctx.createGain(); g.gain.value = val; return g }

  // Three clean sine tones — a quiet chord
  const t1 = osc('sine', 110);  const g1 = gain(0.10)
  const t2 = osc('sine', 138.6);const g2 = gain(0.07)  // minor third
  const t3 = osc('sine', 165);  const g3 = gain(0.06)  // perfect fifth

  const lfo1 = osc('sine', 0.03); const lfoG1 = gain(1.2)
  lfo1.connect(lfoG1); lfoG1.connect(t1.frequency)

  const lfo2 = osc('sine', 0.05); const lfoG2 = gain(0.8)
  lfo2.connect(lfoG2); lfoG2.connect(t2.frequency)

  t1.connect(g1); g1.connect(master)
  t2.connect(g2); g2.connect(master)
  t3.connect(g3); g3.connect(master)

  ;[t1, t2, t3, lfo1, lfo2].forEach(n => { n.start(); nodes.push(n) })
  return () => nodes.forEach(n => { try { n.stop() } catch (_) {} })
}

const BUILDERS = [buildAmbient, buildTension, buildMinimal]

export default function MusicPlayer() {
  const [muted,    setMuted]    = useState(false)
  const [track,    setTrack]    = useState(0)
  const [started,  setStarted]  = useState(false)

  const ctxRef    = useRef(null)
  const masterRef = useRef(null)
  const stopRef   = useRef(null)

  /* Start audio context on first user interaction */
  useEffect(() => {
    const start = () => {
      if (ctxRef.current) return
      const ctx    = new (window.AudioContext || window.webkitAudioContext)()
      const master = ctx.createGain()
      master.gain.value = 0.38
      master.connect(ctx.destination)
      ctxRef.current    = ctx
      masterRef.current = master
      stopRef.current   = BUILDERS[0](ctx, master)
      setStarted(true)
    }
    document.addEventListener('click', start, { once: true })
    return () => document.removeEventListener('click', start)
  }, [])

  /* Switch track */
  const switchTrack = (e) => {
    e.stopPropagation()
    if (!ctxRef.current) return
    const next = (track + 1) % TRACKS.length
    if (stopRef.current) stopRef.current()
    stopRef.current = BUILDERS[next](ctxRef.current, masterRef.current)
    setTrack(next)
  }

  /* Mute / unmute */
  const toggleMute = (e) => {
    e.stopPropagation()
    if (!ctxRef.current) return
    const newMuted = !muted
    setMuted(newMuted)
    masterRef.current.gain.setTargetAtTime(
      newMuted ? 0 : 0.38,
      ctxRef.current.currentTime,
      0.4
    )
  }

  return (
    <div className={`music-player ${started ? 'mp-on' : 'mp-off'}`}>
      <div className="mp-indicator" aria-hidden>
        {started && !muted
          ? [0,1,2,3].map(i => <div key={i} className="mp-bar" style={{ animationDelay: `${i * 0.18}s` }}/>)
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
