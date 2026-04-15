import { useState, useEffect, useRef } from 'react'

const WORD_POOL = [
  { word: 'SHELTER',   hint: 'Protection from the elements — the first need of any human' },
  { word: 'FAMILY',    hint: 'The smallest and oldest social unit known to humanity' },
  { word: 'CULTURE',   hint: 'Shared beliefs, art, and practices passed between generations' },
  { word: 'RITUAL',    hint: 'A repeated ceremony that gives daily life its meaning' },
  { word: 'MIGRATE',   hint: 'To leave one place and settle in another' },
  { word: 'MARKET',    hint: 'Where people gather to exchange goods and ideas' },
  { word: 'HABITAT',   hint: 'The environment a community calls home' },
  { word: 'GATHER',    hint: 'To come together as a group or community' },
  { word: 'MEMORY',    hint: 'How humans preserve the past and pass it on' },
  { word: 'NOMAD',     hint: 'A person who moves from place to place without settling' },
  { word: 'VILLAGE',   hint: 'A small community of people living closely together' },
  { word: 'LANGUAGE',  hint: 'The system humans use to communicate and share meaning' },
  { word: 'TRADE',     hint: 'The exchange of goods that connects communities' },
  { word: 'WORSHIP',   hint: 'A practice of reverence shared by many human societies' },
  { word: 'CITIZEN',   hint: 'A member of a city or nation with rights and duties' },
]

const ROUND_SIZE = 4

function pickRandom(pool, n) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

function scramble(word) {
  const arr = word.split('')
  let result
  let attempts = 0
  do {
    result = [...arr].sort(() => Math.random() - 0.5).join('')
    attempts++
  } while (result === word && attempts < 20)
  return result
}

export default function Station1People({ onComplete, currentValue }) {
  const [round,    setRound]    = useState(() => pickRandom(WORD_POOL, ROUND_SIZE))
  const [index,    setIndex]    = useState(0)
  const [scrambled, setScrambled] = useState(() => scramble(pickRandom(WORD_POOL, ROUND_SIZE)[0].word))
  const [input,    setInput]    = useState('')
  const [feedback, setFeedback] = useState(null)
  const [score,    setScore]    = useState(0)
  const [done,     setDone]     = useState(false)
  const [shake,    setShake]    = useState(false)
  const inputRef = useRef(null)

  // Set scrambled word whenever the round or index changes
  useEffect(() => {
    setScrambled(scramble(round[0].word))
  }, []) // only on mount; we manage scrambled manually on advance

  useEffect(() => {
    inputRef.current?.focus()
  }, [index, done])

  const current = round[index]

  const advance = (newScore) => {
    const nextIndex = index + 1
    if (nextIndex >= ROUND_SIZE) {
      setDone(true)
    } else {
      setIndex(nextIndex)
      setScrambled(scramble(round[nextIndex].word))
      setInput('')
      setFeedback(null)
    }
  }

  const handleSubmit = () => {
    if (!input.trim()) return
    if (input.trim().toUpperCase() === current.word) {
      const newScore = score + 1
      setScore(newScore)
      setFeedback('correct')
      setTimeout(() => advance(newScore), 750)
    } else {
      setFeedback('wrong')
      setShake(true)
      setTimeout(() => { setShake(false); setFeedback(null) }, 600)
    }
  }

  const handleSkip = () => {
    setFeedback(null)
    setInput('')
    advance(score)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter') handleSubmit()
  }

  const handlePlayAgain = () => {
    const newRound = pickRandom(WORD_POOL, ROUND_SIZE)
    setRound(newRound)
    setIndex(0)
    setScrambled(scramble(newRound[0].word))
    setInput('')
    setFeedback(null)
    setScore(0)
    setDone(false)
  }

  /* ── DONE SCREEN ── */
  if (done) {
    const finalScore = Math.round((score / ROUND_SIZE) * 100)
    const desc =
      finalScore === 100 ? 'EXCELLENT — Human behavioral patterns fully mapped.' :
      finalScore >= 75  ? 'ADEQUATE — Partial understanding of human settlement.' :
      finalScore >= 50  ? 'WEAK — Limited knowledge of human systems.' :
                          'CRITICAL — Human data insufficient for planning.'

    return (
      <div className="station-people">
        <div className="scramble-done">
          <div className="scramble-done-title">DECODING COMPLETE</div>
          <div className="scramble-done-score">{score} / {ROUND_SIZE} WORDS DECODED</div>
          <div className="scramble-done-bar">
            <div className="scramble-done-fill" style={{ width: `${finalScore}%` }} />
          </div>
          <div className="scramble-done-pct">{finalScore}%</div>
          <p className="scramble-done-desc">{desc}</p>
          <div className="scramble-actions">
            <button className="confirm-btn" onClick={() => onComplete(finalScore)}>
              CONFIRM — {finalScore}%
            </button>
            <button className="skip-btn" onClick={handlePlayAgain}>
              ↺ NEW WORDS
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ── GAME SCREEN ── */
  return (
    <div className="station-people">
      <p className="station-instruction">
        Unscramble the words. Each one describes how humans organize their lives.
        Use the hint for help.
      </p>

      {/* Progress pips */}
      <div className="scramble-progress">
        {round.map((_, i) => (
          <div
            key={i}
            className={`scramble-pip ${i < index ? 'sp-done' : i === index ? 'sp-active' : ''}`}
          />
        ))}
        <span className="scramble-count">{index + 1} / {ROUND_SIZE}</span>
      </div>

      {/* Hint */}
      <div className="scramble-hint">{current.hint}</div>

      {/* Scrambled letters */}
      <div className={`scramble-word ${shake ? 'scramble-shake' : ''} ${feedback === 'correct' ? 'scramble-word-correct' : ''}`}>
        {scrambled.split('').map((ch, i) => (
          <span key={i} className="scramble-letter">{ch}</span>
        ))}
      </div>

      {/* Feedback */}
      <div className={`scramble-feedback ${feedback === 'correct' ? 'sfb-correct' : feedback === 'wrong' ? 'sfb-wrong' : 'sfb-hidden'}`}>
        {feedback === 'correct' ? '✓ CORRECT' : feedback === 'wrong' ? '✗ TRY AGAIN' : '—'}
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        className="scramble-input"
        type="text"
        value={input}
        onChange={e => setInput(e.target.value.toUpperCase())}
        onKeyDown={handleKey}
        placeholder="TYPE YOUR ANSWER…"
        maxLength={current.word.length + 3}
        autoComplete="off"
        spellCheck={false}
      />

      {/* Action buttons */}
      <div className="scramble-actions">
        <button className="confirm-btn" onClick={handleSubmit}>SUBMIT</button>
        <button className="skip-btn"    onClick={handleSkip}>SKIP →</button>
      </div>

      <div className="scramble-live-score">SCORE: {score} / {index}</div>
    </div>
  )
}
