import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

const WORLD_NAMES = {
  people:         'PEOPLE WORLD',
  environment:    'ENVIRONMENT WORLD',
  economy:        'ECONOMY WORLD',
  infrastructure: 'INFRASTRUCTURE WORLD',
  memory:         'MEMORY WORLD',
}

export default function SimulationScreen({ times = {}, onExit }) {
  const mountRef  = useRef(null)
  const stateRef  = useRef({ raf: null, aerial: false })
  const [locked,  setLocked]  = useState(false)
  const [aerial,  setAerial]  = useState(false)

  const entries = Object.entries(times).filter(([,v]) => v !== null && v !== undefined)
  const slowest = entries.length ? entries.sort((a,b) => b[1]-a[1])[0][0] : 'people'
  const fmt = ms => ms ? `${Math.round(ms/1000)}s` : '—'

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    /* ── RENDERER ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.shadowMap.enabled = true
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;'
    mount.appendChild(renderer.domElement)

    /* ── SCENE / CAMERA ── */
    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 800)
    camera.position.set(0, 1.7, 28)

    /* ── LIGHTING ── */
    const ambient = new THREE.AmbientLight(0xffffff, 0.7)
    scene.add(ambient)
    const sun = new THREE.DirectionalLight(0xffffff, 1.2)
    sun.position.set(50, 80, 40)
    sun.castShadow = true
    scene.add(sun)
    const fill = new THREE.DirectionalLight(0x8899ff, 0.3)
    fill.position.set(-30, 20, -20)
    scene.add(fill)

    /* ── TILED PLAZA GROUND ── */
    const tileCanvas = document.createElement('canvas')
    tileCanvas.width = tileCanvas.height = 128
    const tc = tileCanvas.getContext('2d')
    tc.fillStyle = '#b0a898'
    tc.fillRect(0, 0, 128, 128)
    tc.strokeStyle = '#9a9088'
    tc.lineWidth = 1
    for (let i = 0; i <= 128; i += 16) {
      tc.beginPath(); tc.moveTo(i, 0); tc.lineTo(i, 128); tc.stroke()
      tc.beginPath(); tc.moveTo(0, i); tc.lineTo(128, i); tc.stroke()
    }
    const tileTex = new THREE.CanvasTexture(tileCanvas)
    tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping
    tileTex.repeat.set(20, 20)
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshLambertMaterial({ map: tileTex })
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    /* ── TV TOWER (Fernsehturm) ── */
    function buildTVTower(show = true) {
      if (!show) return new THREE.Group()
      const g = new THREE.Group()
      // Concrete base legs
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 10, 1.2),
          new THREE.MeshLambertMaterial({ color: 0xbbbbbb })
        )
        leg.position.set(Math.cos(a) * 2.8, 5, Math.sin(a) * 2.8)
        g.add(leg)
      }
      // Main shaft lower
      const lower = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 2.5, 30, 12),
        new THREE.MeshLambertMaterial({ color: 0xcccccc })
      )
      lower.position.y = 25
      g.add(lower)
      // Main shaft upper
      const upper = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 1.2, 35, 10),
        new THREE.MeshLambertMaterial({ color: 0xdddddd })
      )
      upper.position.y = 57
      g.add(upper)
      // Transition disc
      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(5, 3, 1.5, 24),
        new THREE.MeshLambertMaterial({ color: 0xaaaaaa })
      )
      disc.position.y = 73
      g.add(disc)
      // Sphere — the iconic element
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(6, 20, 14),
        new THREE.MeshLambertMaterial({ color: 0xe8e0d8 })
      )
      sphere.position.y = 80
      g.add(sphere)
      // Cross-window strips on sphere (decorative)
      const stripH = new THREE.Mesh(
        new THREE.TorusGeometry(6, 0.3, 6, 32),
        new THREE.MeshLambertMaterial({ color: 0x888888 })
      )
      stripH.position.y = 80
      g.add(stripH)
      // Thin antenna above sphere
      const ant = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.22, 22, 6),
        new THREE.MeshLambertMaterial({ color: 0x999999 })
      )
      ant.position.y = 103
      g.add(ant)
      g.position.set(12, 0, -10)
      return g
    }

    /* ── WORLD CLOCK (Weltzeituhr) ── */
    function buildWorldClock(show = true) {
      if (!show) return new THREE.Group()
      const g = new THREE.Group()
      // Yellow base platform
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(3.5, 3.5, 0.6, 24),
        new THREE.MeshLambertMaterial({ color: 0xddaa00 })
      )
      g.add(base)
      // Hour columns around ring — alternating blue/yellow
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2
        const col = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.18, 3.2, 6),
          new THREE.MeshLambertMaterial({ color: i % 2 === 0 ? 0x0055bb : 0xffcc00 })
        )
        col.position.set(Math.cos(a) * 3, 2.2, Math.sin(a) * 3)
        g.add(col)
      }
      // Central shaft
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 4, 10),
        new THREE.MeshLambertMaterial({ color: 0xcccccc })
      )
      shaft.position.y = 2.3
      g.add(shaft)
      // Globe on top
      const globe = new THREE.Mesh(
        new THREE.SphereGeometry(1.8, 14, 10),
        new THREE.MeshLambertMaterial({ color: 0x1166cc })
      )
      globe.position.y = 5.8
      g.add(globe)
      // Equator ring on globe
      const eqRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.8, 0.15, 6, 24),
        new THREE.MeshLambertMaterial({ color: 0xffcc00 })
      )
      eqRing.position.y = 5.8
      g.add(eqRing)
      g.position.set(-3, 0, 4)
      return g
    }

    /* ── FOUNTAIN ── */
    function buildFountain() {
      const g = new THREE.Group()
      const bowl = new THREE.Mesh(
        new THREE.CylinderGeometry(4, 3.5, 0.8, 20),
        new THREE.MeshLambertMaterial({ color: 0x888888 })
      )
      g.add(bowl)
      const water = new THREE.Mesh(
        new THREE.CylinderGeometry(3.6, 3.6, 0.15, 20),
        new THREE.MeshLambertMaterial({ color: 0x3399cc, transparent: true, opacity: 0.8 })
      )
      water.position.y = 0.5
      g.add(water)
      const spire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.3, 2, 8),
        new THREE.MeshLambertMaterial({ color: 0x999999 })
      )
      spire.position.y = 1.5
      g.add(spire)
      g.position.set(8, 0, 14)
      return g
    }

    /* ── PARK INN HOTEL (tall iconic building) ── */
    function buildParkInn(opts = {}) {
      const color = opts.color || 0x4a6688
      // Main tower
      const tower = new THREE.Mesh(
        new THREE.BoxGeometry(16, 44, 12),
        new THREE.MeshLambertMaterial({ color })
      )
      tower.position.set(-26, 22, -22)
      // Window grid texture
      const wc = document.createElement('canvas')
      wc.width = 128; wc.height = 256
      const wx = wc.getContext('2d')
      wx.fillStyle = opts.winBg || '#2a4a66'
      wx.fillRect(0, 0, 128, 256)
      wx.fillStyle = opts.winColor || '#88aacc'
      for (let r = 0; r < 20; r++) for (let c = 0; c < 5; c++)
        wx.fillRect(c * 24 + 4, r * 12 + 3, 16, 7)
      tower.material.map = new THREE.CanvasTexture(wc)
      return tower
    }

    /* ── VARIED BUILDINGS RING ── */
    const BUILDING_PALETTE = [
      0xcc6644, // brick red
      0x8899aa, // concrete blue-grey
      0x667755, // GDR green-grey
      0xbbaa88, // sand/cream
      0x445566, // dark slate
      0x996644, // warm brown
      0x558877, // teal
      0xaa8855, // ochre
    ]

    function buildRingBuildings(opts = {}) {
      const g = new THREE.Group()
      const N = 18, R = 52
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2
        let h = opts.h || (10 + Math.random() * 22)
        if (opts.crumbled) h *= 0.2 + Math.random() * 0.8
        const w = 7 + Math.random() * 7, d = 7 + Math.random() * 6
        const baseColor = opts.color || BUILDING_PALETTE[i % BUILDING_PALETTE.length]
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(w, h, d),
          new THREE.MeshLambertMaterial({ color: baseColor })
        )
        mesh.position.set(Math.cos(a) * R, h / 2, Math.sin(a) * R)
        mesh.castShadow = true
        g.add(mesh)
        // Rooftop detail on taller buildings
        if (h > 18 && !opts.crumbled) {
          const roof = new THREE.Mesh(
            new THREE.BoxGeometry(w - 1, 1.5, d - 1),
            new THREE.MeshLambertMaterial({ color: 0x888888 })
          )
          roof.position.set(Math.cos(a) * R, h + 0.75, Math.sin(a) * R)
          g.add(roof)
        }
      }
      return g
    }

    /* ── STREET LAMPS ── */
    function buildLamps() {
      const g = new THREE.Group()
      const positions = [
        [15,0],[15,20],[15,-20],[-15,0],[-15,20],[-15,-20],
        [0,20],[0,-20],[25,10],[-25,10],
      ]
      positions.forEach(([x, z]) => {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.15, 6, 6),
          new THREE.MeshLambertMaterial({ color: 0x888888 })
        )
        pole.position.set(x, 3, z)
        g.add(pole)
        const head = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 0.3, 0.4),
          new THREE.MeshLambertMaterial({ color: 0xffffcc, emissive: 0xffffaa, emissiveIntensity: 0.6 })
        )
        head.position.set(x, 6.2, z)
        g.add(head)
      })
      return g
    }

    /* ── TREES ── */
    function buildTrees(count = 14, color = 0x336622) {
      const g = new THREE.Group()
      const spots = [
        [20,20],[22,10],[20,-5],[30,0],[28,18],
        [-20,15],[-22,5],[-18,-8],[-28,12],[-25,-5],
        [10,30],[-10,30],[10,-28],[-10,-28],
      ].slice(0, count)
      spots.forEach(([x, z]) => {
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.25, 0.35, 4, 6),
          new THREE.MeshLambertMaterial({ color: 0x5c3d1e })
        )
        trunk.position.set(x, 2, z)
        g.add(trunk)
        const crown = new THREE.Mesh(
          new THREE.SphereGeometry(2.5 + Math.random(), 8, 6),
          new THREE.MeshLambertMaterial({ color })
        )
        crown.position.set(x, 6, z)
        g.add(crown)
      })
      return g
    }

    /* ── NPC ── */
    function makeNPC(opts = {}) {
      const g = new THREE.Group()
      const coatColors = [0x334455, 0x553344, 0x445533, 0x554433, 0x335544]
      const bodyColor = opts.color || coatColors[Math.floor(Math.random() * coatColors.length)]
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, 1.5, 7),
        new THREE.MeshLambertMaterial({ color: bodyColor })
      )
      if (opts.hunched) body.scale.y = 0.6
      g.add(body)
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 8, 6),
        new THREE.MeshLambertMaterial({ color: 0xddaa88 })
      )
      head.position.y = opts.hunched ? 0.72 : 1.05
      g.add(head)
      g.position.set((Math.random() - 0.5) * 50, opts.hunched ? 0.45 : 0.75, (Math.random() - 0.5) * 50)
      g.userData = {
        target: new THREE.Vector3((Math.random() - 0.5) * 60, 0, (Math.random() - 0.5) * 60),
        speed: opts.speed || 0.035,
        retarget: opts.retarget || 0,
        timer: 0,
      }
      return g
    }

    function stepNPC(npc, S = 1) {
      const { target, speed, retarget } = npc.userData
      if (retarget > 0 && ++npc.userData.timer >= retarget) {
        npc.userData.timer = 0
        target.set((Math.random() - 0.5) * 60, 0, (Math.random() - 0.5) * 60)
      }
      const dx = target.x - npc.position.x, dz = target.z - npc.position.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < 0.5) {
        target.set((Math.random() - 0.5) * 60, 0, (Math.random() - 0.5) * 60)
      } else {
        npc.position.x += (dx / dist) * speed * S
        npc.position.z += (dz / dist) * speed * S
        npc.rotation.y  = Math.atan2(dx / dist, dz / dist)
      }
    }

    /* ── ANIMALS ── */
    function makeDog() {
      const g = new THREE.Group()
      const palette = [0x8b5e3c, 0xf5deb3, 0x2c1a0e, 0xddbb88, 0x555555]
      const col = palette[Math.floor(Math.random() * palette.length)]
      const mat  = new THREE.MeshLambertMaterial({ color: col })
      const dark = new THREE.MeshLambertMaterial({ color: 0x1a0e06 })
      // Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.55, 0.45), mat)
      body.position.y = 0.55; g.add(body)
      // Head
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 0.38), mat)
      head.position.set(0.6, 0.85, 0); g.add(head)
      // Snout
      const snout = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.22), mat)
      snout.position.set(0.82, 0.76, 0); g.add(snout)
      // Floppy ears
      for (const s of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.08), dark)
        ear.position.set(0.55, 1.06, s * 0.19); g.add(ear)
      }
      // 4 Legs
      for (const [xo, zo] of [[0.28,-0.17],[0.28,0.17],[-0.28,-0.17],[-0.28,0.17]]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.52, 5), dark)
        leg.position.set(xo, 0.28, zo); g.add(leg)
      }
      // Tail (angled up)
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 0.5, 5), mat)
      tail.position.set(-0.55, 0.78, 0); tail.rotation.z = -0.65; g.add(tail)
      g.position.set((Math.random()-0.5)*50, 0, (Math.random()-0.5)*50)
      g.userData = { target: new THREE.Vector3((Math.random()-0.5)*60,0,(Math.random()-0.5)*60), speed:0.04+Math.random()*0.025, retarget:180+Math.floor(Math.random()*140), timer:0 }
      return g
    }

    function makeCat() {
      const g = new THREE.Group()
      const palette = [0xff6600, 0x888888, 0x111111, 0xeeeeee, 0xcc8844]
      const col = palette[Math.floor(Math.random() * palette.length)]
      const mat = new THREE.MeshLambertMaterial({ color: col })
      // Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.4, 0.32), mat)
      body.position.y = 0.44; g.add(body)
      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), mat)
      head.position.set(0.46, 0.7, 0); g.add(head)
      // Pointed ears
      for (const s of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.17, 4), mat)
        ear.position.set(0.44, 0.96, s * 0.14); ear.rotation.z = s * 0.25; g.add(ear)
      }
      // 4 slender legs
      for (const [xo, zo] of [[0.2,-0.12],[0.2,0.12],[-0.2,-0.12],[-0.2,0.12]]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.42, 5), mat)
        leg.position.set(xo, 0.22, zo); g.add(leg)
      }
      // Two-segment curved tail
      const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.52, 5), mat)
      t1.position.set(-0.44, 0.62, 0); t1.rotation.z = -0.7; g.add(t1)
      const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.38, 5), mat)
      t2.position.set(-0.68, 0.88, 0); t2.rotation.z = 0.45; g.add(t2)
      g.position.set((Math.random()-0.5)*45, 0, (Math.random()-0.5)*45)
      g.userData = { target: new THREE.Vector3((Math.random()-0.5)*50,0,(Math.random()-0.5)*50), speed:0.022+Math.random()*0.02, retarget:220+Math.floor(Math.random()*180), timer:0 }
      return g
    }

    function makeMouse() {
      const g = new THREE.Group()
      const mat  = new THREE.MeshLambertMaterial({ color: 0x999999 })
      const pink = new THREE.MeshLambertMaterial({ color: 0xddaaaa })
      // Body (stretched sphere)
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.14, 7, 5), mat)
      body.scale.z = 1.6; body.position.y = 0.14; g.add(body)
      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 7, 5), mat)
      head.position.set(0.2, 0.15, 0); g.add(head)
      // Big round ears
      for (const s of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 4), pink)
        ear.scale.z = 0.3; ear.position.set(0.17, 0.29, s * 0.13); g.add(ear)
      }
      // Tiny pink nose
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.025, 4, 3), pink)
      nose.position.set(0.31, 0.15, 0); g.add(nose)
      // Long thin tail
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.02, 0.42, 4), mat)
      tail.position.set(-0.26, 0.14, 0); tail.rotation.z = 0.5; g.add(tail)
      g.position.set((Math.random()-0.5)*35, 0, (Math.random()-0.5)*35)
      g.userData = { target: new THREE.Vector3((Math.random()-0.5)*40,0,(Math.random()-0.5)*40), speed:0.07+Math.random()*0.04, retarget:70+Math.floor(Math.random()*80), timer:0 }
      return g
    }

    /* ══════════════════════════════════════════
       WORLD BUILDERS
    ══════════════════════════════════════════ */
    const animated = [], npcs = []

    function buildPeople() {
      // ── Brighter midnight-blue sky ──
      scene.background = new THREE.Color(0x0d1a40)
      scene.fog = new THREE.Fog(0x0d1a40, 28, 90)
      ambient.intensity = 0.75
      ambient.color.set(0x8899cc)
      sun.color.set(0x99aadd); sun.intensity = 0.55
      fill.color.set(0x3355aa); fill.intensity = 0.3
      ground.material.map = null; ground.material.color.set(0x1a2035)

      scene.add(buildTVTower())
      scene.add(buildWorldClock())
      scene.add(buildRingBuildings({ color: 0x1e2244 }))
      scene.add(buildFountain())

      // ── Existing lamp post geometry ──
      scene.add(buildLamps())

      // ── Extra lamp posts deeper in the plaza ──
      const EXTRA_LAMP_POS = [
        [6,8],[-6,8],[6,-8],[-6,-8],
        [20,-15],[-20,-15],[20,30],[-20,30],
      ]
      const extraG = new THREE.Group()
      EXTRA_LAMP_POS.forEach(([x, z]) => {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.15, 6, 6),
          new THREE.MeshLambertMaterial({ color: 0x888888 })
        )
        pole.position.set(x, 3, z); extraG.add(pole)
        const head = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 0.3, 0.4),
          new THREE.MeshLambertMaterial({ color: 0xffffcc, emissive: 0xffffaa, emissiveIntensity: 1.0 })
        )
        head.position.set(x, 6.2, z); extraG.add(head)
      })
      scene.add(extraG)

      // ── Real PointLights at every lamp head — warm yellow-white ──
      const ALL_LAMP_POS = [
        [15,0],[15,20],[15,-20],[-15,0],[-15,20],[-15,-20],
        [0,20],[0,-20],[25,10],[-25,10],
        ...EXTRA_LAMP_POS,
      ]
      ALL_LAMP_POS.forEach(([x, z]) => {
        const l = new THREE.PointLight(0xffeebb, 2.2, 22)
        l.position.set(x, 6.2, z)
        scene.add(l)
      })

      // ── Soft atmospheric accent lights ──
      const pinkLight = new THREE.PointLight(0xff44aa, 0.5, 40)
      pinkLight.position.set(0, 12, 0); scene.add(pinkLight)
      const blueLight = new THREE.PointLight(0x3366ff, 0.45, 35)
      blueLight.position.set(22, 8, -12); scene.add(blueLight)

      // Drifting litter (humans are gone)
      for (let i = 0; i < 14; i++) {
        const lit = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.03, 0.15),
          new THREE.MeshLambertMaterial({ color: 0x3a3a4a })
        )
        lit.position.set((Math.random() - 0.5) * 40, 0.02, (Math.random() - 0.5) * 40)
        lit.userData.dx = (Math.random() - 0.5) * 0.005
        lit.userData.dz = (Math.random() - 0.5) * 0.005
        animated.push(lit); scene.add(lit)
      }
      // The city belongs to the animals now
      for (let i = 0; i < 7;  i++) { const a = makeDog();   npcs.push(a); scene.add(a) }
      for (let i = 0; i < 6;  i++) { const a = makeCat();   npcs.push(a); scene.add(a) }
      for (let i = 0; i < 14; i++) { const a = makeMouse(); npcs.push(a); scene.add(a) }
    }

    function buildEnvironment() {
      // ── Hazy dusk sky — toned down, buildings visible ──
      scene.background = new THREE.Color(0x1a0d08)
      scene.fog = new THREE.FogExp2(0x3a1a0a, 0.013)
      ambient.color.set(0xcc6633); ambient.intensity = 0.55
      sun.color.set(0xff6633); sun.intensity = 0.9
      fill.color.set(0xaa4422); fill.intensity = 0.35
      // Scorched ground
      ground.material.map = null; ground.material.color.set(0x2e1208)

      // Softer heat point lights
      const heatA = new THREE.PointLight(0xff4422, 1.4, 45)
      heatA.position.set(0, 1.5, 0); scene.add(heatA)
      const heatB = new THREE.PointLight(0xff6633, 0.9, 30)
      heatB.position.set(18, 1, -12); scene.add(heatB)
      const heatC = new THREE.PointLight(0xff5522, 0.7, 25)
      heatC.position.set(-15, 1, 14); scene.add(heatC)

      scene.add(buildTVTower())
      scene.add(buildWorldClock())
      scene.add(buildRingBuildings({ color: 0x7a3a18 }))
      scene.add(buildFountain())

      // Charred bare tree stumps
      for (let i = 0; i < 18; i++) {
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.18, 2.5 + Math.random() * 2, 5),
          new THREE.MeshLambertMaterial({ color: 0x1e0a04 })
        )
        trunk.position.set((Math.random() - 0.5) * 55, 1.4, (Math.random() - 0.5) * 55)
        scene.add(trunk)
      }

      // Reduced embers — small, subtle
      const emberColors = [0xff4400, 0xff6600, 0xff8800, 0xffaa00]
      for (let i = 0; i < 35; i++) {
        const size = 0.03 + Math.random() * 0.07
        const ep = new THREE.Mesh(
          new THREE.SphereGeometry(size, 4, 3),
          new THREE.MeshBasicMaterial({
            color: emberColors[Math.floor(Math.random() * emberColors.length)],
            transparent: true,
            opacity: 0.35 + Math.random() * 0.3,
          })
        )
        ep.position.set((Math.random() - 0.5) * 60, Math.random() * 14, (Math.random() - 0.5) * 60)
        ep.userData.rise = 0.018 + Math.random() * 0.03
        animated.push(ep); scene.add(ep)
      }

      // ── Smoke plumes rising from the ground ──
      const smokeColors = [0x444444, 0x333333, 0x555555, 0x3a3028, 0x4a3830]
      for (let i = 0; i < 45; i++) {
        const size = 0.35 + Math.random() * 0.7
        const smoke = new THREE.Mesh(
          new THREE.SphereGeometry(size, 6, 5),
          new THREE.MeshBasicMaterial({
            color: smokeColors[Math.floor(Math.random() * smokeColors.length)],
            transparent: true,
            opacity: 0.18 + Math.random() * 0.22,
          })
        )
        // Start at or just above ground, spread across scene
        smoke.position.set(
          (Math.random() - 0.5) * 70,
          Math.random() * 5,         // low starting height
          (Math.random() - 0.5) * 70
        )
        smoke.userData.rise     = 0.012 + Math.random() * 0.022   // slower than embers
        smoke.userData.drift    = (Math.random() - 0.5) * 0.006   // slight horizontal drift
        smoke.userData.maxY     = 18 + Math.random() * 10         // fade out height
        smoke.userData.baseOpac = smoke.material.opacity
        animated.push(smoke); scene.add(smoke)
      }

      // Falling heavy smog clumps — reduced and lighter
      for (let i = 0; i < 25; i++) {
        const sp = new THREE.Mesh(
          new THREE.SphereGeometry(0.08 + Math.random() * 0.07, 4, 4),
          new THREE.MeshBasicMaterial({ color: 0x3a2010, transparent: true, opacity: 0.45 })
        )
        sp.position.set((Math.random() - 0.5) * 60, Math.random() * 18, (Math.random() - 0.5) * 60)
        sp.userData.fall = 0.004 + Math.random() * 0.009
        animated.push(sp); scene.add(sp)
      }

      // Heat & pollution warning signs
      const WARNINGS = [
        ['SURFACE TEMP',  '58 °C'],
        ['UV INDEX',      'EXTREME'],
        ['AIR QUALITY',   'HAZARDOUS'],
        ['HEAT ALERT',    'LEVEL 5'],
        ['VEGETATION',    '0 %'],
        ['HUMIDITY',      '2 %'],
        ['O₃ LEVEL',      'CRITICAL'],
        ['VISIBILITY',    '40 m'],
      ]
      WARNINGS.forEach(([label, value], i) => {
        const cv = document.createElement('canvas')
        cv.width = 280; cv.height = 86
        const cx = cv.getContext('2d')
        cx.fillStyle = '#120000'; cx.fillRect(0, 0, 280, 86)
        cx.strokeStyle = '#ff2200'; cx.lineWidth = 2.5; cx.strokeRect(2, 2, 276, 82)
        cx.fillStyle = '#ff4422'; cx.font = '13px monospace'; cx.fillText(label, 10, 26)
        cx.fillStyle = '#ff0000'; cx.font = 'bold 28px monospace'; cx.fillText(value, 10, 64)
        const sign = new THREE.Mesh(
          new THREE.PlaneGeometry(5.5, 1.7),
          new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), side: THREE.DoubleSide })
        )
        const angle = (i / WARNINGS.length) * Math.PI * 2
        const dist  = 11 + (i % 3) * 7
        sign.position.set(Math.cos(angle) * dist, 2.2 + (i % 3) * 0.9, Math.sin(angle) * dist)
        sign.rotation.y = -angle
        scene.add(sign)
      })

      // Hunched, struggling survivors — more of them, slightly faster so movement is visible
      for (let i = 0; i < 20; i++) {
        const n = makeNPC({ hunched: true, speed: 0.022 + Math.random() * 0.018, color: 0x3a1a0a })
        npcs.push(n); scene.add(n)
      }
    }

    function buildEconomy() {
      scene.background = new THREE.Color(0xcc7700)
      sun.color.set(0xffbb44); sun.intensity = 1.3
      ambient.intensity = 0.9
      ground.material.map = null; ground.material.color.set(0xaa8833)
      scene.add(buildTVTower())
      scene.add(buildWorldClock())
      scene.add(buildRingBuildings({ color: 0x996600 }))
      scene.add(buildFountain())
      scene.add(buildLamps())

      // ── Euro symbol helper (canvas texture) ──
      function makeEuroTex(size = 128) {
        const cv = document.createElement('canvas')
        cv.width = cv.height = size
        const cx = cv.getContext('2d')
        cx.clearRect(0, 0, size, size)
        cx.font = `bold ${Math.round(size * 0.82)}px serif`
        cx.textAlign = 'center'
        cx.textBaseline = 'middle'
        // Soft glow behind
        cx.shadowColor = '#ffdd00'
        cx.shadowBlur = size * 0.18
        cx.fillStyle = '#ffe600'
        cx.fillText('\u20AC', size / 2, size / 2)
        return new THREE.CanvasTexture(cv)
      }

      // ── 120 falling euro symbols ──
      for (let i = 0; i < 120; i++) {
        const s = 0.5 + Math.random() * 1.4
        const euro = new THREE.Mesh(
          new THREE.PlaneGeometry(s, s),
          new THREE.MeshBasicMaterial({
            map: makeEuroTex(128),
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
          })
        )
        euro.position.set(
          (Math.random() - 0.5) * 90,
          Math.random() * 32,
          (Math.random() - 0.5) * 90
        )
        euro.userData.fall        = 0.035 + Math.random() * 0.07
        euro.userData.wobble      = Math.random() * Math.PI * 2
        euro.userData.wobbleSpeed = 0.03 + Math.random() * 0.04
        euro.userData.spinY       = (Math.random() - 0.5) * 0.04
        animated.push(euro)
        scene.add(euro)
      }

      // ── Price popup signs (daily needs, hyperinflation prices) ──
      const PRICE_ITEMS = [
        ['Bread (loaf)',    '€ 47,500'],
        ['Coffee',         '€ 23,000'],
        ['Bus Ticket',     '€  4,200'],
        ['Rent / month',   '€480,000'],
        ['Aspirin',        '€  2,700'],
        ['Eggs (dozen)',   '€ 31,000'],
        ['Internet / mo',  '€  9,500'],
        ['Electricity',    '€ 18,000'],
        ['Milk  1L',       '€  8,500'],
        ['Tomatoes  1kg',  '€  6,200'],
        ['Water  1L',      '€ 12,800'],
        ['Soap',           '€  3,100'],
      ]

      PRICE_ITEMS.forEach(([item, price], i) => {
        const cv = document.createElement('canvas')
        cv.width = 300; cv.height = 90
        const cx = cv.getContext('2d')
        // Background
        cx.fillStyle = '#0d0600'
        cx.fillRect(0, 0, 300, 90)
        // Amber border
        cx.strokeStyle = '#cc7700'
        cx.lineWidth = 2.5
        cx.strokeRect(2, 2, 296, 86)
        // Item name
        cx.fillStyle = '#aaaaaa'
        cx.font = '14px monospace'
        cx.fillText(item, 12, 28)
        // Price in bright yellow
        cx.fillStyle = '#ffcc00'
        cx.font = 'bold 26px monospace'
        cx.fillText(price, 12, 66)
        // Tiny PROTOCOL tag
        cx.fillStyle = '#554400'
        cx.font = '10px monospace'
        cx.fillText('ALEXANDERPLATZ MARKET  2047', 12, 83)

        const sign = new THREE.Mesh(
          new THREE.PlaneGeometry(6, 1.8),
          new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), side: THREE.DoubleSide })
        )
        // Scatter at varying distances and heights around the plaza
        const angle  = (i / PRICE_ITEMS.length) * Math.PI * 2
        const dist   = 10 + (i % 3) * 8 + Math.random() * 4
        const height = 2.2 + (i % 4) * 1.2
        sign.position.set(
          Math.cos(angle) * dist + (Math.random() - 0.5) * 4,
          height,
          Math.sin(angle) * dist + (Math.random() - 0.5) * 4
        )
        sign.rotation.y = -angle + (Math.random() - 0.5) * 0.4
        scene.add(sign)
      })

      // Busy commuters and shoppers — varied speeds
      for (let i = 0; i < 24; i++) {
        const colors = [0xddbb88, 0xccaa77, 0xbbaa99, 0x998877, 0xeeccaa]
        const n = makeNPC({
          speed: 0.04 + Math.random() * 0.06,
          retarget: 80 + Math.floor(Math.random() * 80),
          color: colors[Math.floor(Math.random() * colors.length)],
        })
        npcs.push(n); scene.add(n)
      }
    }

    function buildInfrastructure() {
      scene.background = new THREE.Color(0x1e1208)
      scene.fog = new THREE.Fog(0x1e1208, 12, 65)
      ambient.intensity = 0.35; sun.color.set(0xff6622); sun.intensity = 0.5
      ground.material.map = null; ground.material.color.set(0x3a2a18)

      // ── TV Tower — still standing but visibly damaged ──
      const tower = buildTVTower()
      tower.rotation.z = 0.045   // leaning slightly
      tower.rotation.x = 0.02
      scene.add(tower)

      // ── Crumbled ring buildings ──
      scene.add(buildRingBuildings({ color: 0x5a4030, crumbled: true }))

      // ── Fallen flat wall slabs on the ground ──
      const slabMats = [0x5a4030, 0x4a3825, 0x6a5040, 0x3a2820, 0x553322]
      for (let i = 0; i < 12; i++) {
        const slab = new THREE.Mesh(
          new THREE.BoxGeometry(4 + Math.random()*6, 0.35, 3 + Math.random()*4),
          new THREE.MeshLambertMaterial({ color: slabMats[i % slabMats.length] })
        )
        slab.position.set((Math.random()-0.5)*55, 0.18, (Math.random()-0.5)*55)
        slab.rotation.y = Math.random() * Math.PI
        slab.rotation.x = (Math.random()-0.5) * 0.28
        scene.add(slab)
      }

      // ── Leaning broken wall sections (still partly standing) ──
      for (let i = 0; i < 9; i++) {
        const wall = new THREE.Mesh(
          new THREE.BoxGeometry(2.5 + Math.random()*4, 3 + Math.random()*5, 0.4),
          new THREE.MeshLambertMaterial({ color: 0x4a3322 })
        )
        wall.position.set((Math.random()-0.5)*48, 2.5, (Math.random()-0.5)*48)
        wall.rotation.y = Math.random() * Math.PI
        wall.rotation.z = (Math.random()-0.5) * 0.55   // leaning dangerously
        scene.add(wall)
      }

      // ── Rubble piles (clusters of small chunks) ──
      for (let i = 0; i < 22; i++) {
        const rx = (Math.random()-0.5)*58, rz = (Math.random()-0.5)*58
        for (let j = 0; j < 4 + Math.floor(Math.random()*5); j++) {
          const chunk = new THREE.Mesh(
            new THREE.BoxGeometry(0.25+Math.random()*0.7, 0.15+Math.random()*0.4, 0.25+Math.random()*0.7),
            new THREE.MeshLambertMaterial({ color: 0x4a3825 })
          )
          chunk.position.set(rx+(Math.random()-0.5)*2.5, 0.15, rz+(Math.random()-0.5)*2.5)
          chunk.rotation.set(Math.random()*0.5, Math.random()*Math.PI*2, Math.random()*0.5)
          scene.add(chunk)
        }
      }

      // ── Fallen street lamps lying on the ground ──
      for (let i = 0; i < 7; i++) {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.12, 6, 6),
          new THREE.MeshLambertMaterial({ color: 0x555555 })
        )
        pole.position.set((Math.random()-0.5)*42, 0.12, (Math.random()-0.5)*42)
        pole.rotation.z = Math.PI / 2 + (Math.random()-0.5)*0.35
        pole.rotation.y = Math.random()*Math.PI
        scene.add(pole)
      }

      // ── Moving collision cars ──
      const carA = new THREE.Mesh(new THREE.BoxGeometry(2.2,0.9,4.5), new THREE.MeshLambertMaterial({ color: 0xaa2222 }))
      const carB = new THREE.Mesh(new THREE.BoxGeometry(2.2,0.9,4.5), new THREE.MeshLambertMaterial({ color: 0x2233aa }))
      carA.position.set(-22, 0.45, 6); carB.position.set(22, 0.45, 6)
      carA.userData.dir = 1; carB.userData.dir = -1
      animated.push(carA, carB); scene.add(carA, carB)

      // ── Additional crashed / abandoned cars ──
      ;[
        { p:[8,0.45,-14],  ry:0.8,  rx:0,    c:0x886633 },
        { p:[-14,0.45,9],  ry:-0.4, rx:0,    c:0x336644 },
        { p:[18,0.45,22],  ry:1.2,  rx:0,    c:0x554422 },
        { p:[-9,0.32,-21], ry:0.2,  rx:0.18, c:0x662222 }, // tilted
        { p:[24,0.45,-5],  ry:2.4,  rx:0,    c:0x445533 },
        { p:[-20,0.45,-14],ry:1.8,  rx:0,    c:0x776644 },
      ].forEach(({ p, ry, rx, c }) => {
        const car = new THREE.Mesh(new THREE.BoxGeometry(2.2,0.9,4.5), new THREE.MeshLambertMaterial({ color: c }))
        car.position.set(...p); car.rotation.y = ry; car.rotation.x = rx
        scene.add(car)
      })

      // ── Deep ground cracks ──
      const pts = []
      for (let i = 0; i < 45; i++) {
        const sx = (Math.random()-0.5)*70, sz = (Math.random()-0.5)*70
        for (let j = 0; j < 6; j++)
          pts.push(sx+(Math.random()-0.5)*6,0.01,sz+(Math.random()-0.5)*6,
                   sx+(Math.random()-0.5)*6,0.01,sz+(Math.random()-0.5)*6)
      }
      const cg = new THREE.BufferGeometry()
      cg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
      scene.add(new THREE.LineSegments(cg, new THREE.LineBasicMaterial({ color: 0x110800 })))

      // ── Danger warning signs ──
      const DANGER = [
        ['ROAD CLOSED',  'STRUCTURAL DAMAGE'],
        ['DANGER',       'COLLAPSE RISK'],
        ['NO ENTRY',     'UNSAFE ZONE'],
        ['EMERGENCY',    'CALL 112'],
        ['GAS LEAK',     'DO NOT ENTER'],
        ['POWER OUTAGE', 'LIVE WIRES AHEAD'],
      ]
      DANGER.forEach(([l1, l2], i) => {
        const cv = document.createElement('canvas')
        cv.width = 256; cv.height = 80
        const cx = cv.getContext('2d')
        cx.fillStyle = '#150800'; cx.fillRect(0,0,256,80)
        cx.strokeStyle = '#ff4400'; cx.lineWidth = 2; cx.strokeRect(2,2,252,76)
        cx.fillStyle = '#ff6600'; cx.font = 'bold 18px monospace'; cx.fillText(l1, 10, 28)
        cx.fillStyle = '#ffaa44'; cx.font = '12px monospace'; cx.fillText(l2, 10, 56)
        const sign = new THREE.Mesh(
          new THREE.PlaneGeometry(4.6,1.4),
          new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), side: THREE.DoubleSide })
        )
        const a = (i / DANGER.length) * Math.PI * 2
        sign.position.set(Math.cos(a)*13, 2.2+(i%2)*1.2, Math.sin(a)*13)
        sign.rotation.y = -a + (Math.random()-0.5)*0.5
        scene.add(sign)
      })

      // ── Orange safety barriers ──
      for (let i = 0; i < 20; i++) {
        const b = new THREE.Mesh(
          new THREE.BoxGeometry(0.4,1.0,0.4),
          new THREE.MeshLambertMaterial({ color: 0xff6600 })
        )
        b.position.set((Math.random()-0.5)*36, 0.5, (Math.random()-0.5)*36)
        b.rotation.y = (Math.random()-0.5)*0.5
        scene.add(b)
      }

      // ── Smoke rising from rubble ──
      for (let i = 0; i < 35; i++) {
        const smoke = new THREE.Mesh(
          new THREE.SphereGeometry(0.08+Math.random()*0.16, 5, 4),
          new THREE.MeshBasicMaterial({ color: 0x2a2a2a, transparent:true, opacity:0.35+Math.random()*0.3 })
        )
        smoke.position.set((Math.random()-0.5)*55, Math.random()*12, (Math.random()-0.5)*55)
        smoke.userData.rise = 0.012 + Math.random()*0.022
        animated.push(smoke); scene.add(smoke)
      }

      // ── Pulsing warning lights ──
      ;[[0,7,0,0xff3300,2.8,32],[16,5,-12,0xff6600,2.2,24],[-13,5,16,0xff2200,2.0,22]].forEach(([x,y,z,c,i,d]) => {
        const l = new THREE.PointLight(c, i, d); l.position.set(x,y,z); scene.add(l)
      })

      // ── Panicking people running in all directions ──
      for (let i = 0; i < 28; i++) {
        const n = makeNPC({
          speed: 0.07 + Math.random() * 0.09,
          retarget: 30 + Math.floor(Math.random() * 60),
          color: 0x887766,
        })
        npcs.push(n); scene.add(n)
      }
    }

    function buildMemory() {
      scene.background = new THREE.Color(0xeeeeee)
      ambient.intensity = 1.0; sun.color.set(0xffffff); sun.intensity = 0.5
      ground.material.map = null; ground.material.color.set(0xdddddd)

      // Uniform identical grid — no TV tower, no clock
      const sp = 15
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          if (r === 0 && c === 0) continue
          const m = new THREE.Mesh(
            new THREE.BoxGeometry(5, 9, 5),
            new THREE.MeshLambertMaterial({ color: 0x999999 })
          )
          m.position.set(c * sp, 4.5, r * sp)
          scene.add(m)
        }
      }

      // ── Question mark texture helper ──
      function makeQMarkTex(size, color, alpha) {
        const cv = document.createElement('canvas')
        cv.width = cv.height = size
        const cx = cv.getContext('2d')
        cx.clearRect(0, 0, size, size)
        cx.font = `bold ${Math.round(size * 0.85)}px serif`
        cx.textAlign = 'center'
        cx.textBaseline = 'middle'
        cx.globalAlpha = alpha
        cx.fillStyle = color
        cx.fillText('?', size / 2, size / 2 + size * 0.04)
        return new THREE.CanvasTexture(cv)
      }

      // ── Large ? painted on building faces ──
      const buildingPositions = []
      for (let r = -2; r <= 2; r++) for (let c = -2; c <= 2; c++) {
        if (r === 0 && c === 0) continue
        buildingPositions.push([c * sp, r * sp])
      }
      buildingPositions.forEach(([bx, bz]) => {
        // stick a ? on each of the 4 faces
        const offsets = [[0, 2.8, 0], [0, -2.8, 0], [2.8, 0, 0], [-2.8, 0, 0]]
        const rotations = [0, Math.PI, Math.PI / 2, -Math.PI / 2]
        offsets.forEach(([ox, oz, _], fi) => {
          const sign = new THREE.Mesh(
            new THREE.PlaneGeometry(3.5, 3.5),
            new THREE.MeshBasicMaterial({
              map: makeQMarkTex(128, '#444444', 0.55),
              transparent: true,
              side: THREE.DoubleSide,
              depthWrite: false,
            })
          )
          sign.position.set(bx + ox, 4.5, bz + oz)
          sign.rotation.y = rotations[fi]
          scene.add(sign)
        })
      })

      // ── Floating ? sprites drifting through the air ──
      const qColors  = ['#cc0000', '#0044cc', '#888888', '#222222']
      const qAlphas  = [0.9, 0.75, 0.6, 0.5]
      for (let i = 0; i < 80; i++) {
        const s = 0.6 + Math.random() * 1.8
        const col = qColors[i % qColors.length]
        const alp = qAlphas[Math.floor(Math.random() * qAlphas.length)]
        const q = new THREE.Mesh(
          new THREE.PlaneGeometry(s, s),
          new THREE.MeshBasicMaterial({
            map: makeQMarkTex(128, col, alp),
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
          })
        )
        q.position.set(
          (Math.random() - 0.5) * 80,
          0.5 + Math.random() * 12,
          (Math.random() - 0.5) * 80
        )
        // slow horizontal drift + gentle bobbing
        q.userData.dx      = (Math.random() - 0.5) * 0.006
        q.userData.dz      = (Math.random() - 0.5) * 0.006
        q.userData.bobBase = q.position.y
        q.userData.bobT    = Math.random() * Math.PI * 2
        q.userData.bobAmp  = 0.3 + Math.random() * 0.4
        animated.push(q)
        scene.add(q)
      }

      // ── ? signs on poles scattered at ground level ──
      const poleSpots = [
        [5,5],[5,-5],[-5,5],[-5,-5],[12,0],[-12,0],[0,12],[0,-12],
        [8,18],[-8,18],[8,-18],[-8,-18],[18,8],[-18,8],[18,-8],[-18,-8],
      ]
      poleSpots.forEach(([px, pz]) => {
        // pole
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.08, 4, 5),
          new THREE.MeshLambertMaterial({ color: 0x888888 })
        )
        pole.position.set(px, 2, pz)
        scene.add(pole)
        // sign board
        const cv2 = document.createElement('canvas')
        cv2.width = 128; cv2.height = 128
        const cx2 = cv2.getContext('2d')
        cx2.fillStyle = '#ffffff'
        cx2.fillRect(0, 0, 128, 128)
        cx2.strokeStyle = '#999999'
        cx2.lineWidth = 4
        cx2.strokeRect(2, 2, 124, 124)
        cx2.font = 'bold 96px serif'
        cx2.textAlign = 'center'
        cx2.textBaseline = 'middle'
        cx2.fillStyle = '#cc0000'
        cx2.fillText('?', 64, 68)
        const board = new THREE.Mesh(
          new THREE.PlaneGeometry(2, 2),
          new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv2), side: THREE.DoubleSide })
        )
        board.position.set(px, 5, pz)
        scene.add(board)
      })

      // Wandering figures — medium pace, grey tones to match Memory world
      for (let i = 0; i < 18; i++) {
        const greys = [0xaaaaaa, 0x999999, 0xbbbbbb, 0x888888, 0xcccccc]
        const n = makeNPC({
          speed: 0.038 + Math.random() * 0.03,
          retarget: 90 + Math.floor(Math.random() * 80),
          color: greys[Math.floor(Math.random() * greys.length)],
        })
        npcs.push(n); scene.add(n)
      }
    }

    // Park Inn (always present except memory)
    if (slowest !== 'memory') {
      const pi = buildParkInn({
        color: slowest === 'infrastructure' ? 0x443322 : slowest === 'environment' ? 0x445533 : 0x4a6688,
      })
      scene.add(pi)
    }

    switch (slowest) {
      case 'people':         buildPeople();         break
      case 'environment':    buildEnvironment();    break
      case 'economy':        buildEconomy();        break
      case 'infrastructure': buildInfrastructure(); break
      case 'memory':         buildMemory();         break
      default:               buildPeople()
    }

    // Trees for non-damaged worlds
    if (slowest === 'people') scene.add(buildTrees(6, 0x1a3a22))
    if (slowest === 'economy') scene.add(buildTrees(8, 0x335522))

    /* ── POINTER LOCK ── */
    const canvas = renderer.domElement
    const onLockChange = () => {
      const isLocked = document.pointerLockElement === canvas
      stateRef.current.locked = isLocked
      setLocked(isLocked)
    }
    canvas.addEventListener('click', () => {
      if (!stateRef.current.aerial) canvas.requestPointerLock()
    })
    document.addEventListener('pointerlockchange', onLockChange)

    /* ── CONTROLS ── */
    const keys = {}
    const onKeyDown = e => {
      keys[e.code] = true
      if (e.code === 'Tab') {
        e.preventDefault()
        stateRef.current.aerial = !stateRef.current.aerial
        setAerial(a => !a)
        if (stateRef.current.aerial) {
          document.exitPointerLock?.()
          camera.position.set(0, 95, 0)
        } else {
          camera.position.set(0, 1.7, 28)
        }
      }
    }
    const onKeyUp = e => { keys[e.code] = false }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup',   onKeyUp)

    let yaw = 0, pitch = 0
    const onMouseMove = e => {
      if (!stateRef.current.locked || stateRef.current.aerial) return
      yaw   -= e.movementX * 0.0022
      pitch -= e.movementY * 0.0022
      pitch  = Math.max(-1.3, Math.min(1.3, pitch))
    }
    document.addEventListener('mousemove', onMouseMove)

    /* ── ANIMATION LOOP ── */
    const fwd   = new THREE.Vector3()
    const right = new THREE.Vector3()

    const animate = () => {
      stateRef.current.raf = requestAnimationFrame(animate)
      const isAerial = stateRef.current.aerial

      if (isAerial) {
        // Aerial: WASD pans x/z, camera fixed high looking down
        const panSpd = 0.4
        if (keys['KeyW'] || keys['ArrowUp'])    camera.position.z -= panSpd
        if (keys['KeyS'] || keys['ArrowDown'])  camera.position.z += panSpd
        if (keys['KeyA'] || keys['ArrowLeft'])  camera.position.x -= panSpd
        if (keys['KeyD'] || keys['ArrowRight']) camera.position.x += panSpd
        camera.position.y = 95
        camera.rotation.order = 'YXZ'
        camera.rotation.x = -Math.PI / 2
        camera.rotation.y = 0
      } else {
        const spd = 0.15
        fwd.set(-Math.sin(yaw), 0, -Math.cos(yaw))
        right.set(Math.cos(yaw), 0, -Math.sin(yaw))
        if (keys['KeyW'] || keys['ArrowUp'])    camera.position.addScaledVector(fwd,    spd)
        if (keys['KeyS'] || keys['ArrowDown'])  camera.position.addScaledVector(fwd,   -spd)
        if (keys['KeyA'] || keys['ArrowLeft'])  camera.position.addScaledVector(right, -spd)
        if (keys['KeyD'] || keys['ArrowRight']) camera.position.addScaledVector(right,  spd)
        camera.position.y = 1.7
        camera.rotation.order = 'YXZ'
        camera.rotation.y = yaw
        camera.rotation.x = pitch
      }

      // Global animation speed scalar — lower = slower
      const S = 0.28

      // Animate objects
      for (const o of animated) {
        if (o.userData.dx !== undefined) {
          o.position.x += o.userData.dx * S
          o.position.z += o.userData.dz * S
          if (Math.abs(o.position.x) > 45) o.userData.dx *= -1
          if (Math.abs(o.position.z) > 45) o.userData.dz *= -1
          // gentle vertical bob for floating ? marks
          if (o.userData.bobBase !== undefined) {
            o.userData.bobT += 0.018 * S
            o.position.y = o.userData.bobBase + Math.sin(o.userData.bobT) * o.userData.bobAmp
          }
        } else if (o.userData.rise !== undefined) {
          o.position.y += o.userData.rise * S
          // Smoke: horizontal drift + fade as it rises
          if (o.userData.drift !== undefined) {
            o.position.x += o.userData.drift * S
            const maxY = o.userData.maxY || 20
            const t = Math.min(o.position.y / maxY, 1)
            o.material.opacity = o.userData.baseOpac * (1 - t * t)
          }
          const ceiling = o.userData.maxY || 20
          if (o.position.y > ceiling) {
            o.position.y = 0.05
            o.position.x = (Math.random() - 0.5) * 65
            o.position.z = (Math.random() - 0.5) * 65
            if (o.userData.baseOpac !== undefined) o.material.opacity = o.userData.baseOpac
          }
        } else if (o.userData.wobble !== undefined) {
          o.position.y -= o.userData.fall * S
          o.userData.wobble += o.userData.wobbleSpeed * S
          o.rotation.z = Math.sin(o.userData.wobble) * 0.55
          o.rotation.y += o.userData.spinY * S
          if (o.position.y < -1) {
            o.position.y = 32
            o.position.x = (Math.random() - 0.5) * 90
            o.position.z = (Math.random() - 0.5) * 90
          }
        } else if (o.userData.fall !== undefined && o.userData.spin === undefined) {
          o.position.y -= o.userData.fall * S
          if (o.position.y < 0) o.position.y = 16
        } else if (o.userData.spin !== undefined) {
          o.position.y -= o.userData.fall * S
          o.rotation.y += o.userData.spin * S
          if (o.position.y < 0) o.position.y = 28
        } else if (o.userData.dir !== undefined) {
          o.position.x += o.userData.dir * 0.12 * S
          if (o.position.x >  22) o.userData.dir = -1
          if (o.position.x < -22) o.userData.dir =  1
        }
      }
      for (const n of npcs) stepNPC(n, S)
      renderer.render(scene, camera)
    }
    animate()

    /* ── RESIZE ── */
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(stateRef.current.raf)
      document.exitPointerLock?.()
      document.removeEventListener('pointerlockchange', onLockChange)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup',   onKeyUp)
      document.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'#000' }}>
      <div ref={mountRef} style={{ position:'absolute', inset:0 }} />

      {/* Click-to-begin (ground mode only) */}
      {!locked && !aerial && (
        <div style={{
          position:'absolute', inset:0, display:'flex',
          alignItems:'center', justifyContent:'center',
          background:'rgba(0,0,0,.45)', cursor:'pointer',
          fontSize:'12px', letterSpacing:'5px', color:'rgba(255,255,255,.8)',
          fontFamily:'Courier New,monospace', zIndex:2, pointerEvents:'none',
        }}>
          CLICK TO BEGIN
        </div>
      )}

      {/* Memory vignette */}
      {slowest === 'memory' && (
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none', zIndex:3,
          background:'radial-gradient(ellipse at center,transparent 35%,rgba(0,0,0,.65) 100%)',
        }} />
      )}

      {/* Environment — red heat vignette */}
      {slowest === 'environment' && (
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none', zIndex:3,
          background:'radial-gradient(ellipse at center, transparent 30%, rgba(180,0,0,0.35) 100%)',
          animation:'env-heat-pulse 2.4s ease-in-out infinite',
        }}>
          <style>{`
            @keyframes env-heat-pulse {
              0%,100% { opacity: 0.75; }
              50%      { opacity: 1.0;  }
            }
          `}</style>
        </div>
      )}

      {/* HUD */}
      <div style={{
        position:'absolute', top:16, left:16, zIndex:10, pointerEvents:'none',
        fontFamily:'Courier New,monospace', fontSize:'10px', letterSpacing:'1.5px',
        background:'rgba(0,0,0,.65)', padding:'12px 16px',
        border:'1px solid rgba(255,255,255,.12)', minWidth:'200px', color:'#fff',
      }}>
        <div style={{ fontSize:'13px', fontWeight:'bold', letterSpacing:'3px', marginBottom:'10px' }}>
          {WORLD_NAMES[slowest]}
        </div>
        {Object.entries(times).map(([k, v]) => (
          <div key={k} style={{
            display:'flex', justifyContent:'space-between', gap:'16px', marginBottom:'3px',
            opacity: k === slowest ? 1 : 0.45,
            color: k === slowest ? '#ffaa00' : '#fff',
          }}>
            <span>{k.toUpperCase()}</span><span>{fmt(v)}</span>
          </div>
        ))}
        <div style={{
          marginTop:'10px', fontSize:'9px', color:'rgba(255,255,255,.3)',
          letterSpacing:'1px', lineHeight:2,
          borderTop:'1px solid rgba(255,255,255,.1)', paddingTop:'8px',
        }}>
          W A S D — {aerial ? 'PAN' : 'MOVE'}<br />
          {aerial ? 'TAB — GROUND VIEW' : 'MOUSE — LOOK  |  CLICK — LOCK'}<br />
          {!aerial && 'TAB — AERIAL VIEW'}
        </div>
      </div>

      {/* Exit button */}
      <button onClick={onExit} style={{
        position:'absolute', top:16, right:16, zIndex:10,
        background:'transparent', border:'1px solid rgba(255,255,255,.35)',
        color:'rgba(255,255,255,.65)', fontFamily:'Courier New,monospace',
        fontSize:'10px', letterSpacing:'2px', padding:'8px 16px', cursor:'pointer',
      }}>
        EXIT SIMULATION
      </button>
    </div>
  )
}
