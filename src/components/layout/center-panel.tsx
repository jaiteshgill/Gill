import { useState, useEffect, useRef, useCallback } from 'react'
import { Document, Page } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { FileText, Music, File, Upload, SkipForward, RotateCcw } from 'lucide-react'
import type { ImportedFile } from '../../App'
// configures pdfjs.GlobalWorkerOptions.workerSrc for every pdf.js consumer
import '../../lib/pdf'

interface CenterPanelProps {
  isDarkMode: boolean
  importedFile: ImportedFile | null
  onImport: (file: File) => void
  zoom?: number
}

const PAGE_PADDING = 96

function useContainerHeight() {
  const [h, setH] = useState(0)
  useEffect(() => {
    const el = document.getElementById('pdf-scroll')
    if (!el) return
    setH(el.clientHeight)
    const ro = new ResizeObserver(() => setH(el.clientHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return h
}

function PdfViewer({ url, isDarkMode, zoom = 1 }: { url: string; isDarkMode: boolean; zoom?: number }) {
  const [numPages, setNumPages] = useState<number>(0)
  const [skippedPages, setSkippedPages] = useState<Set<number>>(new Set())
  const [aspectRatio, setAspectRatio] = useState<number | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  // furthest page that can actually be scrolled to — see measure()
  const [lastIdx, setLastIdx] = useState(0)

  const containerH = useContainerHeight()
  // derive page width from actual container height so slot height == container height exactly
  const pageWidth = aspectRatio && containerH > 0
    ? Math.round((containerH - PAGE_PADDING * 2) * aspectRatio * zoom)
    : 0

  // skipped pages stay in place — skipping is a toggle, not a removal, so there's nothing to restore
  const pages = Array.from({ length: numPages }, (_, i) => i + 1)

  const toggleSkip = (pageNum: number) =>
    setSkippedPages(prev => {
      const next = new Set(prev)
      if (next.has(pageNum)) next.delete(pageNum)
      else next.add(pageNum)
      return next
    })

  const getContainer = () => document.getElementById('pdf-scroll') as HTMLElement | null

  // Measure real page positions rather than assuming every slot is exactly one viewport tall.
  // That assumption breaks at the extremes: the browser clamps scrollTop to
  // scrollHeight - clientHeight, so whenever a slot is shorter than the viewport (any zoom < 100%,
  // or sub-pixel drift from rounding pageWidth at 100%) the computed target for the last page is
  // past the clamp and that page can never be reached or reported as current.
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])

  // Measure live geometry: each page's offset within the scrollable content, plus which page is
  // the furthest one that can actually be brought to the top of the viewport. Zoomed out far
  // enough, the trailing pages all fit on screen at once and sit past the scroll clamp — they can
  // never become the top page, so treating them as navigable deadlocks the arrows.
  const measure = useCallback((container: HTMLElement) => {
    const base = container.getBoundingClientRect().top - container.scrollTop
    const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight)
    const slots = pageRefs.current.slice(0, pages.length).map(el => {
      if (!el) return null
      const rect = el.getBoundingClientRect()
      return { top: rect.top - base, height: rect.height }
    })
    let lastIdx = pages.length - 1
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i]
      if (s && s.top >= maxScroll - 2) { lastIdx = i; break }
    }
    return { slots, maxScroll, lastIdx: Math.max(0, lastIdx) }
  }, [pages.length])

  // The page whose top sits closest to the current scroll offset. This deliberately mirrors what
  // navigate() does (it scrolls a page's top to the viewport top) — measuring by page *center*
  // instead disagrees with that model at low zoom, so prev/next compute a target equal to the
  // position you are already at and navigation deadlocks. Scroll extremes win over the estimate.
  const getCurrentIdx = useCallback((container: HTMLElement) => {
    const { slots, maxScroll, lastIdx } = measure(container)
    if (maxScroll > 0) {
      if (container.scrollTop >= maxScroll - 2) return lastIdx
      if (container.scrollTop <= 2) return 0
    }
    let best = 0
    let bestDist = Infinity
    slots.forEach((s, i) => {
      if (!s) return
      const dist = Math.abs(s.top - container.scrollTop)
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    })
    return Math.min(best, lastIdx)
  }, [measure])

  const navigate = (dir: 1 | -1) => {
    const container = getContainer()
    if (!container) return
    // derive from live layout, not stale state
    const { slots, maxScroll, lastIdx } = measure(container)
    const next = Math.max(0, Math.min(lastIdx, getCurrentIdx(container) + dir))
    const target = slots[next]?.top
    if (target == null) return
    container.scrollTo({ top: Math.min(target, maxScroll), behavior: 'smooth' })
    setCurrentIdx(next)
  }

  // track current page from scroll position
  useEffect(() => {
    const container = getContainer()
    if (!container || !pages.length) return
    const onScroll = () => {
      setCurrentIdx(getCurrentIdx(container))
      setLastIdx(measure(container).lastIdx)
    }
    onScroll()
    container.addEventListener('scroll', onScroll, { passive: true })
    return () => container.removeEventListener('scroll', onScroll)
  }, [pages.length, pageWidth, getCurrentIdx, measure])

  const btnStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    background: isDarkMode ? 'rgba(40,40,40,0.92)' : 'rgba(255,255,255,0.92)',
    color: isDarkMode ? '#ccc' : '#444',
    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
  }

  return (
    <>
      <Document
        file={url}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
      >
        {pages.map((pageNum, idx) => {
          const skipped = skippedPages.has(pageNum)
          return (
            <div
              key={pageNum}
              ref={el => { pageRefs.current[idx] = el }}
              className="relative group"
              style={{ lineHeight: 0, paddingTop: PAGE_PADDING, paddingBottom: PAGE_PADDING }}
            >
              <div
                style={{
                  opacity: skipped ? 0.35 : 1,
                  filter: skipped ? 'grayscale(0.5)' : 'none',
                  transition: 'opacity 0.25s ease, filter 0.25s ease',
                }}
              >
                <Page
                  pageNumber={pageNum}
                  width={pageWidth || undefined}
                  onLoadSuccess={(page) => {
                    if (!aspectRatio)
                      setAspectRatio(page.originalWidth / page.originalHeight)
                  }}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="shadow-lg"
                />
              </div>

              {/* page number, sitting above the page in the gap, left-aligned — a clean
                  neutral tag, opaque enough to sit cleanly over the dots */}
              <div
                className="absolute select-none pointer-events-none uppercase"
                style={{
                  top: PAGE_PADDING - 19,
                  left: 2,
                  padding: '2px 6px',
                  margin: '-2px -6px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: 0.6,
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.045)',
                  color: isDarkMode ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)',
                }}
              >
                Page {pageNum}
              </div>

              {/* skip toggle — a tap marks the slide as one the app shouldn't teach; tap again to undo, no separate restore step needed */}
              <button
                onClick={() => toggleSkip(pageNum)}
                title={skipped ? `Unskip page ${pageNum}` : `Skip page ${pageNum}`}
                className={`absolute flex items-center gap-1 transition-opacity ${skipped ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                style={{
                  top: PAGE_PADDING + 8,
                  right: 8,
                  padding: '4px 9px',
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 500,
                  lineHeight: 1,
                  background: skipped
                    ? (isDarkMode ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)')
                    : (isDarkMode ? 'rgba(40,40,40,0.92)' : 'rgba(255,255,255,0.92)'),
                  color: skipped
                    ? (isDarkMode ? '#ddd' : '#444')
                    : (isDarkMode ? '#ccc' : '#555'),
                  boxShadow: skipped ? 'none' : '0 1px 4px rgba(0,0,0,0.2)',
                }}
              >
                {skipped ? (
                  <>
                    <RotateCcw className="h-3 w-3" /> Skipped
                  </>
                ) : (
                  <>
                    <SkipForward className="h-3 w-3" /> Skip
                  </>
                )}
              </button>
            </div>
          )
        })}
      </Document>

      {/* fixed nav buttons */}
      {pages.length > 1 && (
        <div
          className="fixed bottom-[124px] right-6 flex flex-col gap-2 z-50"
          style={{ pointerEvents: 'auto' }}
        >
          {/* aria-disabled, not the `disabled` attribute: flipping `disabled` on the button
              you just clicked blurs it, and that focus change cancels the smooth scroll we
              just started — which silently broke navigation onto the first and last pages */}
          <button
            style={{ ...btnStyle, opacity: currentIdx <= 0 ? 0.3 : 1, cursor: currentIdx <= 0 ? 'default' : 'pointer' }}
            aria-disabled={currentIdx <= 0}
            onClick={() => { if (currentIdx > 0) navigate(-1) }}
            title="Previous page"
          >
            ↑
          </button>
          <button
            style={{ ...btnStyle, opacity: currentIdx >= lastIdx ? 0.3 : 1, cursor: currentIdx >= lastIdx ? 'default' : 'pointer' }}
            aria-disabled={currentIdx >= lastIdx}
            onClick={() => { if (currentIdx < lastIdx) navigate(1) }}
            title="Next page"
          >
            ↓
          </button>
        </div>
      )}
    </>
  )
}

function FileViewer({ file, isDarkMode, zoom }: { file: ImportedFile; isDarkMode: boolean; zoom?: number }) {
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
    return <PdfViewer url={url} isDarkMode={isDarkMode} zoom={zoom} />
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

export function CenterPanel({ isDarkMode, importedFile, onImport, zoom }: CenterPanelProps) {
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
    return <FileViewer file={importedFile} isDarkMode={isDarkMode} zoom={zoom} />
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
