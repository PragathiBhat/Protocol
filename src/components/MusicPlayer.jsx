import { useState, useEffect, useRef } from 'react'

const TRACKS = [
  { name: 'TECHNO',  bpm: 130 },
  { name: 'CYBER',   bpm: 145 },
  { name: 'PULSE',   bpm: 120 },
]

/* ══════════════════════════════════════════════
   DRUM HITS
   ══════════════════════════════════════════════ */
function kick(ctx, out, t) {
  const osc = ctx.createOscillator()
  const g   = ctx.createGain()
  osc.frequency.setValueAtTime(180, t)
  osc.frequency.exponentialRampToValueAtTime(0.001, t + 0.45)
  g.gain.setValueAtTime(1.0, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.45)
  osc.connect(g); g.connect(out)
  osc.start(t); osc.stop(t + 0.5)
}

function snare(ctx, out, noiseBuffer, t) {
  // Noise body
  const src = ctx.createBufferSource(); src.buffer = noiseBuffer
  const bp  = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1200; bp.Q.value = 0.8
  const ng  = ctx.createGain()
  ng.gain.setValueAtTime(0.9, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
  src.connect(bp); bp.connect(ng); ng.connect(out)
  src.start(t); src.stop(t + 0.2)

  // Tone snap
  const osc = ctx.createOscillator(); const og = ctx.createGain()
  osc.frequency.value = 200
  og.gain.setValueAtTime(0.5, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
  osc.connect(og); og.connect(out); osc.start(t); osc.stop(t + 0.1)
}

function hihat(ctx, out, noiseBuffer, t, open = false) {
  const src = ctx.createBufferSource(); src.buffer = noiseBuffer
  const hp  = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 8500
  const g   = ctx.createGain()
  const len = open ? 0.22 : 0.04
  g.gain.setValueAtTime(0.28, t); g.gain.exponentialRampToValueAtTime(0.001, t + len)
  src.connect(hp); hp.connect(g); g.connect(out)
  src.start(t); src.stop(t + len + 0.02)
}

function synthBass(ctx, out, t, freq, dur) {
  const osc  = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = freq
  const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 120
  filt.frequency.setValueAtTime(1800, t)
  filt.frequency.exponentialRampToValueAtTime(120, t + 0.08)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.55, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.85)
  osc.connect(filt); filt.connect(g); g.connect(out)
  osc.start(t); osc.stop(t + dur)
}

function synthLead(ctx, out, t, freq, dur) {
  const osc = ctx.createOscillator(); osc.type = 'square'; osc.frequency.value = freq
  const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'
  filt.frequency.setValueAtTime(2400, t)
  filt.frequency.exponentialRampToValueAtTime(400, t + dur * 0.6)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.9)
  osc.connect(filt); filt.connect(g); g.connect(out)
  osc.start(t); osc.stop(t + dur)
}

/* ══════════════════════════════════════════════
   PATTERNS  (16 steps each, 1 = hit, 0 = rest)
   ══════════════════════════════════════════════ */

// TECHNO 130 BPM — four-on-the-floor
const TECHNO = {
  kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
  snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
  hh:    [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
  ho:    [0,0,0,1, 0,0,0,1, 0,0,0,1, 0,0,0,1],
  bass:  [55, 0,55, 0, 55, 0,41,0,  55, 0,55, 0, 55,49,0,49],
  lead:  [0,0,0,0, 220,0,0,0, 0,0,262,0, 0,0,0,330],
}

// CYBER 145 BPM — fast rolling hi-hats, syncopated kick
const CYBER = {
  kick:  [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,1,0,0],
  snare: [0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,1,0],
  hh:    [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
  ho:    [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0],
  bass:  [73,0,73,73, 0,0,73,0, 73,0,55,0, 73,0,0,73],
  lead:  [0,0,440,0, 0,0,523,0, 0,0,440,0, 392,0,0,0],
}

// PULSE 120 BPM — groove, heavy bass
const PULSE = {
  kick:  [1,0,0,0, 0,0,1,0, 1,0,0,1, 0,0,0,0],
  snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1],
  hh:    [1,0,1,1, 0,1,1,0, 1,0,1,1, 0,1,0,1],
  ho:    [0,0,0,0, 0,1,0,0, 0,0,0,0, 0,0,1,0],
  bass:  [49,0,0,49, 49,0,49,0, 41,0,41,0, 49,49,0,0],
  lead:  [0,0,0,0, 196,0,0,0, 0,0,220,0, 196,0,0,0],
}

const ALL_PATTERNS = [TECHNO, CYBER, PULSE]

/* ══════════════════════════════════════════════
   SEQUENCER ENGINE
   ══════════════════════════════════════════════ */
function createEngine(ctx, master, bpm, pattern, noiseBuffer) {
  const stepLen  = (60 / bpm) / 4   // 16th note duration
  const AHEAD    = 0.15              // schedule this many seconds ahead
  let   step     = 0
  let   nextTime = ctx.currentTime + 0.05

  const id = setInterval(() => {
    while (nextTime < ctx.currentTime + AHEAD) {
      const s   = step % 16
      const t   = nextTime

      if (pattern.kick[s])  kick(ctx, master, t)
      if (pattern.snare[s]) snare(ctx, master, noiseBuffer, t)
      if (pattern.hh[s])    hihat(ctx, master, noiseBuffer, t, false)
      if (pattern.ho[s])    hihat(ctx, master, noiseBuffer, t, true)
      if (pattern.bass[s])  synthBass(ctx, master, t, pattern.bass[s], stepLen * 1.8)
      if (pattern.lead[s])  synthLead(ctx, master, t, pattern.lead[s], stepLen * 1.6)

      nextTime += stepLen
      step++
    }
  }, 20)

  return () => clearInterval(id)
}

/* ══════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════ */
export default function MusicPlayer() {
  const [muted,   setMuted]   = useState(false)
  const [track,   setTrack]   = useState(0)
  const [started, setStarted] = useState(false)

  const ctxRef    = useRef(null)
  const masterRef = useRef(null)
  const noiseRef  = useRef(null)
  const stopRef   = useRef(null)

  useEffect(() => {
    const start = () => {
      if (ctxRef.current) return
      const ctx    = new (window.AudioContext || window.webkitAudioContext)()
      const master = ctx.createGain(); master.gain.value = 0.55
      master.connect(ctx.destination)

      // Build shared noise buffer once
      const buf  = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1

      ctxRef.current    = ctx
      masterRef.current = master
      noiseRef.current  = buf
      stopRef.current   = createEngine(ctx, master, TRACKS[0].bpm, ALL_PATTERNS[0], buf)
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
    stopRef.current = createEngine(
      ctxRef.current, masterRef.current,
      TRACKS[next].bpm, ALL_PATTERNS[next], noiseRef.current
    )
    setTrack(next)
  }

  const toggleMute = (e) => {
    e.stopPropagation()
    if (!ctxRef.current) return
    const newMuted = !muted
    setMuted(newMuted)
    masterRef.current.gain.setTargetAtTime(
      newMuted ? 0 : 0.55,
      ctxRef.current.currentTime, 0.1
    )
  }

  return (
    <div className={`music-player ${started ? 'mp-on' : 'mp-off'}`}>
      <div className="mp-indicator" aria-hidden>
        {started && !muted
          ? [0,1,2,3].map(i => <div key={i} className="mp-bar" style={{ animationDelay:`${i*0.12}s` }}/>)
          : <div className="mp-bar mp-bar-flat"/>
        }
      </div>
      <button className="mp-track-btn" onClick={switchTrack} title="Switch track">
        {TRACKS[track].name} <span style={{opacity:.5, fontSize:'7px'}}>{TRACKS[track].bpm}</span>
      </button>
      <button className="mp-mute-btn" onClick={toggleMute}>
        {muted ? '[ OFF ]' : '[ ON ]'}
      </button>
    </div>
  )
}
