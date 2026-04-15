# PROTOCOL

A browser-based escape room where you configure five city control systems to determine the fate of Alexanderplatz.

---

## Author & course

**Author:** Pragathi Bhat Prakash  
**Studio:** Prompt City — Urban Vision Wolfsburg 2026  
**Course:** IUDD Master, SoSe 2026  
**Chair:** Informatics in Architecture and Urbanism (InfAU), Faculty of Architecture and Urbanism, Bauhaus-Universität Weimar  
**Teaching staff:** Reinhard König, Martin Bielik, Sven Schneider, Egor Gaydukov, Egor Gavrilov  
**Exercise:** Urban Absurdities (Nonsense Project)  
**Submission date:** 2026-04-16

---

## Links

- **Live app (GitHub Pages):** https://pragathibhat.github.io/Protocol/
- **Source repo:** https://github.com/PragathiBhat/Protocol
- **Miro frame:** https://miro.com/app/board/uXjVGCtKivA=/?moveToWidget=[your-frame-id]
- **60 s showreel:** embedded on the Miro frame above

---

## The task

Nonsense Project is a two-weeks long task designed to get familiar with application of coding agents in building apps, tools and projects that investigate unique ways of working with urban context. I was randomly assigned one urban paradox and one constraint from the studio's Nonsense Ideas deck and built a working web app that answers this combination. The process is documented here and in a 60-second showreel.

---

## Theme & constraint

**Theme (Urban Absurdity):**  
[Paste the theme exactly as drawn.]

**Constraint (Playful Limitation):**  
[Paste the constraint exactly as drawn.]

---

## Concept and User Story

**Concept** (100–150 words, non-technical). What the app is, how it reads the theme, where the constraint actually bites.

[Your concept goes here.]

---

**User story** (100–200 words):

[Your user story goes here.]

---

## How to use it

1. Open the live app — an animated terminal loads over a 3D map of Berlin; Alexanderplatz pulses on screen.
2. Click **ENTER CONTROL ROOM** to step inside the operator station.
3. The room is filled with panels — most are decoys. Explore by clicking each one to find the 5 active control systems. Wrong panels flash **⚠ OFFLINE**.
4. Use **◎ SCAN ROOM** (top-right HUD) if you get stuck — it highlights the real stations briefly.
5. Click a real station to open its puzzle panel. A timer starts counting in the corner.
6. Complete all 5 stations (People, Memory, Environment, Economy, Infrastructure).
7. Once all are configured, the **EXIT** ladder at the right of the room lights up.
8. Click EXIT to enter the city simulation and see the world shaped by your choices.

> **Note:** Every time you reload, the panels rearrange — no two sessions look the same.

---

## Technical implementation

**Frontend:** React + Vite, JavaScript (no TypeScript)  
**Hosting & build:** GitHub Pages, built via GitHub Actions workflow (`.github/workflows/deploy.yml`) on every push to `main`  
**Data sources / APIs:** OpenStreetMap vector tiles via [OpenFreeMap](https://openfreemap.org/) (liberty style) — loaded at runtime for the intro map  
**Models at runtime:** None  
**Notable libraries:** Three.js (5 city simulations), MapLibre GL JS (intro OSM map), React

**Run locally:**

```bash
# Install dependencies
npm install

# Start the development server (runs at http://localhost:5173)
npm run dev

# Build for production
npm run build
```

---

## Working with AI

**Coding agents used:** Claude Code  
**Model:** claude-sonnet-4-6

**Key prompts (2–5 that actually moved the project):**

> [Quote prompt 1]

> [Quote prompt 2]

> [Quote prompt 3]

**Reflection** (≤ 150 words): What unlocked progress? Where did the agent get stuck or go sideways? What is one thing you would do differently next time?

[Your reflection goes here.]

---

## Credits, assets, licenses

**Fonts:** Space Mono (Google Fonts, OFL), Orbitron (Google Fonts, OFL)  
**Data:** OpenStreetMap contributors, ODbL — accessed via OpenFreeMap tiles  
**Images / sounds:** None  
**Third-party code:** Three.js (MIT), MapLibre GL JS (BSD-3-Clause), React (MIT), Vite (MIT)  
**This repo:** MIT
