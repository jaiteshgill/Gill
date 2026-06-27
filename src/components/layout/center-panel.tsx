import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { FileText, Music, File, Upload } from 'lucide-react'
import type { ImportedFile } from '../../App'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

interface CenterPanelProps {
  isDarkMode: boolean
  importedFile: ImportedFile | null
  onImport: (file: File) => void
}

const ZOOM_STEP = 0.15
const ZOOM_MIN = 0.5
const ZOOM_MAX = 3

const TOP_BAR = 60, PLAY_BAR = 56, CANVAS_PADDING = 56

function useFitSize(pageSize: { w: number; h: number } | null) {
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const maxW = viewport.w * 0.68
  const maxH = viewport.h - TOP_BAR - PLAY_BAR - CANVAS_PADDING

  if (!pageSize) return { displayW: maxW, displayH: maxH }

  const ratio = pageSize.w / pageSize.h
  const hFromW = maxW / ratio
  if (hFromW <= maxH) return { displayW: maxW, displayH: hFromW }
  return { displayW: maxH * ratio, displayH: maxH }
}

function PdfViewer({ url, isDarkMode }: { url: string; isDarkMode: boolean }) {
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [locked, setLocked] = useState<boolean>(false)
  const [editingPage, setEditingPage] = useState(false)
  const [pageInput, setPageInput] = useState('')
  const [pageSize, setPageSize] = useState<{ w: number; h: number } | null>(null)
  const [zoom, setZoom] = useState<number>(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const pageInputRef = useRef<HTMLInputElement>(null)
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])

  const { displayW, displayH } = useFitSize(pageSize)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.05 : 0.05
      setZoom(z => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, +(z + delta).toFixed(2))))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // arrow key nav only when locked
  useEffect(() => {
    if (!locked) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault()
        setCurrentPage(p => Math.min(numPages, p + 1))
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        setCurrentPage(p => Math.max(1, p - 1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [locked, numPages])

  const prevLockedRef = useRef(locked)
  useLayoutEffect(() => {
    const wasLocked = prevLockedRef.current
    prevLockedRef.current = locked
    // when unlocking: hidden pages above currentPage reappear and push it down —
    // use getBoundingClientRect to find where currentPage actually is now and snap there
    if (wasLocked && !locked) {
      const container = containerRef.current
      const page = pageRefs.current[currentPage - 1]
      if (container && page) {
        const containerTop = container.getBoundingClientRect().top
        const pageTop = page.getBoundingClientRect().top
        container.scrollTop = pageTop - containerTop
      }
    }
  }, [locked, currentPage])

  // track visible page while scrolling (scroll mode only)
  useEffect(() => {
    if (locked || numPages === 0) return
    const container = containerRef.current
    if (!container) return
    const onScroll = () => {
      for (let i = 0; i < pageRefs.current.length; i++) {
        const el = pageRefs.current[i]
        if (!el) continue
        const rect = el.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        if (rect.top >= containerRect.top - rect.height / 2) {
          setCurrentPage(i + 1)
          break
        }
      }
    }
    container.addEventListener('scroll', onScroll, { passive: true })
    return () => container.removeEventListener('scroll', onScroll)
  }, [locked, numPages])

  const prevPage = () => {
    const p = Math.max(1, currentPage - 1)
    setCurrentPage(p)
    if (!locked) pageRefs.current[p - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const nextPage = () => {
    const p = Math.min(numPages, currentPage + 1)
    setCurrentPage(p)
    if (!locked) pageRefs.current[p - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    if (editingPage) pageInputRef.current?.select()
  }, [editingPage])

  const zoomIn  = () => setZoom(z => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))
  const zoomOut = () => setZoom(z => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))
  const zoomReset = () => setZoom(1)

  const pageWidth = Math.round(displayW)

  const btnStyle: React.CSSProperties = {
    background: isDarkMode ? 'rgba(40,40,40,0.9)' : 'rgba(255,255,255,0.92)',
    color: isDarkMode ? '#ccc' : '#444',
    border: `1px solid ${isDarkMode ? '#3a3a3a' : '#ddd'}`,
    borderRadius: 6,
    width: 30,
    height: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: 16,
    lineHeight: 1,
    userSelect: 'none',
  }

  const dividerStyle: React.CSSProperties = {
    width: 1,
    height: 18,
    background: isDarkMode ? '#3a3a3a' : '#ddd',
    margin: '0 4px',
  }

  return (
    <div style={{ width: displayW }} className="relative">
      {/* nav + zoom controls */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl shadow-lg"
        style={{
          background: isDarkMode ? 'rgba(30,30,30,0.92)' : 'rgba(255,255,255,0.92)',
          border: `1px solid ${isDarkMode ? '#3a3a3a' : '#e0e0e0'}`,
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* scroll / lock toggle */}
        <button
          onClick={() => setLocked(l => !l)}
          title={locked ? 'Locked — click to scroll freely' : 'Scroll — click to lock'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0 2px',
            userSelect: 'none',
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 600, color: isDarkMode ? '#666' : '#aaa', letterSpacing: '0.04em' }}>
            SCROLL LOCK
          </span>
          {/* pill track */}
          <span style={{
            position: 'relative',
            display: 'inline-flex',
            width: 32,
            height: 18,
            borderRadius: 9,
            background: locked
              ? (isDarkMode ? '#3a6a9e' : '#5b7fa6')
              : (isDarkMode ? '#3a3a3a' : '#d0d0d0'),
            transition: 'background 0.2s',
            flexShrink: 0,
          }}>
            {/* knob */}
            <span style={{
              position: 'absolute',
              top: 2,
              left: locked ? 16 : 2,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: '#fff',
              transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
            }} />
          </span>
        </button>

        <div style={dividerStyle} />

        <button style={btnStyle} onClick={prevPage} disabled={currentPage <= 1} title="Previous slide (↑)">↑</button>
        {editingPage ? (
          <input
            ref={pageInputRef}
            type="text"
            inputMode="numeric"
            value={pageInput}
            onChange={e => setPageInput(e.target.value.replace(/\D/g, ''))}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const n = parseInt(pageInput, 10)
                if (n >= 1 && n <= numPages) {
                  setCurrentPage(n)
                  if (!locked) pageRefs.current[n - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                setEditingPage(false)
              } else if (e.key === 'Escape') {
                setEditingPage(false)
              }
            }}
            onBlur={() => {
              const n = parseInt(pageInput, 10)
              if (n >= 1 && n <= numPages) {
                setCurrentPage(n)
                if (!locked) pageRefs.current[n - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
              setEditingPage(false)
            }}
            className="text-xs font-medium tabular-nums text-center focus:outline-none"
            style={{
              width: 48,
              background: 'transparent',
              color: isDarkMode ? '#aaa' : '#666',
              border: `1px solid ${isDarkMode ? '#555' : '#bbb'}`,
              borderRadius: 4,
              padding: '1px 4px',
            }}
          />
        ) : (
          <span
            onClick={() => { setPageInput(String(currentPage)); setEditingPage(true) }}
            className="text-xs font-medium tabular-nums cursor-text select-none px-1"
            style={{ color: isDarkMode ? '#aaa' : '#666', minWidth: 48, textAlign: 'center' }}
            title="Click to jump to slide"
          >
            {currentPage} / {numPages || '—'}
          </span>
        )}
        <button style={btnStyle} onClick={nextPage} disabled={currentPage >= numPages} title="Next slide (↓)">↓</button>

        <div style={dividerStyle} />

        <button style={btnStyle} onClick={zoomOut} disabled={zoom <= ZOOM_MIN}>−</button>
        <span
          onClick={zoomReset}
          className="text-xs font-medium tabular-nums cursor-pointer select-none px-1"
          style={{ color: isDarkMode ? '#aaa' : '#666', minWidth: 40, textAlign: 'center' }}
          title="Reset zoom"
        >
          {Math.round(zoom * 100)}%
        </span>
        <button style={btnStyle} onClick={zoomIn} disabled={zoom >= ZOOM_MAX}>+</button>
      </div>

      <div
        ref={containerRef}
        className="overflow-auto"
        style={{
          width: displayW,
          height: displayH,
          backgroundColor: isDarkMode ? '#000000' : '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: locked ? 'center' : 'flex-start',
        }}
      >
        <div style={{ zoom }}>
          <Document
            file={url}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            className="flex flex-col items-center py-4 gap-4"
          >
            {pageWidth > 0 && numPages > 0 && Array.from({ length: numPages }, (_, i) => (
              <div
                key={i + 1}
                ref={el => { pageRefs.current[i] = el }}
                style={locked && i + 1 !== currentPage ? { display: 'none' } : undefined}
              >
                <Page
                  pageNumber={i + 1}
                  width={pageWidth}
                  onLoadSuccess={(page) => {
                    if (i === 0 && !pageSize) setPageSize({ w: page.originalWidth, h: page.originalHeight })
                  }}
                  renderTextLayer={true}
                  renderAnnotationLayer={false}
                  className="shadow-md"
                />
              </div>
            ))}
          </Document>
        </div>
      </div>
    </div>
  )
}

function FileViewer({ file, isDarkMode }: { file: ImportedFile; isDarkMode: boolean }) {
  const { name, type, url } = file

  if (type.startsWith('image/')) {
    return (
      <img
        src={url}
        alt={name}
        className="max-w-full max-h-full object-contain rounded"
      />
    )
  }

  if (type.startsWith('video/')) {
    return (
      <video
        src={url}
        controls
        className="max-w-full max-h-full rounded"
      />
    )
  }

  if (type === 'application/pdf') {
    return <PdfViewer url={url} isDarkMode={isDarkMode} />
  }

  if (type.startsWith('audio/')) {
    return (
      <div className="flex flex-col items-center gap-4">
        <Music className="h-12 w-12" style={{ color: isDarkMode ? '#555' : '#bbb' }} />
        <span className="text-sm font-medium" style={{ color: isDarkMode ? '#ccc' : '#444' }}>{name}</span>
        <audio src={url} controls />
      </div>
    )
  }

  if (type === 'text/plain' || type === 'text/markdown') {
    return (
      <iframe
        src={url}
        title={name}
        className="w-full h-full border-0 rounded"
        style={{ background: isDarkMode ? '#1a1a1a' : '#fff', color: isDarkMode ? '#eee' : '#111' }}
      />
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {type.includes('presentation') || name.match(/\.pptx?$/i) ? (
        <FileText className="h-12 w-12" style={{ color: isDarkMode ? '#555' : '#bbb' }} />
      ) : (
        <File className="h-12 w-12" style={{ color: isDarkMode ? '#555' : '#bbb' }} />
      )}
      <span className="text-sm font-medium" style={{ color: isDarkMode ? '#ccc' : '#444' }}>{name}</span>
      <span className="text-xs" style={{ color: isDarkMode ? '#555' : '#aaa' }}>
        Preview not available for this file type
      </span>
      <a
        href={url}
        download={name}
        className="text-xs underline"
        style={{ color: '#5b7fa6' }}
      >
        Download file
      </a>
    </div>
  )
}

export function CenterPanel({ isDarkMode, importedFile, onImport }: CenterPanelProps) {
  const importRef = useRef<HTMLInputElement>(null)

  if (!importedFile) {
    return (
      <div className="flex flex-col items-center gap-3">
        <input
          ref={importRef}
          type="file"
          accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp,.svg,.mp4,.mov,.webm,.mp3,.wav,.m4a,.txt,.md"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = '' }}
        />
        <button
          onClick={() => importRef.current?.click()}
          className="cursor-pointer flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-colors"
          style={{
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            color: isDarkMode ? '#aaaaaa' : '#666666',
          }}
        >
          <Upload className="h-4 w-4" />
          Import file
        </button>
      </div>
    )
  }

  if (importedFile.type === 'application/pdf') {
    return (
      <div
        className="rounded-xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: isDarkMode ? '#000000' : '#ffffff' }}
      >
        <FileViewer file={importedFile} isDarkMode={isDarkMode} />
      </div>
    )
  }

  // Images, video, audio, etc. — natural size, centered
  return (
    <div
      className="rounded-xl overflow-hidden shadow-2xl flex items-center justify-center p-6"
      style={{
        maxWidth: 'min(55vw, 900px)',
        maxHeight: 'min(80vh, 1000px)',
        backgroundColor: isDarkMode ? '#000000' : '#ffffff',
      }}
    >
      <FileViewer file={importedFile} isDarkMode={isDarkMode} />
    </div>
  )
}
