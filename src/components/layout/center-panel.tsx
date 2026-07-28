import { useState, useEffect, useRef } from 'react'
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

function PdfViewer({ url, isDarkMode }: { url: string; isDarkMode: boolean }) {
  const [numPages, setNumPages] = useState<number>(0)
  const [deletedPages, setDeletedPages] = useState<Set<number>>(new Set())
  const [aspectRatio, setAspectRatio] = useState<number | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)

  const containerH = useContainerHeight()
  // derive page width from actual container height so slot height == container height exactly
  const pageWidth = aspectRatio && containerH > 0
    ? Math.round((containerH - PAGE_PADDING * 2) * aspectRatio)
    : 0

  const visiblePages = Array.from({ length: numPages }, (_, i) => i + 1)
    .filter(p => !deletedPages.has(p))

  const deletePage = (pageNum: number) =>
    setDeletedPages(prev => new Set([...prev, pageNum]))

  const getContainer = () => document.getElementById('pdf-scroll') as HTMLElement | null

  const navigate = (dir: 1 | -1) => {
    const container = getContainer()
    if (!container) return
    const slotH = container.clientHeight
    // read live scrollTop — no stale state
    const live = Math.round(container.scrollTop / slotH)
    const next = Math.max(0, Math.min(visiblePages.length - 1, live + dir))
    container.scrollTo({ top: next * slotH, behavior: 'smooth' })
    setCurrentIdx(next)
  }

  // track current page from scroll position
  useEffect(() => {
    const container = getContainer()
    if (!container || !visiblePages.length) return
    const onScroll = () => {
      const slotH = container.clientHeight
      if (!slotH) return
      // crossing the midpoint of a page switches to that page
      setCurrentIdx(Math.min(Math.round(container.scrollTop / slotH), visiblePages.length - 1))
    }
    container.addEventListener('scroll', onScroll, { passive: true })
    return () => container.removeEventListener('scroll', onScroll)
  }, [visiblePages.length])

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
        {visiblePages.map((pageNum) => (
          <div
            key={pageNum}
            className="relative group"
            style={{ lineHeight: 0, paddingTop: PAGE_PADDING, paddingBottom: PAGE_PADDING }}
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
            <button
              onClick={() => deletePage(pageNum)}
              title={`Delete page ${pageNum}`}
              className="absolute opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              style={{
                top: PAGE_PADDING + 8,
                right: 8,
                width: 26,
                height: 26,
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                background: 'rgba(210, 45, 45, 0.9)',
                color: '#fff',
                fontSize: 17,
                fontWeight: 700,
                lineHeight: 1,
                boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
              }}
            >
              ×
            </button>
            <div
              className="absolute left-1/2 -translate-x-1/2 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ bottom: PAGE_PADDING + 8, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 11 }}
            >
              {pageNum}
            </div>
          </div>
        ))}
      </Document>

      {deletedPages.size > 0 && (
        <button
          onClick={() => setDeletedPages(new Set())}
          className="text-xs px-3 py-1.5 rounded-lg mb-8"
          style={{
            background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
            color: isDarkMode ? '#aaa' : '#555',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Restore {deletedPages.size} deleted page{deletedPages.size > 1 ? 's' : ''}
        </button>
      )}

      {/* fixed nav buttons */}
      {visiblePages.length > 1 && (
        <div
          className="fixed bottom-20 right-6 flex flex-col gap-2 z-50"
          style={{ pointerEvents: 'auto' }}
        >
          <button
            style={{ ...btnStyle, opacity: currentIdx <= 0 ? 0.3 : 1 }}
            disabled={currentIdx <= 0}
            onClick={() => navigate(-1)}
            title="Previous page"
          >
            ↑
          </button>
          <button
            style={{ ...btnStyle, opacity: currentIdx >= visiblePages.length - 1 ? 0.3 : 1 }}
            disabled={currentIdx >= visiblePages.length - 1}
            onClick={() => navigate(1)}
            title="Next page"
          >
            ↓
          </button>
        </div>
      )}
    </>
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
    return <FileViewer file={importedFile} isDarkMode={isDarkMode} />
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
