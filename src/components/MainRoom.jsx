import { useState, useEffect, useRef } from 'react'
import StationModal from './StationModal'
import Station1People from './stations/Station1People'
import Station2Memory from './stations/Station2Memory'
import Station3Environment from './stations/Station3Environment'
import Station4Economy from './stations/Station4Economy'
import Station5Infrastructure from './stations/Station5Infrastructure'

const STATION_MAP = {
  people:         { Component: Station1People,        label: 'PEOPLE',          color: '#00d4ff' },
  memory:         { Component: Station2Memory,        label: 'MEMORY',          color: '#aa44ff' },
  environment:    { Component: Station3Environment,   label: 'ENVIRONMENT',     color: '#00ff88' },
  economy:        { Component: Station4Economy,       label: 'ECONOMY',         color: '#ffaa00' },
  infrastructure: { Component: Station5Infrastructure, label: 'INFRASTRUCTURE', color: '#ff6644' },
}

/* Stable "random" bits for background decoration */
const BITS = '10110010110100110101001011010110100101101001011010011010'.split('')

function formatTime(ms) {
  if (ms === null || ms === undefined) return null
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

export default function MainRoom({ scores, times = {}, onUpdateScore, onUpdateTime, onExit, allComplete }) {
  const [activeStation, setActiveStation] = useState(null)
  const [scanning,      setScanning]      = useState(false)
  const [introVisible,  setIntroVisible]  = useState(true)
  const [decoyFlash,    setDecoyFlash]    = useState(null)   // id of active decoy flash
  const openedAt = useRef(null)

  const clickDecoy = (id) => {
    setDecoyFlash(id)
    setTimeout(() => setDecoyFlash(null), 1100)
  }
  const configuredCount = Object.values(scores).filter(v => v !== null).length

  useEffect(() => {
    const t = setTimeout(() => setIntroVisible(false), 4200)
    return () => clearTimeout(t)
  }, [])

  const triggerScan = () => {
    if (scanning) return
    setScanning(true)
    setTimeout(() => setScanning(false), 2600)
  }

  const handleComplete = (stationId, value) => {
    const elapsed = openedAt.current ? Date.now() - openedAt.current : null
    onUpdateScore(stationId, value)
    if (elapsed !== null) onUpdateTime(stationId, elapsed)
    setActiveStation(null)
  }

  const open = id => {
    if (scores[id] !== null) return   // already completed — locked
    setActiveStation(id)
    openedAt.current = Date.now()
  }
  const active = activeStation ? STATION_MAP[activeStation] : null

  /* Scan class helper */
  const sc = id => scanning && scores[id] === null ? 'iz-scan' : ''
  const dk = id => scores[id] !== null ? 'iz-done' : ''

  return (
    <div className="rm">

      {/* ═══════════════════════════════════════════
          GLITCH OVERLAYS (always on top)
      ═══════════════════════════════════════════ */}
      <div className="rm-static" aria-hidden />
      <div className="rm-glitch-bar gb1" aria-hidden />
      <div className="rm-glitch-bar gb2" aria-hidden />
      <div className="rm-glitch-bar gb3" aria-hidden />
      <div className="rm-err-msg" aria-hidden>⚠ CRITICAL — DATA INTEGRITY COMPROMISED — MANUAL OVERRIDE REQUIRED</div>

      {/* ─── SCAN BEAM ─── */}
      {scanning && <div className="rm-scanbeam" />}

      {/* ─── INTRO HINT ─── */}
      {introVisible && (
        <div className="rm-intro-hint">
          <div className="rih-line1">5 CONTROL SYSTEMS</div>
          <div className="rih-line2">are hidden in this room</div>
          <div className="rih-line3">Explore · Click · Use SCAN if you need help</div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          ROOM BACKGROUND LAYERS
      ═══════════════════════════════════════════ */}

      {/* Ceiling */}
      <div className="rm-ceiling">
        <div className="rm-ceil-panel rcp-l">
          <div className="rcp-tube" /><div className="rcp-glow" />
        </div>
        <div className="rm-ceil-panel rcp-r">
          <div className="rcp-tube" /><div className="rcp-glow" />
        </div>
        <div className="rm-conduit rc1" /><div className="rm-conduit rc2" />
      </div>

      {/* Wall */}
      <div className="rm-wall">
        {/* Ambient monitor glow on wall */}
        <div className="rm-mon-spill" />
        {/* Wall data — ambient bits */}
        <div className="rm-wallbits" aria-hidden>
          {BITS.map((b, i) => <span key={i} style={{ animationDelay: `${i * 0.4}s` }}>{b}</span>)}
        </div>
        {/* Ceiling-to-wall join strip */}
        <div className="rm-wall-top-strip" />
      </div>

      {/* Floor */}
      <div className="rm-floor">
        <div className="rm-rug" />
        <div className="rm-floor-reflect" />
      </div>

      {/* Corner darkness / vignette */}
      <div className="rm-vignette" />

      {/* ─── AMBIENT LIGHTING ─── */}
      <div className="rm-ambient-pink" aria-hidden />
      <div className="rm-ambient-floor-pink" aria-hidden />

      {/* ═══════════════════════════════════════════
          FLOOR LAMP  (atmosphere only)
      ═══════════════════════════════════════════ */}
      <div className="rm-lamp" aria-hidden>
        <div className="lamp-head" />
        <div className="lamp-arm"  />
        <div className="lamp-pole" />
        <div className="lamp-base" />
        <div className="lamp-glow" />
      </div>

      {/* ═══════════════════════════════════════════
          LADDER  (right side, atmosphere + exit)
      ═══════════════════════════════════════════ */}
      <div className="rm-ladder" aria-hidden>
        <div className="ldr-rail ldr-l" /><div className="ldr-rail ldr-r" />
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="ldr-rung" style={{ top: `${6 + i * 10.5}%` }} />
        ))}
        <div className="ldr-top-void" />
        {allComplete && (
          <div className="ldr-exit" onClick={onExit}>
            <div className="ldr-exit-light" />
            <span className="ldr-exit-label">EXIT</span>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          INTERACTIVE STATION OBJECTS
      ═══════════════════════════════════════════ */}

      {/* ── 1. MONITOR CLUSTER — People ── */}
      <div className={`rm-obj rm-monitors ${dk('people')} ${sc('people')}`}
           onClick={() => open('people')}>
        <div className="mon-group">
          {/* Left monitor — green terminal */}
          <div className="mon mon-s">
            <div className="mon-bezel">
              <div className="mon-screen scr-green">
                <div className="scr-scanlines" />
                <div className="scr-crt-text">
                  {['USR.NODE 01','> SCAN...','ACTIVE 142','USR.NODE 02','> IDLE  ','ACTIVE  87','USR.NODE 03','> SCAN...'].map((t,i) =>
                    <div key={i} className="crt-row" style={{ animationDelay: `${i * 0.4}s` }}>{t}</div>
                  )}
                </div>
              </div>
            </div>
            <div className="mon-neck" /><div className="mon-base" />
          </div>

          {/* Centre monitor — population graph */}
          <div className="mon mon-l">
            <div className="mon-bezel">
              <div className="mon-screen scr-cyan">
                <div className="scr-scanlines" />
                <div className="scr-bars">
                  {[40,65,50,80,55,70,60,85,45,75].map((h, i) => (
                    <div key={i} className="scr-bar" style={{ height: `${h}%`, animationDelay: `${i * 0.18}s` }} />
                  ))}
                </div>
                <div className="scr-footer">POPULATION FEED</div>
              </div>
            </div>
            <div className="mon-neck" /><div className="mon-base" />
          </div>

          {/* Right monitor — map dots */}
          <div className="mon mon-s">
            <div className="mon-bezel">
              <div className="mon-screen scr-amber">
                <div className="scr-scanlines" />
                <div className="scr-map">
                  <div className="scr-grid" />
                  {[[28,45],[55,30],[70,62],[38,70],[62,20]].map(([x,y],i) => (
                    <div key={i} className="scr-dot" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.6}s` }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="mon-neck" /><div className="mon-base" />
          </div>
        </div>
        {/* Desk surface under monitors */}
        <div className="desk-surface">
          <div className="desk-kbd" />
          <div className="desk-papers" />
          <div className="desk-cup" />
        </div>
        <div className="desk-body" />
        {scores.people !== null && <div className="iz-check-banner">✓ CONFIGURED</div>}
        {formatTime(times.people) && <div className="rm-time-badge">{formatTime(times.people)}</div>}
      </div>

      {/* ── 2. FILING CABINET — Memory ── */}
      <div className={`rm-obj rm-cabinet ${dk('memory')} ${sc('memory')}`}
           onClick={() => open('memory')}>
        <div className="cab-header">ARCHIVE</div>
        {['A–F', 'G–M', 'N–Z'].map((lbl, i) => (
          <div key={i} className={`cab-drawer ${i === 1 ? 'cab-open' : ''}`}>
            <div className="cab-handle" />
            <div className="cab-label">{lbl}</div>
            {i === 1 && <div className="cab-glow-strip" />}
          </div>
        ))}
        {scores.memory !== null && <div className="iz-check-banner">✓</div>}
        {formatTime(times.memory) && <div className="rm-time-badge">{formatTime(times.memory)}</div>}
      </div>

      {/* ── 3. GAUGE PANEL — Environment ── */}
      <div className={`rm-obj rm-gauges ${dk('environment')} ${sc('environment')}`}
           onClick={() => open('environment')}>
        <div className="gauges-title">ECO / BAL</div>
        <div className="gauges-row">
          {[
            { lbl:'AIR', c:'#00ff88', d:'0s'   },
            { lbl:'H₂O', c:'#00d4ff', d:'1.5s' },
            { lbl:'BIO', c:'#aa44ff', d:'2.8s' },
          ].map(g => (
            <div key={g.lbl} className="gauge-wrap">
              <div className="gauge-face" style={{ '--gc': g.c }}>
                <div className="gauge-arc"  style={{ borderColor: `${g.c}33` }} />
                <div className="gauge-tick t1" /><div className="gauge-tick t2" /><div className="gauge-tick t3" />
                <div className="gauge-needle" style={{ '--gc': g.c, animationDelay: g.d }} />
                <div className="gauge-center" />
              </div>
              <div className="gauge-lbl" style={{ color: g.c }}>{g.lbl}</div>
            </div>
          ))}
        </div>
        {scores.environment !== null && <div className="iz-check-banner">✓</div>}
        {formatTime(times.environment) && <div className="rm-time-badge">{formatTime(times.environment)}</div>}
      </div>

      {/* ── 4. DATA TICKER — Economy ── */}
      <div className={`rm-obj rm-ticker ${dk('economy')} ${sc('economy')}`}
           onClick={() => open('economy')}>
        <div className="ticker-header">◈ MARKET FEED</div>
        <div className="ticker-body">
          {[
            { sym:'MRKT', val:'142.3', up:true  },
            { sym:'RETL', val:'089.1', up:false },
            { sym:'OFFC', val:'201.7', up:true  },
            { sym:'INDX', val:'057.2', up:false },
          ].map(r => (
            <div key={r.sym} className="ticker-row">
              <span className="tr-sym">{r.sym}</span>
              <span className={`tr-arrow ${r.up ? 'tr-up' : 'tr-dn'}`}>{r.up ? '▲' : '▼'}</span>
              <span className="tr-val">{r.val}</span>
            </div>
          ))}
        </div>
        {scores.economy !== null && <div className="iz-check-banner">✓</div>}
        {formatTime(times.economy) && <div className="rm-time-badge">{formatTime(times.economy)}</div>}
      </div>

      {/* ── 5. SERVER / CABLE RACK — Infrastructure ── */}
      <div className={`rm-obj rm-server ${dk('infrastructure')} ${sc('infrastructure')}`}
           onClick={() => open('infrastructure')}>
        <div className="srv-label">SYS GRID</div>
        <div className="srv-units">
          {[
            { color:'#00ff88', label:'PWR', active:true  },
            { color:'#00d4ff', label:'NET', active:true  },
            { color:'#ffaa00', label:'DAT', active:false },
            { color:'#ff6644', label:'TRN', active:true  },
          ].map((u, i) => (
            <div key={i} className="srv-unit">
              <div className="srv-led" style={{ background: u.active ? u.color : '#1a2030', boxShadow: u.active ? `0 0 8px ${u.color}` : 'none' }} />
              <div className="srv-bar" style={{ flex:1, height:'8px', background: u.active ? `${u.color}22` : '#0a1020', border:`1px solid ${u.color}44`, borderRadius:'1px' }}>
                {u.active && <div style={{ width:'60%', height:'100%', background:`${u.color}88`, borderRadius:'1px' }} />}
              </div>
              <div className="srv-name">{u.label}</div>
            </div>
          ))}
        </div>
        {/* Port grid */}
        <div className="srv-ports">
          {Array.from({ length: 12 }, (_, i) => {
            const colors = ['#00ff88','#00d4ff','#ff6644','#ffaa00','#aa44ff']
            const c = i % 5 < 3 ? colors[i % 5] : ''
            return (
              <div key={i} className="srv-port"
                style={{ background: c ? '#0a1828' : '#08101c', borderColor: c || '#1a2030',
                         boxShadow: c ? `0 0 5px ${c}66` : 'none' }} />
            )
          })}
        </div>
        {/* Hanging cables */}
        <svg className="srv-cables" viewBox="0 0 100 30" preserveAspectRatio="none">
          {[['#00d4ff',10,5],['#ff6644',30,8],['#aa44ff',55,4],['#00ff88',75,7]].map(([c,x,w],i) => (
            <path key={i} d={`M${x},0 C${x+5},15 ${x+w},20 ${x+w+10},30`} stroke={c} strokeWidth="1.2" fill="none" opacity=".6" strokeLinecap="round"/>
          ))}
        </svg>
        {scores.infrastructure !== null && <div className="iz-check-banner">✓</div>}
        {formatTime(times.infrastructure) && <div className="rm-time-badge">{formatTime(times.infrastructure)}</div>}
      </div>

      {/* ─── STICKY NOTES on monitors ─── */}
      <div className="rm-sticky s1" aria-hidden>OVERRIDE<br/>PROTO<br/>7-A</div>
      <div className="rm-sticky s2" aria-hidden>DO NOT<br/>RESET<br/>!!</div>
      <div className="rm-sticky s3" aria-hidden>CHECK<br/>LOGS<br/>???</div>
      <div className="rm-sticky s4" aria-hidden>SYS<br/>FAIL<br/>→ ME</div>

      {/* ─── EQUIPMENT BOXES (left corner clutter) ─── */}
      <div className="rm-boxes" aria-hidden>
        <div className="eq-box b1"><div className="eq-label">SYS-BACKUP</div></div>
        <div className="eq-box b2"><div className="eq-label">ARCHIVE</div></div>
        <div className="eq-box b3" />
      </div>

      {/* ─── ELECTRICAL BREAKER PANEL ─── */}
      <div className="rm-elec-panel" aria-hidden>
        <div className="ep-header"><span>DIST·PANEL</span><div className="ep-led ep-led-r" /></div>
        <div className="ep-breakers">
          {['on','on','off','on','fault','on','on','off','on','on','on','fault'].map((s,i) => (
            <div key={i} className={`ep-breaker ep-br-${s}`}>
              <div className="ep-br-toggle" />
              <span className="ep-br-label">{String(i+1).padStart(2,'0')}</span>
            </div>
          ))}
        </div>
        <div className="ep-footer">230V / 50Hz</div>
      </div>

      {/* ─── VERTICAL CONDUIT PIPES (left wall) ─── */}
      <div className="rm-conduit-pipes" aria-hidden>
        <div className="cp-pipe cp1" />
        <div className="cp-pipe cp2" />
        <div className="cp-pipe cp3" />
        <div className="cp-clip" style={{top:'18%'}} />
        <div className="cp-clip" style={{top:'52%'}} />
        <div className="cp-clip" style={{top:'78%'}} />
      </div>

      {/* ─── STACKED FLOOR UNITS (UPS / batteries / controller) ─── */}
      <div className="rm-floor-stacks" aria-hidden>
        <div className="fs-unit">
          <div className="fs-label">UPS-02</div>
          <div className="fs-led-row">
            {[1,0,1,1,0,1,1,0,1,1].map((on,i) => <div key={i} className={`fs-led ${on?'fs-led-on':''}`} />)}
          </div>
          <div className="fs-vent-row">
            {Array.from({length:10}).map((_,i) => <div key={i} className="fs-vent" />)}
          </div>
        </div>
        <div className="fs-unit">
          <div className="fs-label">BATT·BANK</div>
          <div className="fs-bar-row">
            {[80,65,90,45,70,55].map((w,i) => (
              <div key={i} className="fs-bar-track"><div className="fs-bar-fill" style={{width:`${w}%`}} /></div>
            ))}
          </div>
        </div>
        <div className="fs-unit">
          <div className="fs-knob-row">
            <div className="fs-knob" /><div className="fs-knob" /><div className="fs-knob" />
          </div>
          <div className="fs-label">PWR·CTRL</div>
        </div>
      </div>

      {/* ─── CABLE TRUNKING at floor level ─── */}
      <div className="rm-cable-trunking" aria-hidden>
        <div className="ct-tray" />
        <div className="ct-cables">
          {['#00d4ff','#ff6644','#00ff88','#ffaa00','#aa44ff','#ff2d78','#ffffff'].map((c,i) => (
            <div key={i} className="ct-wire" style={{background:c}} />
          ))}
        </div>
      </div>

      {/* ─── JUNCTION BOXES on left wall ─── */}
      <div className="rm-junction-boxes" aria-hidden>
        {[['J-04','g'],['J-05','r'],['J-06','g'],['J-07','g'],['J-08','r']].map(([lbl,col],i) => (
          <div key={i} className="jb-box">
            <div className={`jb-led jb-led-${col}`} />
            <span>{lbl}</span>
          </div>
        ))}
      </div>

      {/* ─── PINK QUESTION MARKS — scattered across room ─── */}
      <div className="rm-qmarks" aria-hidden>
        {[
          { l:'7%',  t:'24%', size:'4vw',   rot:'12deg',  delay:'0s'   },
          { l:'80%', t:'20%', size:'3.5vw', rot:'-9deg',  delay:'0.5s' },
          { l:'22%', t:'48%', size:'5.5vw', rot:'-12deg', delay:'1.1s' },
          { l:'60%', t:'43%', size:'4.5vw', rot:'7deg',   delay:'0.3s' },
          { l:'44%', t:'68%', size:'6vw',   rot:'-4deg',  delay:'0.8s' },
          { l:'88%', t:'60%', size:'3.8vw', rot:'14deg',  delay:'1.4s' },
          { l:'35%', t:'32%', size:'3.2vw', rot:'-7deg',  delay:'0.6s' },
        ].map((q, i) => (
          <div key={i} className="rm-qmark" style={{
            left: q.l, top: q.t,
            fontSize: q.size,
            transform: `rotate(${q.rot})`,
            animationDelay: q.delay,
          }}>?</div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
          DECOY PANELS — look interactive but do nothing
      ═══════════════════════════════════════════ */}

      {/* Decoy A — wall keypad, left upper */}
      <div className="rm-decoy dc-a" onClick={() => clickDecoy('a')}>
        {decoyFlash === 'a' && <div className="dc-denied">⚠ OFFLINE</div>}
        <div className="dc-title">AUTH·PAD</div>
        <div className="dc-keypad">
          {[1,2,3,4,5,6,7,8,9,'*',0,'#'].map(k => (
            <div key={k} className="dc-key">{k}</div>
          ))}
        </div>
        <div className="dc-status-row"><div className="dc-led dc-led-r"/><span>LOCKED</span></div>
      </div>

      {/* Decoy B — small LCD display, upper centre-left */}
      <div className="rm-decoy dc-b" onClick={() => clickDecoy('b')}>
        {decoyFlash === 'b' && <div className="dc-denied">⚠ OFFLINE</div>}
        <div className="dc-lcd">
          <div className="dc-lcd-row">SYS·ID  :: 04-C</div>
          <div className="dc-lcd-row">STATUS  :: FAULT</div>
          <div className="dc-lcd-row">TEMP    :: 94°C</div>
          <div className="dc-lcd-row blink-row">▶ AWAITING CMD</div>
        </div>
        <div className="dc-btn-row">
          <div className="dc-btn">RST</div>
          <div className="dc-btn">CFG</div>
          <div className="dc-btn dc-btn-a">ACK</div>
        </div>
      </div>

      {/* Decoy C — ventilation/HVAC panel, right wall upper */}
      <div className="rm-decoy dc-c" onClick={() => clickDecoy('c')}>
        {decoyFlash === 'c' && <div className="dc-denied">⚠ OFFLINE</div>}
        <div className="dc-title">HVAC·CTRL</div>
        <div className="dc-dial-row">
          <div className="dc-dial"><div className="dc-dial-mark"/></div>
          <div className="dc-dial dc-dial-2"><div className="dc-dial-mark"/></div>
        </div>
        <div className="dc-bar-stack">
          {[60,40,75,30,55].map((w,i) => (
            <div key={i} className="dc-minibar"><div className="dc-minibar-fill" style={{width:`${w}%`}}/></div>
          ))}
        </div>
      </div>

      {/* Decoy D — comms/intercom panel, left lower */}
      <div className="rm-decoy dc-d" onClick={() => clickDecoy('d')}>
        {decoyFlash === 'd' && <div className="dc-denied">⚠ OFFLINE</div>}
        <div className="dc-title">COMM·SYS</div>
        <div className="dc-freq">142.650 MHz</div>
        <div className="dc-wave">
          {Array.from({length:18}).map((_,i) => (
            <div key={i} className="dc-wave-bar" style={{height:`${20+Math.sin(i*0.8)*14}px`, animationDelay:`${i*0.08}s`}}/>
          ))}
        </div>
        <div className="dc-status-row"><div className="dc-led dc-led-y"/><span>STANDBY</span></div>
      </div>

      {/* Decoy E — sub-breaker panel, centre wall */}
      <div className="rm-decoy dc-e" onClick={() => clickDecoy('e')}>
        {decoyFlash === 'e' && <div className="dc-denied">⚠ OFFLINE</div>}
        <div className="dc-title">SUB·DIST B</div>
        <div className="dc-switches">
          {['ON','ON','OFF','ON','OFF','ON'].map((s,i) => (
            <div key={i} className={`dc-switch dc-sw-${s.toLowerCase()}`}>
              <div className="dc-sw-toggle"/><span>{i+7}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Decoy F — data terminal, right lower */}
      <div className="rm-decoy dc-f" onClick={() => clickDecoy('f')}>
        {decoyFlash === 'f' && <div className="dc-denied">⚠ OFFLINE</div>}
        <div className="dc-lcd">
          <div className="dc-lcd-row">NODE·B :: TIMEOUT</div>
          <div className="dc-lcd-row">PKT·LOSS :: 87%</div>
          <div className="dc-lcd-row blink-row">▶ RECONNECTING…</div>
        </div>
        <div className="dc-status-row"><div className="dc-led dc-led-r"/><span>ERROR</span></div>
      </div>

      {/* Decoy G — access control panel, far right */}
      <div className="rm-decoy dc-g" onClick={() => clickDecoy('g')}>
        {decoyFlash === 'g' && <div className="dc-denied">⚠ OFFLINE</div>}
        <div className="dc-title">ZONE·ACCESS</div>
        <div className="dc-zones">
          {['Z-1','Z-2','Z-3','Z-4'].map((z,i) => (
            <div key={i} className="dc-zone-row">
              <div className={`dc-led ${i===1?'dc-led-r':'dc-led-g'}`}/>
              <span>{z}</span>
              <span className="dc-zone-st">{i===1?'DENIED':'CLEAR'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── EXTRA DECOY PANELS ─── */}

      {/* Decoy H — wide map display, top-left */}
      <div className="rm-decoy dc-h" onClick={() => clickDecoy('h')}>
        {decoyFlash === 'h' && <div className="dc-denied">⚠ OFFLINE</div>}
        <div className="dc-title">DISTRICT·MAP</div>
        <div className="dc-bigmap">
          <div className="dc-grid-lines"/>
          {[[15,30],[40,55],[62,20],[78,68],[25,72],[50,40],[85,35]].map(([x,y],i)=>(
            <div key={i} className="dc-map-node" style={{left:`${x}%`,top:`${y}%`,animationDelay:`${i*0.5}s`}}/>
          ))}
          {['A-3','B-7','C-1'].map((lbl,i)=>(
            <div key={i} className="dc-map-label" style={{left:`${15+i*32}%`,top:'82%'}}>{lbl}</div>
          ))}
        </div>
      </div>

      {/* Decoy I — tall status column, left mid */}
      <div className="rm-decoy dc-i" onClick={() => clickDecoy('i')}>
        {decoyFlash === 'i' && <div className="dc-denied">⚠ OFFLINE</div>}
        <div className="dc-title">NODE·STATUS</div>
        {['SRV-01','SRV-02','SRV-03','SRV-04','SRV-05','SRV-06'].map((n,i)=>(
          <div key={i} className="dc-node-row">
            <div className={`dc-led ${[0,2,4].includes(i)?'dc-led-g':'dc-led-r'}`}/>
            <span>{n}</span>
            <span className="dc-node-val">{[0,2,4].includes(i)?'OK':'ERR'}</span>
          </div>
        ))}
      </div>

      {/* Decoy J — wide waveform monitor, top centre-right */}
      <div className="rm-decoy dc-j" onClick={() => clickDecoy('j')}>
        {decoyFlash === 'j' && <div className="dc-denied">⚠ OFFLINE</div>}
        <div className="dc-title">SIGNAL·MONITOR</div>
        <div className="dc-waveform">
          {Array.from({length:32}).map((_,i)=>(
            <div key={i} className="dc-wf-bar" style={{
              height:`${14+Math.abs(Math.sin(i*0.45+1)*22)}px`,
              animationDelay:`${i*0.06}s`
            }}/>
          ))}
        </div>
        <div className="dc-wave-footer">
          <span>FREQ: 2.4 GHz</span><span>SNR: –12 dB</span><span>BW: 40 MHz</span>
        </div>
      </div>

      {/* Decoy K — wide log terminal, bottom-left */}
      <div className="rm-decoy dc-k" onClick={() => clickDecoy('k')}>
        {decoyFlash === 'k' && <div className="dc-denied">⚠ OFFLINE</div>}
        <div className="dc-title">SYSTEM·LOG</div>
        <div className="dc-logbox">
          {[
            '[03:14:07] ERR  kernel panic — seg fault 0x00ff',
            '[03:14:09] WARN memory pressure critical',
            '[03:14:11] ERR  watchdog timeout — reset',
            '[03:14:13] INFO attempting recovery…',
            '[03:14:15] ERR  recovery failed',
          ].map((line,i)=>(
            <div key={i} className="dc-log-line" style={{animationDelay:`${i*0.3}s`}}>{line}</div>
          ))}
        </div>
      </div>

      {/* Decoy L — wide power graph, bottom centre */}
      <div className="rm-decoy dc-l" onClick={() => clickDecoy('l')}>
        {decoyFlash === 'l' && <div className="dc-denied">⚠ OFFLINE</div>}
        <div className="dc-title">POWER·GRID</div>
        <div className="dc-powergraph">
          {[45,60,38,72,55,80,48,65,40,70,58,85,50,62,44].map((h,i)=>(
            <div key={i} className="dc-pg-bar" style={{height:`${h}%`,animationDelay:`${i*0.12}s`}}/>
          ))}
        </div>
        <div className="dc-wave-footer">
          <span>LOAD: 84%</span><span>DRAW: 12.4 kW</span><span>BATT: 23%</span>
        </div>
      </div>

      {/* Decoy M — camera feeds, bottom-right */}
      <div className="rm-decoy dc-m" onClick={() => clickDecoy('m')}>
        {decoyFlash === 'm' && <div className="dc-denied">⚠ OFFLINE</div>}
        <div className="dc-title">CCTV·FEEDS</div>
        <div className="dc-cams">
          {['CAM-1','CAM-2','CAM-3','CAM-4'].map((c,i)=>(
            <div key={i} className="dc-cam-cell">
              <div className="dc-cam-noise"/>
              <span className="dc-cam-lbl">{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Decoy N — network topology, right upper-mid */}
      <div className="rm-decoy dc-n" onClick={() => clickDecoy('n')}>
        {decoyFlash === 'n' && <div className="dc-denied">⚠ OFFLINE</div>}
        <div className="dc-title">NET·TOPOLOGY</div>
        <svg className="dc-topo-svg" viewBox="0 0 100 60">
          <line x1="50" y1="10" x2="20" y2="40" stroke="#1e3a50" strokeWidth="0.8"/>
          <line x1="50" y1="10" x2="80" y2="40" stroke="#1e3a50" strokeWidth="0.8"/>
          <line x1="50" y1="10" x2="50" y2="45" stroke="#1e3a50" strokeWidth="0.8"/>
          <line x1="20" y1="40" x2="80" y2="40" stroke="#0e2030" strokeWidth="0.5" strokeDasharray="2,2"/>
          {[[50,10],[20,40],[80,40],[50,45]].map(([x,y],i)=>(
            <circle key={i} cx={x} cy={y} r="4" fill="#0d1e2c" stroke={i===0?'#cc2200':'#1e3a50'} strokeWidth="1"/>
          ))}
        </svg>
        <div className="dc-status-row"><div className="dc-led dc-led-r"/><span>2 NODES DOWN</span></div>
      </div>

      {/* Decoy O — thermal readout, mid-centre */}
      <div className="rm-decoy dc-o" onClick={() => clickDecoy('o')}>
        {decoyFlash === 'o' && <div className="dc-denied">⚠ OFFLINE</div>}
        <div className="dc-title">THERMAL·MAP</div>
        <div className="dc-thermal">
          {Array.from({length:20}).map((_,i)=>{
            const heat = [90,75,60,80,95,70,55,85,65,78,92,58,72,88,62,76,82,68,94,73][i]
            const col = heat>85?'#cc2200':heat>70?'#ff7700':'#1e5a40'
            return <div key={i} className="dc-th-cell" style={{background:col,opacity:0.5+heat/200}}/>
          })}
        </div>
        <div className="dc-status-row"><div className="dc-led dc-led-r"/><span>OVERHEAT ZONE 3</span></div>
      </div>

      {/* Decoy P — wide alert console, bottom far-right */}
      <div className="rm-decoy dc-p" onClick={() => clickDecoy('p')}>
        {decoyFlash === 'p' && <div className="dc-denied">⚠ OFFLINE</div>}
        <div className="dc-title">ALERT·CONSOLE</div>
        {[
          {col:'#cc2200', msg:'CRITICAL — SECTOR 4 OFFLINE'},
          {col:'#ff7700', msg:'WARNING  — TEMP THRESHOLD'},
          {col:'#cc2200', msg:'CRITICAL — AUTH BREACH Z-2'},
          {col:'#ff7700', msg:'WARNING  — POWER SURGE'},
        ].map((a,i)=>(
          <div key={i} className="dc-alert-row" style={{borderLeftColor:a.col,animationDelay:`${i*0.4}s`}}>
            <div className="dc-led" style={{background:a.col,boxShadow:`0 0 5px ${a.col}`,width:6,height:6,borderRadius:'50%',flexShrink:0}}/>
            <span>{a.msg}</span>
          </div>
        ))}
      </div>

      {/* ─── FLOOR CABLES ─── */}
      <svg className="rm-floor-cables" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <path d="M12,0 C18,35 4,52 10,100"  stroke="#0d1e30" strokeWidth="1.1" fill="none" opacity=".7"/>
        <path d="M15,0 C22,40 7,58 14,100"  stroke="#00d4ff" strokeWidth=".45" fill="none" opacity=".35"/>
        <path d="M9,20 C14,50 5,68 11,100"  stroke="#aa44ff" strokeWidth=".6" fill="none" opacity=".3"/>
        <path d="M44,35 C50,60 36,72 42,100" stroke="#0d1e30" strokeWidth=".9" fill="none" opacity=".55"/>
        <path d="M47,35 C54,65 38,75 45,100" stroke="#ff6644" strokeWidth=".4" fill="none" opacity=".25"/>
        <path d="M3,0  C8,28 2,44 6,100"    stroke="#00ff88" strokeWidth=".4" fill="none" opacity=".22"/>
      </svg>

      {/* ─── WALL WARNING TAPE ─── */}
      <div className="rm-warn-tape" aria-hidden />

      {/* ─── WALL JUNK BOX with blinking LED ─── */}
      <div className="rm-wall-junk" aria-hidden>
        <div className="wj-box"><div className="wj-led" /></div>
        <div className="wj-label">⚠ RESTRICTED</div>
      </div>

      {/* ─── DESK EXTRA CLUTTER ─── */}
      <div className="rm-desk-extra" aria-hidden>
        <div className="dc-can dc-can1" />
        <div className="dc-can dc-can2" />
        <div className="dc-circuit" />
        <div className="dc-papers-extra"><span /></div>
      </div>

      {/* ─── WALL ART FRAME (pink glow) ─── */}
      <div className="rm-art-frame" aria-hidden>
        <div className="art-outer" />
        <div className="art-mount" />
      </div>

      {/* ─── WALL SHELF + PLANT ─── */}
      <div className="rm-shelf" aria-hidden>
        <div className="shelf-items">
          <div className="rm-plant">
            <div className="plant-leaves">
              <div className="plant-leaf pl-l1" />
              <div className="plant-leaf pl-l2" />
              <div className="plant-leaf pl-l3" />
            </div>
            <div className="plant-stem" />
            <div className="plant-pot" />
          </div>
        </div>
        <div className="shelf-board" />
      </div>

      {/* ─── OPERATOR — person at the desk ─── */}
      <div className="rm-operator" aria-hidden>
        <div className="op-phones">
          <div className="op-phone-cup op-cup-l" />
          <div className="op-phone-cup op-cup-r" />
        </div>
        <div className="op-head" />
        <div className="op-neck" />
        <div className="op-shoulders" />
        <div className="op-torso" />
        <div className="op-chair-back" />
        <div className="op-chair-seat" />
        <div className="op-armrest op-armrest-l" />
        <div className="op-armrest op-armrest-r" />
      </div>

      {/* ═══════════════════════════════════════════
          HUD
      ═══════════════════════════════════════════ */}
      <div className="rm-hud">
        <div className="rm-hud-title">PROTOCOL</div>
        <div className="rm-hud-pips">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className={`rm-pip ${i < configuredCount ? 'rm-pip-on' : ''}`} />
          ))}
        </div>
        <button className="rm-scan-btn" onClick={triggerScan} disabled={scanning}>
          {scanning ? '◉ SCANNING...' : '◎ SCAN ROOM'}
        </button>
      </div>

      {/* ═══════════════════════════════════════════
          MODAL
      ═══════════════════════════════════════════ */}
      {activeStation && active && (
        <StationModal
          stationLabel={active.label}
          stationColor={active.color}
          startTime={openedAt.current}
          onClose={() => setActiveStation(null)}
        >
          <active.Component
            onComplete={value => handleComplete(activeStation, value)}
            currentValue={scores[activeStation]}
          />
        </StationModal>
      )}
    </div>
  )
}
