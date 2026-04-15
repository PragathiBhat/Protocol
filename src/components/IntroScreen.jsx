import { useState, useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const LINES = [
  '> ALEXANDERPLATZ URBAN CONTROL SYSTEM  v3.7.1',
  '> AUTHORITY OVERRIDE  . . . . . . . .  ACTIVE',
  '> SYSTEM CHECK  . . . . . . . . . . .  FAILED',
  '> DATA OVERLOAD DETECTED — MANUAL INPUT REQUIRED',
  '> 5 SYSTEMS AWAIT OPERATOR CONFIGURATION',
  '> CITY FATE  . . . . . . . . . .  UNDETERMINED',
  '> YOU ARE THE OPERATOR.',
]

const ALEX  = [13.4132, 52.5219]
const TITLE = 'PROTOCOL'

function MapBackground() {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!document.getElementById('alex-pulse-style')) {
      const s = document.createElement('style')
      s.id = 'alex-pulse-style'
      s.textContent = `
        @keyframes alex-ring-pulse {
          0%,100% { transform:translate(-50%,-50%) scale(1);    opacity:.85; }
          50%      { transform:translate(-50%,-50%) scale(1.25); opacity:1;   }
        }
        @keyframes alex-ring-outer {
          0%,100% { transform:translate(-50%,-50%) scale(1);    opacity:.4; }
          50%      { transform:translate(-50%,-50%) scale(1.45); opacity:.75; }
        }
        .alex-ring-inner {
          position:absolute; left:50%; top:50%;
          width:72px; height:72px; border-radius:50%;
          border:2px solid #ff7700;
          background:rgba(255,119,0,0.12);
          transform:translate(-50%,-50%);
          animation:alex-ring-pulse 2.4s ease-in-out infinite;
        }
        .alex-ring-outer {
          position:absolute; left:50%; top:50%;
          width:148px; height:148px; border-radius:50%;
          border:1px solid rgba(255,140,0,0.5);
          transform:translate(-50%,-50%);
          animation:alex-ring-outer 2.4s ease-in-out infinite;
        }
        .alex-dot {
          position:absolute; left:50%; top:50%;
          width:10px; height:10px; border-radius:50%;
          background:#ffaa00;
          transform:translate(-50%,-50%);
          box-shadow:0 0 12px 5px rgba(255,170,0,.85);
        }
        .alex-label {
          position:absolute; left:50%; top:calc(50% + 56px);
          transform:translateX(-50%);
          font-family:'Courier New',monospace;
          font-size:9px; letter-spacing:4px; color:#ffaa00;
          white-space:nowrap;
          text-shadow:0 0 10px rgba(255,170,0,.9);
        }
      `
      document.head.appendChild(s)
    }

    // Shift map center west so Alexanderplatz appears on the right side of the screen
    const mapCenter = [ALEX[0] - 0.016, ALEX[1] - 0.003]

    const map = new maplibregl.Map({
      container: containerRef.current,
      style:     'https://tiles.openfreemap.org/styles/liberty',
      center:    mapCenter,
      zoom:      15.2,
      pitch:     58,
      bearing:   -20,
      interactive:      false,
      attributionControl: false,
    })

    map.on('load', () => {
      const style       = map.getStyle()
      const srcName     = Object.keys(style.sources).find(k => style.sources[k].type === 'vector') || 'openmaptiles'
      const firstSymbol = style.layers.find(l => l.type === 'symbol')?.id

      /* ── Restyle every existing layer ── */
      style.layers.forEach(layer => {
        const sl = layer['source-layer']
        const t  = layer.type
        const id = layer.id

        try {
          // Background → near black
          if (t === 'background') {
            map.setPaintProperty(id, 'background-color', '#050505')
            return
          }

          // Roads → electric blue, all types
          if (t === 'line' && sl === 'transportation') {
            map.setPaintProperty(id, 'line-color',   '#1a5fff')
            map.setPaintProperty(id, 'line-opacity',  1)
            return
          }

          // All other lines (boundaries, waterways, paths) → near black
          if (t === 'line') {
            map.setPaintProperty(id, 'line-color',   '#0a0a0a')
            map.setPaintProperty(id, 'line-opacity',  0.5)
            return
          }

          // Flat building fills → hide (replaced by 3D layer)
          if (t === 'fill' && sl === 'building') {
            map.setPaintProperty(id, 'fill-opacity', 0)
            return
          }

          // Any existing fill-extrusion → hide
          if (t === 'fill-extrusion') {
            map.setPaintProperty(id, 'fill-extrusion-opacity', 0)
            return
          }

          // All other fills (land, water, parks, landuse…) → super dark
          if (t === 'fill') {
            map.setPaintProperty(id, 'fill-color',   '#080808')
            map.setPaintProperty(id, 'fill-opacity',  1)
            return
          }

          // All labels and icons → hide (clean background)
          if (t === 'symbol') {
            map.setPaintProperty(id, 'text-opacity', 0)
            map.setPaintProperty(id, 'icon-opacity', 0)
            return
          }
        } catch (_) { /* some layers reject certain properties — skip silently */ }
      })

      /* ── 3D orange buildings ── */
      try {
        map.addLayer(
          {
            id:   'protocol-3d-buildings',
            type: 'fill-extrusion',
            source: srcName,
            'source-layer': 'building',
            minzoom: 12,
            paint: {
              'fill-extrusion-color': [
                'interpolate', ['linear'],
                ['coalesce', ['get', 'render_height'], ['get', 'height'], 10],
                0,   '#7a2800',
                10,  '#aa3c00',
                20,  '#cc5500',
                35,  '#e86a00',
                60,  '#ff8000',
                100, '#ffaa00',
              ],
              'fill-extrusion-height':  ['coalesce', ['get', 'render_height'],     ['get', 'height'],     8],
              'fill-extrusion-base':    ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0],
              'fill-extrusion-opacity': 0.95,
            },
          },
          firstSymbol
        )
      } catch (e) {
        console.warn('3D buildings:', e.message)
      }

      /* ── Alexanderplatz glowing marker ── */
      const el = document.createElement('div')
      el.style.cssText = 'position:relative;width:148px;height:148px;pointer-events:none;'
      el.innerHTML = `
        <div class="alex-ring-outer"></div>
        <div class="alex-ring-inner"></div>
        <div class="alex-dot"></div>
        <div class="alex-label">ALEXANDERPLATZ</div>
      `
      new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat(ALEX)
        .addTo(map)
    })

    return () => map.remove()
  }, [])

  return <div ref={containerRef} style={{ position:'absolute', inset:0 }} />
}

export default function IntroScreen({ onEnter }) {
  const [typedCount,      setTypedCount]      = useState(0)
  const [visibleLines,    setVisibleLines]    = useState(0)
  const [ready,           setReady]           = useState(false)
  const [subtitleVisible, setSubtitleVisible] = useState(false)

  const titleDone = typedCount >= TITLE.length

  // Type out PROTOCOL super fast (55 ms per letter)
  useEffect(() => {
    if (typedCount < TITLE.length) {
      const t = setTimeout(() => setTypedCount(c => c + 1), 55)
      return () => clearTimeout(t)
    }
  }, [typedCount])

  useEffect(() => {
    const t = setTimeout(() => setSubtitleVisible(true), 400)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (visibleLines < LINES.length) {
      const t = setTimeout(
        () => setVisibleLines(v => v + 1),
        visibleLines === 0 ? 800 : 500
      )
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => setReady(true), 600)
      return () => clearTimeout(t)
    }
  }, [visibleLines])

  return (
    <div className="intro-screen">

      {/* Live OSM map */}
      <MapBackground />

      {/* Dark vignette — edges fade to black */}
      <div style={{
        position:'absolute', inset:0, zIndex:1, pointerEvents:'none',
        background:'radial-gradient(ellipse at center, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.72) 100%)',
      }} />

      {/* Content */}
      <div className="intro-header" style={{ position:'relative', zIndex:2 }}>
        <div className="intro-tagline">ALEXANDERPLATZ — URBAN CONTROL SYSTEM</div>
        <div className={`intro-logo${titleDone ? '' : ' intro-logo-typing'}`}>
          {TITLE.slice(0, typedCount)}
          {!titleDone && <span className="intro-logo-cursor">█</span>}
        </div>
        {subtitleVisible && (
          <div className="intro-subtitle">
            <span className="intro-sub-line">Something is wrong in Alexanderplatz.</span>
            <span className="intro-sub-line intro-sub-line2">The system is overloaded. Data is everywhere.</span>
          </div>
        )}
      </div>

      <div className="intro-terminal" style={{ position:'relative', zIndex:2 }}>
        {LINES.slice(0, visibleLines).map((line, i) => (
          <div key={i} className="intro-line">{line}</div>
        ))}
        {visibleLines < LINES.length && <span className="cursor">█</span>}
      </div>

      {ready && (
        <button className="intro-enter-btn" onClick={onEnter} style={{ position:'relative', zIndex:2 }}>
          ENTER CONTROL ROOM
        </button>
      )}

    </div>
  )
}
