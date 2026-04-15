import { useEffect, useRef } from 'react'

export default function CustomCursor() {
  const curRef = useRef(null)

  useEffect(() => {
    const el = curRef.current
    if (!el) return

    // Direct DOM mutation — no React re-renders, perfectly smooth
    const onMove = (e) => {
      el.style.left = e.clientX + 'px'
      el.style.top  = e.clientY + 'px'
    }

    const onOver = (e) => {
      const clickable = e.target.closest(
        'button, a, .rm-obj, .rm-decoy, [onClick], .intro-enter-btn, .ldr-exit'
      )
      el.classList.toggle('cur-hover', !!clickable)
    }

    const onDown = () => el.classList.add('cur-click')
    const onUp   = () => el.classList.remove('cur-click')

    document.addEventListener('mousemove', onMove,  { passive: true })
    document.addEventListener('mouseover', onOver,  { passive: true })
    document.addEventListener('mousedown', onDown)
    document.addEventListener('mouseup',   onUp)

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('mouseup',   onUp)
    }
  }, [])

  return (
    <div ref={curRef} className="custom-cursor" aria-hidden>
      {/* Center dot */}
      <div className="cur-dot" />

      {/* Inner spinning ring */}
      <div className="cur-ring cur-ring-inner" />

      {/* Outer counter-spinning ring (dashed) */}
      <div className="cur-ring cur-ring-outer" />

      {/* Corner targeting brackets */}
      <div className="cur-bracket cur-tl" />
      <div className="cur-bracket cur-tr" />
      <div className="cur-bracket cur-bl" />
      <div className="cur-bracket cur-br" />

      {/* Crosshair lines */}
      <div className="cur-cross cur-cross-h" />
      <div className="cur-cross cur-cross-v" />
    </div>
  )
}
