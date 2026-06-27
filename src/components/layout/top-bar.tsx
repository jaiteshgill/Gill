import { useState, useRef, useEffect } from 'react'
import { Settings, User, Sun, Moon, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TopBarProps {
  isDarkMode: boolean
  onToggleDarkMode: () => void
  questionsOpen: boolean
  onToggleQuestions: () => void
  fileName?: string | null
}

export function TopBar({ isDarkMode, onToggleDarkMode, questionsOpen, onToggleQuestions, fileName }: TopBarProps) {
  const defaultTitle = fileName ?? 'Gill Notes'
  const [title, setTitle] = useState(defaultTitle)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const next = fileName ?? 'Gill Notes'
    setTitle(next)
    setDraft(next)
  }, [fileName])

  const startEdit = () => {
    setDraft(title)
    setEditing(true)
  }

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed) setTitle(trimmed)
    else setDraft(title)
    setEditing(false)
  }

  return (
    <header
      className="h-[60px] w-full flex items-center justify-between px-4 border-b shrink-0 relative"
      style={{
        backgroundColor: isDarkMode ? '#242424' : '#ffffff',
        borderColor: isDarkMode ? '#333333' : '#e5e5e5',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: '#5b7fa6' }}
        >
          <span className="text-white font-bold text-lg">G</span>
        </div>
        <span
          className="font-semibold text-lg"
          style={{ color: isDarkMode ? '#f5f4f0' : '#1a1a1a' }}
        >
          Gill
        </span>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') { setDraft(title); setEditing(false) }
            }}
            className="text-base font-medium bg-transparent border-b outline-none text-center"
            style={{
              color: isDarkMode ? '#e5e5e5' : '#1a1a1a',
              borderColor: isDarkMode ? '#555' : '#999',
              minWidth: 80,
              width: Math.max(80, draft.length * 9),
            }}
          />
        ) : (
          <h1
            onClick={startEdit}
            className="text-base font-medium cursor-pointer hover:opacity-70 transition-opacity"
            style={{ color: isDarkMode ? '#e5e5e5' : '#1a1a1a' }}
          >
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleDarkMode}
          className="hover:bg-black/5"
          style={{ color: isDarkMode ? '#e5e5e5' : '#666666' }}
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-black/5"
          style={{ color: isDarkMode ? '#e5e5e5' : '#666666' }}
        >
          <Settings className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleQuestions}
          className="hover:bg-black/5"
          style={{ color: questionsOpen ? '#5b7fa6' : isDarkMode ? '#e5e5e5' : '#666666' }}
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-black/5"
          style={{ color: isDarkMode ? '#e5e5e5' : '#666666' }}
        >
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
