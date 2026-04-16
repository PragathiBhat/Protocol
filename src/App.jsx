import { useState } from 'react'
import IntroScreen from './components/IntroScreen'
import MainRoom from './components/MainRoom'
import CityScreen from './components/CityScreen'
import MusicPlayer from './components/MusicPlayer'
import CustomCursor from './components/CustomCursor'
import CinematicIntro from './components/CinematicIntro'
import './App.css'

function App() {
  const [phase, setPhase] = useState('cinematic') // 'cinematic' | 'intro' | 'room' | 'city'
  const [scores, setScores] = useState({
    people: null,         // 0–100  (population density)
    memory: null,         // 'preserve' | 'reduce' | 'erase'
    environment: null,    // 0–100  (0=nature, 100=urban)
    economy: null,        // 0–100  (economic density)
    infrastructure: null, // 0–100  (network efficiency)
  })
  const [times, setTimes] = useState({
    people: null, memory: null, environment: null, economy: null, infrastructure: null,
  })

  const updateScore = (key, value) => {
    setScores(prev => ({ ...prev, [key]: value }))
  }
  const updateTime = (key, ms) => {
    setTimes(prev => ({ ...prev, [key]: ms }))
  }

  const allComplete = Object.values(scores).every(v => v !== null)

  return (
    <div className="game-root">
      <MusicPlayer />
      <CustomCursor />
      {phase === 'cinematic' && (
        <CinematicIntro onComplete={() => setPhase('intro')} />
      )}
      {phase === 'intro' && (
        <IntroScreen onEnter={() => setPhase('room')} />
      )}
      {phase === 'room' && (
        <MainRoom
          scores={scores}
          times={times}
          onUpdateScore={updateScore}
          onUpdateTime={updateTime}
          onExit={() => setPhase('city')}
          allComplete={allComplete}
        />
      )}
      {phase === 'city' && (
        <CityScreen scores={scores} times={times} onRestart={() => {
          setScores({ people: null, memory: null, environment: null, economy: null, infrastructure: null })
          setTimes({ people: null, memory: null, environment: null, economy: null, infrastructure: null })
          setPhase('intro')
        }} />
      )}
    </div>
  )
}

export default App
