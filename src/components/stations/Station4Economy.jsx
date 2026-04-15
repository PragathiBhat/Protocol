import { useState, useEffect, useRef } from 'react'

/* ══════════════════════════════════════════════════
   GENERATE 5 DOUBLE-DIGIT MATH QUESTIONS
   Numbers in range 15–84. Mix of + and −.
   Subtraction always yields a positive result.
══════════════════════════════════════════════════ */
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateQuestions() {
  const qs = []
  for (let i = 0; i < 5; i++) {
    const op = Math.random() < 0.5 ? '+' : '-'
    let a = rand(15, 84)
    let b = rand(15, 84)
    if (op === '-' && b > a) [a, b] = [b, a]   // keep result positive
    qs.push({ a, b, op, answer: op === '+' ? a + b : a - b })
  }
  return qs
}

export default function Station4Economy({ onComplete }) {
  const [questions]   = useState(generateQuestions)
  const [index,   setIndex]   = useState(0)
  const [input,   setInput]   = useState('')
  const [phase,   setPhase]   = useState('question')  // 'question' | 'feedback' | 'skipped' | 'done'
  const [lastOk,  setLastOk]  = useState(null)
  const [history, setHistory] = useState([])           // { expr, answer, result: 'correct'|'skipped' }
  const inputRef = useRef(null)

  useEffect(() => {
    if (phase === 'question') inputRef.current?.focus()
  }, [index, phase])

  const current = questions[index]

  const advance = () => {
    if (index < questions.length - 1) {
      setIndex(i => i + 1)
      setInput('')
      setPhase('question')
    } else {
      setPhase('done')
    }
  }

  const submit = () => {
    if (phase !== 'question') return
    const typed = parseInt(input, 10)
    if (isNaN(typed)) return

    const correct = typed === current.answer
    const expr    = `${current.a} ${current.op} ${current.b}`

    setLastOk(correct)
    setPhase('feedback')

    if (correct) {
      setHistory(h => [...h, { expr, answer: current.answer, result: 'correct' }])
      setTimeout(advance, 1000)
    } else {
      setTimeout(() => {
        setInput('')
        setPhase('question')
      }, 900)
    }
  }

  const skip = () => {
    if (phase !== 'question') return
    const expr = `${current.a} ${current.op} ${current.b}`
    setHistory(h => [...h, { expr, answer: current.answer, result: 'skipped' }])
    setPhase('skipped')
    setTimeout(advance, 1100)
  }

  const handleKey = e => {
    if (e.key === 'Enter') submit()
  }

  const correctCount = history.filter(h => h.result === 'correct').length
  const finalScore   = Math.round((correctCount / questions.length) * 100)

  const cardClass =
    phase === 'feedback' ? (lastOk ? 'mq-correct' : 'mq-wrong-shake') :
    phase === 'skipped'  ? 'mq-skipped' : ''

  return (
    <div className="station-economy">
      <p className="station-instruction">
        Solve five double-digit equations to calibrate the city's economic output.
        Type your answer and press Enter — or skip if you're stuck.
      </p>

      {/* Progress dots */}
      <div className="mq-progress">
        {questions.map((_, i) => {
          const h = history[i]
          let cls = 'mq-dot'
          if (h)     cls += h.result === 'correct' ? ' dot-done' : ' dot-skip'
          else if (i === index && phase !== 'done') cls += ' dot-current'
          return <div key={i} className={cls} />
        })}
      </div>

      {/* ── ACTIVE QUESTION ── */}
      {phase !== 'done' && (
        <div className={`mq-problem-wrap ${cardClass}`}>

          <div className="mq-column">
            <div className="mq-top-row">
              <span className="mq-op-char"> </span>
              <span className="mq-big">{current.a}</span>
            </div>
            <div className="mq-bot-row">
              <span className={`mq-op-char mq-op-char-bot ${current.op === '+' ? 'mq-op-plus' : 'mq-op-minus'}`}>
                {current.op === '+' ? '+' : '−'}
              </span>
              <span className="mq-big">{current.b}</span>
            </div>
            <div className="mq-line" />
            <div className="mq-input-row">
              <span className="mq-op-char"> </span>
              <input
                ref={inputRef}
                className="mq-input"
                type="number"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                disabled={phase !== 'question'}
                placeholder="?"
              />
            </div>
          </div>

          {phase === 'feedback' && (
            <div className={`mq-badge ${lastOk ? 'ok' : 'bad'}`}>
              {lastOk ? 'CORRECT' : 'TRY AGAIN'}
            </div>
          )}

          {phase === 'skipped' && (
            <div className="mq-badge mq-badge-skip">
              SKIPPED — {current.answer}
            </div>
          )}

          {phase === 'question' && (
            <div className="mq-btn-row">
              <button className="mq-submit" onClick={submit} disabled={input === ''}>
                SUBMIT
              </button>
              <button className="mq-skip-btn" onClick={skip}>
                SKIP →
              </button>
            </div>
          )}
        </div>
      )}

      {/* History log */}
      {history.length > 0 && phase !== 'done' && (
        <div className="mq-history">
          {history.map((h, i) => (
            <div key={i} className="mq-history-row">
              <span className="mq-hist-expr">{h.expr}</span>
              {h.result === 'correct'
                ? <span className="mq-hist-mark ok">✓</span>
                : <span className="mq-hist-mark skip">— {h.answer}</span>
              }
            </div>
          ))}
        </div>
      )}

      {/* ── DONE SCREEN ── */}
      {phase === 'done' && (
        <div className="mq-done">
          <div className="mq-done-label">CALCULATION COMPLETE</div>
          <div className="mq-done-score" style={{
            color: finalScore === 100 ? 'var(--green)' : finalScore >= 60 ? 'var(--amber)' : 'var(--red)',
            textShadow: finalScore === 100 ? '0 0 30px rgba(0,255,136,.7)' : 'none'
          }}>
            {finalScore}
          </div>
          <div className="mq-done-sub">
            {correctCount} of {questions.length} equations solved — economic output calibrated.
          </div>

          <div className="mq-history" style={{ marginTop: 8 }}>
            {history.map((h, i) => (
              <div key={i} className="mq-history-row">
                <span className="mq-hist-expr">{h.expr}</span>
                {h.result === 'correct'
                  ? <span className="mq-hist-mark ok">✓</span>
                  : <span className="mq-hist-mark skip">— {h.answer}</span>
                }
              </div>
            ))}
          </div>

          <button className="confirm-btn" onClick={() => onComplete(finalScore)}>
            COMMIT ECONOMIC OUTPUT
          </button>
        </div>
      )}
    </div>
  )
}
