import { useState, useCallback, useRef, useEffect } from 'react'
import { ZoomIn, ZoomOut } from 'lucide-react'
import { TopBar } from './components/layout/top-bar'
import { CenterPanel } from './components/layout/center-panel'
import { PlaybackBar } from './components/layout/playback-bar'
import { QuestionsOverlay } from './components/layout/questions-overlay'
import { AnnotationCanvas } from './components/layout/annotation-canvas'
import { Button } from './components/ui/button'

export interface ImportedFile {
  name: string
  type: string
  url: string
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [importedFile, setImportedFile] = useState<ImportedFile | null>(null)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gill_anthropic_api_key') ?? '')
  const [questionsOpen, setQuestionsOpen] = useState(false)
  const [zoom, setZoom] = useState(1)

  const adjustZoom = useCallback((delta: number) => {
    setZoom(z => Math.min(2, Math.max(0.25, Math.round((z + delta) * 100) / 100)))
  }, [])

  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startZoom = (delta: number) => {
    adjustZoom(delta * 2)
    delayRef.current = setTimeout(() => {
      holdRef.current = setInterval(() => adjustZoom(delta * 2), 400)
    }, 600)
  }

  const stopZoom = () => {
    if (delayRef.current) { clearTimeout(delayRef.current); delayRef.current = null }
    if (holdRef.current) { clearInterval(holdRef.current); holdRef.current = null }
  }

  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = -e.deltaY * 0.002
        setZoom(z => Math.min(2, Math.max(0.25, z + delta)))
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const handleSaveApiKey = (key: string) => {
    localStorage.setItem('gill_anthropic_api_key', key)
    setApiKey(key)
  }

  const toggleDarkMode = () => {
    const next = !isDarkMode
    setIsDarkMode(next)
    document.documentElement.classList.toggle('dark', next)
    document.body.style.backgroundColor = next ? '#111111' : '#f5f4f0'
  }

  const handleImport = (file: File) => {
    if (importedFile) URL.revokeObjectURL(importedFile.url)
    setImportedFile({ name: file.name, type: file.type, url: URL.createObjectURL(file) })
  }

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f4f0' }}
    >
      <TopBar isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} questionsOpen={questionsOpen} onToggleQuestions={() => setQuestionsOpen(o => !o)} fileName={importedFile ? `${importedFile.name.replace(/\.[^/.]+$/, '')} — Gill Notes` : null} />
      <main ref={mainRef} className="flex-1 min-h-0 relative overflow-hidden">
        {/* Chalk canvas always fills the full screen regardless of zoom */}
        <AnnotationCanvas isDarkMode={isDarkMode} zoom={zoom} />

        {/* PDF viewer floats in center, scaled by zoom, shifts left when questions open */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            transform: questionsOpen ? 'translateX(-14%)' : 'translateX(0)',
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div
            className="pointer-events-auto"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <CenterPanel isDarkMode={isDarkMode} importedFile={importedFile} onImport={handleImport} />
          </div>
        </div>

        <QuestionsOverlay isDarkMode={isDarkMode} isOpen={questionsOpen} />

        {/* Floating zoom controls — bottom right of chalk screen */}
        <div
          className="absolute bottom-4 right-4 flex items-center gap-1 rounded-lg px-2 py-1"
          style={{
            backgroundColor: isDarkMode ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          }}
        >
          <Button
            variant="ghost"
            size="icon"
            onMouseDown={() => startZoom(-0.05)}
            onMouseUp={stopZoom}
            onMouseLeave={stopZoom}
            className="h-7 w-7 hover:bg-black/5"
            style={{ color: isDarkMode ? '#cccccc' : '#555555' }}
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span
            className="text-xs font-medium tabular-nums w-9 text-center select-none"
            style={{ color: isDarkMode ? '#aaaaaa' : '#666666' }}
          >
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onMouseDown={() => startZoom(0.05)}
            onMouseUp={stopZoom}
            onMouseLeave={stopZoom}
            className="h-7 w-7 hover:bg-black/5"
            style={{ color: isDarkMode ? '#cccccc' : '#555555' }}
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
        </div>
      </main>
      <PlaybackBar isDarkMode={isDarkMode} />
    </div>
  )
}

export default App
