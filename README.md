# PROTOCOL

A browser-based interactive escape room game set inside a control room that manages a city producing more data than can be interpreted.

You are the operator. Configure 5 city systems to unlock the exit — then see the city you created.

## How to play

1. You are placed inside a control room with 5 stations
2. Click each station to open its control panel
3. Interact with each system:
   - **People** — set population density with a slider
   - **Memory** — choose how the city handles its past
   - **Environment** — drag elements to balance nature vs. urban
   - **Economy** — toggle economic activity on and off
   - **Infrastructure** — connect city systems by clicking nodes
4. Once all 5 stations are configured, the EXIT DOOR unlocks
5. Enter the exit to see your city — shaped entirely by your choices

There is no correct answer.

---

## Local setup

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build
```

The dev server runs at `http://localhost:5173` (or next available port).

---

## Deployment (GitHub Pages)

This project auto-deploys to GitHub Pages on every push to `main`.

**One-time setup:**
1. Go to your repo → Settings → Pages
2. Set **Source** to `GitHub Actions`
3. Push to `main` — the workflow handles the rest

Your game will be live at `https://<your-username>.github.io/<repo-name>/`

---

## Tech stack

- [Vite](https://vite.dev/) — build tool & dev server
- [React](https://react.dev/) — UI framework
- [react-icons](https://react-icons.github.io/react-icons/) — icons
- No backend, no database, no external API

---

## Project structure

```
src/
  App.jsx                    # Game state machine (intro → room → city)
  App.css                    # All visual styles
  components/
    IntroScreen.jsx           # Terminal-style opening sequence
    MainRoom.jsx              # Control room with 5 station panels
    StationModal.jsx          # Modal wrapper for station panels
    CityScreen.jsx            # Procedural city visualization
    stations/
      Station1People.jsx      # Slider — population density
      Station2Memory.jsx      # Buttons — archive protocol
      Station3Environment.jsx # Drag-and-drop — ecological balance
      Station4Economy.jsx     # Toggle grid — commercial density
      Station5Infrastructure.jsx  # Node puzzle — system connectivity
```
