import { useState } from 'react'
import { TopBar } from './components/layout/top-bar'
import { LeftPanel } from './components/layout/left-panel'
import { CenterPanel } from './components/layout/center-panel'
import { RightPanel } from './components/layout/right-panel'
import { PlaybackBar } from './components/layout/playback-bar'

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  return (
    <div
      className={`h-screen w-screen flex flex-col overflow-hidden ${isDarkMode ? 'dark' : ''}`}
      style={{ backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f4f0' }}
    >
      <TopBar isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} />
      <main className="flex-1 flex min-h-0">
        <LeftPanel isDarkMode={isDarkMode} />
        <CenterPanel isDarkMode={isDarkMode} />
        <RightPanel isDarkMode={isDarkMode} />
      </main>
      <PlaybackBar isDarkMode={isDarkMode} />
    </div>
  )
}

export default App
